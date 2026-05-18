# Presets

Revos presets are ready-made rule sets for common architectures and frameworks.

Use a preset with:

```bash
revos init . --preset <preset-name> --force

Or let Revos choose automatically:

revos init . --auto --force
Available presets
default
clean-architecture
nextjs
nestjs
laravel
laravel-clean-architecture
fastapi
Default preset
revos init . --preset default --force

The default preset provides basic architecture protection.

It is useful when a project does not match a supported framework-specific preset yet.

Clean Architecture preset
revos init . --preset clean-architecture --force

The clean architecture preset is intended for projects organized around layers such as:

domain
application
infrastructure
presentation

Typical goals:

domain should not depend on infrastructure;
domain should not depend on framework code;
infrastructure should not depend on controllers;
lower-level details should not leak into higher-level business code.
Next.js preset
revos init . --preset nextjs --force

The Next.js preset detects common architecture issues in Next.js, React, and server/client codebases.

Current rules include:

components-no-prisma
components-no-node-builtins
client-no-prisma
client-no-node-builtins
app-no-prisma
pages-no-prisma
app-no-repository
client-no-server
middleware-no-prisma
middleware-no-database
domain-no-next
domain-no-react

Examples of detected problems:

React component imports Prisma.
React component imports Node.js APIs.
Client code imports Prisma.
Client code imports node:fs, node:path, or similar server-only modules.
App layer imports Prisma.
Pages layer imports Prisma.
App layer imports repositories directly.
Client code imports server code.
Middleware imports Prisma.
Middleware imports database/repository code.
Domain code imports Next.js.
Domain code imports React.
NestJS preset
revos init . --preset nestjs --force

The NestJS preset detects architecture violations in NestJS applications.

Current rules include:

controller-no-repository
controller-no-prisma
controller-no-typeorm
controller-no-database-client
domain-no-nestjs
domain-no-typeorm
domain-no-prisma
domain-no-infrastructure
repository-no-controller
service-no-controller
module-no-repository

Examples of detected problems:

Controller imports repository directly.
Controller imports Prisma.
Controller imports TypeORM.
Controller imports database client code.
Domain code imports NestJS.
Domain code imports TypeORM.
Domain code imports Prisma.
Domain code imports infrastructure.
Repository imports controller.
Service imports controller.
Module imports repository directly.
Laravel preset
revos init . --preset laravel --force

The Laravel preset detects common Laravel architecture issues.

Current rules include:

laravel-controller-no-model
laravel-controller-no-db-facade
laravel-controller-no-mail-facade
laravel-controller-no-queue-facade
laravel-controller-no-event-facade
laravel-controller-no-storage-facade
laravel-controller-no-http-client
laravel-controller-no-cache-facade
laravel-controller-no-config-facade
laravel-controller-no-repository
laravel-controller-no-infrastructure-src
laravel-controller-no-infrastructure-app
laravel-model-no-controller
laravel-model-no-db-facade
laravel-model-no-request
laravel-job-no-controller
laravel-job-no-request

Examples of detected problems:

Controller imports Eloquent model.
Controller accesses DB facade.
Controller uses Mail, Queue, Event, Storage, Http, Cache, or Config facade.
Controller imports repository.
Controller imports infrastructure.
Model imports controller.
Model uses DB facade.
Model depends on HTTP request.
Job imports controller.
Job depends on HTTP request.
Laravel Clean Architecture preset
revos init . --preset laravel-clean-architecture --force

This preset includes the Laravel preset plus additional Clean Architecture rules.

Additional rules include:

laravel-domain-no-laravel-framework-src
laravel-domain-no-laravel-framework-app
laravel-domain-no-eloquent-src
laravel-domain-no-eloquent-app
laravel-application-no-controller-src
laravel-application-no-controller-app
laravel-application-no-eloquent-src
laravel-application-no-eloquent-app
laravel-application-no-facades-src
laravel-application-no-facades-app
laravel-infrastructure-no-controller-src
laravel-infrastructure-no-controller-app
laravel-controller-no-domain-entity-src
laravel-controller-no-domain-entity-app

Examples of detected problems:

Domain imports Laravel or Illuminate.
Domain imports Eloquent.
Application imports controller.
Application imports Eloquent.
Application imports Laravel facades.
Infrastructure imports controller.
Controller imports domain entity directly.
FastAPI preset
revos init . --preset fastapi --force

The FastAPI preset detects common layering problems in FastAPI applications.

Current rules include:

fastapi-domain-no-fastapi
fastapi-domain-no-starlette
fastapi-domain-no-sqlalchemy
fastapi-domain-no-pydantic
fastapi-api-no-repository
fastapi-routes-no-repository
fastapi-api-no-sqlalchemy
fastapi-routes-no-sqlalchemy
fastapi-repositories-no-fastapi
fastapi-models-no-routes
fastapi-services-no-routes
fastapi-services-no-api

Examples of detected problems:

Domain imports FastAPI.
Domain imports Starlette.
Domain imports SQLAlchemy.
Domain imports Pydantic.
API imports repository directly.
Routes import repository directly.
API imports SQLAlchemy.
Routes import SQLAlchemy.
Repository imports FastAPI.
Models import routes.
Services import routes.
Services import API.
Choosing a preset

Recommended starting points:

Next.js project -> nextjs
NestJS project -> nestjs
Laravel project -> laravel
Laravel with Domain/Application/Infrastructure -> laravel-clean-architecture
FastAPI project -> fastapi
Generic layered project -> clean-architecture
Unknown project -> default or --auto
Customizing presets

Presets generate a starting .revos/rules.json.

You can then edit:

rule severities;
messages;
suggested fixes;
custom forbidden imports;
ignoreRules;
ignoreIssues.

Example:

{
  "ignoreRules": [
    "fastapi-api-no-repository"
  ],
  "forbiddenImports": [
    {
      "id": "domain-no-sqlalchemy",
      "from": "**/domain/**",
      "to": "[external] sqlalchemy",
      "severity": "high",
      "title": "Domain depends on SQLAlchemy",
      "message": "Domain code should not depend on SQLAlchemy.",
      "suggestedFix": "Move persistence concerns into repositories or infrastructure."
    }
  ]
}
