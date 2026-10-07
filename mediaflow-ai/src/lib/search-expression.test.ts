import { describe, expect, it } from "vitest";
import { buildSearchExpression, sanitizeTerms } from "@/lib/search-expression";
import type { DashboardFilters } from "@/types/media";

const base: DashboardFilters = { search: "", type: "all", moderation: "all" };

describe("sanitizeTerms", () => {
  it("lowercases and splits on whitespace", () => {
    expect(sanitizeTerms("Car  ROAD")).toEqual(["car", "road"]);
  });

  it("strips characters that could change the expression syntax", () => {
    const terms = sanitizeTerms('cat" OR tags:secret* (x)');
    expect(terms.length).toBeGreaterThan(0);
    for (const t of terms) expect(t).toMatch(/^[\p{L}\p{N}_-]+$/u);
  });

  it("removes leading hyphens", () => {
    expect(sanitizeTerms("-secret")).toEqual(["secret"]);
  });

  it("keeps unicode letters and limits to five terms", () => {
    expect(sanitizeTerms("café")).toEqual(["café"]);
    expect(sanitizeTerms("a b c d e f g")).toHaveLength(5);
  });
});

describe("buildSearchExpression", () => {
  it("always scopes to the app tag", () => {
    expect(buildSearchExpression(base, "mediaflow")).toBe("tags=mediaflow");
  });

  it("adds type and moderation filters (review maps to pending)", () => {
    const expr = buildSearchExpression({ ...base, type: "video", moderation: "review" }, "mediaflow");
    expect(expr).toContain("resource_type=video");
    expect(expr).toContain("context.moderation=pending");
  });

  it("adds a prefix clause per search term", () => {
    const expr = buildSearchExpression({ ...base, search: "car" }, "mediaflow");
    expect(expr).toContain("(tags:car* OR public_id:car* OR filename:car*)");
  });

  it("cannot be used to widen the query beyond the app tag", () => {
    const expr = buildSearchExpression({ ...base, search: "x) OR tags=private" }, "mediaflow");
    expect(expr.match(/tags=/g)).toHaveLength(1);
    expect(expr).not.toContain("tags=private");
  });
});