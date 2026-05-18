import fs from "fs/promises";
import os from "os";
import path from "path";

import { describe, expect, it } from "vitest";

import { resolveScanTarget } from "./resolveScanTarget.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-scan-target-"));
}

describe("resolveScanTarget", () => {
  it("resolves a local project path", async () => {
    const projectPath = await createTempProject();

    const target = await resolveScanTarget(projectPath);

    expect(target).toMatchObject({
      projectPath: path.resolve(projectPath),
      source: projectPath,
      isTemporary: false
    });
  });

  it("resolves a local project subdirectory", async () => {
    const projectPath = await createTempProject();
    await fs.mkdir(path.join(projectPath, "apps", "web"), {
      recursive: true
    });

    const target = await resolveScanTarget(projectPath, {
      subdir: "apps/web"
    });

    expect(target).toMatchObject({
      projectPath: path.join(projectPath, "apps", "web"),
      source: projectPath,
      isTemporary: false,
      subdir: "apps/web"
    });
  });

  it("rejects missing subdirectories", async () => {
    const projectPath = await createTempProject();

    await expect(
      resolveScanTarget(projectPath, {
        subdir: "missing"
      })
    ).rejects.toThrow("Subdirectory not found: missing");
  });

  it("rejects absolute subdirectories", async () => {
    const projectPath = await createTempProject();

    await expect(
      resolveScanTarget(projectPath, {
        subdir: "/tmp"
      })
    ).rejects.toThrow("Subdirectory must be relative to the scan target.");
  });

  it("rejects path traversal subdirectories", async () => {
    const projectPath = await createTempProject();

    await expect(
      resolveScanTarget(projectPath, {
        subdir: "../outside"
      })
    ).rejects.toThrow("Subdirectory cannot contain '..'.");
  });
});
