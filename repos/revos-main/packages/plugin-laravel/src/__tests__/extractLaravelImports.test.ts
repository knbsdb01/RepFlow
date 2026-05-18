import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractLaravelImports } from "../extractImports.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-laravel-imports-"));
}

describe("extractLaravelImports", () => {
  it("resolves imports using composer psr-4 mappings", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify(
        {
          require: {
            "laravel/framework": "^11.0"
          },
          autoload: {
            "psr-4": {
              "App\\": "app/",
              "Domain\\": "src/Domain/"
            }
          }
        },
        null,
        2
      )
    );

    const controllerPath = path.join(
      projectPath,
      "app",
      "Http",
      "Controllers",
      "UserController.php"
    );

    const domainActionPath = path.join(
      projectPath,
      "src",
      "Domain",
      "Users",
      "Application",
      "CreateUser.php"
    );

    await fs.mkdir(path.dirname(controllerPath), { recursive: true });
    await fs.mkdir(path.dirname(domainActionPath), { recursive: true });

    await fs.writeFile(
      domainActionPath,
      `<?php

namespace Domain\\Users\\Application;

class CreateUser {}
`
    );

    await fs.writeFile(
      controllerPath,
      `<?php

namespace App\\Http\\Controllers;

use Domain\\Users\\Application\\CreateUser;
use Illuminate\\Support\\Facades\\DB;

class UserController {}
`
    );

    await expect(
      extractLaravelImports(controllerPath, projectPath)
    ).resolves.toEqual([
      {
        from: controllerPath,
        to: domainActionPath
      },
      {
        from: controllerPath,
        to: "[external] Illuminate\\Support\\Facades\\DB"
      }
    ]);
  });
});
