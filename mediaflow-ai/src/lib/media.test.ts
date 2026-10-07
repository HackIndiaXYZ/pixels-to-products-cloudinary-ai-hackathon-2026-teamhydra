import { describe, expect, it } from "vitest";
import {
  computeStats, formatBytes, hasActiveFilters, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES,
  mediaTypeOf, parseFilters, validateFile,
} from "@/lib/media";
import type { MediaAsset } from "@/types/media";

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    publicId: "a",
    filename: "a",
    type: "image",
    format: "jpg",
    width: 1,
    height: 1,
    secureUrl: "https://res.cloudinary.com/demo/image/upload/a.jpg",
    thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/a.jpg",
    tags: [],
    moderation: "pending",
    processing: "processing",
    variantCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("parseFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseFilters({})).toEqual({ search: "", type: "all", moderation: "all" });
  });

  it("accepts valid values and trims the search text", () => {
    expect(parseFilters({ search: "  car ", type: "image", moderation: "review" })).toEqual({
      search: "car",
      type: "image",
      moderation: "review",
    });
  });

  it("falls back to defaults for invalid enum values", () => {
    const f = parseFilters({ type: "banana", moderation: "nope" });
    expect(f.type).toBe("all");
    expect(f.moderation).toBe("all");
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseFilters({ type: ["video", "image"] }).type).toBe("video");
  });

  it("drops search text longer than 100 characters", () => {
    expect(parseFilters({ search: "x".repeat(101) }).search).toBe("");
  });
});

describe("hasActiveFilters", () => {
  it("is false for defaults and true when anything is set", () => {
    expect(hasActiveFilters({ search: "", type: "all", moderation: "all" })).toBe(false);
    expect(hasActiveFilters({ search: "car", type: "all", moderation: "all" })).toBe(true);
    expect(hasActiveFilters({ search: "", type: "video", moderation: "all" })).toBe(true);
    expect(hasActiveFilters({ search: "", type: "all", moderation: "approved" })).toBe(true);
  });
});

describe("mediaTypeOf", () => {
  it("maps MIME types", () => {
    expect(mediaTypeOf("image/png")).toBe("image");
    expect(mediaTypeOf("video/mp4")).toBe("video");
    expect(mediaTypeOf("application/pdf")).toBeNull();
    expect(mediaTypeOf("")).toBeNull();
  });
});

describe("validateFile", () => {
  it("rejects unsupported types", () => {
    expect(validateFile({ type: "application/pdf", size: 100 })).toMatch(/unsupported/i);
  });

  it("rejects empty files", () => {
    expect(validateFile({ type: "image/png", size: 0 })).toBe("File is empty.");
  });

  it("enforces the image and video size limits", () => {
    expect(validateFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toBeNull();
    expect(validateFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toMatch(/exceeds/i);
    expect(validateFile({ type: "video/mp4", size: MAX_IMAGE_BYTES + 1 })).toBeNull();
    expect(validateFile({ type: "video/mp4", size: MAX_VIDEO_BYTES + 1 })).toMatch(/exceeds/i);
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(undefined)).toBe("n/a");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("computeStats", () => {
  it("returns zeros for no assets", () => {
    expect(computeStats([])).toEqual({ total: 0, processed: 0, approved: 0, needsReview: 0, variants: 0 });
  });

  it("counts real asset states only", () => {
    const stats = computeStats([
      asset({ processing: "completed", moderation: "approved", variantCount: 6 }),
      asset({ processing: "completed", moderation: "review", variantCount: 3 }),
      asset(),
    ]);
    expect(stats).toEqual({ total: 3, processed: 2, approved: 1, needsReview: 1, variants: 9 });
  });
});