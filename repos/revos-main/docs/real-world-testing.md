# Real-world testing

Revos has been tested against real public repositories to validate its behavior on large codebases, monorepos, framework-specific projects, and mixed-stack applications.

The goal of this testing phase is not to claim perfect coverage, but to harden the scanner against real-world layouts, reduce noisy reports, improve framework detection, and make the output useful for early alpha users.

---

## Summary

Revos was tested on projects using:

- TypeScript
- React
- Next.js
- NestJS
- Express
- Python
- Django
- FastAPI
- Laravel / PHP
- mixed monorepo layouts

During this phase, several improvements were implemented based on real scan results:

- TypeScript framework detection inside monorepos
- GitHub URL scans with `--subdir`
- filtering of self-dependency cycles
- reduction of overlapping circular dependency reports
- more precise Python framework detection
- detection of Python frameworks from project name
- Django detection for `src/manage.py`
- Laravel framework-noise filtering for common factory and Filament patterns

---

## Tested repositories

| Repository | Stack detected | Files scanned | Dependencies | Issues found | Notes |
|---|---:|---:|---:|---:|---|
| `supabase/supabase` | TypeScript, Next.js, React | 6523 | 34047 | 23 | Large TypeScript monorepo. Report stayed readable. |
| `saleor/saleor` | TypeScript, Python, Django | 4246 | 25340 | 51 | Initially produced 922 circular issues. Cycle reduction brought it down to 51. |
| `makeplane/plane` | TypeScript, React, Express | 4109 | 17644 | 60 | Large full-stack project. Found mostly UI/store/component cycles. |
| `twentyhq/twenty` | TypeScript, React, Express, NestJS, Next.js | 17269 | 86565 | 3 | Very large monorepo. Scanner remained stable and output was concise. |
| `hoppscotch/hoppscotch` | TypeScript, NestJS, Express | 1038 | 5081 | 13 | Found CLI/types, lenses, and OAuth-related cycles. |
| `pretix/pretix` | TypeScript, Python, Django | 1228 | 8322 | 27 | Improved Django detection by supporting `src/manage.py`. |
| `appwrite/appwrite` | TypeScript | 1612 | 117 | 3 | Found SDK-style client/service cycles. |
| `fastapi/fastapi` | Python, FastAPI | 1119 | 3388 | 19 | Improved Python detection to avoid false Flask detection and detect framework project names. |
| `the-momentum/open-wearables --subdir backend` | Python, FastAPI | 530 | 3282 | 11 | Root scan had no supported plugin; `--subdir backend` enabled a useful scan. |
| `calcom/cal.com` | TypeScript, Next.js, React | 5018 | 24091 | 14 | Monorepo framework detection improved from `none` to `nextjs, react`. |
| `formbricks/formbricks` | TypeScript, React | 2264 | 12576 | 6 | Large TypeScript monorepo. |
| `haydenbleasel/next-forge` | TypeScript, Next.js, React | 368 | 1156 | 0 | Monorepo framework detection improved from `none` to `nextjs, react`. |
| `scopsy/nestjs-monorepo-starter` | TypeScript, React, NestJS, Next.js | 134 | 411 | 0 | Monorepo framework detection improved from `none` to multiple frameworks. |
| `ProgrammerNomad/LaraCoreKit` | TypeScript, Laravel | 236 | 401 | 0 | Laravel/Filament noise filtering reduced repeated false-positive style cycles. |
| `bagisto/bagisto` | TypeScript, Laravel | 2690 | 6228 | 19 | Laravel factory noise filtering reduced issue count significantly. |
| `lunarphp/lunar` | Laravel | 1808 | 6611 | 30 | Filtering common Laravel factory and Filament resource/page cycles reduced noise. |
| `Netflix/dispatch` | TypeScript, Python, FastAPI | 740 | 4052 | 3 | Mixed TypeScript/Python scan. |
| `benavlabs/FastAPI-boilerplate` | Python, FastAPI | 67 | 350 | 0 | FastAPI detection and import resolution behaved correctly. |
| `modern-python/fastapi-sqlalchemy-template` | Python, FastAPI | 21 | 86 | 0 | Small FastAPI/SQLAlchemy template. |
| `ArmanShirzad/fastapi-production-template` | Python, FastAPI | 15 | 35 | 0 | Small production-style FastAPI template. |
| `tduyng/nestjs-graphql-prisma` | TypeScript, NestJS | 325 | 1201 | 3 | Generated-code cycle filtering reduced noise from generated GraphQL/Prisma files. |

---

## Improvements discovered through real-world testing

### TypeScript monorepo framework detection

Some repositories were initially detected as TypeScript projects, but their frameworks were missed because dependencies were declared in nested package files instead of the root `package.json`.

Examples:

