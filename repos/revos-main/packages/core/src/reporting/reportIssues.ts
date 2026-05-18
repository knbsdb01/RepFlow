import { Issue } from "../types/Issue.js";
import { formatPath } from "../utils/formatPath.js";

function countIssuesBySeverity(issues: Issue[]): {
  high: number;
  medium: number;
  low: number;
} {
  return {
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length
  };
}

function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`
): string {
  return count === 1 ? singular : plural;
}

export function reportIssues(
  issues: Issue[],
  basePath: string,
  maxIssues?: number
): void {
  console.log("\nArchitecture Issues");

  if (issues.length === 0) {
    console.log("No architecture issues found.");
    return;
  }

  const severityCounts = countIssuesBySeverity(issues);

  console.log(
    `Found ${issues.length} ${pluralize(issues.length, "issue")}: ` +
      `${severityCounts.high} high, ` +
      `${severityCounts.medium} medium, ` +
      `${severityCounts.low} low`
  );

  const visibleIssues =
    maxIssues === undefined || maxIssues === 0
      ? issues
      : issues.slice(0, maxIssues);

  if (visibleIssues.length < issues.length) {
    console.log(
      `Showing ${visibleIssues.length} of ${issues.length} issues. Use --max-issues 0 to show all.`
    );
  }

  for (const [index, issue] of visibleIssues.entries()) {
    console.log("");
    console.log(
      `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`
    );
    console.log(`   Type: ${issue.type}`);

    if (issue.ruleId) {
      console.log(`   Rule: ${issue.ruleId}`);
    }

    console.log("");
    console.log("   Files:");
    for (const file of issue.files) {
      console.log(`   - ${formatPath(file, basePath)}`);
    }

    console.log("");
    console.log("   Problem:");
    console.log(`   ${issue.message}`);

    console.log("");
    console.log("   Suggested fix:");
    console.log(`   ${issue.suggestedFix}`);
  }
}
