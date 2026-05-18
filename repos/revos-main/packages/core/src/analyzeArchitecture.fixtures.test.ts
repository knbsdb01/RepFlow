import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import { analyzeArchitecture } from "./analyzeArchitecture.js";
import { DependencyGraph } from "./types/DependencyGraph.js";

async function createTempProject(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "revos-fixtures-"));
}

describe("analyzeArchitecture fixture noise filtering", () => {
  it("ignores circular dependencies fully inside test fixtures", async () => {
    const projectPath = await createTempProject();

    const firstFile =
      "tests/fixtures/sample-js-project-negative/src/a.ts";
    const secondFile =
      "tests/fixtures/sample-js-project-negative/src/b.ts";

    const graph: DependencyGraph = {
      nodes: [firstFile, secondFile],
      edges: [
        {
          from: firstFile,
          to: secondFile
        },
        {
          from: secondFile,
          to: firstFile
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, projectPath);

    expect(issues).toEqual([]);
  });

  it("keeps circular dependencies in real source files", async () => {
    const projectPath = await createTempProject();

    const firstFile = "src/a.ts";
    const secondFile = "src/b.ts";

    const graph: DependencyGraph = {
      nodes: [firstFile, secondFile],
      edges: [
        {
          from: firstFile,
          to: secondFile
        },
        {
          from: secondFile,
          to: firstFile
        }
      ]
    };

    const issues = await analyzeArchitecture(graph, projectPath);

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("circular-dependency");
    expect(issues[0].files).toEqual([
      firstFile,
      secondFile,
      firstFile
    ]);
  });
});
