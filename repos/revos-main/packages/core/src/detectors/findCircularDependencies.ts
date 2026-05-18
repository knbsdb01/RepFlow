import { DependencyGraph } from "../types/DependencyGraph.js";

export function findCircularDependencies(
  graph: DependencyGraph
): string[][] {
  const adjacencyList = new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacencyList.set(node, []);
  }

  for (const edge of graph.edges) {
    if (edge.to.startsWith("[external]")) {
      continue;
    }

    adjacencyList.get(edge.from)?.push(edge.to);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function visit(node: string) {
    if (stack.has(node)) {
      const cycleStartIndex = path.indexOf(node);
      cycles.push([...path.slice(cycleStartIndex), node]);
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    stack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) ?? [];

    for (const neighbor of neighbors) {
      visit(neighbor);
    }

    stack.delete(node);
    path.pop();
  }

  for (const node of graph.nodes) {
    visit(node);
  }

  return reduceOverlappingCycles(cycles);
}

function reduceOverlappingCycles(cycles: string[][]): string[][] {
  const uniqueCyclesBySignature = new Map<string, string[]>();

  const sortedCycles = [...cycles].sort((left, right) => {
    const leftSize = getUniqueCycleFiles(left).size;
    const rightSize = getUniqueCycleFiles(right).size;

    if (leftSize !== rightSize) {
      return leftSize - rightSize;
    }

    return left.join("\0").localeCompare(right.join("\0"));
  });

  for (const cycle of sortedCycles) {
    const signature = getCycleSignature(cycle);

    if (!uniqueCyclesBySignature.has(signature)) {
      uniqueCyclesBySignature.set(signature, cycle);
    }
  }

  const reducedCycles: string[][] = [];

  for (const cycle of uniqueCyclesBySignature.values()) {
    const cycleFiles = getUniqueCycleFiles(cycle);

    const isCoveredBySmallerCycle = reducedCycles.some((existingCycle) => {
      const existingCycleFiles = getUniqueCycleFiles(existingCycle);

      return isSubset(existingCycleFiles, cycleFiles);
    });

    if (!isCoveredBySmallerCycle) {
      reducedCycles.push(cycle);
    }
  }

  return reducedCycles;
}

function getUniqueCycleFiles(cycle: string[]): Set<string> {
  return new Set(cycle);
}

function getCycleSignature(cycle: string[]): string {
  return [...getUniqueCycleFiles(cycle)].sort().join("\0");
}

function isSubset(
  possibleSubset: Set<string>,
  possibleSuperset: Set<string>
): boolean {
  for (const value of possibleSubset) {
    if (!possibleSuperset.has(value)) {
      return false;
    }
  }

  return true;
}
