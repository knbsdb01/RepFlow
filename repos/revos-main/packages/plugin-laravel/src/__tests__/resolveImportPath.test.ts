import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveLaravelImportPath } from "../resolver/resolveImportPath.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-laravel-"));
}

async function writeComposer(
  projectPath: string,
  composer: Record<string, unknown>
): Promise<void> {
  await fs.writeFile(
    path.join(projectPath, "composer.json"),
    JSON.stringify(composer, null, 2)
  );
}

describe("resolveLaravelImportPath", () => {
  it("resolves App namespaces to app/*.php files using Laravel fallback mapping", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      }
    });

    const servicePath = path.join(projectPath, "app", "Services", "UserService.php");

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "<?php\nclass UserService {}\n");

    await expect(
      resolveLaravelImportPath("App\\Services\\UserService", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("resolves App namespaces from composer psr-4 autoload mapping", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      },
      autoload: {
        "psr-4": {
          "App\\": "src/App/"
        }
      }
    });

    const servicePath = path.join(projectPath, "src", "App", "Services", "UserService.php");

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "<?php\nclass UserService {}\n");

    await expect(
      resolveLaravelImportPath("App\\Services\\UserService", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("resolves custom Domain namespaces from composer psr-4 autoload mapping", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      },
      autoload: {
        "psr-4": {
          "Domain\\": "src/Domain/"
        }
      }
    });

    const servicePath = path.join(
      projectPath,
      "src",
      "Domain",
      "Users",
      "Application",
      "CreateUser.php"
    );

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "<?php\nclass CreateUser {}\n");

    await expect(
      resolveLaravelImportPath("Domain\\Users\\Application\\CreateUser", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("resolves custom module namespaces from composer psr-4 autoload mapping", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      },
      autoload: {
        "psr-4": {
          "Modules\\": "modules/"
        }
      }
    });

    const servicePath = path.join(
      projectPath,
      "modules",
      "Billing",
      "Application",
      "CreateInvoice.php"
    );

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "<?php\nclass CreateInvoice {}\n");

    await expect(
      resolveLaravelImportPath("Modules\\Billing\\Application\\CreateInvoice", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("supports psr-4 namespace mappings with multiple directories", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      },
      autoload: {
        "psr-4": {
          "Shared\\": ["src/Shared/", "packages/Shared/"]
        }
      }
    });

    const helperPath = path.join(
      projectPath,
      "packages",
      "Shared",
      "Support",
      "Money.php"
    );

    await fs.mkdir(path.dirname(helperPath), { recursive: true });
    await fs.writeFile(helperPath, "<?php\nclass Money {}\n");

    await expect(
      resolveLaravelImportPath("Shared\\Support\\Money", projectPath)
    ).resolves.toBe(helperPath);
  });

  it("uses the longest matching psr-4 namespace prefix first", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      },
      autoload: {
        "psr-4": {
          "Modules\\": "modules/",
          "Modules\\Billing\\": "bounded-contexts/Billing/"
        }
      }
    });

    const servicePath = path.join(
      projectPath,
      "bounded-contexts",
      "Billing",
      "Application",
      "CreateInvoice.php"
    );

    await fs.mkdir(path.dirname(servicePath), { recursive: true });
    await fs.writeFile(servicePath, "<?php\nclass CreateInvoice {}\n");

    await expect(
      resolveLaravelImportPath("Modules\\Billing\\Application\\CreateInvoice", projectPath)
    ).resolves.toBe(servicePath);
  });

  it("marks non-project namespaces as external dependencies", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      }
    });

    await expect(
      resolveLaravelImportPath("Illuminate\\Support\\Facades\\DB", projectPath)
    ).resolves.toBe("[external] Illuminate\\Support\\Facades\\DB");
  });

  it("marks missing project classes as external dependencies", async () => {
    const projectPath = await createTempProject();

    await writeComposer(projectPath, {
      require: {
        "laravel/framework": "^11.0"
      }
    });

    await expect(
      resolveLaravelImportPath("App\\Missing\\Thing", projectPath)
    ).resolves.toBe("[external] App\\Missing\\Thing");
  });
});
