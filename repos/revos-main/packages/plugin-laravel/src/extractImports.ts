import * as fs from "node:fs/promises";
import { resolveLaravelImportPath } from "./resolver/resolveImportPath.js";

export interface ImportEdge {
  from: string;
  to: string;
}

interface PhpUseImport {
  namespace: string;
  alias: string;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "");
}

function normalizePhpNamespace(namespace: string): string {
  return namespace.trim().replace(/^\\+/, "").replace(/\\+$/, "");
}

function getDefaultAlias(namespace: string): string {
  const parts = normalizePhpNamespace(namespace).split("\\").filter(Boolean);
  return parts[parts.length - 1] ?? namespace;
}

function parseUseAlias(imported: string): PhpUseImport | null {
  const trimmed = imported.trim();

  if (!trimmed.includes("\\")) {
    return null;
  }

  const aliasMatch = trimmed.match(/^(.+?)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)$/i);

  if (aliasMatch) {
    const namespace = normalizePhpNamespace(aliasMatch[1]);
    const alias = aliasMatch[2];

    return {
      namespace,
      alias
    };
  }

  const namespace = normalizePhpNamespace(trimmed);

  return {
    namespace,
    alias: getDefaultAlias(namespace)
  };
}

function expandGroupedUse(prefix: string, groupBody: string): PhpUseImport[] {
  return groupBody
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => parseUseAlias(`${prefix}\\${part}`))
    .filter((imported): imported is PhpUseImport => imported !== null);
}

export function extractPhpUseImports(source: string): PhpUseImport[] {
  const cleanSource = stripComments(source);
  const imports = new Map<string, PhpUseImport>();

  const groupedUseRegex = /^\s*use\s+([^;{}]+)\\\s*\{([^}]+)\}\s*;/gm;
  for (const match of cleanSource.matchAll(groupedUseRegex)) {
    const prefix = match[1]?.trim();
    const groupBody = match[2]?.trim();

    if (!prefix || !groupBody) {
      continue;
    }

    for (const imported of expandGroupedUse(prefix, groupBody)) {
      imports.set(imported.alias, imported);
    }
  }

  const normalUseRegex = /^\s*use\s+([^;{}]+)\s*;/gm;
  for (const match of cleanSource.matchAll(normalUseRegex)) {
    const imported = match[1]?.trim();

    if (!imported) {
      continue;
    }

    const parsed = parseUseAlias(imported);

    if (parsed) {
      imports.set(parsed.alias, parsed);
    }
  }

  return Array.from(imports.values());
}

export function extractPhpUseStatements(source: string): string[] {
  return extractPhpUseImports(source).map((imported) => imported.namespace);
}

export function extractPhpFullyQualifiedReferences(source: string): string[] {
  const cleanSource = stripComments(source);
  const references = new Set<string>();

  const fullyQualifiedClassRegex =
    /(?<![A-Za-z0-9_])\\[A-Z_][A-Za-z0-9_]*(?:\\[A-Z_][A-Za-z0-9_]*)+/g;

  for (const match of cleanSource.matchAll(fullyQualifiedClassRegex)) {
    const reference = match[0];

    if (!reference) {
      continue;
    }

    references.add(normalizePhpNamespace(reference));
  }

  return Array.from(references);
}

export function extractPhpStaticClassReferences(source: string): string[] {
  const cleanSource = stripComments(source);
  const references = new Set<string>();

  const staticClassRegex =
    /(?<![A-Za-z0-9_\\])([A-Z_][A-Za-z0-9_]*(?:\\[A-Z_][A-Za-z0-9_]*)+)::(?:class|[A-Za-z_][A-Za-z0-9_]*)/g;

  for (const match of cleanSource.matchAll(staticClassRegex)) {
    const reference = match[1];

    if (!reference) {
      continue;
    }

    references.add(normalizePhpNamespace(reference));
  }

  return Array.from(references);
}

export function extractPhpShortClassReferences(source: string): string[] {
  const cleanSource = stripComments(source);
  const useImports = extractPhpUseImports(source);
  const aliasToNamespace = new Map(
    useImports.map((imported) => [imported.alias, imported.namespace])
  );

  const references = new Set<string>();

  const shortStaticReferenceRegex =
    /(?<![A-Za-z0-9_\\])([A-Z_][A-Za-z0-9_]*)::(?:class|[A-Za-z_][A-Za-z0-9_]*)/g;

  for (const match of cleanSource.matchAll(shortStaticReferenceRegex)) {
    const alias = match[1];

    if (!alias) {
      continue;
    }

    const namespace = aliasToNamespace.get(alias);

    if (namespace) {
      references.add(namespace);
    }
  }

  const shortNewReferenceRegex =
    /new\s+([A-Z_][A-Za-z0-9_]*)\s*\(/g;

  for (const match of cleanSource.matchAll(shortNewReferenceRegex)) {
    const alias = match[1];

    if (!alias) {
      continue;
    }

    const namespace = aliasToNamespace.get(alias);

    if (namespace) {
      references.add(namespace);
    }
  }

  return Array.from(references);
}

export function extractPhpDependencies(source: string): string[] {
  return Array.from(
    new Set([
      ...extractPhpUseStatements(source),
      ...extractPhpFullyQualifiedReferences(source),
      ...extractPhpStaticClassReferences(source),
      ...extractPhpShortClassReferences(source)
    ])
  );
}

export async function extractLaravelImports(
  filePath: string,
  projectPath: string
): Promise<ImportEdge[]> {
  const source = await fs.readFile(filePath, "utf8");
  const namespaces = extractPhpDependencies(source);

  const edges: ImportEdge[] = [];

  for (const namespace of namespaces) {
    edges.push({
      from: filePath,
      to: await resolveLaravelImportPath(namespace, projectPath)
    });
  }

  return edges;
}
