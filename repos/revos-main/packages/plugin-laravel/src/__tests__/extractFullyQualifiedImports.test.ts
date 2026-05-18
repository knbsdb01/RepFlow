import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractLaravelImports } from "../extractImports.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-laravel-fqcn-"));
}

describe("extractLaravelImports with fully-qualified class references", () => {
  it("resolves fully-qualified internal and external references", async () => {
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

    const servicePath = path.join(
      projectPath,
      "app",
      "Services",
      "UserService.php"
    );

    const actionPath = path.join(
      projectPath,
      "src",
      "Domain",
      "Users",
      "Application",
      "CreateUser.php"
    );

    await fs.mkdir(path.dirname(controllerPath), { recursive: true });
    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.mkdir(path.dirname(actionPath), { recursive: true });

    await fs.writeFile(
      servicePath,
      `<?php

namespace App\\Services;

class UserService {}
`
    );

    await fs.writeFile(
      actionPath,
      `<?php

namespace Domain\\Users\\Application;

class CreateUser {}
`
    );

    await fs.writeFile(
      controllerPath,
      `<?php

namespace App\\Http\\Controllers;

class UserController
{
    public function index()
    {
        $service = new \\App\\Services\\UserService();

        \\Illuminate\\Support\\Facades\\DB::table("users")->get();

        return \\Domain\\Users\\Application\\CreateUser::handle();
    }
}
`
    );

    await expect(
      extractLaravelImports(controllerPath, projectPath)
    ).resolves.toEqual([
      {
        from: controllerPath,
        to: servicePath
      },
      {
        from: controllerPath,
        to: "[external] Illuminate\\Support\\Facades\\DB"
      },
      {
        from: controllerPath,
        to: actionPath
      }
    ]);
  });
});
