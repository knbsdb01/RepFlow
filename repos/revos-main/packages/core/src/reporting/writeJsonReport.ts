import fs from "fs/promises";
import path from "path";

import { ScanRunResult } from "../types/ScanRunResult.js";
import { formatPath } from "../utils/formatPath.js";

export async function writeJsonReport(
  result: ScanRunResult
): Promise<string> {
  const reportDirectory = path.join(result.projectPath, ".revos");
  const reportPath = path.join(reportDirectory, "report.json");

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

  const report = {
    tool: "revos",
    version: "0.1.3",
    projectPath: result.projectPath,
    summary: {
      filesScanned: result.files.length,
      detectedPlugins: result.detectedPlugins.map((plugin) => plugin.name),
      detectedFrameworks: result.detectedFrameworks.map((framework) => ({
        name: framework.name,
        confidence: framework.confidence,
        reason: framework.reason
      })),
      dependencies: result.graph.edges.length,
      issuesFound: result.issues.length,
      severity: {
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues
      }
    },
    issues: result.issues.map((issue) => ({
      type: issue.type,
      ruleId: issue.ruleId ?? null,
      severity: issue.severity,
      title: issue.title,
      files: issue.files.map((file) =>
        formatPath(file, result.projectPath)
      ),
      message: issue.message,
      suggestedFix: issue.suggestedFix
    }))
  };

  await fs.writeFile(
    reportPath,
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  return reportPath;
}
