import fs from "fs/promises";
import { ImportEdge } from "../../core/src/types/ImportEdge.js";
import { resolveImportPath } from "./resolver/resolveImportPath.js";

export async function extractImports(
  filePath: string,
  projectPath: string
): Promise<ImportEdge[]> {
  const content = await fs.readFile(filePath, "utf-8");

  const importPatterns = [
    /import\s+.*?from\s+["'](.*?)["']/g,
    /import\s+["'](.*?)["']/g,
    /export\s+.*?from\s+["'](.*?)["']/g,
    /import\s*\(\s*["'](.*?)["']\s*\)/g
  ];

  const imports = new Set<string>();

  for (const pattern of importPatterns) {
    let match;

    while ((match = pattern.exec(content)) !== null) {
      imports.add(match[1]);
    }
  }

  return Array.from(imports).map((rawImportPath) => ({
    from: filePath,
    to: resolveImportPath(filePath, rawImportPath, projectPath)
  }));
}
