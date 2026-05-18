"""ReqFlow Graph Engine — FastAPI service wrapping hedwig-code-graph.

Provides REST API for building code dependency graphs, hybrid search,
impact analysis, and linking BASIL requirements to code nodes.
"""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any

import networkx as nx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("graph-engine")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ReqFlow Graph Engine",
    description="Code dependency graph API powered by hedwig-code-graph",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Shared state (lazy-loaded, same pattern as MCP server)
# ---------------------------------------------------------------------------
_store = None
_graph = None
_db_path: str | None = None
# Store requirement-to-node links (in-memory for now, extend to SQLite later)
_requirement_links: dict[str, list[dict[str, str]]] = {}
# Track build status
_build_tasks: dict[str, dict[str, Any]] = {}


def _resolve_db_path(req_db_path: str | None = None) -> str:
    """Resolve database path from request param, env, or default."""
    global _db_path
    if req_db_path and Path(req_db_path).exists():
        _db_path = req_db_path
        return _db_path
    if _db_path:
        return _db_path
    env_path = os.environ.get("HEDWIG_CG_DB")
    if env_path and Path(env_path).exists():
        _db_path = str(Path(env_path) / "knowledge.db")
        return _db_path
    return ""


def _load(db_path: str | None = None):
    """Lazy-load store and graph."""
    global _store, _graph
    if _store is not None and _graph is not None:
        return _store, _graph
    resolved = _resolve_db_path(db_path)
    if not resolved or not Path(resolved).exists():
        raise FileNotFoundError(
            "No code graph found. Run POST /build first."
        )
    from hedwig_cg.storage.store import KnowledgeStore

    _store = KnowledgeStore(resolved)
    _graph = _store.load_graph()
    n, e = _graph.number_of_nodes(), _graph.number_of_edges()
    logger.info(f"Loaded graph: {n} nodes, {e} edges")
    return _store, _graph


def _reload():
    """Force reload after build."""
    global _store, _graph
    _store = None
    _graph = None


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class BuildRequest(BaseModel):
    source_dir: str = Field(description="Directory to analyze")
    incremental: bool = True
    embed: bool = True
    lang: str = "auto"
    max_file_size: int = 1_000_000


class BuildStatusResponse(BaseModel):
    task_id: str
    status: str
    source_dir: str
    progress: list[str] = []
    result: dict[str, Any] | None = None


class SearchQuery(BaseModel):
    query: str
    top_k: int = 10
    fast: bool = False


class LinkRequirementRequest(BaseModel):
    requirement_id: str = Field(description="BASIL requirement ID")
    node_id: str = Field(description="Graph node ID (file:line format)")
    component_id: str | None = Field(None, description="BASIL API/component ID")


class ImpactRequest(BaseModel):
    node_id: str = Field(description="Starting node for blast radius")
    max_depth: int = 3
    direction: str = "both"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "graph-engine"}


