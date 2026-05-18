import { RevosConfig } from "../../types/RevosConfig.js";

export const cleanArchitecturePreset: RevosConfig = {
  forbiddenImports: [
    {
      id: "domain-no-infrastructure",
      from: "/domain/",
      to: "/infrastructure/",
      severity: "high",
      title: "Domain depends on infrastructure",
      message:
        "Domain code is importing infrastructure code. This couples business logic to technical details.",
      suggestedFix:
        "Move infrastructure access behind an interface or application service."
    },
    {
      id: "domain-no-express",
      from: "/domain/",
      to: "[external] express",
      severity: "high",
      title: "Domain depends on web framework",
      message:
        "Domain code is importing Express. Business logic should not depend on the web framework.",
      suggestedFix:
        "Move framework-specific code outside the domain layer."
    },
    {
      id: "domain-no-nestjs",
      from: "/domain/",
      to: "[external] @nestjs/common",
      severity: "high",
      title: "Domain depends on NestJS framework",
      message:
        "Domain code is importing NestJS. Business logic should stay independent from framework decorators and utilities.",
      suggestedFix:
        "Keep NestJS-specific code in controllers, modules, or infrastructure adapters."
    },
    {
      id: "controller-no-prisma",
      from: "/controllers/",
      to: "[external] @prisma/client",
      severity: "high",
      title: "Controller accesses database directly",
      message:
        "A controller is importing Prisma directly. This puts database access inside the HTTP layer.",
      suggestedFix:
        "Move Prisma usage into a service or repository, then inject that dependency into the controller."
    },
    {
      id: "controller-no-repository",
      from: "/controllers/",
      to: "/repositories/",
      severity: "high",
      title: "Layer violation detected",
      message:
        "A controller is importing a repository directly. This bypasses the service layer and increases coupling.",
      suggestedFix:
        "Move the repository access into a service, then make the controller depend on that service instead."
    }
  ]
};
