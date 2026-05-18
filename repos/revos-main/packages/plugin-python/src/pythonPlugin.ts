import { detectPythonFrameworks, isPythonProject } from "./detectFrameworks.js";
import { extractPythonImports } from "./extractImports.js";

interface LanguagePlugin {
  name: string;
  extensions: string[];

  detect(projectPath: string): Promise<boolean>;

  extractImports(
    filePath: string,
    projectPath: string
  ): Promise<Array<{ from: string; to: string }>>;

  detectFrameworks?(
    projectPath: string
  ): Promise<
    Array<{
      name: string;
      confidence: "low" | "medium" | "high";
      reason: string;
    }>
  >;
}

export const pythonPlugin: LanguagePlugin = {
  name: "python",
  extensions: [".py"],

  async detect(projectPath: string): Promise<boolean> {
    return isPythonProject(projectPath);
  },

  extractImports: extractPythonImports,

  detectFrameworks: detectPythonFrameworks
};
