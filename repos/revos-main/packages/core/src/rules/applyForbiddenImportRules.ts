import { DependencyGraph } from "../types/DependencyGraph.js";
import { RevosConfig } from "../types/RevosConfig.js";
import { Issue } from "../types/Issue.js";
import { matchRulePattern } from "./matchRulePattern.js";
import { shouldIgnoreIssue } from "./shouldIgnoreIssue.js";

export function applyForbiddenImportRules(
  graph: DependencyGraph,
  config: RevosConfig
): Issue[] {
  const issues: Issue[] = [];

  for (const edge of graph.edges) {
    for (const rule of config.forbiddenImports) {
      const fromMatches = matchRulePattern(edge.from, rule.from);
      const toMatches = matchRulePattern(edge.to, rule.to);

      if (fromMatches && toMatches) {
        const issue: Issue = {
          type: "forbidden-import",
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: rule.message,
          files: [edge.from, edge.to],
          suggestedFix: rule.suggestedFix
        };

        if (!shouldIgnoreIssue(issue, config)) {
          issues.push(issue);
        }
      }
    }
  }

  return issues;
}
