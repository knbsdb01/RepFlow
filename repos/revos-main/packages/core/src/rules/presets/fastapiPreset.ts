import { RevosConfig } from "../../types/RevosConfig.js";

export const fastapiPreset: RevosConfig = {
  forbiddenImports: [
    {
      id: "fastapi-domain-no-fastapi",
      from: "**/domain/**",
      to: "[external] fastapi",
      severity: "high",
      title: "Domain depends on FastAPI",
      message:
        "Domain code is importing FastAPI. Business logic should not depend on the web framework.",
      suggestedFix:
        "Move FastAPI-specific code into API routes, controllers, or adapters. Keep domain logic framework-independent."
    },
    {
      id: "fastapi-domain-no-starlette",
      from: "**/domain/**",
      to: "[external] starlette",
      severity: "high",
      title: "Domain depends on Starlette",
      message:
        "Domain code is importing Starlette. Business logic should not depend on HTTP framework internals.",
      suggestedFix:
        "Move Starlette-specific code into API routes, middleware, or adapters."
    },
    {
      id: "fastapi-domain-no-sqlalchemy",
      from: "**/domain/**",
      to: "[external] sqlalchemy",
      severity: "high",
      title: "Domain depends on SQLAlchemy",
      message:
        "Domain code is importing SQLAlchemy. This couples business rules to persistence details.",
      suggestedFix:
        "Move SQLAlchemy usage into repositories, infrastructure, or adapters. Keep domain entities and services persistence-independent."
    },
    {
      id: "fastapi-domain-no-pydantic",
      from: "**/domain/**",
      to: "[external] pydantic",
      severity: "medium",
      title: "Domain depends on Pydantic",
      message:
        "Domain code is importing Pydantic. In clean architecture, request/response validation models should usually stay outside the domain layer.",
      suggestedFix:
        "Move Pydantic models into schemas, DTOs, API, or application boundaries. Keep domain objects as plain Python classes where possible."
    },
    {
      id: "fastapi-api-no-repository",
      from: "**/api/**",
      to: "**/repositories/**",
      severity: "medium",
      title: "API layer imports repository directly",
      message:
        "A FastAPI route is importing a repository directly. This can mix HTTP concerns with persistence access.",
      suggestedFix:
        "Move repository usage into an application service or use case, then call that from the route."
    },
    {
      id: "fastapi-routes-no-repository",
      from: "**/routes/**",
      to: "**/repositories/**",
      severity: "medium",
      title: "Route layer imports repository directly",
      message:
        "A FastAPI route is importing a repository directly. Routes should coordinate requests and delegate application logic.",
      suggestedFix:
        "Move repository access into a service or use case."
    },
    {
      id: "fastapi-api-no-sqlalchemy",
      from: "**/api/**",
      to: "[external] sqlalchemy",
      severity: "medium",
      title: "API layer depends on SQLAlchemy",
      message:
        "A FastAPI API module is importing SQLAlchemy directly. This can put persistence details inside the HTTP layer.",
      suggestedFix:
        "Move SQLAlchemy sessions, queries, and ORM usage into repositories, infrastructure, or dedicated data access modules."
    },
    {
      id: "fastapi-routes-no-sqlalchemy",
      from: "**/routes/**",
      to: "[external] sqlalchemy",
      severity: "medium",
      title: "Route layer depends on SQLAlchemy",
      message:
        "A FastAPI route module is importing SQLAlchemy directly. This can mix HTTP routing with persistence details.",
      suggestedFix:
        "Move SQLAlchemy usage into repositories, infrastructure, or dedicated data access modules."
    },
    {
      id: "fastapi-repositories-no-fastapi",
      from: "**/repositories/**",
      to: "[external] fastapi",
      severity: "high",
      title: "Repository depends on FastAPI",
      message:
        "Repository code is importing FastAPI. Persistence code should not depend on HTTP framework details.",
      suggestedFix:
        "Move FastAPI-specific dependencies into API routes or dependency providers. Keep repositories focused on persistence."
    },
    {
      id: "fastapi-models-no-routes",
      from: "**/models/**",
      to: "**/routes/**",
      severity: "high",
      title: "Model layer imports routes",
      message:
        "Model code is importing route code. Persistence or data model code should not depend on the HTTP layer.",
      suggestedFix:
        "Move shared behavior into a service or domain module that both layers can depend on safely."
    },
    {
      id: "fastapi-services-no-routes",
      from: "**/services/**",
      to: "**/routes/**",
      severity: "high",
      title: "Service layer imports routes",
      message:
        "Service code is importing route code. Application services should not depend on HTTP delivery details.",
      suggestedFix:
        "Move shared code into a separate module, or invert the dependency so routes call services."
    },
    {
      id: "fastapi-services-no-api",
      from: "**/services/**",
      to: "**/api/**",
      severity: "high",
      title: "Service layer imports API layer",
      message:
        "Service code is importing API code. Application services should not depend on HTTP delivery details.",
      suggestedFix:
        "Move shared logic into a domain or application module, then make API routes call services."
    }
  ]
};
