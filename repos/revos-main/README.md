# Revos

[![npm version](https://img.shields.io/npm/v/@revoscli/cli.svg)](https://www.npmjs.com/package/@revoscli/cli)
[![CI](https://github.com/mattykry/revos/actions/workflows/test.yml/badge.svg)](https://github.com/mattykry/revos/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Architecture governance for AI-assisted software development.

Revos scans a codebase, builds a dependency graph, detects architecture violations, explains what went wrong, and suggests possible fixes.

It is designed for teams using AI coding tools, where code can compile and tests can pass while the architecture slowly drifts.

## Install

Run Revos without installing it globally:

```bash
npx @revoscli/cli scan https://github.com/fastapi/fastapi --report all
```

Or install it globally:

```bash
npm install -g @revoscli/cli
revos --help
```

The npm package is:

```text
@revoscli/cli
```

The installed command is:

```text
revos
```

## Quick start

Scan a local project:

```bash
revos scan .
```

Scan a public GitHub repository:

```bash
revos scan https://github.com/user/repo --report all
```

Scan a subdirectory inside a repository:

```bash
revos scan https://github.com/user/repo --subdir backend --report all
```

Initialize Revos in a project:

```bash
revos init . --auto --force
```

Or choose a preset manually:

```bash
revos init . --preset default --force
revos init . --preset clean-architecture --force
revos init . --preset nextjs --force
revos init . --preset nestjs --force
revos init . --preset laravel --force
revos init . --preset laravel-clean-architecture --force
revos init . --preset fastapi --force
```

## Why Revos exists

Modern teams can generate code very quickly.

The problem is that working code is not always well-structured code.

A project can compile, tests can pass, and the product can still slowly develop architecture problems such as:

- UI components importing database clients.
- Domain code depending on frameworks.
- Controllers accessing repositories or databases directly.
- Client code importing server-only modules.
- Circular dependencies.
- Modules importing internal details from other modules.
- Application or domain layers depending on infrastructure.

Revos helps catch these problems early.

It is not a replacement for mature static analyzers. It is an architecture guardrail for the AI era: fast scans, framework presets, readable reports, CI-friendly output, and practical suggestions.

## Example output

```text
Scanning project: https://github.com/fastapi/fastapi
Detected plugins: python
Detected frameworks: fastapi
Found 1119 source files

Dependency Graph
Nodes: 1021
Edges: 3388

Architecture Issues

[HIGH] Circular dependency detected
Type: circular-dependency

Files:
- fastapi/utils.py
- fastapi/routing.py
- fastapi/utils.py

Problem:
Two or more files depend on each other. This makes the architecture harder to maintain and can create runtime bugs.

Suggested fix:
Extract the shared logic into a separate file or module, then make both files depend on that shared abstraction instead of depending on each other.

Summary
Files scanned: 1119
Detected plugins: python
Dependencies: 3388
Issues found: 6
High: 6
Medium: 0
Low: 0
```

## What Revos checks

Revos currently supports:

- Project scanning from local paths.
- Public GitHub repository scanning.
- Subdirectory scanning with `--subdir`.
- Dependency graph generation.
- Circular dependency detection.
- Forbidden import rules.
- Framework-aware presets.
- Rule-level ignores.
- Targeted issue ignores.
- Issue deduplication.
- Markdown reports.
- JSON reports.
- SARIF reports for GitHub Code Scanning.
- Compact terminal output with `--max-issues`.
- CI failure with `--fail-on`.

## Supported stacks

Currently supported:

- TypeScript
- TSX
- React
- Next.js
- NestJS
- Express detection
- Laravel / PHP
- Laravel Clean Architecture
- Python
- FastAPI
- Django detection
- Flask detection

## Reports

Generate a Markdown report:

```bash
revos scan . --report markdown
```

Generate a JSON report:

```bash
revos scan . --report json
```

Generate a SARIF report:

```bash
revos scan . --report sarif
```

Generate all report formats:

```bash
revos scan . --report all
```

Local project reports are written to:

```text
.revos/report.md
.revos/report.json
.revos/report.sarif
```

For GitHub repository scans, reports are copied to the current working directory by default:

```text
revos-report.md
revos-report.json
revos-report.sarif
```

Choose a custom output directory:

```bash
revos scan https://github.com/user/repo --report all --output ./reports
```

Limit terminal output while keeping full reports:

```bash
revos scan . --report all --max-issues 10
```

Show all issues in the terminal:

```bash
revos scan . --max-issues 0
```

## CI usage

Fail CI when high severity issues are found:

```bash
revos scan . --report all --fail-on high
```

Keep terminal output compact in CI while still generating complete reports:

```bash
revos scan . --report all --fail-on high --max-issues 20
```

Example GitHub Actions workflow:

```yaml
name: Revos

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  revos:
    name: Architecture checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Revos
        run: npm install -g @revoscli/cli

      - name: Initialize Revos config if missing
        run: |
          if [ ! -f .revos/rules.json ]; then
            revos init . --auto
          fi

      - name: Run Revos
        run: revos scan . --report all --fail-on high --max-issues 20

      - name: Upload Revos reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: revos-reports
          path: |
            .revos/report.md
            .revos/report.json
            .revos/report.sarif

      - name: Upload Revos SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: .revos/report.sarif
```

A sample workflow is available here:

```text
examples/github-actions/revos.yml
```

## Configuration

Revos uses a project-level configuration file:

```text
.revos/rules.json
```

Example:

```json
{
  "forbiddenImports": [
    {
      "id": "domain-no-fastapi",
      "from": "**/domain/**",
      "to": "[external] fastapi",
      "severity": "high",
      "title": "Domain depends on FastAPI",
      "message": "Domain code should not depend on FastAPI.",
      "suggestedFix": "Move FastAPI-specific code into API routes or adapters."
    }
  ]
}
```

Supported severities:

```text
low
medium
high
```

Read more:

- `docs/configuration.md`
- `docs/presets.md`
- `docs/plugins.md`

## Presets

Available presets:

```text
default
clean-architecture
nextjs
nestjs
laravel
laravel-clean-architecture
fastapi
```

Use a preset:

```bash
revos init . --preset nextjs --force
```

Auto-detect a suitable preset:

```bash
revos init . --auto --force
```

## Language support

### TypeScript / Next.js / NestJS

The TypeScript plugin supports:

- `.ts`
- `.tsx`
- static imports
- side-effect imports
- `export from`
- dynamic imports
- relative imports
- `tsconfig.json` aliases
- framework detection from nested `package.json` files

Detected frameworks include:

- Next.js
- React
- NestJS
- Express

### Laravel / PHP

The Laravel plugin supports:

- `.php`
- `use` imports
- aliased imports
- grouped imports
- fully-qualified class references
- static class references
- short class references resolved through `use`
- Composer PSR-4 mappings
- Laravel fallback mappings
- Laravel detection
- Laravel Clean Architecture detection

Read more:

```text
docs/laravel.md
```

### Python / FastAPI

The Python plugin supports:

- `.py`
- standard imports
- `from` imports
- alias imports
- relative imports
- root layout
- `src/` layout
- package `__init__.py`
- FastAPI detection
- Django detection
- Flask detection
- FastAPI preset

Read more:

```text
docs/python.md
```

## Development

Install dependencies:

```bash
pnpm install
```

Run tests:

```bash
pnpm test
```

Build the CLI:

```bash
pnpm --filter @revoscli/cli build
```

Run the CLI locally:

```bash
pnpm --filter @revoscli/cli dev scan .
```

Run a local scan with reports:

```bash
pnpm --filter @revoscli/cli dev scan . --report all
```

## Monorepo structure

```text
revos/
  apps/
    cli/

  packages/
    core/
    plugin-typescript/
    plugin-laravel/
    plugin-python/

  docs/
  examples/
  .github/
```

## Status

Revos is currently an early alpha / serious technical MVP.

It is useful for:

- detecting common architecture drift;
- keeping framework boundaries clean;
- making CI fail on serious architecture issues;
- helping teams review generated code;
- explaining architecture problems clearly.

Revos should not yet be described as:

- production-ready enterprise software;
- a complete replacement for mature static analyzers;
- a tool that covers every language or framework edge case.

Current positioning:

```text
Early alpha architecture governance CLI for AI-era codebases.
```

## Roadmap

Near-term ideas:

- Baseline mode for failing only on new architecture issues.
- Better monorepo visualization.
- Improved false-positive filtering.
- More framework presets.
- HTML reports.
- More real-world repository benchmarks.

## License

MIT.
