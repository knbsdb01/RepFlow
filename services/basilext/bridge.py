"""BASIL ↔ Graph Engine Bridge Service.

Connects BASIL's software components (ApiModel) to the Graph Engine
for dependency analysis and impact assessment.

This can run as a sidecar or be called by the gateway.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("basil-bridge")

app = FastAPI(title="ReqFlow BASIL Bridge", version="0.1.0")

# Configuration
BASIL_API_URL = os.environ.get("BASIL_API_URL", "http://basil-api:5000")
GRAPH_ENGINE_URL = os.environ.get(
    "GRAPH_ENGINE_URL", "http://graph-engine:8001"
)
BASIL_AUTH = {"user-id": "admin", "token": os.environ.get("BASIL_ADMIN_PASSWORD", "admin123")}

# In-memory registry: component_id -> repo mapping
COMPONENT_REPOS: dict[str, dict[str, str]] = {}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class RegisterComponentRequest(BaseModel):
    component_id: str = Field(description="BASIL API/component ID")
    repo_url: str = Field(description="Git repository URL")
    local_path: str = Field(description="Local path in the /repos volume")


class LinkRequirementRequest(BaseModel):
    requirement_id: str
    node_id: str
    component_id: str


class ImpactQuery(BaseModel):
    component_id: str
    requirement_id: str | None = None
    node_id: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "basil-bridge"}


@app.post("/components/register")
async def register_component(req: RegisterComponentRequest):
    """Register a BASIL component with its code repository."""
    COMPONENT_REPOS[req.component_id] = {
        "repo_url": req.repo_url,
        "local_path": req.local_path,
    }
    logger.info(f"Registered component {req.component_id} → {req.local_path}")
    return {
        "status": "registered",
        "component_id": req.component_id,
        "local_path": req.local_path,
    }


@app.get("/components")
async def list_components():
    """List all registered components."""
    return {"components": COMPONENT_REPOS}


@app.post("/build/{component_id}")
async def build_component_graph(component_id: str):
    """Build code graph for a registered component."""
    if component_id not in COMPONENT_REPOS:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not registered")

    repo = COMPONENT_REPOS[component_id]
    local_path = repo["local_path"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_ENGINE_URL}/build",
            json={"source_dir": local_path, "incremental": True},
            timeout=300,
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Graph build failed: {resp.text}",
            )
        return resp.json()


@app.get("/component/{component_id}/stats")
async def get_component_stats(component_id: str):
    """Get graph statistics for a component."""
    if component_id not in COMPONENT_REPOS:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not registered")

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GRAPH_ENGINE_URL}/stats")
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Graph engine unavailable")
        return resp.json()


@app.post("/link-requirement")
async def link_requirement(req: LinkRequirementRequest):
    """Link a BASIL requirement to a code graph node."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_ENGINE_URL}/link-requirement",
            json={
                "requirement_id": req.requirement_id,
                "node_id": req.node_id,
                "component_id": req.component_id,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=str(resp.text))
        return resp.json()


@app.post("/impact")
async def analyze_impact(req: ImpactQuery):
    """Analyze the impact of a change to a linked requirement."""
    if req.requirement_id:
        # Get affected nodes via graph engine
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GRAPH_ENGINE_URL}/affected-nodes/{req.requirement_id}",
                params={"component_id": req.component_id, "max_depth": 3},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=str(resp.text))
            return resp.json()

    elif req.node_id:
        # Direct blast radius query
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{GRAPH_ENGINE_URL}/impact",
                json={"node_id": req.node_id, "max_depth": 3, "direction": "both"},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=str(resp.text))
            return resp.json()

    raise HTTPException(status_code=400, detail="Provide requirement_id or node_id")


@app.get("/components/{component_id}/search")
async def search_component_code(
    component_id: str,
    query: str = "",
    top_k: int = 10,
):
    """Search code within a component's graph."""
    if component_id not in COMPONENT_REPOS:
        raise HTTPException(status_code=404, detail=f"Component {component_id} not registered")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_ENGINE_URL}/search",
            json={"query": query, "top_k": top_k},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=str(resp.text))
        return resp.json()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("BASIL_BRIDGE_PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
