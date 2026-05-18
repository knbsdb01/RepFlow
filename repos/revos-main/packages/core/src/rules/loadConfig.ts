import fs from "fs/promises";
import path from "path";
import { RevosConfig } from "../types/RevosConfig.js";

const defaultConfig: RevosConfig = {
  forbiddenImports: []
};

export async function loadConfig(projectPath: string): Promise<RevosConfig> {
  const configPath = path.join(projectPath, ".revos", "rules.json");

  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content) as RevosConfig;
  } catch {
    return defaultConfig;
  }
}