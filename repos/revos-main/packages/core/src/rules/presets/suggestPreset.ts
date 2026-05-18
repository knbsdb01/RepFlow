import { FrameworkDetection } from "../../types/FrameworkDetection.js";
import { RevosPreset } from "./presetTypes.js";

export function suggestPreset(
  frameworks: FrameworkDetection[]
): RevosPreset {
  const frameworkNames = frameworks.map((framework) => framework.name);

  if (frameworkNames.includes("nextjs")) {
    return "nextjs";
  }

  if (frameworkNames.includes("nestjs")) {
    return "nestjs";
  }

  if (frameworkNames.includes("laravel-clean-architecture")) {
    return "laravel-clean-architecture";
  }

  if (frameworkNames.includes("laravel")) {
    return "laravel";
  }

  if (frameworkNames.includes("fastapi")) {
    return "fastapi";
  }

  return "default";
}
