import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { detectLaravelFrameworks } from "../detectFrameworks.js";
import { laravelPlugin } from "../laravelPlugin.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-laravel-"));
}

describe("laravel framework detection", () => {
  it("detects Laravel from composer.json dependency", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify({
        require: {
          "laravel/framework": "^11.0"
        }
      })
    );

    await expect(laravelPlugin.detect(projectPath)).resolves.toBe(true);

    await expect(detectLaravelFrameworks(projectPath)).resolves.toEqual([
      {
        name: "laravel",
        confidence: "high",
        reason: "composer.json contains laravel/framework"
      }
    ]);
  });

  it("detects Laravel with medium confidence from artisan and controllers", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify({
        require: {}
      })
    );

    await fs.writeFile(path.join(projectPath, "artisan"), "");
    await fs.mkdir(path.join(projectPath, "app", "Http", "Controllers"), {
      recursive: true
    });

    await expect(laravelPlugin.detect(projectPath)).resolves.toBe(true);

    await expect(detectLaravelFrameworks(projectPath)).resolves.toEqual([
      {
        name: "laravel",
        confidence: "medium",
        reason: "Project contains artisan and app/Http/Controllers"
      }
    ]);
  });

  it("detects Laravel clean architecture from src folders", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify({
        require: {
          "laravel/framework": "^11.0"
        }
      })
    );

    await fs.mkdir(path.join(projectPath, "src", "Domain"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "src", "Application"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "src", "Infrastructure"), {
      recursive: true
    });

    await expect(detectLaravelFrameworks(projectPath)).resolves.toEqual([
      {
        name: "laravel",
        confidence: "high",
        reason: "composer.json contains laravel/framework"
      },
      {
        name: "laravel-clean-architecture",
        confidence: "high",
        reason:
          "Project contains Laravel plus Domain, Application, and Infrastructure folders"
      }
    ]);
  });

  it("detects Laravel clean architecture from app folders", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify({
        require: {
          "laravel/framework": "^11.0"
        }
      })
    );

    await fs.mkdir(path.join(projectPath, "app", "Domain"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "Application"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "Infrastructure"), {
      recursive: true
    });

    await expect(detectLaravelFrameworks(projectPath)).resolves.toEqual([
      {
        name: "laravel",
        confidence: "high",
        reason: "composer.json contains laravel/framework"
      },
      {
        name: "laravel-clean-architecture",
        confidence: "high",
        reason:
          "Project contains Laravel plus Domain, Application, and Infrastructure folders"
      }
    ]);
  });

  it("does not detect Laravel without composer.json", async () => {
    const projectPath = await createTempProject();

    await expect(laravelPlugin.detect(projectPath)).resolves.toBe(false);
    await expect(detectLaravelFrameworks(projectPath)).resolves.toEqual([]);
  });
});
