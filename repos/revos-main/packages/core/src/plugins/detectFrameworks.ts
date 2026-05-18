import { LanguagePlugin } from "./LanguagePlugin.js";
import { FrameworkDetection } from "../types/FrameworkDetection.js";

export async function detectFrameworks(
  projectPath: string,
  plugins: LanguagePlugin[]
): Promise<FrameworkDetection[]> {
  const detectedFrameworks: FrameworkDetection[] = [];

  for (const plugin of plugins) {
    if (!plugin.detectFrameworks) {
      continue;
    }

    const frameworks = await plugin.detectFrameworks(projectPath);
    detectedFrameworks.push(...frameworks);
  }

  return detectedFrameworks;
}
