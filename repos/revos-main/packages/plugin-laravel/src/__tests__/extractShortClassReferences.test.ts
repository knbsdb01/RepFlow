import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { extractLaravelImports } from "../extractImports.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-laravel-short-ref-"));
}

describe("extractLaravelImports with short class references", () => {
  it("resolves short class references through use imports", async () => {
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
              "App\\": "app/"
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

    const modelPath = path.join(
      projectPath,
      "app",
      "Models",
      "User.php"
    );

    await fs.mkdir(path.dirname(controllerPath), { recursive: true });
    await fs.mkdir(path.dirname(modelPath), { recursive: true });

    await fs.writeFile(
      modelPath,
      `<?php

namespace App\\Models;

class User {}
`
    );

    await fs.writeFile(
      controllerPath,
      `<?php

namespace App\\Http\\Controllers;

use App\\Models\\User;
use Illuminate\\Support\\Facades\\DB;

class UserController
{
    public function index()
    {
        User::class;

        DB::table("users");
    }
}
`
    );

    await expect(
      extractLaravelImports(controllerPath, projectPath)
    ).resolves.toEqual([
      {
        from: controllerPath,
        to: modelPath
      },
      {
        from: controllerPath,
        to: "[external] Illuminate\\Support\\Facades\\DB"
      }
    ]);
  });

  it("resolves aliased short class references through use imports", async () => {
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
              "App\\": "app/"
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

    await fs.mkdir(path.dirname(controllerPath), { recursive: true });
    await fs.mkdir(path.dirname(servicePath), { recursive: true });

    await fs.writeFile(
      servicePath,
      `<?php

namespace App\\Services;

class UserService {}
`
    );

    await fs.writeFile(
      controllerPath,
      `<?php

namespace App\\Http\\Controllers;

use App\\Services\\UserService as Users;

class UserController
{
    public function index()
    {
        return new Users();
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
      }
    ]);
  });
});
