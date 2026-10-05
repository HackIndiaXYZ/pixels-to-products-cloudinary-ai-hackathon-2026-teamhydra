import { z } from "zod";
import type { DashboardFilters, MediaAsset, MediaType } from "@/types/media";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const filtersSchema = z.object({
  search: z.string().trim().max(100).catch(""),
  type: z.enum(["all", "image", "video"]).catch("all"),
  moderation: z.enum(["all", "approved", "review", "rejected"]).catch("all"),
});

export const DEFAULT_FILTERS: DashboardFilters = { search: "", type: "all", moderation: "all" };

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFilters(params: RawParams): DashboardFilters {
  return filtersSchema.parse({
    search: first(params.search) ?? "",
    type: first(params.type) ?? "all",
    moderation: first(params.moderation) ?? "all",
  });
}

export function hasActiveFilters(f: DashboardFilters): boolean {
  return f.search !== "" || f.type !== "all" || f.moderation !== "all";
}

export function mediaTypeOf(mime: string): MediaType | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: { type: string; size: number }): string | null {
  const type = mediaTypeOf(file.type);
  if (!type) return "Unsupported file type. Upload an image or video.";
  if (file.size === 0) return "File is empty.";
  const limit = type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > limit) return `File exceeds the ${formatBytes(limit)} limit for ${type}s.`;
  return null;
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return "n/a";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function computeStats(assets: MediaAsset[]) {
  return {
    total: assets.length,
    processed: assets.filter((a) => a.processing === "completed").length,
    approved: assets.filter((a) => a.moderation === "approved").length,
    needsReview: assets.filter((a) => a.moderation === "review").length,
    variants: assets.reduce((sum, a) => sum + a.variantCount, 0),
  };
}