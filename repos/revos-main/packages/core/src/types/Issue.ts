export type IssueSeverity = "low" | "medium" | "high";

export interface Issue {
  type: string;
  ruleId?: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  files: string[];
  suggestedFix: string;
}