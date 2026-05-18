import fs from "fs/promises";
import path from "path";

import { ScanRunResult } from "../types/ScanRunResult.js";
import { formatPath } from "../utils/formatPath.js";

export async function writeMarkdownReport(
  result: ScanRunResult
): Promise<string> {
  const reportDirectory = path.join(result.projectPath, ".revos");
  const reportPath = path.join(reportDirectory, "report.md");

  await fs.mkdir(reportDirectory, { recursive: true });

  const highIssues = result.issues.filter(
    (issue) => issue.severity === "high"
  ).length;

  const mediumIssues = result.issues.filter(
    (issue) => issue.severity === "medium"
  ).length;

  const lowIssues = result.issues.filter(
    (issue) => issue.severity === "low"
  ).length;

  const detectedPlugins = result.detectedPlugins
    .map((plugin) => plugin.name)
    .join(", ");

  const detectedFrameworks =
    result.detectedFrameworks.length > 0
      ? result.detectedFrameworks
          .map((framework) => framework.name)
          .join(", ")
      : "none";

  const lines: string[] = [];

  lines.push("# Revos Report");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Files scanned: ${result.files.length}`);
  lines.push(`- Detected plugins: ${detectedPlugins}`);
  lines.push(`- Detected frameworks: ${detectedFrameworks}`);
  lines.push(`- Dependencies: ${result.graph.edges.length}`);
  lines.push(`- Issues found: ${result.issues.length}`);
  lines.push(`- High: ${highIssues}`);
  lines.push(`- Medium: ${mediumIssues}`);
  lines.push(`- Low: ${lowIssues}`);
  lines.push("");

  lines.push("## Issues");
  lines.push("");

  if (result.issues.length === 0) {
    lines.push("No architecture issues found.");
  }

  for (const issue of result.issues) {
    lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title}`);
    lines.push("");
    lines.push(`- Type: ${issue.type}`);

    if (issue.ruleId) {
      lines.push(`- Rule: ${issue.ruleId}`);
    }

    lines.push("");
    lines.push("**Files:**");
    lines.push("");

    for (const file of issue.files) {
      lines.push(`- ${formatPath(file, result.projectPath)}`);
    }

    lines.push("");
    lines.push("**Problem:**");
    lines.push("");
    lines.push(issue.message);
    lines.push("");
    lines.push("**Suggested fix:**");
    lines.push("");
    lines.push(issue.suggestedFix);
    lines.push("");
  }

  await fs.writeFile(reportPath, lines.join("\n"), "utf-8");

  return reportPath;
}
