import { Issue } from "../types/Issue.js";
import { IssueSeverity } from "../types/Issue.js";

const severityRank: Record<IssueSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3
};

export function shouldFailOnSeverity(
  issues: Issue[],
  failOn: IssueSeverity
): boolean {
  const threshold = severityRank[failOn];

  return issues.some((issue) => {
    return severityRank[issue.severity] >= threshold;
  });
}
