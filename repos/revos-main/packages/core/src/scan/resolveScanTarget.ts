import fs from "fs/promises";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

export interface ScanTarget {
  projectPath: string;
  source: string;
  isTemporary: boolean;
  subdir?: string;
  cleanup?: () => Promise<void>;
}

export interface ResolveScanTargetOptions {
  subdir?: string;
}

function isGitHubUrl(value: string): boolean {
  return (
    value.startsWith("https://github.com/") ||
    value.startsWith("http://github.com/")
  );
}

export async function resolveScanTarget(
  input: string,
  options: ResolveScanTargetOptions = {}
): Promise<ScanTarget> {
  const subdir = options.subdir
    ? normalizeSubdir(options.subdir)
    : undefined;

  if (!isGitHubUrl(input)) {
    const rootPath = path.resolve(input);
    const projectPath = subdir
      ? await resolveSubdir(rootPath, subdir)
      : rootPath;

    return {
      projectPath,
      source: input,
      isTemporary: false,
      subdir
    };
  }

  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "revos-")
  );

  const clonePath = path.join(tempRoot, "repo");

  execFileSync(
    "git",
    ["clone", "--depth", "1", input, clonePath],
    {
      stdio: "inherit"
    }
  );

  const projectPath = subdir
    ? await resolveSubdir(clonePath, subdir)
    : clonePath;

  return {
    projectPath,
    source: input,
    isTemporary: true,
    subdir,
    cleanup: async () => {
      await fs.rm(tempRoot, {
        recursive: true,
        force: true
      });
    }
  };
}

function normalizeSubdir(subdir: string): string {
  const normalized = subdir.trim();

  if (!normalized) {
    throw new Error("Subdirectory cannot be empty.");
  }

  if (path.isAbsolute(normalized)) {
    throw new Error("Subdirectory must be relative to the scan target.");
  }

  const normalizedForCheck = normalized.replaceAll("\\", "/");

  if (
    normalizedForCheck === ".." ||
    normalizedForCheck.startsWith("../") ||
    normalizedForCheck.includes("/../")
  ) {
    throw new Error("Subdirectory cannot contain '..'.");
  }

  return normalizedForCheck.replace(/^\.\/+/, "");
}

async function resolveSubdir(
  rootPath: string,
  subdir: string
): Promise<string> {
  const projectPath = path.resolve(rootPath, subdir);
  const relativePath = path.relative(rootPath, projectPath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Subdirectory must stay inside the scan target.");
  }

  try {
    const stat = await fs.stat(projectPath);

    if (!stat.isDirectory()) {
      throw new Error(`Subdirectory is not a directory: ${subdir}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Subdirectory")) {
      throw error;
    }

    throw new Error(`Subdirectory not found: ${subdir}`);
  }

  return projectPath;
}