@app.post("/build")
async def build_graph(req: BuildRequest):
    """Build or incrementally update a code dependency graph."""
    import uuid

    from hedwig_cg.core.pipeline import run_pipeline

    source_dir = Path(req.source_dir).resolve()
    if not source_dir.is_dir():
        raise HTTPException(
            status_code=400,
            detail=f"Directory not found: {source_dir}",
        )

    # Use HEDWIG_CG_DB as output dir, or default to a subdir of source
    output_dir = os.environ.get("HEDWIG_CG_DB", "")
    if output_dir:
        output_path = Path(output_dir)
    else:
        output_path = source_dir / ".hedwig-cg"
    output_path.mkdir(parents=True, exist_ok=True)

    task_id = str(uuid.uuid4())
    progress_log: list[str] = []

    def _on_progress(stage: str, detail: str):
        entry = f"[{stage}] {detail}"
        progress_log.append(entry)
        logger.info(entry)

    _build_tasks[task_id] = {
        "status": "running",
        "source_dir": str(source_dir),
        "progress": progress_log,
        "result": None,
    }

    try:
        result = run_pipeline(
            source_dir=str(source_dir),
            output_dir=str(output_path),
            embed=req.embed,
            incremental=req.incremental,
            lang=req.lang,
            max_file_size=req.max_file_size,
            on_progress=_on_progress,
        )
        _reload()

        task_data = {
            "status": "complete",
            "source_dir": str(source_dir),
            "progress": progress_log,
            "result": {
                "node_count": result.node_count,
                "edge_count": result.edge_count,
                "db_path": result.db_path,
                "stage_timings": result.stage_timings,
                "total_time": result.stage_timings.get("total", 0),
                "embeddings_count": result.embeddings_count,
            },
        }
        _build_tasks[task_id] = task_data
        return {"task_id": task_id, **task_data}

    except Exception as e:
        logger.exception("Build failed")
        _build_tasks[task_id] = {
            "status": "failed",
            "source_dir": str(source_dir),
            "progress": progress_log,
            "error": str(e),
        }
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/build/{task_id}")
async def get_build_status(task_id: str):
    """Get build task status."""
    task = _build_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/search")
async def search(req: SearchQuery, db_path: str | None = None):
    """Hybrid search across the code graph (vector + keyword + subgraph)."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    from hedwig_cg.query.hybrid import hybrid_search

    try:
        result = hybrid_search(req.query, store, G, top_k=req.top_k, fast=req.fast)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Convert to JSON-serializable format
    nodes_out = []
    for n in result.nodes:
        nodes_out.append({
            "node_id": n.node_id,
            "label": n.label,
            "kind": n.kind,
            "file_path": n.file_path,
            "score": n.score,
            "source": n.source,
            "start_line": n.start_line,
            "end_line": n.end_line,
            "signature": n.signature,
        })

    edges_out = []
    for e in result.edges:
        edges_out.append({
            "source": e.source,
            "target": e.target,
            "relation": e.relation,
        })

    isolated = []
    for n in result.isolated:
        isolated.append({
            "node_id": n.node_id,
            "label": n.label,
            "kind": n.kind,
            "file_path": n.file_path,
            "score": n.score,
        })

    return {
        "query": req.query,
        "seeds": [n["node_id"] for n in nodes_out if n["source"] == "seed"],
        "nodes": nodes_out,
        "edges": edges_out,
        "isolated": isolated,
    }


@app.get("/node/{node_id:path}")
async def get_node(node_id: str, db_path: str | None = None):
    """Get detailed info about a specific graph node."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Try exact match first
    if node_id in G.nodes:
        matches = [node_id]
    else:
        q = node_id.lower()
        matches = [
            n for n in G.nodes
            if q in n.lower() or q in G.nodes[n].get("label", "").lower()
        ]

    if not matches:
        raise HTTPException(status_code=404, detail=f"No node found matching '{node_id}'")

    result = []
    for nid in matches[:5]:
        data = G.nodes[nid]
        node_info = {
            "id": nid,
            "label": data.get("label", nid),
            "kind": data.get("kind", "unknown"),
            "file_path": data.get("file_path", ""),
            "language": data.get("language", ""),
            "start_line": data.get("start_line"),
            "end_line": data.get("end_line"),
            "signature": data.get("signature", ""),
            "docstring": (data.get("docstring", "") or "")[:500],
            "pagerank": data.get("pagerank", 0),
            "community_ids": data.get("community_ids", []),
        }

        # Outgoing edges
        out_edges = []
        for _, target, edata in G.out_edges(nid, data=True):
            tlabel = G.nodes.get(target, {}).get("label", target)
            out_edges.append({
                "target": target,
                "target_label": tlabel,
                "relation": edata.get("relation", "?"),
                "weight": edata.get("weight", 0),
            })
        node_info["outgoing_edges"] = sorted(out_edges, key=lambda x: -x["weight"])[:20]

        # Incoming edges
        in_edges = []
        for source, _, edata in G.in_edges(nid, data=True):
            slabel = G.nodes.get(source, {}).get("label", source)
            in_edges.append({
                "source": source,
                "source_label": slabel,
                "relation": edata.get("relation", "?"),
                "weight": edata.get("weight", 0),
            })
        node_info["incoming_edges"] = sorted(in_edges, key=lambda x: -x["weight"])[:20]

        result.append(node_info)

    return {"matches": result, "total": len(matches)}


