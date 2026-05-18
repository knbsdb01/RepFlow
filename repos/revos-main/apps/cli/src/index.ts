import { Command } from "commander";
import path from "path";

import { runScan } from "../../../packages/core/src/scan/runScan.js";
import { resolveScanTarget } from "../../../packages/core/src/scan/resolveScanTarget.js";
import { reportIssues } from "../../../packages/core/src/reporting/reportIssues.js";
import { writeMarkdownReport } from "../../../packages/core/src/reporting/writeMarkdownReport.js";
import { writeJsonReport } from "../../../packages/core/src/reporting/writeJsonReport.js";
import { writeSarifReport } from "../../../packages/core/src/reporting/writeSarifReport.js";
import { copyReportsToDirectory } from "../../../packages/core/src/reporting/copyReportsToDirectory.js";
import { shouldFailOnSeverity } from "../../../packages/core/src/reporting/shouldFailOnSeverity.js";
import { initConfig } from "../../../packages/core/src/rules/initConfig.js";
import { suggestPreset } from "../../../packages/core/src/rules/presets/suggestPreset.js";
import { detectPlugins } from "../../../packages/core/src/plugins/pluginRegistry.js";
import { detectFrameworks } from "../../../packages/core/src/plugins/detectFrameworks.js";

import { RevosPreset } from "../../../packages/core/src/rules/presets/presetTypes.js";
import { FrameworkDetection } from "../../../packages/core/src/types/FrameworkDetection.js";
import { IssueSeverity } from "../../../packages/core/src/types/Issue.js";

import { typescriptPlugin } from "../../../packages/plugin-typescript/src/typescriptPlugin.js";
import { laravelPlugin } from "../../../packages/plugin-laravel/src/laravelPlugin.js";
import { pythonPlugin } from "../../../packages/plugin-python/src/pythonPlugin.js";

const program = new Command();

const availablePlugins = [
  typescriptPlugin,
  laravelPlugin,
  pythonPlugin
];

const availablePresets: RevosPreset[] = [
  "default",
  "clean-architecture",
  "nestjs",
  "nextjs",
  "laravel",
  "laravel-clean-architecture",
  "fastapi"
];

const availableSeverities: IssueSeverity[] = [
  "low",
  "medium",
  "high"
];

function isValidPreset(preset: string): preset is RevosPreset {
  return availablePresets.includes(preset as RevosPreset);
}

function isValidSeverity(
  severity: string
): severity is IssueSeverity {
  return availableSeverities.includes(severity as IssueSeverity);
}

program
  .name("revos")
  .description("Architecture governance for AI-assisted software development")
  .version("0.1.3")
  .addHelpText(
    "after",
    `

Examples:
  revos init . --auto --force
  revos init . --preset nextjs --force
  revos scan .
  revos scan . --report all
  revos scan . --max-issues 10
  revos scan . --fail-on high
  revos scan https://github.com/user/repo
  revos scan https://github.com/user/repo --report all --output ./reports

Available presets:
  default
  clean-architecture
  nestjs
  nextjs
  laravel
  laravel-clean-architecture
  fastapi

Report formats:
  markdown
  json
  sarif
  all

Severity levels:
  low
  medium
  high
`
  );

program
  .command("init")
  .description("Create or update .revos/rules.json")
  .argument("<path>", "project path")
  .option(
    "--preset <preset>",
    "config preset: default, clean-architecture, nestjs, nextjs, laravel, laravel-clean-architecture, fastapi",
    "default"
  )
  .option(
    "--auto",
    "automatically choose the best preset from detected frameworks",
    false
  )
  .option(
    "--force",
    "overwrite existing .revos/rules.json",
    false
  )
  .addHelpText(
    "after",
    `

Examples:
  revos init . --auto --force
  revos init . --preset default
  revos init . --preset clean-architecture
  revos init . --preset nestjs
  revos init . --preset nextjs --force
  revos init . --preset laravel --force
  revos init . --preset laravel-clean-architecture --force
  revos init . --preset fastapi --force
`
  )
  .action(async (projectPath, options) => {
    const force = Boolean(options.force);
    const auto = Boolean(options.auto);

    const absoluteProjectPath = path.resolve(projectPath);

    let preset = options.preset as string;
    let detectedFrameworks: FrameworkDetection[] = [];

    if (auto) {
      const detectedPlugins = await detectPlugins(
        absoluteProjectPath,
        availablePlugins
      );

      detectedFrameworks = await detectFrameworks(
        absoluteProjectPath,
        detectedPlugins
      );

      preset = suggestPreset(detectedFrameworks);
    }

    if (!isValidPreset(preset)) {
      console.log(`Invalid preset: ${preset}`);
      console.log(`Available presets: ${availablePresets.join(", ")}`);
      return;
    }

    const configPath = await initConfig(
      absoluteProjectPath,
      preset,
      force
    );

    console.log("Revos initialized");
    console.log(`Preset: ${preset}`);
    console.log(`Auto: ${auto}`);
    console.log(`Force: ${force}`);

    if (auto) {
      if (detectedFrameworks.length > 0) {
        console.log(
          `Detected frameworks: ${detectedFrameworks
            .map((framework) => framework.name)
            .join(", ")}`
        );
      } else {
        console.log("Detected frameworks: none");
      }
    }

    console.log(`Config file: ${configPath}`);
  });

