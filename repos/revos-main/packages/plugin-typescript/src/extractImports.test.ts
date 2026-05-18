import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import { extractImports } from "./extractImports.js";

async function createTempProject(): Promise<string> {
  const projectPath = await fs.mkdtemp(
    path.join(os.tmpdir(), "revos-test-")
  );

  await fs.writeFile(
    path.join(projectPath, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["*"]
          }
        }
      },
      null,
      2
    ),
    "utf-8"
  );

  await fs.mkdir(path.join(projectPath, "server"), {
    recursive: true
  });

  await fs.mkdir(path.join(projectPath, "client"), {
    recursive: true
  });

  await fs.writeFile(
    path.join(projectPath, "server", "auth.ts"),
    "export const auth = {};",
    "utf-8"
  );

  await fs.writeFile(
    path.join(projectPath, "client", "session.ts"),
    'import { auth } from "@/server/auth";\n\nexport const session = auth;\n',
    "utf-8"
  );

  return projectPath;
}

describe("extractImports", () => {
  it("resolves tsconfig path aliases", async () => {
    const projectPath = await createTempProject();

    const filePath = path.join(
      projectPath,
      "client",
      "session.ts"
    );

    const imports = await extractImports(filePath, projectPath);

    expect(imports).toEqual([
      {
        from: filePath,
        to: path.join(projectPath, "server", "auth.ts")
      }
    ]);
  });

  it("marks unresolved non-relative imports as external dependencies", async () => {
    const projectPath = await createTempProject();

    const filePath = path.join(
      projectPath,
      "client",
      "session.ts"
    );

    await fs.writeFile(
      filePath,
      'import { PrismaClient } from "@prisma/client";\n\nexport const prisma = new PrismaClient();\n',
      "utf-8"
    );

    const imports = await extractImports(filePath, projectPath);

    expect(imports).toEqual([
      {
        from: filePath,
        to: "[external] @prisma/client"
      }
    ]);
  });

  it("supports side-effect imports and export-from statements", async () => {
    const projectPath = await createTempProject();

    await fs.writeFile(
      path.join(projectPath, "setup.ts"),
      "export const setup = true;",
      "utf-8"
    );

    await fs.writeFile(
      path.join(projectPath, "module.ts"),
      "export const value = 1;",
      "utf-8"
    );

    const filePath = path.join(projectPath, "index.ts");

    await fs.writeFile(
      filePath,
      [
        'import "./setup.js";',
        'export * from "./module.js";',
        'export { value } from "./module.js";'
      ].join("\n"),
      "utf-8"
    );

    const imports = await extractImports(filePath, projectPath);

    expect(imports).toEqual([
      {
        from: filePath,
        to: path.join(projectPath, "setup.ts")
      },
      {
        from: filePath,
        to: path.join(projectPath, "module.ts")
      }
    ]);
  });
});
