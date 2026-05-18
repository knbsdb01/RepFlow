# Revos CLI

Command-line interface for Revos.

The CLI handles project initialization, project scanning, report generation, public GitHub repository scanning, and CI-friendly failure thresholds.

## Commands

```bash
revos init <path>
revos scan <path-or-github-url>
Initialize configuration

Automatically choose a preset:

revos init . --auto --force

Choose a preset manually:

revos init . --preset default --force
revos init . --preset clean-architecture --force
revos init . --preset nextjs --force
revos init . --preset nestjs --force
revos init . --preset laravel --force
revos init . --preset laravel-clean-architecture --force
revos init . --preset fastapi --force
Scan a local project
revos scan .

Generate reports:

revos scan . --report markdown
revos scan . --report json
revos scan . --report all

Fail CI when issues are found at a given severity or higher:

revos scan . --fail-on high
revos scan . --fail-on medium
revos scan . --fail-on low

Generate reports and fail on high severity issues:

revos scan . --report all --fail-on high
Scan a public GitHub repository
revos scan https://github.com/user/repo

With reports:

revos scan https://github.com/user/repo --report all

With custom output directory:

revos scan https://github.com/user/repo --report all --output ./reports

GitHub URL scanning currently supports public HTTPS repositories.

Supported presets
default
clean-architecture
nextjs
nestjs
laravel
laravel-clean-architecture
fastapi
Supported ecosystems
TypeScript / TSX
React
Next.js
NestJS
Laravel / PHP
Laravel Clean Architecture
Python
FastAPI
Supported report formats
markdown
json
all
Supported severity levels
low
medium
high
Reports

Local project reports are written to:

.revos/report.md
.revos/report.json

For temporary GitHub scans, reports are copied outside the temporary clone directory.

Default GitHub scan report names:

revos-report.md
revos-report.json
Development

From the monorepo root:

pnpm install
pnpm test
pnpm --filter @revoscli/cli build

Run the CLI locally:

pnpm --filter cli dev scan .

Run with reports:

pnpm --filter cli dev scan . --report all

Initialize a preset locally:

pnpm --filter cli dev init . --preset fastapi --force
CI usage

Recommended CI command for early alpha adoption:

revos scan . --report all --fail-on high

During alpha usage, failing only on high severity issues is usually safer because it gives teams time to tune rules and ignore intentional exceptions.

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

Limit terminal output while keeping full reports:

```bash
revos scan . --report all --max-issues 10
```

Show all issues in the terminal:

```bash
revos scan . --max-issues 0
```
