import path from "path";

import { LanguagePlugin } from "../plugins/LanguagePlugin.js";
import { detectPlugins } from "../plugins/pluginRegistry.js";
import { detectFrameworks } from "../plugins/detectFrameworks.js";
import { scanProject } from "../scanner/scanProject.js";
import { buildDependencyGraph } from "../graph/buildDependencyGraph.js";
import { analyzeArchitecture } from "../analyzeArchitecture.js";

import { ImportEdge } from "../types/ImportEdge.js";
import { ScanRunResult } from "../types/ScanRunResult.js";

function getSupportedExtensions(
  plugins: LanguagePlugin[]
): string[] {
  return Array.from(
    new Set(
      plugins.flatMap((plugin) => plugin.extensions)
    )
  );
}

export async function runScan(
  projectPath: string,
  availablePlugins: LanguagePlugin[]
): Promise<ScanRunResult> {
  const supportedExtensions = getSupportedExtensions(availablePlugins);

  const scanResult = await scanProject(
    projectPath,
    supportedExtensions
  );

  const detectedPlugins = await detectPlugins(
    scanResult.projectPath,
    availablePlugins
  );

  const detectedFrameworks = await detectFrameworks(
    scanResult.projectPath,
    detectedPlugins
  );

  const allImports: ImportEdge[] = [];

  for (const file of scanResult.files) {
    const fileExtension = path.extname(file.path);

    const plugin = detectedPlugins.find((detectedPlugin) =>
      detectedPlugin.extensions.includes(fileExtension)
    );

    if (!plugin) {
      continue;
    }

    const imports = await plugin.extractImports(
      file.path,
      scanResult.projectPath
    );

    allImports.push(...imports);
  }

  const graph = buildDependencyGraph(allImports);

  const issues = await analyzeArchitecture(
    graph,
    scanResult.projectPath
  );

  return {
    projectPath: scanResult.projectPath,
    files: scanResult.files,
    detectedPlugins,
    detectedFrameworks,
    graph,
    issues
  };
}
