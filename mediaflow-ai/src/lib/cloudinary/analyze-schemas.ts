import { z } from "zod";

export const analyzeRequestSchema = z.object({
  publicId: z.string().min(1).max(255),
  resourceType: z.enum(["image", "video"]),
});

export type AssetInfo = {
  context?: Record<string, string>;
  publicId: string;
  resourceType: "image" | "video";
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  secureUrl: string;
  createdAt?: string;
    tags: string[];
  moderation?: { kind?: string; status: string }[];
};