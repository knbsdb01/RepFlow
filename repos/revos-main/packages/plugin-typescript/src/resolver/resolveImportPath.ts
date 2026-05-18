git branch -M mainimport fs from "fs";
import path from "path";

type TsConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function resolveWithExtensions(basePath: string): string | null {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx")
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      if (candidate.endsWith(".js")) {
        return candidate.replace(/\.js$/, ".ts");
      }

      if (candidate.endsWith(".jsx")) {
        return candidate.replace(/\.jsx$/, ".tsx");
      }

      return candidate;
    }
  }

  return null;
}

function loadTsConfig(projectPath: string): TsConfig | null {
  const tsconfigPath = path.join(projectPath, "tsconfig.json");

  try {
    const content = fs.readFileSync(tsconfigPath, "utf-8");
    return JSON.parse(content) as TsConfig;
  } catch {
    return null;
  }
}

function resolveAliasImport(
  projectPath: string,
  importPath: string
): string | null {
  const tsconfig = loadTsConfig(projectPath);

  const compilerOptions = tsconfig?.compilerOptions;
  const paths = compilerOptions?.paths;

  if (!paths) {
    return null;
  }

  const baseUrl = compilerOptions.baseUrl ?? ".";
  const absoluteBaseUrl = path.resolve(projectPath, baseUrl);

  for (const [aliasPattern, targets] of Object.entries(paths)) {
    const hasWildcard = aliasPattern.includes("*");

    if (!hasWildcard) {
      if (importPath !== aliasPattern) {
        continue;
      }

      for (const target of targets) {
        const candidate = path.resolve(absoluteBaseUrl, target);
        const resolved = resolveWithExtensions(candidate);

        if (resolved) {
          return resolved;
        }
      }

      continue;
    }

    const [aliasPrefix, aliasSuffix] = aliasPattern.split("*");

    if (
      !importPath.startsWith(aliasPrefix) ||
      !importPath.endsWith(aliasSuffix)
    ) {
      continue;
    }

    const matchedPart = importPath.slice(
      aliasPrefix.length,
      importPath.length - aliasSuffix.length
    );

    for (const target of targets) {
      const mappedTarget = target.replace("*", matchedPart);
      const candidate = path.resolve(absoluteBaseUrl, mappedTarget);
      const resolved = resolveWithExtensions(candidate);

      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

export function resolveImportPath(
  fromFilePath: string,
  importPath: string,
  projectPath: string
): string {
  const isRelativeImport =
    importPath.startsWith("./") || importPath.startsWith("../");

  if (isRelativeImport) {
    const fromDirectory = path.dirname(fromFilePath);
    const resolvedPath = path.resolve(fromDirectory, importPath);

    const resolvedWithExtension = resolveWithExtensions(resolvedPath);

    if (resolvedWithExtension) {
      return resolvedWithExtension;
    }

    if (resolvedPath.endsWith(".js")) {
      return resolvedPath.replace(/\.js$/, ".ts");
    }

    if (resolvedPath.endsWith(".jsx")) {
      return resolvedPath.replace(/\.jsx$/, ".tsx");
    }

    return resolvedPath;
  }

  const aliasResolvedPath = resolveAliasImport(projectPath, importPath);

  if (aliasResolvedPath) {
    return aliasResolvedPath;
  }

  return `[external] ${importPath}`;
}
