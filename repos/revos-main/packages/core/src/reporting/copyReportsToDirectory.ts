import fs from "fs/promises";
import path from "path";

export async function copyReportsToDirectory(
  sourceProjectPath: string,
  outputDirectory: string
): Promise<{
  markdownReportPath?: string;
  jsonReportPath?: string;
  sarifReportPath?: string;
}> {
  await fs.mkdir(outputDirectory, { recursive: true });

  const sourceMarkdownPath = path.join(
    sourceProjectPath,
    ".revos",
    "report.md"
  );

  const sourceJsonPath = path.join(
    sourceProjectPath,
    ".revos",
    "report.json"
  );

  const sourceSarifPath = path.join(
    sourceProjectPath,
    ".revos",
    "report.sarif"
  );

  const targetMarkdownPath = path.join(
    outputDirectory,
    "revos-report.md"
  );

  const targetJsonPath = path.join(
    outputDirectory,
    "revos-report.json"
  );

  const targetSarifPath = path.join(
    outputDirectory,
    "revos-report.sarif"
  );

  const copiedReports: {
    markdownReportPath?: string;
    jsonReportPath?: string;
    sarifReportPath?: string;
  } = {};

  try {
    await fs.copyFile(sourceMarkdownPath, targetMarkdownPath);
    copiedReports.markdownReportPath = targetMarkdownPath;
  } catch {
    // markdown report was not generated
  }

  try {
    await fs.copyFile(sourceJsonPath, targetJsonPath);
    copiedReports.jsonReportPath = targetJsonPath;
  } catch {
    // json report was not generated
  }

  try {
    await fs.copyFile(sourceSarifPath, targetSarifPath);
    copiedReports.sarifReportPath = targetSarifPath;
  } catch {
    // sarif report was not generated
  }

  return copiedReports;
}
