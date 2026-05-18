import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPythonImports } from "../extractImports.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-python-relative-"));
}

describe("extractPythonImports with relative imports", () => {
  it("resolves relative imports to internal files", async () => {
    const projectPath = await createTempProject();

    const routePath = path.join(projectPath, "app", "api", "users.py");
    const domainPath = path.join(projectPath, "app", "domain", "user.py");
    const servicePath = path.join(projectPath, "app", "services", "user_service.py");

    await fs.mkdir(path.dirname(routePath), { recursive: true });
    await fs.mkdir(path.dirname(domainPath), { recursive: true });
    await fs.mkdir(path.dirname(servicePath), { recursive: true });

    await fs.writeFile(domainPath, "class User:\n    pass\n");
    await fs.writeFile(servicePath, "class UserService:\n    pass\n");

    await fs.writeFile(
      routePath,
      `
from fastapi import APIRouter
from ..domain.user import User
from ..services.user_service import UserService
`
    );

    await expect(
      extractPythonImports(routePath, projectPath)
    ).resolves.toEqual([
      {
        from: routePath,
        to: "[external] fastapi"
      },
      {
        from: routePath,
        to: domainPath
      },
      {
        from: routePath,
        to: servicePath
      }
    ]);
  });

  it("resolves relative imports to package __init__.py files", async () => {
    const projectPath = await createTempProject();

    const routePath = path.join(projectPath, "app", "api", "users.py");
    const schemasInitPath = path.join(projectPath, "app", "api", "schemas", "__init__.py");

    await fs.mkdir(path.dirname(routePath), { recursive: true });
    await fs.mkdir(path.dirname(schemasInitPath), { recursive: true });

    await fs.writeFile(schemasInitPath, "");

    await fs.writeFile(
      routePath,
      `
from .schemas import UserResponse
`
    );

    await expect(
      extractPythonImports(routePath, projectPath)
    ).resolves.toEqual([
      {
        from: routePath,
        to: schemasInitPath
      }
    ]);
  });
});
