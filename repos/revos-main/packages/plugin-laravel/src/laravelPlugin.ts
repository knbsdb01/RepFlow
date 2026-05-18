import * as fs from "node:fs/promises";
import * as path from "node:path";
import { detectLaravelFrameworks } from "./detectFrameworks.js";
import { extractLaravelImports } from "./extractImports.js";

interface LanguagePlugin {
  name: string;
  extensions: string[];

  detect(projectPath: string): Promise<boolean>;

  extractImports(
    filePath: string,
    projectPath: string
  ): Promise<Array<{ from: string; to: string }>>;

  detectFrameworks?(
    projectPath: string
  ): Promise<
    Array<{
      name: string;
      confidence: "low" | "medium" | "high";
      reason: string;
    }>
  >;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export const laravelPlugin: LanguagePlugin = {
  name: "laravel",
  extensions: [".php"],

  async detect(projectPath: string): Promise<boolean> {
    const composerPath = path.join(projectPath, "composer.json");
    const artisanPath = path.join(projectPath, "artisan");
    const appPath = path.join(projectPath, "app");

    if (!(await fileExists(composerPath))) {
      return false;
    }

    const composerRaw = await fs.readFile(composerPath, "utf8");
    const composer = JSON.parse(composerRaw);

    const dependencies = {
      ...(composer.require ?? {}),
      ...(composer["require-dev"] ?? {})
    };

    if (dependencies["laravel/framework"]) {
      return true;
    }

    return (await fileExists(artisanPath)) && (await fileExists(appPath));
  },

  extractImports: extractLaravelImports,

  detectFrameworks: detectLaravelFrameworks
};