@app.get("/stats")
async def get_stats(db_path: str | None = None):
    """Get code graph statistics."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    n_nodes = G.number_of_nodes()
    n_edges = G.number_of_edges()

    # Node kind distribution
    kinds: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        k = data.get("kind", "unknown")
        kinds[k] = kinds.get(k, 0) + 1

    # Language distribution
    langs: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        l = data.get("language", "unknown")
        langs[l] = langs.get(l, 0) + 1

    # Community count
    community_ids: set[int] = set()
    for _, data in G.nodes(data=True):
        for cid in data.get("community_ids", []):
            community_ids.add(cid)

    # Top nodes by PageRank
    top_nodes = []
    for nid, data in G.nodes(data=True):
        pr = data.get("pagerank", 0)
        if pr > 0:
            top_nodes.append({
                "id": nid,
                "label": data.get("label", nid),
                "kind": data.get("kind", "unknown"),
                "pagerank": pr,
            })
    top_nodes.sort(key=lambda x: -x["pagerank"])

    return {
        "node_count": n_nodes,
        "edge_count": n_edges,
        "density": n_edges / max(n_nodes * (n_nodes - 1), 1),
        "communities": len(community_ids),
        "node_kinds": dict(sorted(kinds.items(), key=lambda x: -x[1])),
        "languages": dict(sorted(langs.items(), key=lambda x: -x[1])),
        "top_nodes": top_nodes[:20],
        "database": _resolve_db_path(db_path),
    }


@app.get("/communities")
async def get_communities(
    search_query: str = "",
    level: int = -1,
    db_path: str | None = None,
):
    """List/search community clusters."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if search_query:
        terms = search_query.lower().split()
        results = store.community_search(terms, top_k=10)
        communities_out = []
        for comm in results:
            cid = comm.get("community_id", comm.get("id", "?"))
            node_ids = comm.get("node_ids", [])
            sample = [
                {"id": n, "label": G.nodes.get(n, {}).get("label", n)}
                for n in node_ids[:5]
            ]
            communities_out.append({
                "id": cid,
                "level": comm.get("level"),
                "score": comm.get("score", 0),
                "node_count": len(node_ids),
                "summary": (comm.get("summary", "") or "")[:200],
                "sample_members": sample,
            })
        return {"communities": communities_out}

    query = "SELECT id, level, summary FROM communities"
    params: list = []
    if level >= 0:
        query += " WHERE level = ?"
        params.append(level)
    query += " ORDER BY level, id"
    rows = store.conn.execute(query, params).fetchall()

    communities_out = []
    for row in rows[:50]:
        cnt = store.conn.execute(
            "SELECT COUNT(*) as c FROM community_members WHERE community_id = ?",
            (row["id"],),
        ).fetchone()["c"]
        communities_out.append({
            "id": row["id"],
            "level": row["level"],
            "node_count": cnt,
            "summary": (row["summary"] or "")[:100],
        })

    return {"communities": communities_out, "total": len(communities_out)}


# ---------------------------------------------------------------------------
# Impact Analysis
# ---------------------------------------------------------------------------

