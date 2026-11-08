import { describe, expect, it } from "vitest";
import { asMessageId, CATEGORIES } from "./types.js";

describe("types", () => {
  it("keeps the starter taxonomy unique", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it("includes a junk category for the one-click cleanup flow", () => {
    expect(CATEGORIES).toContain("junk");
  });

  it("brands message ids without changing the value", () => {
    expect(asMessageId("abc")).toBe("abc");
  });
});
