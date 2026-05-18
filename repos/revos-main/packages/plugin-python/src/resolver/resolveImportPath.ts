import * as fs from "node:fs/promises";
import * as path from "node:path";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function normalizePythonModule(moduleName: string): string {
  return moduleName.trim().replace(/\.+$/g, "");
}

function getExternalPackageName(moduleName: string): string {
  return normalizePythonModule(moduleName).split(".")[0] ?? moduleName;
}

function moduleToCandidatePaths(
  moduleName: string,
  projectPath: string
): string[] {
  const normalized = normalizePythonModule(moduleName);
  const parts = normalized.split(".").filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  const relativePath = path.join(...parts);

  const sourceRoots = [
    projectPath,
    path.join(projectPath, "src")
  ];

  return sourceRoots.flatMap((sourceRoot) => [
    path.join(sourceRoot, `${relativePath}.py`),
    path.join(sourceRoot, relativePath, "__init__.py")
  ]);
}

export async function resolvePythonImportPath(
  moduleName: string,
  projectPath: string
): Promise<string> {
  const normalized = normalizePythonModule(moduleName);

  for (const candidate of moduleToCandidatePaths(normalized, projectPath)) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return `[external] ${getExternalPackageName(normalized)}`;
}
