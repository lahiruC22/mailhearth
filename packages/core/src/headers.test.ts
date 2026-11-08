import { describe, expect, it } from "vitest";
import { looksLikeBulk, parseListUnsubscribe } from "./headers.js";

describe("parseListUnsubscribe", () => {
  it("returns empty targets for a missing header", () => {
    expect(parseListUnsubscribe(undefined)).toEqual({ mailto: [], http: [] });
  });

  it("splits mailto and https targets", () => {
    const result = parseListUnsubscribe(
      "<mailto:unsub@example.com?subject=unsubscribe>, <https://example.com/u/123>",
    );
    expect(result.mailto).toEqual(["mailto:unsub@example.com?subject=unsubscribe"]);
    expect(result.http).toEqual(["https://example.com/u/123"]);
  });

  it("ignores unsupported schemes", () => {
    expect(parseListUnsubscribe("<ftp://example.com/x>")).toEqual({ mailto: [], http: [] });
  });
});

describe("looksLikeBulk", () => {
  it("flags mail with List-Unsubscribe", () => {
    expect(looksLikeBulk({ "list-unsubscribe": "<https://example.com/u>" })).toBe(true);
  });

  it("flags Precedence: bulk", () => {
    expect(looksLikeBulk({ precedence: "Bulk" })).toBe(true);
  });

  it("does not flag ordinary mail", () => {
    expect(looksLikeBulk({ subject: "lunch?" })).toBe(false);
  });

  it("treats Auto-Submitted: no as not automated", () => {
    expect(looksLikeBulk({ "auto-submitted": "no" })).toBe(false);
  });
});
