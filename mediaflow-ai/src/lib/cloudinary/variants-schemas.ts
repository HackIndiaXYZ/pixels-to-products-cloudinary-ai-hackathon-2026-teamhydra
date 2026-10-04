import { z } from "zod";
import { PACK_IDS } from "@/lib/transform";
import type { MediaVariant } from "@/types/media";

export const variantsRequestSchema = z.object({
  publicId: z.string().min(1).max(255),
  resourceType: z.enum(["image", "video"]),
  packs: z.array(z.enum(PACK_IDS)).min(1).max(PACK_IDS.length),
});

export type BackgroundRemovalState =
  | { available: true; variant: MediaVariant }
  | { available: false; reason: string };

export type VariantsResult = {
  variants: MediaVariant[];
  backgroundRemoval: BackgroundRemovalState;
};