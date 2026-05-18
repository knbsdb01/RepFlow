import { describe, expect, it } from "vitest";
import { suggestPreset } from "./suggestPreset.js";
import { FrameworkDetection } from "../../types/FrameworkDetection.js";

describe("suggestPreset", () => {
  it("suggests nextjs when Next.js is detected", () => {
    const frameworks: FrameworkDetection[] = [
      {
        name: "nextjs",
        confidence: "high",
        reason: "package.json contains next"
      }
    ];

    expect(suggestPreset(frameworks)).toBe("nextjs");
  });

  it("suggests nestjs when NestJS is detected", () => {
    const frameworks: FrameworkDetection[] = [
      {
        name: "nestjs",
        confidence: "high",
        reason: "package.json contains @nestjs/core"
      }
    ];

    expect(suggestPreset(frameworks)).toBe("nestjs");
  });

  it("suggests laravel when Laravel is detected", () => {
    const frameworks: FrameworkDetection[] = [
      {
        name: "laravel",
        confidence: "high",
        reason: "composer.json contains laravel/framework"
      }
    ];

    expect(suggestPreset(frameworks)).toBe("laravel");
  });

  it("suggests laravel-clean-architecture when Laravel clean architecture is detected", () => {
    const frameworks: FrameworkDetection[] = [
      {
        name: "laravel",
        confidence: "high",
        reason: "composer.json contains laravel/framework"
      },
      {
        name: "laravel-clean-architecture",
        confidence: "high",
        reason:
          "Project contains Laravel plus Domain, Application, and Infrastructure folders"
      }
    ];

    expect(suggestPreset(frameworks)).toBe("laravel-clean-architecture");
  });

  it("suggests fastapi when FastAPI is detected", () => {
    const frameworks: FrameworkDetection[] = [
      {
        name: "fastapi",
        confidence: "high",
        reason: "Python dependencies contain fastapi"
      }
    ];

    expect(suggestPreset(frameworks)).toBe("fastapi");
  });

  it("falls back to default when no known framework is detected", () => {
    expect(suggestPreset([])).toBe("default");
  });
});
