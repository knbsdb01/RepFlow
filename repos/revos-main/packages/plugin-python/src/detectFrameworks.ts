import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface FrameworkDetection {
  name: string;
  confidence: "low" | "medium" | "high";
  reason: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function normalizeDependencyName(value: string): string {
  return value
    .trim()
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .split(/[<>=~!;\[]/)[0]
    .trim()
    .toLowerCase();
}

function parseRequirementsDependencies(content: string): Set<string> {
  const dependencies = new Set<string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("-r ") ||
      line.startsWith("--")
    ) {
      continue;
    }

    const dependency = normalizeDependencyName(line);

    if (dependency) {
      dependencies.add(dependency);
    }
  }

  return dependencies;
}

function parsePyprojectDependencies(content: string): Set<string> {
  const dependencies = new Set<string>();

  const dependencyArrayMatches = content.matchAll(
    /^\s*dependencies\s*=\s*\[([\s\S]*?)\]/gm
  );

  for (const match of dependencyArrayMatches) {
    const dependencyBlock = match[1] ?? "";

    for (const dependencyMatch of dependencyBlock.matchAll(/["']([^"']+)["']/g)) {
      const dependency = normalizeDependencyName(dependencyMatch[1] ?? "");

      if (dependency) {
        dependencies.add(dependency);
      }
    }
  }

  const poetryDependencyBlock = content.match(
    /^\s*\[tool\.poetry\.dependencies\]\s*([\s\S]*?)(?=^\s*\[|\s*$)/m
  );

  if (poetryDependencyBlock) {
    const block = poetryDependencyBlock[1] ?? "";

    for (const rawLine of block.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#") || line.startsWith("python")) {
        continue;
      }

      const dependencyName = line.split("=")[0]?.trim().toLowerCase();

      if (dependencyName) {
        dependencies.add(dependencyName);
      }
    }
  }

  return dependencies;
}

function parseSetupDependencies(content: string): Set<string> {
  const dependencies = new Set<string>();

  const installRequiresMatch = content.match(
    /install_requires\s*=\s*\[([\s\S]*?)\]/m
  );

  if (!installRequiresMatch) {
    return dependencies;
  }

  const dependencyBlock = installRequiresMatch[1] ?? "";

  for (const dependencyMatch of dependencyBlock.matchAll(/["']([^"']+)["']/g)) {
    const dependency = normalizeDependencyName(dependencyMatch[1] ?? "");

    if (dependency) {
      dependencies.add(dependency);
    }
  }

  return dependencies;
}

function hasDependency(
  dependencies: Set<string>,
  dependencyName: string
): boolean {
  return dependencies.has(dependencyName.toLowerCase());
}

function parsePyprojectProjectName(content: string): string | null {
  const projectSectionMatch = content.match(
    /^\s*\[project\]\s*([\s\S]*?)(?=^\s*\[|\s*$)/m
  );

  if (projectSectionMatch) {
    const block = projectSectionMatch[1] ?? "";
    const nameMatch = block.match(/^\s*name\s*=\s*["']([^"']+)["']/m);

    if (nameMatch) {
      return nameMatch[1].toLowerCase();
    }
  }

  const poetrySectionMatch = content.match(
    /^\s*\[tool\.poetry\]\s*([\s\S]*?)(?=^\s*\[|\s*$)/m
  );

  if (poetrySectionMatch) {
    const block = poetrySectionMatch[1] ?? "";
    const nameMatch = block.match(/^\s*name\s*=\s*["']([^"']+)["']/m);

    if (nameMatch) {
      return nameMatch[1].toLowerCase();
    }
  }

  return null;
}

function hasProjectName(
  projectName: string | null,
  expectedName: string
): boolean {
  return projectName === expectedName.toLowerCase();
}


export async function detectPythonFrameworks(
  projectPath: string
): Promise<FrameworkDetection[]> {
  const pyprojectPath = path.join(projectPath, "pyproject.toml");
  const requirementsPath = path.join(projectPath, "requirements.txt");
  const setupPath = path.join(projectPath, "setup.py");
  const managePath = path.join(projectPath, "manage.py");
  const srcManagePath = path.join(projectPath, "src", "manage.py");

  const pyproject = await readFileIfExists(pyprojectPath);
  const requirements = await readFileIfExists(requirementsPath);
  const setup = await readFileIfExists(setupPath);

  const dependencies = new Set<string>([
    ...parsePyprojectDependencies(pyproject),
    ...parseRequirementsDependencies(requirements),
    ...parseSetupDependencies(setup)
  ]);

  const projectName = parsePyprojectProjectName(pyproject);

  const detections: FrameworkDetection[] = [];

  if (
    hasDependency(dependencies, "fastapi") ||
    hasProjectName(projectName, "fastapi")
  ) {
    detections.push({
      name: "fastapi",
      confidence: "high",
      reason: hasProjectName(projectName, "fastapi")
        ? "Python project name is fastapi"
        : "Python project dependencies include fastapi"
    });
  }

  if (
    hasDependency(dependencies, "django") ||
    hasProjectName(projectName, "django") ||
    (await fileExists(managePath)) ||
    (await fileExists(srcManagePath))
  ) {
    detections.push({
      name: "django",
      confidence: "high",
      reason: (await fileExists(managePath))
        ? "Project contains manage.py"
        : (await fileExists(srcManagePath))
          ? "Project contains src/manage.py"
          : hasProjectName(projectName, "django")
            ? "Python project name is django"
            : "Python project dependencies include django"
    });
  }

  if (
    hasDependency(dependencies, "flask") ||
    hasProjectName(projectName, "flask")
  ) {
    detections.push({
      name: "flask",
      confidence: "high",
      reason: hasProjectName(projectName, "flask")
        ? "Python project name is flask"
        : "Python project dependencies include flask"
    });
  }

  return detections;
}

export async function isPythonProject(projectPath: string): Promise<boolean> {
  const markers = [
    "pyproject.toml",
    "requirements.txt",
    "setup.py",
    "manage.py"
  ];

  for (const marker of markers) {
    if (await fileExists(path.join(projectPath, marker))) {
      return true;
    }
  }

  return false;
}
