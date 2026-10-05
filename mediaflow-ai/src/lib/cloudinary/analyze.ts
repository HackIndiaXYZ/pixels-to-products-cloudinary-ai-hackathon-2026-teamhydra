import "server-only";
import { z } from "zod";
import type { MediaType } from "@/types/media";
import type { AssetInfo } from "./analyze-schemas";
import { getCloudinary } from "./config";
import { UPLOAD_TAG } from "./upload";

export class AssetNotFoundError extends Error {}

const resourceSchema = z.object({
  context: z.object({ custom: z.record(z.string(), z.string()).optional() }).optional(),
  moderation: z.array(z.object({ kind: z.string().optional(), status: z.string() })).optional(),
  public_id: z.string(),
  secure_url: z.string().url(),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
  created_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function analyzeAsset(publicId: string, resourceType: MediaType): Promise<AssetInfo> {
  const cloudinary = getCloudinary();
  const raw: unknown = await cloudinary.api.resource(publicId, { resource_type: resourceType });

  const parsed = resourceSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Unexpected Cloudinary response shape");

  const r = parsed.data;
  const tags = r.tags ?? [];
  // Only assets uploaded through this app are exposed.
  if (!tags.includes(UPLOAD_TAG)) throw new AssetNotFoundError();

  return {
    publicId: r.public_id,
    resourceType,
    format: r.format,
    width: r.width,
    height: r.height,
    bytes: r.bytes,
    secureUrl: r.secure_url,
    createdAt: r.created_at,
    tags,
    moderation: r.moderation,
    context: r.context?.custom,
  };
}