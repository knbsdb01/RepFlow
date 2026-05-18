import { RevosConfig } from "../../types/RevosConfig.js";
import { laravelPreset } from "./laravelPreset.js";

const cleanArchitectureRules: RevosConfig["forbiddenImports"] = [
  {
    id: "laravel-domain-no-laravel-framework-src",
    from: "/src/Domain/",
    to: "[external] Illuminate\\",
    severity: "high",
    title: "Domain depends on Laravel framework",
    message:
      "Domain code is importing Laravel framework APIs. Domain logic should stay independent from Laravel, HTTP, persistence, queues, events, and other framework details.",
    suggestedFix:
      "Move Laravel-specific code into application, infrastructure, controllers, providers, listeners, jobs, or adapters. Keep the domain layer framework-independent."
  },
  {
    id: "laravel-domain-no-laravel-framework-app",
    from: "/app/Domain/",
    to: "[external] Illuminate\\",
    severity: "high",
    title: "Domain depends on Laravel framework",
    message:
      "Domain code is importing Laravel framework APIs. Domain logic should stay independent from Laravel, HTTP, persistence, queues, events, and other framework details.",
    suggestedFix:
      "Move Laravel-specific code into application, infrastructure, controllers, providers, listeners, jobs, or adapters. Keep the domain layer framework-independent."
  },
  {
    id: "laravel-domain-no-eloquent-src",
    from: "/src/Domain/",
    to: "[external] Illuminate\\Database\\Eloquent",
    severity: "high",
    title: "Domain depends on Eloquent",
    message:
      "Domain code is importing Eloquent. This couples business rules to Laravel persistence details.",
    suggestedFix:
      "Move Eloquent models into infrastructure or app/Models, and keep domain entities as plain PHP objects."
  },
  {
    id: "laravel-domain-no-eloquent-app",
    from: "/app/Domain/",
    to: "[external] Illuminate\\Database\\Eloquent",
    severity: "high",
    title: "Domain depends on Eloquent",
    message:
      "Domain code is importing Eloquent. This couples business rules to Laravel persistence details.",
    suggestedFix:
      "Move Eloquent models into infrastructure or app/Models, and keep domain entities as plain PHP objects."
  },
  {
    id: "laravel-application-no-controller-src",
    from: "/src/Application/",
    to: "/app/Http/Controllers/",
    severity: "high",
    title: "Application layer imports controller",
    message:
      "Application layer code is importing an HTTP controller. Application services and use cases should not depend on the delivery layer.",
    suggestedFix:
      "Move shared behavior into an application service, action, command handler, or domain service that the controller can call."
  },
  {
    id: "laravel-application-no-controller-app",
    from: "/app/Application/",
    to: "/app/Http/Controllers/",
    severity: "high",
    title: "Application layer imports controller",
    message:
      "Application layer code is importing an HTTP controller. Application services and use cases should not depend on the delivery layer.",
    suggestedFix:
      "Move shared behavior into an application service, action, command handler, or domain service that the controller can call."
  },
  {
    id: "laravel-application-no-eloquent-src",
    from: "/src/Application/",
    to: "[external] Illuminate\\Database\\Eloquent",
    severity: "medium",
    title: "Application layer depends on Eloquent",
    message:
      "Application layer code is importing Eloquent. In clean architecture, use cases should usually coordinate business workflows without depending directly on ORM details.",
    suggestedFix:
      "Move Eloquent usage into infrastructure, repositories, or adapters behind an interface."
  },
  {
    id: "laravel-application-no-eloquent-app",
    from: "/app/Application/",
    to: "[external] Illuminate\\Database\\Eloquent",
    severity: "medium",
    title: "Application layer depends on Eloquent",
    message:
      "Application layer code is importing Eloquent. In clean architecture, use cases should usually coordinate business workflows without depending directly on ORM details.",
    suggestedFix:
      "Move Eloquent usage into infrastructure, repositories, or adapters behind an interface."
  },
  {
    id: "laravel-application-no-facades-src",
    from: "/src/Application/",
    to: "[external] Illuminate\\Support\\Facades\\",
    severity: "medium",
    title: "Application layer depends on Laravel facade",
    message:
      "Application layer code is importing Laravel facades. This can couple use cases to framework services and static-style infrastructure access.",
    suggestedFix:
      "Move facade usage into infrastructure, adapters, jobs, listeners, or framework-specific services."
  },
  {
    id: "laravel-application-no-facades-app",
    from: "/app/Application/",
    to: "[external] Illuminate\\Support\\Facades\\",
    severity: "medium",
    title: "Application layer depends on Laravel facade",
    message:
      "Application layer code is importing Laravel facades. This can couple use cases to framework services and static-style infrastructure access.",
    suggestedFix:
      "Move facade usage into infrastructure, adapters, jobs, listeners, or framework-specific services."
  },
  {
    id: "laravel-infrastructure-no-controller-src",
    from: "/src/Infrastructure/",
    to: "/app/Http/Controllers/",
    severity: "high",
    title: "Infrastructure layer imports controller",
    message:
      "Infrastructure code is importing an HTTP controller. Infrastructure should implement technical details and should not depend on the delivery layer.",
    suggestedFix:
      "Move shared behavior into an application service or adapter interface. Controllers should call application code, not the other way around."
  },
  {
    id: "laravel-infrastructure-no-controller-app",
    from: "/app/Infrastructure/",
    to: "/app/Http/Controllers/",
    severity: "high",
    title: "Infrastructure layer imports controller",
    message:
      "Infrastructure code is importing an HTTP controller. Infrastructure should implement technical details and should not depend on the delivery layer.",
    suggestedFix:
      "Move shared behavior into an application service or adapter interface. Controllers should call application code, not the other way around."
  },
  {
    id: "laravel-controller-no-domain-entity-src",
    from: "/app/Http/Controllers/",
    to: "/src/Domain/Entities/",
    severity: "medium",
    title: "Controller imports domain entity directly",
    message:
      "A controller is importing a domain entity directly. This can expose domain internals to the HTTP layer and make request handling too coupled to domain objects.",
    suggestedFix:
      "Use an application service, command, query, DTO, resource, or presenter between the controller and the domain entity."
  },
  {
    id: "laravel-controller-no-domain-entity-app",
    from: "/app/Http/Controllers/",
    to: "/app/Domain/Entities/",
    severity: "medium",
    title: "Controller imports domain entity directly",
    message:
      "A controller is importing a domain entity directly. This can expose domain internals to the HTTP layer and make request handling too coupled to domain objects.",
    suggestedFix:
      "Use an application service, command, query, DTO, resource, or presenter between the controller and the domain entity."
  }
];

export const laravelCleanArchitecturePreset: RevosConfig = {
  forbiddenImports: [
    ...laravelPreset.forbiddenImports,
    ...cleanArchitectureRules
  ]
};
