import { describe, expect, it } from "vitest";
import { deduplicateIssues } from "./deduplicateIssues.js";
import { Issue } from "../types/Issue.js";

describe("deduplicateIssues", () => {
  it("keeps non-forbidden-import issues untouched", () => {
    const issues: Issue[] = [
      {
        type: "circular-dependency",
        severity: "high",
        title: "Circular dependency detected",
        message: "Cycle found.",
        files: ["a.ts", "b.ts", "a.ts"],
        suggestedFix: "Break the cycle."
      }
    ];

    expect(deduplicateIssues(issues)).toEqual(issues);
  });

  it("deduplicates forbidden import issues for the same source and target", () => {
    const issues: Issue[] = [
      {
        type: "forbidden-import",
        ruleId: "laravel-domain-no-laravel-framework-src",
        severity: "high",
        title: "Domain depends on Laravel framework",
        message: "Domain code imports Laravel framework APIs.",
        files: [
          "/project/src/Domain/Entities/User.php",
          "[external] Illuminate\\Database\\Eloquent\\Model"
        ],
        suggestedFix: "Keep the domain layer framework-independent."
      },
      {
        type: "forbidden-import",
        ruleId: "laravel-domain-no-eloquent-src",
        severity: "high",
        title: "Domain depends on Eloquent",
        message: "Domain code imports Eloquent.",
        files: [
          "/project/src/Domain/Entities/User.php",
          "[external] Illuminate\\Database\\Eloquent\\Model"
        ],
        suggestedFix: "Move Eloquent models into infrastructure."
      }
    ];

    expect(deduplicateIssues(issues)).toEqual([
      {
        type: "forbidden-import",
        ruleId: "laravel-domain-no-eloquent-src",
        severity: "high",
        title: "Domain depends on Eloquent",
        message: "Domain code imports Eloquent.",
        files: [
          "/project/src/Domain/Entities/User.php",
          "[external] Illuminate\\Database\\Eloquent\\Model"
        ],
        suggestedFix: "Move Eloquent models into infrastructure."
      }
    ]);
  });

  it("does not deduplicate forbidden import issues with different targets", () => {
    const issues: Issue[] = [
      {
        type: "forbidden-import",
        ruleId: "controller-no-model",
        severity: "high",
        title: "Controller imports model",
        message: "Controller imports model.",
        files: [
          "/project/app/Http/Controllers/UserController.php",
          "/project/app/Models/User.php"
        ],
        suggestedFix: "Move model usage elsewhere."
      },
      {
        type: "forbidden-import",
        ruleId: "controller-no-db-facade",
        severity: "high",
        title: "Controller accesses DB facade",
        message: "Controller imports DB.",
        files: [
          "/project/app/Http/Controllers/UserController.php",
          "[external] Illuminate\\Support\\Facades\\DB"
        ],
        suggestedFix: "Move DB usage elsewhere."
      }
    ];

    expect(deduplicateIssues(issues)).toEqual(issues);
  });
});
