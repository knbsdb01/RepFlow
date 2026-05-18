import * as fs from "node:fs/promises";
import * as path from "node:path";

type Psr4Mappings = Array<{
  namespacePrefix: string;
  directories: string[];
}>;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function normalizeNamespace(namespace: string): string {
  return namespace.trim().replace(/^\\+/, "").replace(/\\+$/, "");
}

function normalizeNamespacePrefix(prefix: string): string {
  const normalized = normalizeNamespace(prefix);

  if (normalized.length === 0) {
    return "";
  }

  return normalized.endsWith("\\") ? normalized : `${normalized}\\`;
}

function normalizeComposerDirectory(directory: string): string {
  return directory.replace(/\\/g, "/").replace(/\/+$/, "");
}

async function readComposerPsr4Mappings(
  projectPath: string
): Promise<Psr4Mappings> {
  const composerPath = path.join(projectPath, "composer.json");

  let composerRaw: string;

  try {
    composerRaw = await fs.readFile(composerPath, "utf8");
  } catch {
    return [];
  }

  const composer = JSON.parse(composerRaw);
  const psr4 = composer.autoload?.["psr-4"] ?? {};

  const mappings: Psr4Mappings = [];

  for (const [rawPrefix, rawDirectories] of Object.entries(psr4)) {
    const namespacePrefix = normalizeNamespacePrefix(rawPrefix);

    const directories = Array.isArray(rawDirectories)
      ? rawDirectories
      : [rawDirectories];

    mappings.push({
      namespacePrefix,
      directories: directories
        .filter((directory): directory is string => typeof directory === "string")
        .map(normalizeComposerDirectory)
    });
  }

  return mappings;
}

function getDefaultLaravelMappings(): Psr4Mappings {
  return [
    {
      namespacePrefix: "App\\",
      directories: ["app"]
    },
    {
      namespacePrefix: "Database\\Factories\\",
      directories: ["database/factories"]
    },
    {
      namespacePrefix: "Database\\Seeders\\",
      directories: ["database/seeders"]
    }
  ];
}

async function getPsr4Mappings(projectPath: string): Promise<Psr4Mappings> {
  const composerMappings = await readComposerPsr4Mappings(projectPath);

  const hasAppMapping = composerMappings.some(
    (mapping) => mapping.namespacePrefix === "App\\"
  );

  const defaultMappings = getDefaultLaravelMappings().filter((mapping) => {
    if (mapping.namespacePrefix === "App\\") {
      return !hasAppMapping;
    }

    return !composerMappings.some(
      (composerMapping) =>
        composerMapping.namespacePrefix === mapping.namespacePrefix
    );
  });

  return [...composerMappings, ...defaultMappings].sort(
    (a, b) => b.namespacePrefix.length - a.namespacePrefix.length
  );
}

function namespaceToCandidatePaths(
  namespace: string,
  mappings: Psr4Mappings,
  projectPath: string
): string[] {
  const normalized = normalizeNamespace(namespace);
  const candidates: string[] = [];

  for (const mapping of mappings) {
    if (!normalized.startsWith(mapping.namespacePrefix)) {
      continue;
    }

    const relativeClassName = normalized.slice(mapping.namespacePrefix.length);
    const classPath = relativeClassName.split("\\").filter(Boolean).join(path.sep);

    for (const directory of mapping.directories) {
      candidates.push(path.join(projectPath, directory, `${classPath}.php`));
    }
  }

  return candidates;
}

export async function resolveLaravelImportPath(
  namespace: string,
  projectPath: string
): Promise<string> {
  const normalized = normalizeNamespace(namespace);
  const mappings = await getPsr4Mappings(projectPath);
  const candidates = namespaceToCandidatePaths(normalized, mappings, projectPath);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return `[external] ${normalized}`;
}
