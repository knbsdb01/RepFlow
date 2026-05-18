import { Issue } from "../types/Issue.js";

function getIssueKey(issue: Issue): string | null {
  if (issue.type !== "forbidden-import") {
    return null;
  }

  if (issue.files.length < 2) {
    return null;
  }

  const [from, to] = issue.files;

  return `${issue.type}::${from}::${to}`;
}

function getSpecificityScore(issue: Issue): number {
  const target = issue.files[1] ?? "";
  const ruleId = issue.ruleId ?? "";
  const title = issue.title ?? "";
  const message = issue.message ?? "";

  const searchableText = `${ruleId} ${title} ${message}`.toLowerCase();

  let score = target.length;

  if (searchableText.includes("eloquent")) {
    score += 1000;
  }

  if (searchableText.includes("prisma")) {
    score += 1000;
  }

  if (searchableText.includes("database")) {
    score += 500;
  }

  if (searchableText.includes("framework")) {
    score -= 100;
  }

  score += ruleId.length;

  return score;
}

function isMoreSpecific(candidate: Issue, current: Issue): boolean {
  const candidateScore = getSpecificityScore(candidate);
  const currentScore = getSpecificityScore(current);

  if (candidateScore !== currentScore) {
    return candidateScore > currentScore;
  }

  const severityRank = {
    low: 1,
    medium: 2,
    high: 3
  };

  return severityRank[candidate.severity] > severityRank[current.severity];
}

export function deduplicateIssues(issues: Issue[]): Issue[] {
  const result: Issue[] = [];
  const issueIndexByKey = new Map<string, number>();

  for (const issue of issues) {
    const key = getIssueKey(issue);

    if (!key) {
      result.push(issue);
      continue;
    }

    const existingIndex = issueIndexByKey.get(key);

    if (existingIndex === undefined) {
      issueIndexByKey.set(key, result.length);
      result.push(issue);
      continue;
    }

    const existingIssue = result[existingIndex];

    if (isMoreSpecific(issue, existingIssue)) {
      result[existingIndex] = issue;
    }
  }

  return result;
}
