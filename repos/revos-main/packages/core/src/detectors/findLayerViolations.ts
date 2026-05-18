import { DependencyGraph } from "../types/DependencyGraph.js";
import { Issue } from "../types/Issue.js";

export function findLayerViolations(graph: DependencyGraph): Issue[] {
  const issues: Issue[] = [];

  for (const edge of graph.edges) {
    const fromIsController =
      edge.from.includes("/controllers/") ||
      edge.from.endsWith(".controller.ts");

    const toIsRepository =
      edge.to.includes("/repositories/") ||
      edge.to.endsWith(".repository.ts");

    if (fromIsController && toIsRepository) {
      issues.push({
        type: "layer-violation",
        severity: "high",
        title: "Layer violation detected",
        message:
          "A controller is importing a repository directly. This bypasses the service layer and increases coupling.",
        files: [edge.from, edge.to],
        suggestedFix:
          "Move the repository access into a service, then make the controller depend on that service instead."
      });
    }
  }

  return issues;
}