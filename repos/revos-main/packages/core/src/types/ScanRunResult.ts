import { SourceFile } from "./SourceFile.js";
import { DependencyGraph } from "./DependencyGraph.js";
import { Issue } from "./Issue.js";
import { LanguagePlugin } from "../plugins/LanguagePlugin.js";
import { FrameworkDetection } from "./FrameworkDetection.js";

export interface ScanRunResult {
  projectPath: string;
  files: SourceFile[];
  detectedPlugins: LanguagePlugin[];
  detectedFrameworks: FrameworkDetection[];
  graph: DependencyGraph;
  issues: Issue[];
}
