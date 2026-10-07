import { describe, expect, it } from "vitest";
import {
  buildTransformation, buildVariant, insertTransformation, PACK_IDS, variantIdsForPacks,
} from "@/lib/transform";

const URL_IMG = "https://res.cloudinary.com/demo/image/upload/v1700000000/red-car_ab12.jpg";

describe("buildTransformation", () => {
  it("uses content-aware cropping with f_auto and q_auto for fixed sizes", () => {
    expect(buildTransformation("website", "image")).toBe("c_fill,g_auto,w_1200,h_675,f_auto,q_auto");
    expect(buildTransformation("square", "image")).toBe("c_fill,g_auto,w_1080,h_1080,f_auto,q_auto");
    expect(buildTransformation("portrait", "image")).toBe("c_fill,g_auto,w_1080,h_1350,f_auto,q_auto");
    expect(buildTransformation("story", "image")).toBe("c_fill,g_auto,w_1080,h_1920,f_auto,q_auto");
  });

  it("limits the web-optimized variant instead of cropping", () => {
    expect(buildTransformation("optimized", "image")).toBe("c_limit,w_1600,f_auto,q_auto");
  });

  it("delivers a video thumbnail as a still frame", () => {
    expect(buildTransformation("thumbnail", "video")).toBe("c_fill,g_auto,w_400,h_400,so_0,q_auto");
  });
});

describe("insertTransformation", () => {
  it("inserts after /upload/, keeps the version and drops the extension", () => {
    expect(insertTransformation(URL_IMG, "c_fill,w_10")).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_10/v1700000000/red-car_ab12",
    );
  });

  it("appends an explicit extension when requested", () => {
    expect(insertTransformation(URL_IMG, "w_10", "jpg")).toMatch(/\/red-car_ab12\.jpg$/);
  });

  it("keeps nested public IDs intact", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/folder/sub/name.png";
    expect(insertTransformation(url, "w_10")).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_10/v1/folder/sub/name",
    );
  });

  it("throws for URLs that are not Cloudinary upload URLs", () => {
    expect(() => insertTransformation("https://example.com/a.jpg", "w_10")).toThrow();
  });
});

describe("buildVariant", () => {
  it("returns label, size and a transformed URL", () => {
    const v = buildVariant(URL_IMG, "image", "website");
    expect(v).toMatchObject({ id: "website", label: "Website 16:9", width: 1200, height: 675 });
    expect(v.url).toContain("c_fill,g_auto,w_1200,h_675,f_auto,q_auto");
  });

  it("uses f_auto and q_auto on every image variant", () => {
    for (const id of variantIdsForPacks(PACK_IDS)) {
      expect(buildVariant(URL_IMG, "image", id).url).toContain("f_auto,q_auto");
    }
  });

  it("delivers video thumbnails as JPG", () => {
    const url = "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4";
    const v = buildVariant(url, "video", "thumbnail");
    expect(v.url).toMatch(/\.jpg$/);
    expect(v.url).toContain("so_0");
  });
});

describe("variantIdsForPacks", () => {
  it("de-duplicates and keeps pack order", () => {
    expect(variantIdsForPacks(["website", "website", "instagram"])).toEqual([
      "optimized", "website", "square", "portrait",
    ]);
  });
});