import { SourceFile } from "./SourceFile.js";

export interface ProjectScanResult {
  projectPath: string;
  files: SourceFile[];
}