import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const execFileAsync = promisify(execFile);

async function createTempProject(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function runPnpm(args: string[]): Promise<{
  stdout: string;
  stderr: string;
}> {
  try {
    return await execFileAsync("pnpm", args, {
      cwd: path.resolve(".")
    });
  } catch (error) {
    const commandError = error as {
      stdout?: string;
      stderr?: string;
    };

    return {
      stdout: commandError.stdout ?? "",
      stderr: commandError.stderr ?? ""
    };
  }
}

describe("Revos CLI end-to-end", () => {
  it("initializes and scans a Next.js project", async () => {
    const projectPath = await createTempProject("revos-nextjs-e2e-");

    await fs.mkdir(path.join(projectPath, "components"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "client"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "server"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "domain"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "repositories"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app"), {
      recursive: true
    });

    await fs.writeFile(
      path.join(projectPath, "package.json"),
      JSON.stringify({
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0"
        }
      })
    );

    await fs.writeFile(
      path.join(projectPath, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["./*"]
          }
        }
      })
    );

    await fs.writeFile(
      path.join(projectPath, "components", "UserCard.tsx"),
      `import { PrismaClient } from "@prisma/client";

export function UserCard() {
  return null;
}
`
    );

    await fs.writeFile(
      path.join(projectPath, "client", "session.ts"),
      `import { auth } from "../server/auth";

export const session = auth;
`
    );

    await fs.writeFile(
      path.join(projectPath, "server", "auth.ts"),
      `export const auth = {};
`
    );

    await fs.writeFile(
      path.join(projectPath, "domain", "user.ts"),
      `import { NextRequest } from "next/server";

export const user = {};
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "page.tsx"),
      `import { usersRepository } from "../repositories/usersRepository";

export default function Page() {
  return null;
}
`
    );

    await fs.writeFile(
      path.join(projectPath, "repositories", "usersRepository.ts"),
      `export const usersRepository = {};
`
    );

    const initResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "init",
      projectPath,
      "--auto",
      "--force"
    ]);

    expect(initResult.stdout).toContain("Preset: nextjs");
    expect(initResult.stdout).toContain("Detected frameworks: nextjs");

    const scanResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "scan",
      projectPath,
      "--report",
      "all"
    ]);

    expect(scanResult.stdout).toContain("Plugins: typescript");
    expect(scanResult.stdout).toContain("Frameworks: nextjs, react");
    expect(scanResult.stdout).toContain("Found 4 issues: 3 high, 1 medium, 0 low");
    expect(scanResult.stdout).toContain("Reports");
    expect(scanResult.stdout).toContain("Markdown:");
    expect(scanResult.stdout).toContain("JSON:");
    expect(scanResult.stdout).toContain("SARIF:");
  });

  it("initializes and scans a Laravel project", async () => {
    const projectPath = await createTempProject("revos-laravel-e2e-");

    await fs.mkdir(path.join(projectPath, "app", "Http", "Controllers"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "Services"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "Models"), {
      recursive: true
    });

    await fs.writeFile(
      path.join(projectPath, "composer.json"),
      JSON.stringify({
        require: {
          "laravel/framework": "^11.0"
        }
      })
    );

    await fs.writeFile(
      path.join(projectPath, "artisan"),
      `#!/usr/bin/env php
<?php
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "Services", "UserService.php"),
      `<?php

namespace App\\Services;

class UserService {}
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "Models", "User.php"),
      `<?php

namespace App\\Models;

class User {}
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "Http", "Controllers", "UserController.php"),
      `<?php

namespace App\\Http\\Controllers;

use App\\Services\\UserService;
use App\\Models\\User;
use Illuminate\\Support\\Facades\\DB;

class UserController {}
`
    );

    const initResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "init",
      projectPath,
      "--auto",
      "--force"
    ]);

    expect(initResult.stdout).toContain("Preset: laravel");
    expect(initResult.stdout).toContain("Detected frameworks: laravel");

    const scanResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "scan",
      projectPath,
      "--report",
      "all"
    ]);

    expect(scanResult.stdout).toContain("Plugins: laravel");
    expect(scanResult.stdout).toContain("Frameworks: laravel");
    expect(scanResult.stdout).toContain("Laravel controller imports model directly");
    expect(scanResult.stdout).toContain("Laravel controller accesses DB facade directly");
    expect(scanResult.stdout).toContain("Found 2 issues: 2 high, 0 medium, 0 low");
    expect(scanResult.stdout).toContain("Reports");
    expect(scanResult.stdout).toContain("Markdown:");
    expect(scanResult.stdout).toContain("JSON:");
    expect(scanResult.stdout).toContain("SARIF:");
  });


  it("initializes and scans a FastAPI project", async () => {
    const projectPath = await createTempProject("revos-fastapi-e2e-");

    await fs.mkdir(path.join(projectPath, "app", "api"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "domain"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "repositories"), {
      recursive: true
    });
    await fs.mkdir(path.join(projectPath, "app", "services"), {
      recursive: true
    });

    await fs.writeFile(
      path.join(projectPath, "pyproject.toml"),
      `[project]
dependencies = [
  "fastapi",
  "sqlalchemy",
  "uvicorn"
]
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "api", "users.py"),
      `from fastapi import APIRouter
from app.repositories.user_repository import UserRepository

router = APIRouter()
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "domain", "user.py"),
      `from fastapi import Depends
from sqlalchemy.orm import Session

class User:
    pass
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "repositories", "user_repository.py"),
      `class UserRepository:
    pass
`
    );

    await fs.writeFile(
      path.join(projectPath, "app", "services", "user_service.py"),
      `class UserService:
    pass
`
    );

    const initResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "init",
      projectPath,
      "--auto",
      "--force"
    ]);

    expect(initResult.stdout).toContain("Preset: fastapi");
    expect(initResult.stdout).toContain("Detected frameworks: fastapi");

    const scanResult = await runPnpm([
      "--filter",
      "@revoscli/cli",
      "dev",
      "scan",
      projectPath,
      "--report",
      "all"
    ]);

    expect(scanResult.stdout).toContain("Plugins: python");
    expect(scanResult.stdout).toContain("Frameworks: fastapi");
    expect(scanResult.stdout).toContain("Domain depends on FastAPI");
    expect(scanResult.stdout).toContain("Domain depends on SQLAlchemy");
    expect(scanResult.stdout).toContain("API layer imports repository directly");
    expect(scanResult.stdout).toContain("Found 3 issues: 2 high, 1 medium, 0 low");
    expect(scanResult.stdout).toContain("Reports");
    expect(scanResult.stdout).toContain("Markdown:");
    expect(scanResult.stdout).toContain("JSON:");
    expect(scanResult.stdout).toContain("SARIF:");
  });

});
