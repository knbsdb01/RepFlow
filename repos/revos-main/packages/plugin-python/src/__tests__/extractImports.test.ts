import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractPythonImportModules,
  extractPythonImportModulesWithContext
} from "../extractImports.js";

describe("extractPythonImportModules", () => {
  it("extracts regular import statements", () => {
    const source = `
import os
import sys, json
import fastapi
import sqlalchemy as sa
import app.services.user_service
`;

    expect(extractPythonImportModules(source)).toEqual([
      "os",
      "sys",
      "json",
      "fastapi",
      "sqlalchemy",
      "app.services.user_service"
    ]);
  });

  it("extracts from-import statements", () => {
    const source = `
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
`;

    expect(extractPythonImportModules(source)).toEqual([
      "fastapi",
      "sqlalchemy.orm",
      "app.services.user_service",
      "app.repositories.user_repository"
    ]);
  });

  it("ignores relative imports in context-free mode", () => {
    const source = `
from .services import UserService
from ..domain.user import User
`;

    expect(extractPythonImportModules(source)).toEqual([]);
  });

  it("ignores commented imports", () => {
    const source = `
# import fastapi
# from sqlalchemy.orm import Session

import app.main
`;

    expect(extractPythonImportModules(source)).toEqual([
      "app.main"
    ]);
  });
});

describe("extractPythonImportModulesWithContext", () => {
  it("resolves single-dot relative imports from the current package", () => {
    const projectPath = path.resolve("/project");
    const filePath = path.join(projectPath, "app", "api", "users.py");

    const source = `
from .schemas import UserResponse
from .dependencies.auth import current_user
`;

    expect(
      extractPythonImportModulesWithContext(source, filePath, projectPath)
    ).toEqual([
      "app.api.schemas",
      "app.api.dependencies.auth"
    ]);
  });

  it("resolves parent relative imports", () => {
    const projectPath = path.resolve("/project");
    const filePath = path.join(projectPath, "app", "api", "users.py");

    const source = `
from ..domain.user import User
from ..services.user_service import UserService
`;

    expect(
      extractPythonImportModulesWithContext(source, filePath, projectPath)
    ).toEqual([
      "app.domain.user",
      "app.services.user_service"
    ]);
  });

  it("resolves relative imports from nested packages", () => {
    const projectPath = path.resolve("/project");
    const filePath = path.join(
      projectPath,
      "app",
      "api",
      "v1",
      "users.py"
    );

    const source = `
from ...domain.user import User
from ..schemas import UserResponse
`;

    expect(
      extractPythonImportModulesWithContext(source, filePath, projectPath)
    ).toEqual([
      "app.domain.user",
      "app.api.schemas"
    ]);
  });

  it("keeps absolute imports and resolves relative imports together", () => {
    const projectPath = path.resolve("/project");
    const filePath = path.join(projectPath, "app", "api", "users.py");

    const source = `
import fastapi
from sqlalchemy.orm import Session
from ..domain.user import User
`;

    expect(
      extractPythonImportModulesWithContext(source, filePath, projectPath)
    ).toEqual([
      "fastapi",
      "sqlalchemy.orm",
      "app.domain.user"
    ]);
  });
});
