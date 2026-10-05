import "server-only";
import { z } from "zod";
import { buildSearchExpression } from "@/lib/search-expression";
import { buildTransformation, insertTransformation } from "@/lib/transform";
import type { DashboardFilters, MediaAsset, ModerationStatus } from "@/types/media";
import { getCloudinary } from "./config";
import { UPLOAD_TAG } from "./upload";

const MAX_RESULTS = 30;

const resourceSchema = z.object({
  public_id: z.string(),
  display_name: z.string().optional(),
  resource_type: z.enum(["image", "video"]),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
  secure_url: z.string().url(),
  created_at: z.string(),
  tags: z.array(z.string()).optional(),
  context: z.object({ custom: z.record(z.string(), z.string()).optional() }).optional(),
});

const responseSchema = z.object({ resources: z.array(z.unknown()) });

function moderationFromContext(value: string | undefined): ModerationStatus {
  switch (value) {
    case "approved":
    case "rejected":
    case "unavailable":
      return value;
    case "pending":
      return "review";
    default:
      return "pending"; // pipeline has not recorded a moderation result yet
  }
}

function toMediaAsset(r: z.infer<typeof resourceSchema>): MediaAsset {
  const custom = r.context?.custom ?? {};
  return {
    publicId: r.public_id,
    filename: r.display_name ?? r.public_id,
    type: r.resource_type,
    format: r.format ?? "",
    width: r.width ?? 0,
    height: r.height ?? 0,
    bytes: r.bytes,
    secureUrl: r.secure_url,
    thumbnailUrl: insertTransformation(
      r.secure_url,
      buildTransformation("thumbnail", r.resource_type),
      r.resource_type === "video" ? "jpg" : undefined,
    ),
    tags: (r.tags ?? []).filter((t) => t !== UPLOAD_TAG).map((name) => ({ name })),
    moderation: moderationFromContext(custom.moderation),
    processing: custom.source === "mediaflow-ai" ? "completed" : "processing",
    variantCount: Number.parseInt(custom.variants ?? "0", 10) || 0,
    createdAt: r.created_at,
  };
}

export async function searchAssets(filters: DashboardFilters): Promise<MediaAsset[]> {
  const raw: unknown = await getCloudinary()
    .search.expression(buildSearchExpression(filters, UPLOAD_TAG))
    .sort_by("created_at", "desc")
    .max_results(MAX_RESULTS)
    .with_field("tags")
    .with_field("context")
    .execute();

  return responseSchema
    .parse(raw)
    .resources.flatMap((item) => {
      const parsed = resourceSchema.safeParse(item);
      return parsed.success ? [toMediaAsset(parsed.data)] : [];
    });
}