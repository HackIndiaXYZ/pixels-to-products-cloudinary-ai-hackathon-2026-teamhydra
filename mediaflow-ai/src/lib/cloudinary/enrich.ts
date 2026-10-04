import "server-only";
import { z } from "zod";
import { overallModeration } from "@/lib/moderation";
import type { MediaTag, MediaType } from "@/types/media";
import { analyzeAsset } from "./analyze";
import { getCloudinary } from "./config";
import type { ModerationData, OrganizeData, StageOutcome, TagData } from "./enrich-schemas";
import { AUTO_TAGGING_THRESHOLD, getModerationFeature, getTaggingFeature } from "./features";
import { UPLOAD_TAG } from "./upload";

const skipped = (reason: string) => ({ status: "skipped", reason }) as const;

const taggingResponse = z.object({
  info: z
    .object({
      categorization: z
        .record(
          z.string(),
          z.object({
            data: z
              .array(z.object({ tag: z.string(), confidence: z.number().optional() }))
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const moderationResponse = z.object({
  moderation: z.array(z.object({ kind: z.string().optional(), status: z.string() })).optional(),
});

export async function runTagging(
  publicId: string,
  resourceType: MediaType,
): Promise<StageOutcome<TagData>> {
  const feature = getTaggingFeature();
  if (!feature.enabled) return skipped(feature.reason);
  if (resourceType !== "image") return skipped("Auto-tagging is available for images only in this build.");

  await analyzeAsset(publicId, resourceType); // ownership check
  const raw: unknown = await getCloudinary().uploader.explicit(publicId, {
    type: "upload",
    resource_type: resourceType,
    categorization: feature.provider,
    auto_tagging: AUTO_TAGGING_THRESHOLD,
  });

  const parsed = taggingResponse.safeParse(raw);
  const detected = parsed.success ? (parsed.data.info?.categorization?.[feature.provider]?.data ?? []) : [];
  // Confidence is passed through exactly as the add-on returns it.
  const tags: MediaTag[] = detected.map((t) => ({ name: t.tag, confidence: t.confidence }));
  return { status: "completed", data: { provider: feature.provider, tags } };
}

export async function runModeration(
  publicId: string,
  resourceType: MediaType,
): Promise<StageOutcome<ModerationData>> {
  const feature = getModerationFeature();
  if (!feature.enabled) return skipped(feature.reason);
  if (resourceType !== "image") return skipped("Moderation is available for images only in this build.");

  await analyzeAsset(publicId, resourceType); // ownership check
  const raw: unknown = await getCloudinary().uploader.explicit(publicId, {
    type: "upload",
    resource_type: resourceType,
    moderation: feature.provider,
  });

  const parsed = moderationResponse.safeParse(raw);
  const status = (parsed.success && overallModeration(parsed.data.moderation)) || "pending";
  return { status: "completed", data: { provider: feature.provider, status } };
}

export async function runOrganize(
  publicId: string,
  resourceType: MediaType,
): Promise<StageOutcome<OrganizeData>> {
  const asset = await analyzeAsset(publicId, resourceType); // ownership check + fresh state
  const tagging = getTaggingFeature();
  const moderation = getModerationFeature();

  const context: Record<string, string> = {
    source: "mediaflow-ai",
    processed_at: new Date().toISOString(),
    tagging: tagging.enabled ? tagging.provider : "unavailable",
    moderation:
      overallModeration(asset.moderation) ?? (moderation.enabled ? "pending" : "unavailable"),
    tag_count: String(asset.tags.filter((t) => t !== UPLOAD_TAG).length),
  };

  await getCloudinary().uploader.explicit(publicId, {
    type: "upload",
    resource_type: resourceType,
    context,
  });
  return { status: "completed", data: { context } };
}