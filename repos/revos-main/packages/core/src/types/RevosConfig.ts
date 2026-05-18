import { IssueSeverity } from "./Issue.js";

export interface ForbiddenImportRule {
  id: string;
  from: string;
  to: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  suggestedFix: string;
}

export interface IgnoredIssueRule {
  ruleId?: string;
  from?: string;
  to?: string;
}

export interface RevosConfig {
  forbiddenImports: ForbiddenImportRule[];
  ignoreRules?: string[];
  ignoreIssues?: IgnoredIssueRule[];
}
