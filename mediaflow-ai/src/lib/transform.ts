import type { MediaType, MediaVariant, PackId, VariantId } from "@/types/media";

export const PACK_IDS = ["website", "instagram", "story", "thumbnail"] as const;

export type TransformId = Exclude<VariantId, "original" | "background-removed">;

type Preset = { label: string; width: number; height?: number };

const PRESETS: Record<TransformId, Preset> = {
  optimized: { label: "Web optimized", width: 1600 },
  website: { label: "Website 16:9", width: 1200, height: 675 },
  square: { label: "Instagram square", width: 1080, height: 1080 },
  portrait: { label: "Instagram portrait", width: 1080, height: 1350 },
  story: { label: "Story 9:16", width: 1080, height: 1920 },
  thumbnail: { label: "Thumbnail", width: 400, height: 400 },
};

export const PACKS: Record<PackId, { label: string; variants: TransformId[] }> = {
  website: { label: "Website", variants: ["optimized", "website"] },
  instagram: { label: "Instagram", variants: ["square", "portrait"] },
  story: { label: "Story", variants: ["story"] },
  thumbnail: { label: "Thumbnail", variants: ["thumbnail"] },
};

/** Fixed sizes use content-aware cropping (c_fill + g_auto). Everything uses f_auto and q_auto. */
export function buildTransformation(id: TransformId, resourceType: MediaType): string {
  const { width, height } = PRESETS[id];
  const sizing = height ? ["c_fill", "g_auto", `w_${width}`, `h_${height}`] : ["c_limit", `w_${width}`];
  // A video thumbnail is a still frame, delivered as a JPG.
  if (id === "thumbnail" && resourceType === "video") return [...sizing, "so_0", "q_auto"].join(",");
  return [...sizing, "f_auto", "q_auto"].join(",");
}

/**
 * Inserts a transformation into a Cloudinary delivery URL. The original extension is removed so
 * f_auto can choose the format, unless an explicit extension is requested.
 */
export function insertTransformation(secureUrl: string, transformation: string, extension?: string): string {
  const url = new URL(secureUrl);
  const marker = "/upload/";
  const index = url.pathname.indexOf(marker);
  if (index === -1) throw new Error("Not a Cloudinary upload URL.");

  const head = url.pathname.slice(0, index + marker.length);
  const rest = url.pathname.slice(index + marker.length).replace(/\.[A-Za-z0-9]+$/, "");
  url.pathname = `${head}${transformation}/${rest}${extension ? `.${extension}` : ""}`;
  return url.toString();
}

export function buildVariant(secureUrl: string, resourceType: MediaType, id: TransformId): MediaVariant {
  const { label, width, height } = PRESETS[id];
  const transformation = buildTransformation(id, resourceType);
  const extension = id === "thumbnail" && resourceType === "video" ? "jpg" : undefined;
  return { id, label, width, height, transformation, url: insertTransformation(secureUrl, transformation, extension) };
}

export function variantIdsForPacks(packs: readonly PackId[]): TransformId[] {
  return [...new Set(packs.flatMap((p) => PACKS[p].variants))];
}