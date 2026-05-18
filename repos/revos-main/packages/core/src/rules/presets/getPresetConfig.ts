import { RevosConfig } from "../../types/RevosConfig.js";
import { RevosPreset } from "./presetTypes.js";

import { defaultPreset } from "./defaultPreset.js";
import { cleanArchitecturePreset } from "./cleanArchitecturePreset.js";
import { nestjsPreset } from "./nestjsPreset.js";
import { nextjsPreset } from "./nextjsPreset.js";
import { laravelPreset } from "./laravelPreset.js";
import { laravelCleanArchitecturePreset } from "./laravelCleanArchitecturePreset.js";
import { fastapiPreset } from "./fastapiPreset.js";

export function getPresetConfig(
  preset: RevosPreset
): RevosConfig {
  switch (preset) {
    case "clean-architecture":
      return cleanArchitecturePreset;

    case "nestjs":
      return nestjsPreset;

    case "nextjs":
      return nextjsPreset;

    case "laravel":
      return laravelPreset;

    case "laravel-clean-architecture":
      return laravelCleanArchitecturePreset;

    case "fastapi":
      return fastapiPreset;

    case "default":
      return defaultPreset;

    default:
      return defaultPreset;
  }
}
