import { z } from "zod";
import type { MediaTag, ModerationStatus } from "@/types/media";

export const enrichRequestSchema = z.object({
  publicId: z.string().min(1).max(255),
  resourceType: z.enum(["image", "video"]),
  stage: z.enum(["TAG", "MODERATE", "ORGANIZE"]),
});

export type EnrichStage = z.infer<typeof enrichRequestSchema>["stage"];

export type StageOutcome<T> =
  | { status: "completed"; data: T }
  | { status: "skipped"; reason: string };

export type TagData = { provider: string; tags: MediaTag[] };
export type ModerationData = { provider: string; status: ModerationStatus };
export type OrganizeData = { context: Record<string, string> };