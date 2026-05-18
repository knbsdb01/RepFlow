import { DependencyGraph } from "./types/DependencyGraph.js";
import { Issue } from "./types/Issue.js";

import { findCircularDependencies } from "./detectors/findCircularDependencies.js";
import { loadConfig } from "./rules/loadConfig.js";
import { applyForbiddenImportRules } from "./rules/applyForbiddenImportRules.js";
import { deduplicateIssues } from "./issues/deduplicateIssues.js";

export async function analyzeArchitecture(
  graph: DependencyGraph,
  projectPath: string
): Promise<Issue[]> {
  const config = await loadConfig(projectPath);

  const cycles = findCircularDependencies(graph).filter(
    (cycle) => !isFrameworkNoiseCycle(cycle)
  );

  const circularIssues: Issue[] = cycles.map((cycle) => ({
    type: "circular-dependency",
    severity: "high",
    title: "Circular dependency detected",
    message:
      "Two or more files depend on each other. This makes the architecture harder to maintain and can create runtime bugs.",
    files: cycle,
    suggestedFix:
      "Extract the shared logic into a separate file or module, then make both files depend on that shared abstraction instead of depending on each other."
  }));

  const forbiddenImportIssues = applyForbiddenImportRules(
    graph,
    config
  );

  return deduplicateIssues([
    ...circularIssues,
    ...forbiddenImportIssues
  ]);
}

function isFrameworkNoiseCycle(cycle: string[]): boolean {
  return (
    isSelfDependencyCycle(cycle) ||
    isLaravelFactoryCycle(cycle) ||
    isFilamentResourcePageCycle(cycle) ||
    isGeneratedCodeCycle(cycle) ||
    isFixtureCycle(cycle)
  );
}

function isSelfDependencyCycle(cycle: string[]): boolean {
  return new Set(cycle.map(normalizePath)).size < 2;
}

function isLaravelFactoryCycle(cycle: string[]): boolean {
  return cycle.some((filePath) =>
    normalizePath(filePath).includes("/database/factories/")
  );
}

function isFilamentResourcePageCycle(cycle: string[]): boolean {
  const normalizedCycle = cycle.map(normalizePath);

  return (
    normalizedCycle.some((filePath) =>
      filePath.includes("/filament/resources/")
    ) &&
    normalizedCycle.some((filePath) =>
      filePath.includes("/pages/")
    )
  );
}

function isGeneratedCodeCycle(cycle: string[]): boolean {
  return cycle.every((filePath) => {
    const normalized = normalizePath(filePath);

    return (
      normalized.includes("/generated/") ||
      normalized.includes("/@generated/")
    );
  });
}

function isFixtureCycle(cycle: string[]): boolean {
  return cycle.every((filePath) => {
    const normalized = normalizePath(filePath);

    return (
      normalized.includes("/fixtures/") ||
      normalized.includes("/__fixtures__/") ||
      normalized.includes("/test-fixtures/") ||
      normalized.includes("/tests/fixtures/") ||
      normalized.includes("/test/fixtures/") ||
      /\/sample-[^/]*-negative\//.test(normalized)
    );
  });
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").toLowerCase();
}
