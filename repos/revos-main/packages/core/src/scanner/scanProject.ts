import fg from "fast-glob";
import path from "path";
import { SourceFile } from "../types/SourceFile.js";
import { ProjectScanResult } from "../types/ProjectScanResult.js";

export async function scanProject(
  projectPath: string,
  extensions: string[]
): Promise<ProjectScanResult> {
  const absoluteProjectPath = path.resolve(projectPath);

  const normalizedExtensions = extensions.map((extension) =>
    extension.startsWith(".") ? extension.slice(1) : extension
  );

  const globPattern = `**/*.{${normalizedExtensions.join(",")}}`;

  const files = await fg([globPattern], {
    cwd: absoluteProjectPath,
    absolute: true,
    onlyFiles: true,
    suppressErrors: true,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.git/**",
      "**/.turbo/**",
      "**/.cache/**",
      "**/.vercel/**",
      "**/.output/**",
      "**/coverage/**",
      "**/.Trash/**",
      "**/Library/**",
      "**/Pictures/**",
      "**/Movies/**",
      "**/Music/**",
      "**/Downloads/**"
    ]
  });

  const sourceFiles: SourceFile[] = files.map((file) => ({
    path: file
  }));

  return {
    projectPath: absoluteProjectPath,
    files: sourceFiles
  };
}
