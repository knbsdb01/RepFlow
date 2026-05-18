mkdir -p docs

# Python / FastAPI support

Revos supports Python projects through the Python plugin.

The Python plugin scans `.py` files, extracts Python imports, resolves internal modules, detects FastAPI projects, builds a dependency graph, and applies Python/FastAPI architecture rules.

---

## Quick start

Inside a Python or FastAPI project:

```bash
revos init . --auto --force
revos scan .

If FastAPI is detected, Revos should automatically select the fastapi preset:

Revos initialized
Preset: fastapi
Auto: true
Force: true
Detected frameworks: fastapi
Config file: .revos/rules.json

Then scan the project:

Scanning project: .
Detected plugins: python
Detected frameworks: fastapi
Found 3 source files

Dependency Graph
Nodes: 5
Edges: 4
Supported project markers

The Python plugin detects Python projects using common project files such as:

pyproject.toml
requirements.txt
setup.py
manage.py

If one of these files exists, the Python plugin can be activated.

FastAPI detection

Revos detects FastAPI when it finds fastapi in Python dependency files such as:

pyproject.toml
requirements.txt
setup.py

Example pyproject.toml:

[project]
dependencies = [
  "fastapi",
  "sqlalchemy",
  "uvicorn"
]

Example requirements.txt:

fastapi==0.115.0
sqlalchemy
uvicorn

When FastAPI is detected, revos init . --auto --force selects:

fastapi
Supported Python imports

The Python plugin currently supports common Python import forms.

Regular imports
import fastapi
import sqlalchemy
import app.services.user_service
Multiple imports
import os, sys, json
Aliased imports
import sqlalchemy as sa
From imports
from fastapi import FastAPI
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
Relative imports
from .schemas import UserResponse
from ..domain.user import User
from ..services.user_service import UserService

Revos resolves relative imports based on the file location.

Example:

app/api/users.py

with:

from ..repositories.user_repository import UserRepository

resolves to:

app/repositories/user_repository.py
Internal dependency resolution

Revos resolves Python modules to internal files when possible.

Example import:

from app.services.user_service import UserService

Can resolve to:

app/services/user_service.py

Python package imports can resolve to:

app/services/__init__.py
src layout support

Revos supports common Python src/ layouts.

Example project:

src/
  app/
    api/
    domain/
    repositories/
    services/

An import like:

from app.repositories.user_repository import UserRepository

can resolve to:

src/app/repositories/user_repository.py

Revos checks both:

/project/app/...
/project/src/app/...

and prefers root-level modules when both exist.

External dependencies

If an import cannot be resolved to an internal project file, Revos marks it as external.

Examples:

from fastapi import FastAPI
from sqlalchemy.orm import Session

Become:

[external] fastapi
[external] sqlalchemy

This allows architecture rules such as:

{
  "from": "/domain/",
  "to": "[external] fastapi",
  "severity": "high"
}
FastAPI preset

Use the FastAPI preset manually with:

revos init . --preset fastapi --force

Or automatically with:

revos init . --auto --force

when FastAPI is detected.

The fastapi preset includes rules such as:

domain code should not depend on FastAPI
domain code should not depend on SQLAlchemy
API layer should not import repositories directly
route layer should not import repositories directly
model layer should not import routes
service layer should not import routes
Example: domain depends on FastAPI

Problematic code:

from fastapi import Depends

class User:
    pass

Inside:

app/domain/user.py

Revos issue:

[HIGH] Domain depends on FastAPI
Type: forbidden-import
Rule: fastapi-domain-no-fastapi

Files:
- app/domain/user.py
- [external] fastapi

Problem:
Domain code is importing FastAPI. Business logic should not depend on the web framework.

Suggested fix:
Move FastAPI-specific code into API routes, controllers, or adapters. Keep domain logic framework-independent.
Example: domain depends on SQLAlchemy

Problematic code:

from sqlalchemy.orm import Session

class User:
    pass

Inside:

app/domain/user.py

Revos issue:

[HIGH] Domain depends on SQLAlchemy
Type: forbidden-import
Rule: fastapi-domain-no-sqlalchemy

Files:
- app/domain/user.py
- [external] sqlalchemy

Problem:
Domain code is importing SQLAlchemy. This couples business rules to persistence details.

Suggested fix:
Move SQLAlchemy usage into repositories, infrastructure, or adapters. Keep domain entities and services persistence-independent.
Example: API imports repository directly

Problematic code:

from fastapi import APIRouter
from app.repositories.user_repository import UserRepository

router = APIRouter()

Inside:

app/api/users.py

Revos issue:

[MEDIUM] API layer imports repository directly
Type: forbidden-import
Rule: fastapi-api-no-repository

Files:
- app/api/users.py
- app/repositories/user_repository.py

Problem:
A FastAPI route is importing a repository directly. This can mix HTTP concerns with persistence access.

Suggested fix:
Move repository usage into an application service or use case, then call that from the route.
Example with relative imports

Problematic code:

from fastapi import APIRouter
from ..repositories.user_repository import UserRepository

router = APIRouter()

Inside:

app/api/users.py

Revos resolves:

from ..repositories.user_repository import UserRepository

to:

app/repositories/user_repository.py

and can still report:

API layer imports repository directly
What Revos checks for Python / FastAPI

With the Python plugin and FastAPI preset, Revos can currently detect:

circular dependencies between Python files
domain code importing FastAPI
domain code importing SQLAlchemy
API layer importing repositories directly
routes importing repositories directly
models importing routes
services importing routes
internal imports resolved from normal imports
internal imports resolved from from-imports
internal imports resolved from relative imports
internal imports resolved in root layout
internal imports resolved in src layout
What is not supported yet

The Python plugin is still an MVP.

Not supported yet:

Python AST parsing
dynamic imports
dependency injection analysis
function-level dependency analysis
type-checker integration
pyright / mypy integration
full namespace package behavior
advanced monorepo source root configuration
Django-specific preset
Flask-specific preset
automatic fixes
Recommended usage

For FastAPI projects:

revos init . --auto --force
revos scan .

or:

revos init . --preset fastapi --force
revos scan .

For CI:

revos scan . --report all --fail-on high
Example GitHub Actions usage
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
          if [ ! -f ".revos/rules.json" ]; then
            revos init . --auto
          fi

      - name: Run Revos
        run: revos scan . --report all --fail-on high
Minimal FastAPI example

Project structure:

app/
  api/
    users.py
  domain/
    user.py
  repositories/
    user_repository.py

pyproject.toml

pyproject.toml:

[project]
dependencies = [
  "fastapi",
  "sqlalchemy",
  "uvicorn"
]

app/api/users.py:

from fastapi import APIRouter
from app.repositories.user_repository import UserRepository

router = APIRouter()

app/domain/user.py:

from fastapi import Depends
from sqlalchemy.orm import Session

class User:
    pass

app/repositories/user_repository.py:

class UserRepository:
    pass

Run:

revos init . --auto --force
revos scan .

Expected result:

Detected plugins: python
Detected frameworks: fastapi
Issues found: 3
High: 2
Medium: 1
