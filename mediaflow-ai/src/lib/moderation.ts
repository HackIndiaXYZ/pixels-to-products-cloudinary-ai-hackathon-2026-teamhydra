import type { ModerationStatus } from "@/types/media";

export type ModerationEntry = { kind?: string; status: string };

/** Collapses Cloudinary moderation entries into one status. Unknown values are treated as pending. */
export function overallModeration(entries: ModerationEntry[] | undefined): ModerationStatus | null {
  if (!entries || entries.length === 0) return null;
  if (entries.some((e) => e.status === "rejected")) return "rejected";
  if (entries.every((e) => e.status === "approved")) return "approved";
  return "pending";
}