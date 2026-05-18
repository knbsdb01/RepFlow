import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolvePythonImportPath } from "./resolver/resolveImportPath.js";

export interface ImportEdge {
  from: string;
  to: string;
}

function stripComments(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      const hashIndex = line.indexOf("#");

      if (hashIndex === -1) {
        return line;
      }

      return line.slice(0, hashIndex);
    })
    .join("\n");
}

function removeAlias(importPart: string): string {
  return importPart.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_]*$/g, "").trim();
}

function normalizeModuleName(moduleName: string): string {
  return moduleName.trim().replace(/\.+$/g, "");
}

function isRelativeImport(moduleName: string): boolean {
  return moduleName.startsWith(".");
}

function pathToModuleName(relativePath: string): string {
  return relativePath
    .replace(/\\/g, "/")
    .replace(/\.py$/g, "")
    .replace(/\/__init__$/g, "")
    .split("/")
    .filter(Boolean)
    .join(".");
}

function getCurrentPackageModule(
  filePath: string,
  projectPath: string
): string {
  const relativeFilePath = path.relative(projectPath, filePath);
  const relativeDirectory = path.dirname(relativeFilePath);

  if (relativeDirectory === ".") {
    return "";
  }

  return pathToModuleName(relativeDirectory);
}

function resolveRelativeModuleName(
  rawModuleName: string,
  filePath: string,
  projectPath: string
): string | null {
  if (!isRelativeImport(rawModuleName)) {
    return normalizeModuleName(rawModuleName);
  }

  const leadingDotsMatch = rawModuleName.match(/^(\.+)/);
  const leadingDots = leadingDotsMatch?.[1] ?? "";
  const remainder = rawModuleName.slice(leadingDots.length);

  const currentPackage = getCurrentPackageModule(filePath, projectPath);
  const currentParts = currentPackage ? currentPackage.split(".") : [];

  const levelsUp = Math.max(leadingDots.length - 1, 0);

  if (levelsUp > currentParts.length) {
    return null;
  }

  const baseParts = currentParts.slice(0, currentParts.length - levelsUp);
  const remainderParts = remainder
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  const resolvedParts = [...baseParts, ...remainderParts];

  if (resolvedParts.length === 0) {
    return null;
  }

  return resolvedParts.join(".");
}

export function extractPythonImportModules(source: string): string[] {
  const cleanSource = stripComments(source);
  const modules = new Set<string>();

  const importRegex = /^\s*import\s+(.+)$/gm;
  for (const match of cleanSource.matchAll(importRegex)) {
    const importsPart = match[1]?.trim();

    if (!importsPart) {
      continue;
    }

    const importItems = importsPart
      .split(",")
      .map((part) => removeAlias(part))
      .map(normalizeModuleName)
      .filter(Boolean);

    for (const item of importItems) {
      if (!isRelativeImport(item)) {
        modules.add(item);
      }
    }
  }

  const fromImportRegex = /^\s*from\s+([A-Za-z_\.][A-Za-z0-9_\.]*)\s+import\s+(.+)$/gm;
  for (const match of cleanSource.matchAll(fromImportRegex)) {
    const moduleName = match[1]?.trim();

    if (!moduleName || isRelativeImport(moduleName)) {
      continue;
    }

    modules.add(normalizeModuleName(moduleName));
  }

  return Array.from(modules);
}

export function extractPythonImportModulesWithContext(
  source: string,
  filePath: string,
  projectPath: string
): string[] {
  const cleanSource = stripComments(source);
  const modules = new Set<string>();

  const importRegex = /^\s*import\s+(.+)$/gm;
  for (const match of cleanSource.matchAll(importRegex)) {
    const importsPart = match[1]?.trim();

    if (!importsPart) {
      continue;
    }

    const importItems = importsPart
      .split(",")
      .map((part) => removeAlias(part))
      .map(normalizeModuleName)
      .filter(Boolean);

    for (const item of importItems) {
      if (!isRelativeImport(item)) {
        modules.add(item);
      }
    }
  }

  const fromImportRegex = /^\s*from\s+([A-Za-z_\.][A-Za-z0-9_\.]*)\s+import\s+(.+)$/gm;
  for (const match of cleanSource.matchAll(fromImportRegex)) {
    const rawModuleName = match[1]?.trim();

    if (!rawModuleName) {
      continue;
    }

    const resolvedModuleName = resolveRelativeModuleName(
      rawModuleName,
      filePath,
      projectPath
    );

    if (resolvedModuleName) {
      modules.add(resolvedModuleName);
    }
  }

  return Array.from(modules);
}

export async function extractPythonImports(
  filePath: string,
  projectPath: string
): Promise<ImportEdge[]> {
  const source = await fs.readFile(filePath, "utf8");
  const modules = extractPythonImportModulesWithContext(
    source,
    filePath,
    projectPath
  );

  const edges: ImportEdge[] = [];

  for (const moduleName of modules) {
    edges.push({
      from: filePath,
      to: await resolvePythonImportPath(moduleName, projectPath)
    });
  }

  return edges;
}
