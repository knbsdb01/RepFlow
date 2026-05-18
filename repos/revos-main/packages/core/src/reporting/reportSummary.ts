import { ScanRunResult } from "../types/ScanRunResult.js";

export function reportSummary(result: ScanRunResult): void {
  const highIssues = result.issues.filter(
    (issue) => issue.severity === "high"
  ).length;

  const mediumIssues = result.issues.filter(
    (issue) => issue.severity === "medium"
  ).length;

  const lowIssues = result.issues.filter(
    (issue) => issue.severity === "low"
  ).length;

  console.log("\nSummary");
  console.log(`Files scanned: ${result.files.length}`);
  console.log(
    `Detected plugins: ${result.detectedPlugins
      .map((plugin) => plugin.name)
      .join(", ")}`
  );
  console.log(`Dependencies: ${result.graph.edges.length}`);
  console.log(`Issues found: ${result.issues.length}`);
  console.log(`High: ${highIssues}`);
  console.log(`Medium: ${mediumIssues}`);
  console.log(`Low: ${lowIssues}`);
}