import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePythonImportPath } from "../resolver/resolveImportPath.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-python-"));
}

describe("resolvePythonImportPath", () => {
  it("resolves Python modules to .py files", async () => {
    const projectPath = await createTempProject();

    const servicePath = path.join(
      projectPath,
      "app",
      "services",
      "user_service.py"
    );

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "class UserService:\n    pass\n");

    await expect(
      resolvePythonImportPath("app.services.user_service", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("resolves Python packages to __init__.py files", async () => {
    const projectPath = await createTempProject();

    const initPath = path.join(
      projectPath,
      "app",
      "services",
      "__init__.py"
    );

    await fs.mkdir(path.dirname(initPath), { recursive: true });
    await fs.writeFile(initPath, "");

    await expect(
      resolvePythonImportPath("app.services", projectPath)
    ).resolves.toBe(initPath);
  });

  it("resolves Python modules inside src layout", async () => {
    const projectPath = await createTempProject();

    const servicePath = path.join(
      projectPath,
      "src",
      "app",
      "services",
      "user_service.py"
    );

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "class UserService:\n    pass\n");

    await expect(
      resolvePythonImportPath("app.services.user_service", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("resolves Python packages inside src layout", async () => {
    const projectPath = await createTempProject();

    const initPath = path.join(
      projectPath,
      "src",
      "app",
      "services",
      "__init__.py"
    );

    await fs.mkdir(path.dirname(initPath), { recursive: true });
    await fs.writeFile(initPath, "");

    await expect(
      resolvePythonImportPath("app.services", projectPath)
    ).resolves.toBe(initPath);
  });

  it("prefers project root modules over src modules", async () => {
    const projectPath = await createTempProject();

    const rootServicePath = path.join(
      projectPath,
      "app",
      "services",
      "user_service.py"
    );

    const srcServicePath = path.join(
      projectPath,
      "src",
      "app",
      "services",
      "user_service.py"
    );

    await fs.mkdir(path.dirname(rootServicePath), { recursive: true });
    await fs.mkdir(path.dirname(srcServicePath), { recursive: true });

    await fs.writeFile(rootServicePath, "class RootUserService:\n    pass\n");
    await fs.writeFile(srcServicePath, "class SrcUserService:\n    pass\n");

    await expect(
      resolvePythonImportPath("app.services.user_service", projectPath)
    ).resolves.toBe(rootServicePath);
  });

  it("marks unresolved imports as external package dependencies", async () => {
    const projectPath = await createTempProject();

    await expect(
      resolvePythonImportPath("fastapi", projectPath)
    ).resolves.toBe("[external] fastapi");

    await expect(
      resolvePythonImportPath("sqlalchemy.orm", projectPath)
    ).resolves.toBe("[external] sqlalchemy");
  });
});
