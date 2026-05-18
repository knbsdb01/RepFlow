import fs from "fs/promises";
import path from "path";

import { RevosPreset } from "./presets/presetTypes.js";
import { getPresetConfig } from "./presets/getPresetConfig.js";

export async function initConfig(
  projectPath: string,
  preset: RevosPreset = "default",
  force = false
): Promise<string> {
  const configDirectory = path.join(projectPath, ".revos");
  const configPath = path.join(configDirectory, "rules.json");

  await fs.mkdir(configDirectory, { recursive: true });

  const config = getPresetConfig(preset);

  if (!force) {
    try {
      await fs.access(configPath);
      return configPath;
    } catch {
      // config does not exist, create it below
    }
  }

  await fs.writeFile(
    configPath,
    JSON.stringify(config, null, 2),
    "utf-8"
  );

  return configPath;
}
