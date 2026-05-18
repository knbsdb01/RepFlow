import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPythonImports } from "../extractImports.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-python-imports-"));
}

describe("extractPythonImports", () => {
  it("resolves internal and external Python imports", async () => {
    const projectPath = await createTempProject();

    const routePath = path.join(projectPath, "app", "api", "users.py");
    const servicePath = path.join(projectPath, "app", "services", "user_service.py");
    const repositoryPath = path.join(projectPath, "app", "repositories", "user_repository.py");

    await fs.mkdir(path.dirname(routePath), { recursive: true });
    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.mkdir(path.dirname(repositoryPath), { recursive: true });

    await fs.writeFile(servicePath, "class UserService:\n    pass\n");
    await fs.writeFile(repositoryPath, "class UserRepository:\n    pass\n");

    await fs.writeFile(
      routePath,
      `
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
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
        to: "[external] sqlalchemy"
      },
      {
        from: routePath,
        to: servicePath
      },
      {
        from: routePath,
        to: repositoryPath
      }
    ]);
  });
});
