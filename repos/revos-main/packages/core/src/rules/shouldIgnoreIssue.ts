import { RevosConfig, IgnoredIssueRule } from "../types/RevosConfig.js";
import { Issue } from "../types/Issue.js";
import { matchRulePattern } from "./matchRulePattern.js";

function ignoredIssueMatches(
  issue: Issue,
  ignoredIssue: IgnoredIssueRule
): boolean {
  const [from, to] = issue.files;

  if (ignoredIssue.ruleId && ignoredIssue.ruleId !== issue.ruleId) {
    return false;
  }

  if (ignoredIssue.from && (!from || !matchRulePattern(from, ignoredIssue.from))) {
    return false;
  }

  if (ignoredIssue.to && (!to || !matchRulePattern(to, ignoredIssue.to))) {
    return false;
  }

  return true;
}

export function shouldIgnoreIssue(
  issue: Issue,
  config: RevosConfig
): boolean {
  if (issue.ruleId && config.ignoreRules?.includes(issue.ruleId)) {
    return true;
  }

  if (!config.ignoreIssues || config.ignoreIssues.length === 0) {
    return false;
  }

  return config.ignoreIssues.some((ignoredIssue) =>
    ignoredIssueMatches(issue, ignoredIssue)
  );
}
