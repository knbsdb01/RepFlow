import { describe, expect, it } from "vitest";
import { findCircularDependencies } from "./findCircularDependencies.js";
import { DependencyGraph } from "../types/DependencyGraph.js";

describe("findCircularDependencies", () => {
  it("detects a simple circular dependency", () => {
    const graph: DependencyGraph = {
      nodes: ["a.ts", "b.ts"],
      edges: [
        {
          from: "a.ts",
          to: "b.ts"
        },
        {
          from: "b.ts",
          to: "a.ts"
        }
      ]
    };

    const cycles = findCircularDependencies(graph);

    expect(cycles).toEqual([
      ["a.ts", "b.ts", "a.ts"]
    ]);
  });

  it("ignores external dependencies", () => {
    const graph: DependencyGraph = {
      nodes: ["a.ts", "[external] express"],
      edges: [
        {
          from: "a.ts",
          to: "[external] express"
        }
      ]
    };

    const cycles = findCircularDependencies(graph);

    expect(cycles).toEqual([]);
  });

  it("deduplicates cycles with the same files", () => {
    const graph: DependencyGraph = {
      nodes: ["a.ts", "b.ts", "c.ts"],
      edges: [
        {
          from: "a.ts",
          to: "b.ts"
        },
        {
          from: "b.ts",
          to: "c.ts"
        },
        {
          from: "c.ts",
          to: "a.ts"
        },
        {
          from: "b.ts",
          to: "a.ts"
        }
      ]
    };

    const cycles = findCircularDependencies(graph);

    expect(cycles).toEqual([
      ["a.ts", "b.ts", "a.ts"]
    ]);
  });

  it("keeps separate cycles when neither one covers the other", () => {
    const graph: DependencyGraph = {
      nodes: ["a.ts", "b.ts", "c.ts", "d.ts"],
      edges: [
        {
          from: "a.ts",
          to: "b.ts"
        },
        {
          from: "b.ts",
          to: "a.ts"
        },
        {
          from: "c.ts",
          to: "d.ts"
        },
        {
          from: "d.ts",
          to: "c.ts"
        }
      ]
    };

    const cycles = findCircularDependencies(graph);

    expect(cycles).toEqual([
      ["a.ts", "b.ts", "a.ts"],
      ["c.ts", "d.ts", "c.ts"]
    ]);
  });
});
