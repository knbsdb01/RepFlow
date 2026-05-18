import path from "path";

export function formatPath(filePath: string, basePath: string): string {
  if (filePath.startsWith("[external]")) {
    return filePath;
  }

  return path.relative(basePath, filePath);
}