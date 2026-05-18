import { RevosConfig } from "../../types/RevosConfig.js";

export const nestjsPreset: RevosConfig = {
  forbiddenImports: [
    {
      id: "controller-no-repository",
      from: ".controller.ts",
      to: ".repository.ts",
      severity: "high",
      title: "NestJS controller imports repository directly",
      message:
        "A NestJS controller is importing a repository directly. Controllers should delegate business logic to services.",
      suggestedFix:
        "Inject a service into the controller and move repository access into the service."
    },
    {
      id: "controller-no-prisma",
      from: ".controller.ts",
      to: "[external] @prisma/client",
      severity: "high",
      title: "NestJS controller accesses Prisma directly",
      message:
        "A NestJS controller is importing Prisma directly. This puts database access in the HTTP layer.",
      suggestedFix:
        "Move Prisma access into a provider, service, or repository."
    },
    {
      id: "controller-no-typeorm",
      from: ".controller.ts",
      to: "[external] typeorm",
      severity: "high",
      title: "NestJS controller accesses TypeORM directly",
      message:
        "A NestJS controller is importing TypeORM directly. Controllers should not own persistence details.",
      suggestedFix:
        "Move TypeORM repositories or entity manager usage into a service or repository provider."
    },
    {
      id: "controller-no-database-client",
      from: ".controller.ts",
      to: "/database/",
      severity: "high",
      title: "NestJS controller imports database layer",
      message:
        "A NestJS controller is importing database-layer code directly. This couples HTTP handlers to persistence details.",
      suggestedFix:
        "Inject a service into the controller and move database access into the service or repository layer."
    },
    {
      id: "domain-no-nestjs",
      from: "/domain/",
      to: "[external] @nestjs/common",
      severity: "high",
      title: "Domain depends on NestJS framework",
      message:
        "Domain code is importing NestJS. Domain logic should stay independent from framework decorators and utilities.",
      suggestedFix:
        "Keep NestJS decorators and framework-specific code in controllers, modules, or infrastructure adapters."
    },
    {
      id: "domain-no-typeorm",
      from: "/domain/",
      to: "[external] typeorm",
      severity: "high",
      title: "Domain depends on TypeORM",
      message:
        "Domain code is importing TypeORM. Business logic should not depend on ORM persistence details.",
      suggestedFix:
        "Move TypeORM entities, repositories, and decorators into infrastructure or persistence adapters."
    },
    {
      id: "domain-no-prisma",
      from: "/domain/",
      to: "[external] @prisma/client",
      severity: "high",
      title: "Domain depends on Prisma",
      message:
        "Domain code is importing Prisma. Business logic should not depend on generated database clients.",
      suggestedFix:
        "Move Prisma usage into infrastructure, repositories, or adapters behind an interface."
    },
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
      id: "repository-no-controller",
      from: ".repository.ts",
      to: ".controller.ts",
      severity: "high",
      title: "Repository imports controller",
      message:
        "A repository is importing a controller. Persistence code should not depend on the HTTP layer.",
      suggestedFix:
        "Move shared logic into a service or domain module that both repository and controller can depend on."
    },
    {
      id: "service-no-controller",
      from: ".service.ts",
      to: ".controller.ts",
      severity: "high",
      title: "Service imports controller",
      message:
        "A service is importing a controller. Application services should not depend on HTTP delivery details.",
      suggestedFix:
        "Move shared logic into a separate module, or invert the dependency so controllers call services."
    },
    {
      id: "module-no-repository",
      from: ".module.ts",
      to: ".repository.ts",
      severity: "medium",
      title: "NestJS module imports repository directly",
      message:
        "A NestJS module file is importing a repository directly. Modules should mainly wire providers, controllers, and imports rather than depend on implementation details directly.",
      suggestedFix:
        "Register repositories as providers and depend on services or provider tokens where appropriate."
    }
  ]
};
