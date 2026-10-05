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
  display_name: z.string().optional(),
  original_filename: z.string().optional(),
  secure_url: z.string().url(),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
  created_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function findAsset(publicId: string): Promise<AssetInfo> {
  let notFound = true;
  for (const resourceType of ["image", "video"] as const) {
    try {
      return await analyzeAsset(publicId, resourceType);
    } catch (err) {
      const httpCode =
        typeof err === "object" && err !== null && "http_code" in err
          ? (err as { http_code?: unknown }).http_code
          : undefined;
      if (!(err instanceof AssetNotFoundError) && httpCode !== 404) {
        notFound = false;
        throw err;
      }
    }
  }
  if (notFound) throw new AssetNotFoundError();
  throw new AssetNotFoundError();
}

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
    filename: r.display_name ?? r.original_filename,
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