@app.post("/impact")
async def impact_analysis(req: ImpactRequest, db_path: str | None = None):
    """Compute blast radius for a node in the dependency graph."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    from impact import compute_blast_radius

    result = compute_blast_radius(
        G, req.node_id, max_depth=req.max_depth, direction=req.direction
    )
    return result


# ---------------------------------------------------------------------------
# Requirement ↔ Code Node Linking
# ---------------------------------------------------------------------------

@app.post("/link-requirement")
async def link_requirement(req: LinkRequirementRequest):
    """Link a BASIL requirement to a graph node."""
    comp_id = req.component_id or "default"
    if comp_id not in _requirement_links:
        _requirement_links[comp_id] = []

    _requirement_links[comp_id].append({
        "requirement_id": req.requirement_id,
        "node_id": req.node_id,
    })

    logger.info(
        f"Linked requirement {req.requirement_id} → node {req.node_id} "
        f"(component: {comp_id})"
    )

    return {
        "status": "linked",
        "requirement_id": req.requirement_id,
        "node_id": req.node_id,
        "component_id": comp_id,
    }


@app.get("/affected-nodes/{requirement_id}")
async def get_affected_nodes(
    requirement_id: str,
    component_id: str | None = None,
    max_depth: int = 3,
    db_path: str | None = None,
):
    """Get all code nodes affected by changes to a linked requirement."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    from impact import compute_blast_radius

    # Find links for this requirement
    links = []
    comp_ids = [component_id] if component_id else _requirement_links.keys()
    for cid in comp_ids:
        for link in _requirement_links.get(cid, []):
            if link["requirement_id"] == requirement_id:
                links.append(link)

    if not links:
        raise HTTPException(
            status_code=404,
            detail=f"No links found for requirement '{requirement_id}'",
        )

    results = []
    for link in links:
        result = compute_blast_radius(G, link["node_id"], max_depth=max_depth)
        result["requirement_id"] = requirement_id
        result["node_id"] = link["node_id"]
        results.append(result)

    return {
        "requirement_id": requirement_id,
        "link_count": len(links),
        "results": results,
    }


@app.get("/requirement-links")
async def list_requirement_links(component_id: str | None = None):
    """List all requirement-to-node links."""
    if component_id:
        return {
            "component_id": component_id,
            "links": _requirement_links.get(component_id, []),
        }
    return {"components": _requirement_links}


# ---------------------------------------------------------------------------
# Graph Export (for visualization)
# ---------------------------------------------------------------------------

@app.get("/export")
async def export_graph(
    format: str = Query("d3", description="Export format: d3, json, graphml"),
    db_path: str | None = None,
):
    """Export graph in various formats for visualization."""
    try:
        store, G = _load(db_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if format == "d3":
        # D3.js hierarchical JSON format
        nodes_out = []
        for nid, data in G.nodes(data=True):
            nodes_out.append({
                "id": nid,
                "label": data.get("label", nid),
                "kind": data.get("kind", "unknown"),
                "file_path": data.get("file_path", ""),
                "language": data.get("language", ""),
                "pagerank": data.get("pagerank", 0),
                "community_id": (data.get("community_ids") or [None])[0],
            })

        edges_out = []
        for source, target, data in G.edges(data=True):
            edges_out.append({
                "source": source,
                "target": target,
                "relation": data.get("relation", "?"),
                "weight": data.get("weight", 0),
            })

        return {
            "nodes": nodes_out,
            "edges": edges_out,
            "stats": {
                "node_count": len(nodes_out),
                "edge_count": len(edges_out),
            },
        }

    elif format == "graphml":
        import io
        out = io.StringIO()
        nx.write_graphml(G, out)
        return JSONResponse(content={"graphml": out.getvalue()})

    else:
        # Plain JSON (NetworkX-style)
        data = nx.node_link_data(G)
        return JSONResponse(content=data)


# ---------------------------------------------------------------------------
# Dev / Debug
# ---------------------------------------------------------------------------

@app.get("/builds")
async def list_builds():
    """List all build tasks."""
    return {"tasks": _build_tasks}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("GRAPH_ENGINE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
