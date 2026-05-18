import { DependencyGraph } from "../types/DependencyGraph.js";
import { ImportEdge } from "../types/ImportEdge.js";

export function buildDependencyGraph(
  imports: ImportEdge[]
): DependencyGraph {
  const nodes = new Set<string>();

  for (const edge of imports) {
    nodes.add(edge.from);
    nodes.add(edge.to);
  }

  return {
    nodes: Array.from(nodes),
    edges: imports
  };
}