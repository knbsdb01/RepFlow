import { ImportEdge } from "../types/ImportEdge.js";
import { FrameworkDetection } from "../types/FrameworkDetection.js";
export interface LanguagePlugin {
    name: string;
    extensions: string[];
    detect(projectPath: string): Promise<boolean>;
    extractImports(filePath: string, projectPath: string): Promise<ImportEdge[]>;
    detectFrameworks?(projectPath: string): Promise<FrameworkDetection[]>;
}
