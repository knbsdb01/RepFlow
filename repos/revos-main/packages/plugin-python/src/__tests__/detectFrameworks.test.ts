import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { detectPythonFrameworks, isPythonProject } from "../detectFrameworks.js";
import { pythonPlugin } from "../pythonPlugin.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-python-"));
}

describe("python framework detection", () => {
  it("detects a Python project from pyproject.toml", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(path.join(projectPath, "pyproject.toml"), "");

    await expect(isPythonProject(projectPath)).resolves.toBe(true);
    await expect(pythonPlugin.detect(projectPath)).resolves.toBe(true);
  });

  it("detects FastAPI from pyproject.toml", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "pyproject.toml"),
      `
[project]
dependencies = [
  "fastapi",
  "uvicorn"
]
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python project dependencies include fastapi"
      }
    ]);
  });

  it("detects FastAPI from pyproject project name", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "pyproject.toml"),
      `
[project]
name = "fastapi"
dependencies = [
  "starlette"
]
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python project name is fastapi"
      }
    ]);
  });

  it("detects FastAPI from requirements.txt", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "requirements.txt"),
      `
fastapi==0.115.0
uvicorn
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python project dependencies include fastapi"
      }
    ]);
  });

  it("detects Flask from real requirements dependencies", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "requirements.txt"),
      `
flask>=3.0.0
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "flask",
        confidence: "high",
        reason: "Python project dependencies include flask"
      }
    ]);
  });

  it("does not detect Flask from comments or descriptions", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "pyproject.toml"),
      `
[project]
description = "This project mentions flask in text"
dependencies = [
  "fastapi"
]
`
    );

    await fs.writeFile(
      path.join(projectPath, "requirements.txt"),
      `
# flask example only
fastapi==0.115.0
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python project dependencies include fastapi"
      }
    ]);
  });

  it("does not detect optional pyproject dependencies as frameworks", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "pyproject.toml"),
      `
[project]
dependencies = [
  "fastapi"
]

[project.optional-dependencies]
dev = [
  "flask"
]
`
    );

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python project dependencies include fastapi"
      }
    ]);
  });

  it("detects Django from manage.py", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(path.join(projectPath, "manage.py"), "");

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "django",
        confidence: "high",
        reason: "Project contains manage.py"
      }
    ]);
  });

  it("detects Django from src/manage.py", async () => {
    const projectPath = await createTempProject();

    await fs.mkdir(path.join(projectPath, "src"), { recursive: true });
    await fs.writeFile(path.join(projectPath, "src", "manage.py"), "");

    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([
      {
        name: "django",
        confidence: "high",
        reason: "Project contains src/manage.py"
      }
    ]);
  });

  it("does not detect Python without project markers", async () => {
    const projectPath = await createTempProject();

    await expect(isPythonProject(projectPath)).resolves.toBe(false);
    await expect(pythonPlugin.detect(projectPath)).resolves.toBe(false);
    await expect(detectPythonFrameworks(projectPath)).resolves.toEqual([]);
  });
});
