function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern: string): RegExp {
  const normalizedPattern = normalizePath(pattern);

  let regex = "";

  for (let i = 0; i < normalizedPattern.length; i += 1) {
    const char = normalizedPattern[i];
    const nextChar = normalizedPattern[i + 1];

    if (char === "*" && nextChar === "*") {
      regex += ".*";
      i += 1;
      continue;
    }

    if (char === "*") {
      regex += "[^/]*";
      continue;
    }

    regex += escapeRegExp(char);
  }

  return new RegExp(regex);
}

function looksLikeGlob(pattern: string): boolean {
  return pattern.includes("*");
}

export function matchRulePattern(value: string, pattern: string): boolean {
  const normalizedValue = normalizePath(value);
  const normalizedPattern = normalizePath(pattern);

  if (looksLikeGlob(normalizedPattern)) {
    return globToRegExp(normalizedPattern).test(normalizedValue);
  }

  return normalizedValue.includes(normalizedPattern);
}
