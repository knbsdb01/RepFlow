import fs from "fs/promises";
import path from "path";

import { FrameworkDetection } from "../../core/src/types/FrameworkDetection.js";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const MONOREPO_PACKAGE_DIRS = [
  "apps",
  "packages",
  "frontend",
  "backend",
  "web",
  "api",
  "server"
];

export async function detectFrameworks(
  projectPath: string
): Promise<FrameworkDetection[]> {
  const packageJsonPaths = await findPackageJsonPaths(projectPath);
  const frameworksByName = new Map<string, FrameworkDetection>();

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = await readPackageJson(packageJsonPath);

    if (!packageJson) {
      continue;
    }

    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {})
    };

    const relativePackageJsonPath = path.relative(
      projectPath,
      packageJsonPath
    );

    addFrameworkIfDependencyExists(
      frameworksByName,
      dependencies,
      "next",
      {
        name: "nextjs",
        confidence: "high",
        reason: `Found next dependency in ${relativePackageJsonPath}`
      }
    );

    addFrameworkIfDependencyExists(
      frameworksByName,
      dependencies,
      "@nestjs/core",
      {
        name: "nestjs",
        confidence: "high",
        reason: `Found @nestjs/core dependency in ${relativePackageJsonPath}`
      }
    );

    addFrameworkIfDependencyExists(
      frameworksByName,
      dependencies,
      "react",
      {
        name: "react",
        confidence: "high",
        reason: `Found react dependency in ${relativePackageJsonPath}`
      }
    );

    addFrameworkIfDependencyExists(
      frameworksByName,
      dependencies,
      "express",
      {
        name: "express",
        confidence: "high",
        reason: `Found express dependency in ${relativePackageJsonPath}`
      }
    );
  }

  return [...frameworksByName.values()];
}

async function findPackageJsonPaths(projectPath: string): Promise<string[]> {
  const packageJsonPaths = new Set<string>();

  const rootPackageJsonPath = path.join(projectPath, "package.json");

  if (await fileExists(rootPackageJsonPath)) {
    packageJsonPaths.add(rootPackageJsonPath);
  }

  for (const dir of MONOREPO_PACKAGE_DIRS) {
    const absoluteDir = path.join(projectPath, dir);

    if (!(await directoryExists(absoluteDir))) {
      continue;
    }

    const directPackageJsonPath = path.join(absoluteDir, "package.json");

    if (await fileExists(directPackageJsonPath)) {
      packageJsonPaths.add(directPackageJsonPath);
    }

    const children = await fs.readdir(absoluteDir, {
      withFileTypes: true
    });

    for (const child of children) {
      if (!child.isDirectory() || child.name === "node_modules") {
        continue;
      }

      const childPackageJsonPath = path.join(
        absoluteDir,
        child.name,
        "package.json"
      );

      if (await fileExists(childPackageJsonPath)) {
        packageJsonPaths.add(childPackageJsonPath);
      }
    }
  }

  return [...packageJsonPaths];
}

async function readPackageJson(
  packageJsonPath: string
): Promise<PackageJson | null> {
  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

function addFrameworkIfDependencyExists(
  frameworksByName: Map<string, FrameworkDetection>,
  dependencies: Record<string, string>,
  dependencyName: string,
  detection: FrameworkDetection
): void {
  if (!dependencies[dependencyName] || frameworksByName.has(detection.name)) {
    return;
  }

  frameworksByName.set(detection.name, detection);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function directoryExists(directoryPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(directoryPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
