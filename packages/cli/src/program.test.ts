import { describe, expect, it } from "vitest";
import { buildProgram } from "./program";

describe("cli program", () => {
  it("is named hearth", () => {
    expect(buildProgram().name()).toBe("hearth");
  });

  it("registers the scan and categories commands", () => {
    const names = buildProgram().commands.map((c) => c.name());
    expect(names).toContain("scan");
    expect(names).toContain("categories");
  });
});