program
  .command("scan")
  .description("Scan a local project or GitHub repository and report architecture issues")
  .argument("<path>", "project path or GitHub repository URL")
  .option(
    "--report <format>",
    "write report file. Supported: markdown, json, sarif, all"
  )
  .option(
    "--output <path>",
    "directory where reports should be copied when scanning a GitHub repository"
  )
  .option(
    "--subdir <path>",
    "subdirectory to scan inside a local project or cloned GitHub repository"
  )
  .option(
    "--max-issues <count>",
    "maximum number of issues to print in the terminal. Use 0 to show all"
  )
  .option(
    "--fail-on <severity>",
    "exit with error if issues at this severity or higher are found. Supported: low, medium, high"
  )
  .addHelpText(
    "after",
    `

Examples:
  revos scan .
  revos scan . --report markdown
  revos scan . --report json
  revos scan . --report sarif
  revos scan . --report all
  revos scan . --max-issues 10
  revos scan . --fail-on high
  revos scan . --report all --fail-on high
  revos scan https://github.com/user/repo
  revos scan https://github.com/user/repo --report all
  revos scan https://github.com/user/repo --subdir apps/web --report all
  revos scan https://github.com/user/repo --report all --output ./reports
`
  )
  .action(async (projectPath, options) => {
    const scanTarget = await resolveScanTarget(projectPath, {
      subdir: options.subdir ? String(options.subdir) : undefined
    });

    try {
      console.log("Revos");

      const result = await runScan(
        scanTarget.projectPath,
        availablePlugins
      );

      if (result.detectedPlugins.length === 0) {
        console.log("\nNo supported language plugin detected.");
        return;
      }

      const detectedPlugins = result.detectedPlugins
        .map((plugin) => plugin.name)
        .join(", ");

      const detectedFrameworks =
        result.detectedFrameworks.length > 0
          ? result.detectedFrameworks
              .map((framework) => framework.name)
              .join(", ")
          : "none";

      console.log("\nProject");
      console.log(`Path: ${scanTarget.source}`);

      if (scanTarget.isTemporary) {
        console.log(`Cloned to: ${scanTarget.projectPath}`);
      }

      if (scanTarget.subdir) {
        console.log(`Subdirectory: ${scanTarget.subdir}`);
      }

      console.log(`Plugins: ${detectedPlugins}`);
      console.log(`Frameworks: ${detectedFrameworks}`);
      console.log(`Files: ${result.files.length}`);

      console.log("\nDependency Graph");
      console.log(`Nodes: ${result.graph.nodes.length}`);
      console.log(`Edges: ${result.graph.edges.length}`);

      let maxIssues: number | undefined;

      if (options.maxIssues !== undefined) {
        maxIssues = Number(options.maxIssues);

        if (
          !Number.isInteger(maxIssues) ||
          maxIssues < 0
        ) {
          console.log(`Unsupported max-issues value: ${options.maxIssues}`);
          console.log("Use a non-negative integer. Example: --max-issues 10");
          return;
        }
      }

      reportIssues(result.issues, result.projectPath, maxIssues);

      if (options.report) {
        const reportFormat = String(options.report);

        if (
          reportFormat !== "markdown" &&
          reportFormat !== "json" &&
          reportFormat !== "sarif" &&
          reportFormat !== "all"
        ) {
          console.log(`Unsupported report format: ${reportFormat}`);
          console.log("Supported report formats: markdown, json, sarif, all");
          return;
        }

        const writtenReports: {
          markdown?: string;
          json?: string;
          sarif?: string;
        } = {};

        if (reportFormat === "markdown" || reportFormat === "all") {
          writtenReports.markdown = await writeMarkdownReport(result);
        }

        if (reportFormat === "json" || reportFormat === "all") {
          writtenReports.json = await writeJsonReport(result);
        }

        if (reportFormat === "sarif" || reportFormat === "all") {
          writtenReports.sarif = await writeSarifReport(result);
        }

        console.log("\nReports");

        if (writtenReports.markdown) {
          console.log(`Markdown: ${writtenReports.markdown}`);
        }

        if (writtenReports.json) {
          console.log(`JSON: ${writtenReports.json}`);
        }

        if (writtenReports.sarif) {
          console.log(`SARIF: ${writtenReports.sarif}`);
        }

        if (scanTarget.isTemporary) {
          const outputDirectory = options.output
            ? path.resolve(String(options.output))
            : process.cwd();

          const copiedReports = await copyReportsToDirectory(
            result.projectPath,
            outputDirectory
          );

          if (
            copiedReports.markdownReportPath ||
            copiedReports.jsonReportPath ||
            copiedReports.sarifReportPath
          ) {
            console.log("\nCopied reports");

            if (copiedReports.markdownReportPath) {
              console.log(`Markdown: ${copiedReports.markdownReportPath}`);
            }

            if (copiedReports.jsonReportPath) {
              console.log(`JSON: ${copiedReports.jsonReportPath}`);
            }

            if (copiedReports.sarifReportPath) {
              console.log(`SARIF: ${copiedReports.sarifReportPath}`);
            }
          }
        }
      }

      if (options.failOn) {
        const failOn = String(options.failOn);

        if (!isValidSeverity(failOn)) {
          console.log(`Unsupported fail-on severity: ${failOn}`);
          console.log("Supported severities: low, medium, high");
          return;
        }

        const shouldFail = shouldFailOnSeverity(
          result.issues,
          failOn
        );

        if (shouldFail) {
          console.log(
            `\nRevos failed: found issues with severity ${failOn} or higher`
          );

          process.exitCode = 1;
        }
      }
    } finally {
      if (scanTarget.cleanup && !options.report) {
        await scanTarget.cleanup();
      }
    }
  });

program.parse();
