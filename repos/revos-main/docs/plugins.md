# Revos Plugin System

This document explains how Revos language plugins work and how to add support for new languages such as PHP, Laravel, Python, Go, Rust, C#, Java, and others.

---

## Why plugins exist

Revos is designed to support multiple languages without rewriting the core engine.

The core should not know the syntax of every programming language.

Instead, each language plugin is responsible for reading source files of that language and converting imports, uses, includes, or dependencies into a common format.

That common format is:

```ts
{
  from: "source-file",
  to: "target-file-or-external-dependency"
}

Once a plugin returns dependency edges, the core can reuse the same logic for every language:

build dependency graph
detect circular dependencies
apply forbidden import rules
generate issues
generate terminal, Markdown, and JSON reports
fail on severity
support GitHub repository scanning
Current architecture

Revos is structured like this:

apps/
  cli/

packages/
  core/
  plugin-typescript/
  plugin-laravel/
packages/core

The core contains language-independent logic:

project scanning
plugin detection
framework detection
dependency graph creation
circular dependency detection
forbidden import rules
presets
reporting
Markdown and JSON output
GitHub URL scan support

The core should stay generic.

It should not contain TypeScript-specific, PHP-specific, Python-specific, or Laravel-specific parsing logic.

packages/plugin-typescript

The TypeScript plugin contains TypeScript-specific logic:

detects TypeScript projects
supports .ts and .tsx
extracts TypeScript imports
resolves relative imports
resolves tsconfig.json path aliases
detects frameworks from package.json

Supported frameworks currently include:

Next.js
React
NestJS
Express
packages/plugin-laravel

The Laravel plugin contains PHP / Laravel-specific logic:

detects Laravel projects
supports .php
extracts PHP use imports
supports aliased imports
supports grouped imports
resolves internal classes through Composer PSR-4 mappings
detects Laravel from composer.json, artisan, and Laravel folder conventions

Example supported PHP imports:

use App\Services\UserService;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Services\UserService as Users;
use App\Services\{UserService, BillingService};

Example Composer PSR-4 mappings:

{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Domain\\": "src/Domain/",
      "Application\\": "src/Application/",
      "Infrastructure\\": "src/Infrastructure/",
      "Modules\\": "modules/"
    }
  }
}

Revos can resolve imports like:

use Domain\Users\Application\CreateUser;
use Modules\Billing\Application\CreateInvoice;

into internal project files.

The Laravel plugin also provides framework detection for:

laravel

This allows:

revos init . --auto --force

to select the Laravel preset automatically.

Plugin contract

Every language plugin must implement this interface:

import { ImportEdge } from "../types/ImportEdge.js";
import { FrameworkDetection } from "../types/FrameworkDetection.js";

export interface LanguagePlugin {
  name: string;
  extensions: string[];

  detect(projectPath: string): Promise<boolean>;

  extractImports(
    filePath: string,
    projectPath: string
  ): Promise<ImportEdge[]>;

  detectFrameworks?(
    projectPath: string
  ): Promise<FrameworkDetection[]>;
}
Field explanations
name

The plugin name.

Examples:

name: "typescript"
name: "laravel"
name: "python"
name: "go"

This name appears in CLI output:

Detected plugins: typescript
Detected plugins: laravel
extensions

The file extensions supported by the plugin.

Examples:

extensions: [".ts", ".tsx"]
extensions: [".php"]
extensions: [".py"]
extensions: [".go"]

The scanner uses these extensions to decide which files to read.

The core should not hardcode extensions like .ts, .php, or .py.

Plugins declare them.

detect(projectPath)

This method decides whether the plugin can analyze a project.

Examples:

TypeScript plugin:

detect if package.json or tsconfig.json exists

Laravel plugin:

detect if composer.json contains laravel/framework
detect if artisan exists
detect if app/Http/Controllers exists

Python plugin:

detect if pyproject.toml, requirements.txt, setup.py, or manage.py exists

The method returns true if the plugin should be active for that project.

Otherwise, it returns false.

extractImports(filePath, projectPath)

This is the most important method.

It reads a source file and returns dependency edges.

Example TypeScript input file:

import { auth } from "@/server/auth";

Example returned edge:

{
  from: "/project/client/session.ts",
  to: "/project/server/auth.ts"
}

For external dependencies:

import { PrismaClient } from "@prisma/client";

The plugin should return:

{
  from: "/project/components/UserCard.tsx",
  to: "[external] @prisma/client"
}

Revos uses [external] to distinguish package dependencies from internal file dependencies.

detectFrameworks(projectPath)

This method is optional.

It detects frameworks or ecosystems used in the project.

Example result:

[
  {
    name: "nextjs",
    confidence: "high",
    reason: "Found next dependency in package.json"
  },
  {
    name: "react",
    confidence: "high",
    reason: "Found react dependency in package.json"
  }
]

This is used by:

revos init . --auto

to choose a preset automatically.

Examples:

nextjs detected -> nextjs preset
nestjs detected -> nestjs preset
laravel detected -> laravel preset
otherwise -> default preset
ImportEdge

All plugins must convert language-specific imports into ImportEdge.

export interface ImportEdge {
  from: string;
  to: string;
}
Internal dependency
{
  from: "/project/app/users/page.tsx",
  to: "/project/repositories/user.repository.ts"
}
External dependency
{
  from: "/project/components/UserCard.tsx",
  to: "[external] @prisma/client"
}
PHP / Laravel dependency

PHP source:

use App\Services\UserService;

Returned edge:

{
  from: "/project/app/Http/Controllers/UserController.php",
  to: "/project/app/Services/UserService.php"
}
Python dependency

Python source:

from app.services.user_service import UserService

Possible returned edge:

{
  from: "/project/app/api/users.py",
  to: "/project/app/services/user_service.py"
}
Internal vs external dependencies

Plugins must decide whether a dependency points to:

another source file inside the project
an external package or library

Internal dependencies should resolve to a file path:

/project/server/auth.ts
/project/app/Services/UserService.php
/project/app/services/user_service.py

External dependencies should use:

[external] package-name

Examples:

[external] express
[external] @prisma/client
[external] flask
[external] django
[external] Illuminate\Support\Facades\DB

This allows rules like:

{
  "from": "/domain/",
  "to": "[external] express",
  "severity": "high"
}

or:

{
  "from": "/components/",
  "to": "[external] @prisma/client",
  "severity": "high"
}
How the core uses plugins

The scan flow is:

CLI
  -> resolve scan target
  -> runScan()
  -> collect supported extensions from plugins
  -> scan project files
  -> detect active plugins
  -> detect frameworks
  -> call plugin.extractImports(file, projectPath)
  -> build dependency graph
  -> analyze architecture
  -> report issues

Important file:

packages/core/src/scan/runScan.ts

The core does not parse language syntax directly.

It only calls:

plugin.extractImports(file.path, scanResult.projectPath)
Adding a new plugin

To add a new language plugin, create a new package:

packages/plugin-python/
packages/plugin-go/
packages/plugin-rust/
packages/plugin-csharp/

Recommended structure:

packages/plugin-laravel/
  package.json
  src/
    index.ts
    laravelPlugin.ts
    extractImports.ts
    detectFrameworks.ts
    resolver/
      resolveImportPath.ts
    __tests__/

Minimum required files:

src/index.ts
src/<language>Plugin.ts
src/extractImports.ts

Optional but recommended:

src/detectFrameworks.ts
src/resolver/resolveImportPath.ts
src/__tests__/
Example plugin skeleton
import { LanguagePlugin } from "../../core/src/plugins/LanguagePlugin.js";
import { extractImports } from "./extractImports.js";
import { detectFrameworks } from "./detectFrameworks.js";

export const examplePlugin: LanguagePlugin = {
  name: "example",

  extensions: [".example"],

  async detect(projectPath: string): Promise<boolean> {
    // Detect config files, framework files, or language-specific project markers.
    return true;
  },

  async extractImports(filePath: string, projectPath: string) {
    return extractImports(filePath, projectPath);
  },

  async detectFrameworks(projectPath: string) {
    return detectFrameworks(projectPath);
  }
};
Adding the plugin to the CLI

After creating a plugin, register it in:

apps/cli/src/index.ts

Example:

import { typescriptPlugin } from "../../../packages/plugin-typescript/src/typescriptPlugin.js";
import { laravelPlugin } from "../../../packages/plugin-laravel/src/laravelPlugin.js";

const availablePlugins = [
  typescriptPlugin,
  laravelPlugin
];

Once registered, the rest of Revos should continue to work:

revos scan .
revos scan https://github.com/user/repo
revos scan . --report all
revos scan . --fail-on high
Adding a framework preset

If the new plugin supports a framework, add a preset.

Example:

packages/core/src/rules/presets/laravelPreset.ts

Then update:

packages/core/src/rules/presets/presetTypes.ts
packages/core/src/rules/presets/getPresetConfig.ts
packages/core/src/rules/presets/suggestPreset.ts
apps/cli/src/index.ts

Example Laravel preset rules:

controller should not access model directly
controller should not use DB facade directly
controller should not import repository directly
model should not depend on controller
job should not depend on controller

Example Laravel Clean Architecture preset rules:

domain should not depend on Laravel framework
domain should not depend on Eloquent
application layer should not import controller
infrastructure layer should not import controller
controller should avoid importing domain entities directly
Testing a plugin

Every plugin should have tests.

Recommended test types:

1. Detection tests

Verify that the plugin activates only when expected.

Example:

composer.json with laravel/framework -> laravel plugin detected
plain PHP project -> plugin not detected by laravel plugin
no composer.json -> plugin not detected
2. Import extraction tests

Verify that language imports are converted to ImportEdge.

Example PHP:

use App\Services\UserService;

Expected:

{
  from: "/project/app/Http/Controllers/UserController.php",
  to: "/project/app/Services/UserService.php"
}
3. External dependency tests

Example PHP:

use Illuminate\Support\Facades\DB;

Expected:

{
  from: "/project/app/Http/Controllers/UserController.php",
  to: "[external] Illuminate\\Support\\Facades\\DB"
}
4. Resolver tests

Verify internal dependency resolution.

Example Laravel PSR-4 mapping:

{
  "autoload": {
    "psr-4": {
      "Domain\\": "src/Domain/"
    }
  }
}

Input:

use Domain\Users\Application\CreateUser;

Expected:

{
  from: "/project/app/Http/Controllers/UserController.php",
  to: "/project/src/Domain/Users/Application/CreateUser.php"
}
5. Preset tests

Verify that framework detection suggests the correct preset.

Example:

laravel/framework detected -> laravel preset
6. End-to-end CLI tests

Create a temporary fake project, run:

revos init . --auto --force
revos scan . --report all

and verify:

Detected plugins: laravel
Detected frameworks: laravel
Issues found: N
Important plugin rules

When adding a new plugin:

Do not put language-specific parsing logic in packages/core.
Keep all syntax parsing inside the plugin package.
Always return ImportEdge[].
Resolve internal dependencies to real file paths when possible.
Mark unresolved package dependencies as [external] package-name.
Add tests before expanding rules.
Avoid aggressive rules that create many false positives.
Prefer a few useful high-confidence rules over many noisy rules.
Recommended language rollout

Do not add ten languages at once.

A better sequence:

TypeScript / Next.js / NestJS
PHP / Laravel
Python / FastAPI / Django
Go
C#
Rust
Java / Scala
C / C++

Each language should be validated on small fake projects first, then on real public repositories.

MVP quality bar for a new plugin

A new plugin is MVP-ready when it can:

detect the project type
scan source files
extract common imports, usages, or includes
distinguish internal vs external dependencies
support at least one useful preset
generate terminal, Markdown, and JSON reports
pass unit tests
pass at least one end-to-end CLI test
work on at least one real public repository
Laravel plugin notes

Laravel is a strong plugin target because it has recognizable conventions:

app/Http/Controllers
app/Models
app/Services
app/Repositories
app/Jobs
app/Events
app/Listeners
routes
database

Implemented Laravel capabilities:

Laravel project detection
PHP file scanning
PHP use import extraction
aliased import support
grouped import support
Composer PSR-4 namespace resolution
Laravel preset
Laravel Clean Architecture preset
Laravel e2e CLI test

Implemented Laravel rules include:

laravel-controller-no-model
laravel-controller-no-db-facade
laravel-controller-no-repository
laravel-model-no-controller
laravel-job-no-controller
laravel-domain-no-laravel-framework-src
laravel-domain-no-eloquent-src
laravel-application-no-controller-src
laravel-infrastructure-no-controller-src
laravel-controller-no-domain-entity-src

Example violation:

use App\Models\User;

inside:

app/Http/Controllers/UserController.php

can trigger:

Laravel controller imports model directly

Example fix:

Move model access into a service, action, query object, or repository.
Python plugin notes

Python is also a strong candidate, especially for AI startups.

Common targets:

FastAPI
Django
Flask

Possible Python rules:

api-no-db-direct
domain-no-fastapi
domain-no-django
views-no-services-internal
module-no-other-module-internal

Example:

from fastapi import Request

inside:

domain/user.py

could trigger:

Domain depends on FastAPI

Example fix:

Move FastAPI-specific code into API routes or adapters.
Summary

The plugin system exists so Revos can scale to more languages without rewriting the core.

Each plugin translates language-specific dependencies into a shared dependency graph model.

Once dependencies are represented as ImportEdge[], the core can apply the same architecture analysis to every language.
