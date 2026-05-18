import { LanguagePlugin } from "./LanguagePlugin.js";

export async function detectPlugins(
  projectPath: string,
  plugins: LanguagePlugin[]
): Promise<LanguagePlugin[]> {
  const detectedPlugins: LanguagePlugin[] = [];

  for (const plugin of plugins) {
    const isDetected = await plugin.detect(projectPath);

    if (isDetected) {
      detectedPlugins.push(plugin);
    }
  }

  return detectedPlugins;
}