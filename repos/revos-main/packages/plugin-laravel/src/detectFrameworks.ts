import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface FrameworkDetection {
  name: string;
  confidence: "low" | "medium" | "high";
  reason: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasCleanArchitectureFolders(
  projectPath: string
): Promise<boolean> {
  const srcCleanArchitecture =
    (await fileExists(path.join(projectPath, "src", "Domain"))) &&
    (await fileExists(path.join(projectPath, "src", "Application"))) &&
    (await fileExists(path.join(projectPath, "src", "Infrastructure")));

  const appCleanArchitecture =
    (await fileExists(path.join(projectPath, "app", "Domain"))) &&
    (await fileExists(path.join(projectPath, "app", "Application"))) &&
    (await fileExists(path.join(projectPath, "app", "Infrastructure")));

  return srcCleanArchitecture || appCleanArchitecture;
}

export async function detectLaravelFrameworks(
  projectPath: string
): Promise<FrameworkDetection[]> {
  const composerPath = path.join(projectPath, "composer.json");
  const artisanPath = path.join(projectPath, "artisan");
  const controllersPath = path.join(projectPath, "app", "Http", "Controllers");

  const hasComposer = await fileExists(composerPath);
  const hasArtisan = await fileExists(artisanPath);
  const hasControllers = await fileExists(controllersPath);

  if (!hasComposer) {
    return [];
  }

  const composerRaw = await fs.readFile(composerPath, "utf8");
  const composer = JSON.parse(composerRaw);

  const dependencies = {
    ...(composer.require ?? {}),
    ...(composer["require-dev"] ?? {})
  };

  const hasLaravelDependency = Boolean(dependencies["laravel/framework"]);
  const hasCleanArchitecture = await hasCleanArchitectureFolders(projectPath);

  const detections: FrameworkDetection[] = [];

  if (hasLaravelDependency) {
    detections.push({
      name: "laravel",
      confidence: "high",
      reason: "composer.json contains laravel/framework"
    });
  } else if (hasArtisan && hasControllers) {
    detections.push({
      name: "laravel",
      confidence: "medium",
      reason: "Project contains artisan and app/Http/Controllers"
    });
  }

  if (detections.length > 0 && hasCleanArchitecture) {
    detections.push({
      name: "laravel-clean-architecture",
      confidence: "high",
      reason:
        "Project contains Laravel plus Domain, Application, and Infrastructure folders"
    });
  }

  return detections;
}
