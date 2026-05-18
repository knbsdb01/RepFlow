import { describe, expect, it } from "vitest";
import { matchRulePattern } from "./matchRulePattern.js";

describe("matchRulePattern", () => {
  it("supports legacy includes matching", () => {
    expect(
      matchRulePattern(
        "/project/app/domain/user.py",
        "/domain/"
      )
    ).toBe(true);

    expect(
      matchRulePattern(
        "/project/app/api/users.py",
        "/domain/"
      )
    ).toBe(false);
  });

  it("supports glob matching with **", () => {
    expect(
      matchRulePattern(
        "/project/app/domain/user.py",
        "**/domain/**"
      )
    ).toBe(true);

    expect(
      matchRulePattern(
        "/project/src/app/domain/user.py",
        "**/domain/**"
      )
    ).toBe(true);

    expect(
      matchRulePattern(
        "/project/src/app/api/users.py",
        "**/domain/**"
      )
    ).toBe(false);
  });

  it("supports glob matching with single *", () => {
    expect(
      matchRulePattern(
        "/project/app/api/users.py",
        "**/api/*.py"
      )
    ).toBe(true);

    expect(
      matchRulePattern(
        "/project/app/api/v1/users.py",
        "**/api/*.py"
      )
    ).toBe(false);
  });

  it("supports external dependency patterns", () => {
    expect(
      matchRulePattern(
        "[external] fastapi",
        "[external] fastapi"
      )
    ).toBe(true);

    expect(
      matchRulePattern(
        "[external] sqlalchemy",
        "[external] fastapi"
      )
    ).toBe(false);
  });
});
