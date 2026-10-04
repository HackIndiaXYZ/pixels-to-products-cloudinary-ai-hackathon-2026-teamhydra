import type { PipelineState } from "./pipeline";

export type MediaType = "image" | "video";
export type ModerationStatus = "approved" | "review" | "rejected" | "pending" | "unavailable";
export type ProcessingStatus = "processing" | "completed" | "failed";

export type MediaTag = { name: string; confidence?: number };

export type MediaAsset = {
  publicId: string;
  filename: string;
  type: MediaType;
  format: string;
  width: number;
  height: number;
  bytes?: number;
  secureUrl: string;
  thumbnailUrl: string;
  tags: MediaTag[];
  moderation: ModerationStatus;
  processing: ProcessingStatus;
  variantCount: number;
  createdAt: string;
  pipeline?: PipelineState;
};

export type DashboardFilters = {
  search: string;
  type: MediaType | "all";
  moderation: "approved" | "review" | "rejected" | "all";
};

export type PackId = "website" | "instagram" | "story" | "thumbnail";

export type VariantId =
  | "original"
  | "optimized"
  | "website"
  | "square"
  | "portrait"
  | "story"
  | "thumbnail"
  | "background-removed";

/** Result of requesting a variant URL from Cloudinary's CDN. */
export type VariantCheck = {
  ok: boolean;
  status?: number;
  contentType?: string;
  bytes?: number;
};

export type MediaVariant = {
  id: VariantId;
  label: string;
  url: string;
  /** Cloudinary transformation string; empty for the original. */
  transformation: string;
  width?: number;
  height?: number;
  check?: VariantCheck;
};