import fs from "fs/promises";
import path from "path";

import { LanguagePlugin } from "../../core/src/plugins/LanguagePlugin.js";
import { extractImports } from "./extractImports.js";
import { detectFrameworks } from "./detectFrameworks.js";

export const typescriptPlugin: LanguagePlugin = {
  name: "typescript",

  extensions: [".ts", ".tsx"],

  async detect(projectPath: string): Promise<boolean> {
    const tsconfigPath = path.join(projectPath, "tsconfig.json");
    const packageJsonPath = path.join(projectPath, "package.json");

    try {
      await fs.access(tsconfigPath);
      return true;
    } catch {
      // continue
    }

    try {
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  },

  async extractImports(filePath: string, projectPath: string) {
    return extractImports(filePath, projectPath);
  },

  async detectFrameworks(projectPath: string) {
    return detectFrameworks(projectPath);
  }
};
