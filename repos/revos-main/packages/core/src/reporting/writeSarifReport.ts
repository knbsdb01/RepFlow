import fs from "fs/promises";
import path from "path";

import { Issue, IssueSeverity } from "../types/Issue.js";
import { ScanRunResult } from "../types/ScanRunResult.js";
import { formatPath } from "../utils/formatPath.js";

function severityToSarifLevel(
  severity: IssueSeverity
): "error" | "warning" | "note" {
  if (severity === "high") {
    return "error";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "note";
}

function getRuleId(issue: Issue): string {
  return issue.ruleId ?? issue.type;
}

function buildRule(issue: Issue) {
  return {
    id: getRuleId(issue),
    name: issue.title,
    shortDescription: {
      text: issue.title
    },
    fullDescription: {
      text: issue.message
    },
    help: {
      text: issue.suggestedFix
    },
    properties: {
      category: issue.type,
      severity: issue.severity
    }
  };
}

export async function writeSarifReport(
  result: ScanRunResult
): Promise<string> {
  const reportDirectory = path.join(result.projectPath, ".revos");
  const reportPath = path.join(reportDirectory, "report.sarif");

  await fs.mkdir(reportDirectory, { recursive: true });

  const rulesById = new Map<string, ReturnType<typeof buildRule>>();

  for (const issue of result.issues) {
    const ruleId = getRuleId(issue);

    if (!rulesById.has(ruleId)) {
      rulesById.set(ruleId, buildRule(issue));
    }
  }

  const sarif = {
    version: "2.1.0",
    $schema:
      "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "Revos",
            informationUri: "https://github.com/mattykry/revos",
            semanticVersion: "0.1.3",
            rules: Array.from(rulesById.values())
          }
        },
        results: result.issues.map((issue) => ({
          ruleId: getRuleId(issue),
          level: severityToSarifLevel(issue.severity),
          message: {
            text: `${issue.title}\n\n${issue.message}\n\nSuggested fix: ${issue.suggestedFix}`
          },
          locations: issue.files.map((file) => ({
            physicalLocation: {
              artifactLocation: {
                uri: formatPath(file, result.projectPath)
              },
              region: {
                startLine: 1
              }
            }
          })),
          properties: {
            type: issue.type,
            severity: issue.severity,
            ruleId: issue.ruleId ?? null
          }
        }))
      }
    ]
  };

  await fs.writeFile(
    reportPath,
    JSON.stringify(sarif, null, 2),
    "utf-8"
  );

  return reportPath;
}
