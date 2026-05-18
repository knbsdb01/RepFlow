import { describe, expect, it } from "vitest";
import { getPresetConfig } from "./getPresetConfig.js";

describe("getPresetConfig", () => {
  it("returns the Next.js preset", () => {
    const config = getPresetConfig("nextjs");

    expect(config.forbiddenImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "components-no-prisma",
          from: "/components/",
          to: "[external] @prisma/client",
          severity: "high"
        }),
        expect.objectContaining({
          id: "client-no-node-builtins",
          from: "/client/",
          to: "[external] node:",
          severity: "high"
        }),
        expect.objectContaining({
          id: "middleware-no-prisma",
          from: "/middleware.",
          to: "[external] @prisma/client",
          severity: "high"
        }),
        expect.objectContaining({
          id: "domain-no-react",
          from: "/domain/",
          to: "[external] react",
          severity: "high"
        })
      ])
    );
  });

  it("returns the NestJS preset", () => {
    const config = getPresetConfig("nestjs");

    expect(config.forbiddenImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "controller-no-repository",
          from: ".controller.ts",
          to: ".repository.ts",
          severity: "high"
        }),
        expect.objectContaining({
          id: "controller-no-typeorm",
          from: ".controller.ts",
          to: "[external] typeorm",
          severity: "high"
        }),
        expect.objectContaining({
          id: "domain-no-typeorm",
          from: "/domain/",
          to: "[external] typeorm",
          severity: "high"
        }),
        expect.objectContaining({
          id: "repository-no-controller",
          from: ".repository.ts",
          to: ".controller.ts",
          severity: "high"
        })
      ])
    );
  });

  it("returns the Laravel preset", () => {
    const config = getPresetConfig("laravel");

    expect(config.forbiddenImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "laravel-controller-no-model",
          from: "/app/Http/Controllers/",
          to: "/app/Models/",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-controller-no-db-facade",
          from: "/app/Http/Controllers/",
          to: "[external] Illuminate\\Support\\Facades\\DB",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-controller-no-mail-facade",
          from: "/app/Http/Controllers/",
          to: "[external] Illuminate\\Support\\Facades\\Mail",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "laravel-controller-no-http-client",
          from: "/app/Http/Controllers/",
          to: "[external] Illuminate\\Support\\Facades\\Http",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "laravel-model-no-request",
          from: "/app/Models/",
          to: "[external] Illuminate\\Http\\Request",
          severity: "high"
        })
      ])
    );
  });

  it("returns the Laravel clean architecture preset with base Laravel rules included", () => {
    const config = getPresetConfig("laravel-clean-architecture");

    expect(config.forbiddenImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "laravel-controller-no-model",
          from: "/app/Http/Controllers/",
          to: "/app/Models/",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-controller-no-db-facade",
          from: "/app/Http/Controllers/",
          to: "[external] Illuminate\\Support\\Facades\\DB",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-domain-no-laravel-framework-src",
          from: "/src/Domain/",
          to: "[external] Illuminate\\",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-domain-no-eloquent-src",
          from: "/src/Domain/",
          to: "[external] Illuminate\\Database\\Eloquent",
          severity: "high"
        }),
        expect.objectContaining({
          id: "laravel-application-no-eloquent-src",
          from: "/src/Application/",
          to: "[external] Illuminate\\Database\\Eloquent",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "laravel-application-no-facades-src",
          from: "/src/Application/",
          to: "[external] Illuminate\\Support\\Facades\\",
          severity: "medium"
        })
      ])
    );
  });

  it("returns the FastAPI preset", () => {
    const config = getPresetConfig("fastapi");

    expect(config.forbiddenImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "fastapi-domain-no-fastapi",
          from: "**/domain/**",
          to: "[external] fastapi",
          severity: "high"
        }),
        expect.objectContaining({
          id: "fastapi-domain-no-sqlalchemy",
          from: "**/domain/**",
          to: "[external] sqlalchemy",
          severity: "high"
        }),
        expect.objectContaining({
          id: "fastapi-domain-no-pydantic",
          from: "**/domain/**",
          to: "[external] pydantic",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "fastapi-api-no-repository",
          from: "**/api/**",
          to: "**/repositories/**",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "fastapi-api-no-sqlalchemy",
          from: "**/api/**",
          to: "[external] sqlalchemy",
          severity: "medium"
        }),
        expect.objectContaining({
          id: "fastapi-repositories-no-fastapi",
          from: "**/repositories/**",
          to: "[external] fastapi",
          severity: "high"
        })
      ])
    );
  });
});
