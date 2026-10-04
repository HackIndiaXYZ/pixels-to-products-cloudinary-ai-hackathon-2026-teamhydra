import type { AssetInfo } from "@/lib/cloudinary/analyze-schemas";
import type {
  EnrichStage, ModerationData, OrganizeData, StageOutcome, TagData,
} from "@/lib/cloudinary/enrich-schemas";
import type { UploadResult } from "@/lib/cloudinary/upload-schemas";
import type { ApiResponse } from "@/types/api";
import type { MediaTag, ModerationStatus } from "@/types/media";
import type { PipelineStageId, StageStatus } from "@/types/pipeline";

export class PipelineError extends Error {}

export type PipelineOutput = {
  info: AssetInfo;
  tags: MediaTag[];
  moderation: ModerationStatus | null;
  /** Reasons for skipped or failed stages. */
  notes: Partial<Record<PipelineStageId, string>>;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let json: ApiResponse<T>;
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new PipelineError("Network error while processing.");
  }
  if (!json.success) throw new PipelineError(json.error.message);
  return json.data;
}

/**
 * Runs the stages implemented so far: INGEST, ANALYZE, TAG, MODERATE, ORGANIZE.
 * TRANSFORM, OPTIMIZE and DELIVER are added in Phase 8.
 */
export async function runPipeline(
  upload: UploadResult,
  onStage: (id: PipelineStageId, status: StageStatus) => void,
): Promise<PipelineOutput> {
  if (upload.resource_type === "raw") throw new PipelineError("Unsupported media type.");
  const target = { publicId: upload.public_id, resourceType: upload.resource_type };
  const notes: PipelineOutput["notes"] = {};

  onStage("INGEST", "completed");
  onStage("ANALYZE", "processing");
  let info: AssetInfo;
  try {
    info = await post<AssetInfo>("/api/cloudinary/analyze", target);
    onStage("ANALYZE", "completed");
  } catch (err) {
    onStage("ANALYZE", "failed");
    throw err;
  }

  // A failed or unavailable enrichment stage must not block the stages after it.
  async function runStage<T>(id: EnrichStage): Promise<T | null> {
    onStage(id, "processing");
    try {
      const outcome = await post<StageOutcome<T>>("/api/cloudinary/enrich", { ...target, stage: id });
      if (outcome.status === "skipped") {
        onStage(id, "skipped");
        notes[id] = outcome.reason;
        return null;
      }
      onStage(id, "completed");
      return outcome.data;
    } catch (err) {
      onStage(id, "failed");
      notes[id] = err instanceof Error ? err.message : "Stage failed.";
      return null;
    }
  }

  const tagData = await runStage<TagData>("TAG");
  const moderationData = await runStage<ModerationData>("MODERATE");
  await runStage<OrganizeData>("ORGANIZE");

  return { info, tags: tagData?.tags ?? [], moderation: moderationData?.status ?? null, notes };
}