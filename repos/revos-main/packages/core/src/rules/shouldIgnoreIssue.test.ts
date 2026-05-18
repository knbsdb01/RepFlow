import { describe, expect, it } from "vitest";
import { shouldIgnoreIssue } from "./shouldIgnoreIssue.js";
import { Issue } from "../types/Issue.js";
import { RevosConfig } from "../types/RevosConfig.js";

const issue: Issue = {
  type: "forbidden-import",
  ruleId: "fastapi-api-no-repository",
  severity: "medium",
  title: "API layer imports repository directly",
  message: "A FastAPI route is importing a repository directly.",
  files: [
    "/project/app/api/users.py",
    "/project/app/repositories/user_repository.py"
  ],
  suggestedFix: "Move repository usage into an application service."
};

describe("shouldIgnoreIssue", () => {
  it("ignores an issue by rule id", () => {
    const config: RevosConfig = {
      ignoreRules: ["fastapi-api-no-repository"],
      forbiddenImports: []
    };

    expect(shouldIgnoreIssue(issue, config)).toBe(true);
  });

  it("does not ignore an issue when rule id does not match", () => {
    const config: RevosConfig = {
      ignoreRules: ["other-rule"],
      forbiddenImports: []
    };

    expect(shouldIgnoreIssue(issue, config)).toBe(false);
  });

  it("ignores an issue by rule id, from, and to glob patterns", () => {
    const config: RevosConfig = {
      ignoreIssues: [
        {
          ruleId: "fastapi-api-no-repository",
          from: "**/app/api/**",
          to: "**/app/repositories/**"
        }
      ],
      forbiddenImports: []
    };

    expect(shouldIgnoreIssue(issue, config)).toBe(true);
  });

  it("does not ignore an issue when from pattern does not match", () => {
    const config: RevosConfig = {
      ignoreIssues: [
        {
          ruleId: "fastapi-api-no-repository",
          from: "**/app/domain/**",
          to: "**/app/repositories/**"
        }
      ],
      forbiddenImports: []
    };

    expect(shouldIgnoreIssue(issue, config)).toBe(false);
  });

  it("supports partial ignored issue rules", () => {
    const config: RevosConfig = {
      ignoreIssues: [
        {
          from: "**/app/api/**"
        }
      ],
      forbiddenImports: []
    };

    expect(shouldIgnoreIssue(issue, config)).toBe(true);
  });
});
