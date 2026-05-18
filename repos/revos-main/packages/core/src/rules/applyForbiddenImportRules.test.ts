import { describe, expect, it } from "vitest";
import { applyForbiddenImportRules } from "./applyForbiddenImportRules.js";
import { DependencyGraph } from "../types/DependencyGraph.js";
import { RevosConfig } from "../types/RevosConfig.js";

describe("applyForbiddenImportRules", () => {
  it("creates an issue when a forbidden import rule matches", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/client/session.ts",
        "/project/server/auth.ts"
      ],
      edges: [
        {
          from: "/project/client/session.ts",
          to: "/project/server/auth.ts"
        }
      ]
    };

    const config: RevosConfig = {
      forbiddenImports: [
        {
          id: "client-no-server",
          from: "/client/",
          to: "/server/",
          severity: "high",
          title: "Client code imports server code",
          message:
            "Client-side code is importing server-side code.",
          suggestedFix:
            "Expose server functionality through an API route."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("client-no-server");
    expect(issues[0].severity).toBe("high");
    expect(issues[0].files).toEqual([
      "/project/client/session.ts",
      "/project/server/auth.ts"
    ]);
  });

  it("supports rules against external dependencies", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/components/UserCard.tsx",
        "[external] @prisma/client"
      ],
      edges: [
        {
          from: "/project/components/UserCard.tsx",
          to: "[external] @prisma/client"
        }
      ]
    };

    const config: RevosConfig = {
      forbiddenImports: [
        {
          id: "components-no-prisma",
          from: "/components/",
          to: "[external] @prisma/client",
          severity: "high",
          title: "React component accesses Prisma directly",
          message:
            "A UI component is importing Prisma directly.",
          suggestedFix:
            "Move database access into a server action."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("components-no-prisma");
    expect(issues[0].severity).toBe("high");
  });

  it("supports glob patterns in rules", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/app/domain/user.py",
        "[external] fastapi"
      ],
      edges: [
        {
          from: "/project/app/domain/user.py",
          to: "[external] fastapi"
        }
      ]
    };

    const config: RevosConfig = {
      forbiddenImports: [
        {
          id: "domain-no-fastapi",
          from: "**/domain/**",
          to: "[external] fastapi",
          severity: "high",
          title: "Domain depends on FastAPI",
          message:
            "Domain code should not depend on FastAPI.",
          suggestedFix:
            "Move FastAPI-specific code into API routes."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("domain-no-fastapi");
  });

  it("ignores issues by rule id", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/app/domain/user.py",
        "[external] fastapi"
      ],
      edges: [
        {
          from: "/project/app/domain/user.py",
          to: "[external] fastapi"
        }
      ]
    };

    const config: RevosConfig = {
      ignoreRules: ["domain-no-fastapi"],
      forbiddenImports: [
        {
          id: "domain-no-fastapi",
          from: "**/domain/**",
          to: "[external] fastapi",
          severity: "high",
          title: "Domain depends on FastAPI",
          message:
            "Domain code should not depend on FastAPI.",
          suggestedFix:
            "Move FastAPI-specific code into API routes."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toEqual([]);
  });

  it("ignores issues by specific from and to patterns", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/app/api/health.py",
        "/project/app/repositories/health_repository.py"
      ],
      edges: [
        {
          from: "/project/app/api/health.py",
          to: "/project/app/repositories/health_repository.py"
        }
      ]
    };

    const config: RevosConfig = {
      ignoreIssues: [
        {
          ruleId: "fastapi-api-no-repository",
          from: "**/app/api/health.py",
          to: "**/app/repositories/**"
        }
      ],
      forbiddenImports: [
        {
          id: "fastapi-api-no-repository",
          from: "**/app/api/**",
          to: "**/app/repositories/**",
          severity: "medium",
          title: "API layer imports repository directly",
          message:
            "A FastAPI route is importing a repository directly.",
          suggestedFix:
            "Move repository usage into an application service."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toEqual([]);
  });

  it("does not create an issue when no rule matches", () => {
    const graph: DependencyGraph = {
      nodes: [
        "/project/services/user.service.ts",
        "/project/repositories/user.repository.ts"
      ],
      edges: [
        {
          from: "/project/services/user.service.ts",
          to: "/project/repositories/user.repository.ts"
        }
      ]
    };

    const config: RevosConfig = {
      forbiddenImports: [
        {
          id: "controller-no-repository",
          from: "/controllers/",
          to: "/repositories/",
          severity: "high",
          title: "Controller imports repository directly",
          message:
            "A controller is importing a repository directly.",
          suggestedFix:
            "Move repository access into a service."
        }
      ]
    };

    const issues = applyForbiddenImportRules(graph, config);

    expect(issues).toEqual([]);
  });
});
