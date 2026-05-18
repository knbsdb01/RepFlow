import fs from "fs/promises";
import os from "os";
import path from "path";

import { describe, expect, it } from "vitest";

import { detectFrameworks } from "./detectFrameworks.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-typescript-plugin-"));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(value, null, 2),
    "utf-8"
  );
}

describe("detectFrameworks", () => {
  it("detects frameworks from the root package.json", async () => {
    const projectPath = await createTempProject();

    await writeJson(path.join(projectPath, "package.json"), {
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0"
      }
    });

    const frameworks = await detectFrameworks(projectPath);

    expect(frameworks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "nextjs" }),
        expect.objectContaining({ name: "react" })
      ])
    );
  });

  it("detects frameworks from apps package.json files in monorepos", async () => {
    const projectPath = await createTempProject();

    await writeJson(path.join(projectPath, "package.json"), {
      devDependencies: {
        turbo: "^2.0.0"
      }
    });

    await writeJson(path.join(projectPath, "apps", "web", "package.json"), {
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0"
      }
    });

    const frameworks = await detectFrameworks(projectPath);

    expect(frameworks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "nextjs",
          reason: "Found next dependency in apps/web/package.json"
        }),
        expect.objectContaining({
          name: "react",
          reason: "Found react dependency in apps/web/package.json"
        })
      ])
    );
  });

  it("detects NestJS from packages package.json files in monorepos", async () => {
    const projectPath = await createTempProject();

    await writeJson(path.join(projectPath, "packages", "api", "package.json"), {
      dependencies: {
        "@nestjs/core": "^11.0.0"
      }
    });

    const frameworks = await detectFrameworks(projectPath);

    expect(frameworks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "nestjs",
          reason: "Found @nestjs/core dependency in packages/api/package.json"
        })
      ])
    );
  });

  it("deduplicates framework detections across package.json files", async () => {
    const projectPath = await createTempProject();

    await writeJson(path.join(projectPath, "apps", "web", "package.json"), {
      dependencies: {
        react: "^19.0.0"
      }
    });

    await writeJson(path.join(projectPath, "packages", "ui", "package.json"), {
      dependencies: {
        react: "^19.0.0"
      }
    });

    const frameworks = await detectFrameworks(projectPath);
    const reactDetections = frameworks.filter(
      (framework) => framework.name === "react"
    );

    expect(reactDetections).toHaveLength(1);
  });
});