- `haydenbleasel/next-forge`
- `scopsy/nestjs-monorepo-starter`
- `calcom/cal.com`

Before the fix:

```text
Detected frameworks: none

After the fix:

Detected frameworks: nextjs, react
Detected frameworks: nestjs
Detected frameworks: react, nestjs, nextjs

Revos now checks common monorepo package locations such as:

apps/*/package.json
packages/*/package.json
frontend/package.json
backend/package.json
web/package.json
api/package.json
server/package.json
GitHub scan subdirectories

Some repositories keep the supported project inside a subdirectory.

Example:

revos scan https://github.com/the-momentum/open-wearables

Initially, scanning the root produced:

No supported language plugin detected

After adding --subdir, the backend could be scanned directly:

revos scan https://github.com/the-momentum/open-wearables --subdir backend --report all

Result:

Detected plugins: python
Detected frameworks: fastapi
Files scanned: 530
Dependencies: 3282
Issues found: 11
Self-dependency cycles

Some imports were resolved as a file depending on itself, creating reports such as:

tests/factories.py
tests/factories.py

These are not useful architecture issues, so Revos now ignores circular dependencies with fewer than two unique files.

Overlapping circular dependency reduction

Large Django projects produced many overlapping circular dependency variants.

Example:

saleor/saleor
Issues found before reduction: 922
Issues found after reduction: 51

The scanner now reduces overlapping cycles by preferring smaller, more actionable cycles instead of reporting many expanded variants of the same dependency cluster.

This made large reports much more readable while preserving meaningful circular dependency findings.

Python framework detection precision

The Python framework detector was improved to avoid detecting framework names from comments, descriptions, optional dependencies, or unrelated text.

Example problem:

fastapi/fastapi
Detected frameworks: fastapi, flask

After improving dependency parsing and adding project-name detection:

Detected frameworks: fastapi

Python detection now supports:

pyproject.toml project dependencies
Poetry dependencies
requirements.txt
setup.py install_requires
framework package names from [project] name
manage.py
src/manage.py
Django src/manage.py detection

Some Django projects use a src/ layout.

Example:

pretix/pretix

Before the fix:

Detected frameworks: none

After detecting src/manage.py:

Detected frameworks: django
Laravel noise reduction

Real Laravel projects showed repeated circular dependencies caused by common framework patterns:

model factories
database factories
Filament resource/page relationships

Examples:

bagisto/bagisto
lunarphp/lunar
ProgrammerNomad/LaraCoreKit

Revos now filters common Laravel framework-noise cycles while keeping non-framework cycles.

Example result:

ProgrammerNomad/LaraCoreKit
Before filtering: 16 issues
After filtering: 0 issues
Current interpretation

Revos is currently an early alpha architecture governance tool.

It is useful for:

detecting circular dependencies
catching common architecture rule violations
scanning TypeScript, Laravel/PHP, and Python projects
scanning public GitHub repositories
scanning monorepo subdirectories
producing CI-friendly reports
giving readable explanations and suggested fixes

It should not yet be positioned as:

a complete replacement for mature static analyzers
a production-ready enterprise governance platform
a tool that perfectly understands every framework convention
a tool that guarantees zero false positives

The current positioning is:

AI-era architecture guardrail:
fast scans, framework presets, readable reports, multi-stack support, CI-friendly output.
Known limitations

Current known limitations from real-world testing:

TypeScript framework detection works for common monorepo layouts, but not every possible workspace structure.
Vue-specific framework detection is not implemented yet.
Some generated SDK files may still produce cycles.
Python __init__.py package-export cycles can still appear, especially in large Django/FastAPI codebases.
Laravel and Django conventions may need more framework-aware filtering over time.
The scanner detects dependency structure, but does not understand runtime semantics.
Public GitHub scanning currently supports public HTTPS repositories.
Recommended next hardening steps

Suggested next improvements:

Add report grouping by issue category and repeated file/module patterns.
Add a configurable maximum number of issues per type in reports.
Add first-class Vue/Nuxt detection.
Improve generated-code detection for TypeScript SDKs.
Add more Python/Django-specific architectural rules.
Add more Laravel package/module architecture rules.
Add a docs/real-world-testing.md link from README.md.
Add a short "Tested on real repositories" section to the main README.
Continue testing on selected repositories, but stop broad random scanning once reports stay stable.
Suggested README snippet
## Tested on real repositories

Revos has been tested against large public repositories including Supabase, Saleor, Plane, Twenty, Hoppscotch, Pretix, FastAPI, Appwrite, Cal.com, Bagisto, Lunar, and others.

These real-world scans helped improve monorepo framework detection, GitHub subdirectory scanning, Python/Django detection, Laravel noise filtering, and circular dependency report reduction.

See [`docs/real-world-testing.md`](docs/real-world-testing.md) for details.
