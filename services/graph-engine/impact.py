"""Impact analysis module — blast radius and affected-node tracing."""

from __future__ import annotations

import logging
from typing import Any

import networkx as nx

logger = logging.getLogger(__name__)


def compute_blast_radius(
    G: nx.DiGraph,
    start_node: str,
    max_depth: int = 3,
    direction: str = "both",
) -> dict[str, Any]:
    """Compute blast radius from a node using BFS traversal.

    Args:
        G: NetworkX DiGraph (code dependency graph).
        start_node: Node ID to start from.
        max_depth: Maximum hop depth for BFS.
        direction: "forward" (dependents), "backward" (dependencies),
                   or "both" (all reachable).

    Returns:
        Dict with affected nodes, critical path, and summary stats.
    """
    if start_node not in G:
        return {"error": f"Node '{start_node}' not found in graph", "nodes": [], "edges": []}

    visited: set[str] = set()
    affected: dict[str, dict[str, Any]] = {}
    edges_found: list[dict[str, Any]] = []
    queue: list[tuple[str, int, list[str]]] = [(start_node, 0, [start_node])]

    while queue:
        current, depth, path = queue.pop(0)
        if depth > max_depth:
            continue
        if current in visited:
            continue
        visited.add(current)

        node_data = dict(G.nodes(data=True)).get(current, {})
        affected[current] = {
            "id": current,
            "label": node_data.get("label", current),
            "kind": node_data.get("kind", "unknown"),
            "file_path": node_data.get("file_path", ""),
            "depth": depth,
            "path": path,
            "pagerank": node_data.get("pagerank", 0),
        }

        # Get neighbors based on direction
        neighbors: list[tuple[str, str, str]] = []
        if direction in ("forward", "both"):
            for _, target, edata in G.out_edges(current, data=True):
                neighbors.append(
                    (target, "forward", edata.get("relation", "unknown"))
                )
        if direction in ("backward", "both"):
            for source, _, edata in G.in_edges(current, data=True):
                neighbors.append(
                    (source, "backward", edata.get("relation", "unknown"))
                )

        for neighbor, edge_dir, relation in neighbors:
            if neighbor not in visited:
                edges_found.append({
                    "source": current if edge_dir == "forward" else neighbor,
                    "target": neighbor if edge_dir == "forward" else current,
                    "relation": relation,
                    "direction": edge_dir,
                })
                queue.append((neighbor, depth + 1, path + [neighbor]))

    return {
        "start_node": start_node,
        "max_depth": max_depth,
        "direction": direction,
        "total_affected": len(affected) - 1,  # exclude start node
        "affected_nodes": list(affected.values()),
        "affected_edges": edges_found,
        "critical_paths": _find_critical_paths(G, start_node, affected),
    }


def _find_critical_paths(
    G: nx.DiGraph,
    start_node: str,
    affected: dict[str, Any],
) -> list[list[str]]:
    """Find critical (highest PageRank) paths from start node."""
    scored = sorted(
        affected.values(),
        key=lambda x: x["pagerank"],
        reverse=True,
    )
    critical: list[list[str]] = []
    for node_info in scored[:5]:
        path = node_info.get("path", [])
        if len(path) > 1:
            critical.append(path)
    return critical


def find_impacted_by_requirement(
    G: nx.DiGraph,
    req_links: list[dict[str, str]],
    max_depth: int = 3,
) -> list[dict[str, Any]]:
    """Find all graph nodes impacted by changes to linked requirements.

    Args:
        G: Code dependency graph.
        req_links: List of {"requirement_id": str, "node_id": str} mappings.
        max_depth: Blast radius depth.

    Returns:
        List of impact results per requirement link.
    """
    results = []
    for link in req_links:
        node_id = link.get("node_id", "")
        req_id = link.get("requirement_id", "")
        result = compute_blast_radius(G, node_id, max_depth=max_depth)
        result["requirement_id"] = req_id
        results.append(result)
    return results
