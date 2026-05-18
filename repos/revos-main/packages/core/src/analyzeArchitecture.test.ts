import { describe, expect, it } from "vitest";

import { analyzeArchitecture } from "./analyzeArchitecture.js";
import { DependencyGraph } from "./types/DependencyGraph.js";

describe("analyzeArchitecture", () => {
  it("ignores Laravel factory dependency cycles", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/app/Models/User.php",
        "/project/app/Database/Factories/UserFactory.php"
      ]),
      edges: [
        {
          from: "/project/app/Models/User.php",
          to: "/project/app/Database/Factories/UserFactory.php"
        },
        {
          from: "/project/app/Database/Factories/UserFactory.php",
          to: "/project/app/Models/User.php"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toEqual([]);
  });

  it("ignores lowercase Laravel factory dependency cycles", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/packages/core/src/Models/User.php",
        "/project/packages/core/database/factories/UserFactory.php"
      ]),
      edges: [
        {
          from: "/project/packages/core/src/Models/User.php",
          to: "/project/packages/core/database/factories/UserFactory.php"
        },
        {
          from: "/project/packages/core/database/factories/UserFactory.php",
          to: "/project/packages/core/src/Models/User.php"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toEqual([]);
  });

  it("ignores Filament resource page dependency cycles", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/modules/Blog/src/Filament/Resources/BlogResource.php",
        "/project/modules/Blog/src/Filament/Resources/Pages/CreateBlog.php"
      ]),
      edges: [
        {
          from: "/project/modules/Blog/src/Filament/Resources/BlogResource.php",
          to: "/project/modules/Blog/src/Filament/Resources/Pages/CreateBlog.php"
        },
        {
          from: "/project/modules/Blog/src/Filament/Resources/Pages/CreateBlog.php",
          to: "/project/modules/Blog/src/Filament/Resources/BlogResource.php"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toEqual([]);
  });

  it("ignores dependency cycles fully inside generated code", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/src/common/@generated/user/user-where.input.ts",
        "/project/src/common/@generated/profile/profile-where.input.ts"
      ]),
      edges: [
        {
          from: "/project/src/common/@generated/user/user-where.input.ts",
          to: "/project/src/common/@generated/profile/profile-where.input.ts"
        },
        {
          from: "/project/src/common/@generated/profile/profile-where.input.ts",
          to: "/project/src/common/@generated/user/user-where.input.ts"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toEqual([]);
  });

  it("ignores self-dependency cycles", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/tests/factories.py"
      ]),
      edges: [
        {
          from: "/project/tests/factories.py",
          to: "/project/tests/factories.py"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toEqual([]);
  });

  it("keeps dependency cycles between manual code and generated code", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/src/modules/user/user.service.ts",
        "/project/src/common/@generated/user/user.model.ts"
      ]),
      edges: [
        {
          from: "/project/src/modules/user/user.service.ts",
          to: "/project/src/common/@generated/user/user.model.ts"
        },
        {
          from: "/project/src/common/@generated/user/user.model.ts",
          to: "/project/src/modules/user/user.service.ts"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      type: "circular-dependency",
      severity: "high",
      title: "Circular dependency detected"
    });
  });

  it("keeps non-framework-noise dependency cycles", async () => {
    const graph: DependencyGraph = {
      nodes: new Set([
        "/project/app/Services/UserService.php",
        "/project/app/Repositories/UserRepository.php"
      ]),
      edges: [
        {
          from: "/project/app/Services/UserService.php",
          to: "/project/app/Repositories/UserRepository.php"
        },
        {
          from: "/project/app/Repositories/UserRepository.php",
          to: "/project/app/Services/UserService.php"
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, "/project");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      type: "circular-dependency",
      severity: "high",
      title: "Circular dependency detected"
    });
  });
});
