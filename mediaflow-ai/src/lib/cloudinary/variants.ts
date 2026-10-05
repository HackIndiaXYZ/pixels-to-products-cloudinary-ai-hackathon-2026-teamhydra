import "server-only";

import { buildVariant, variantIdsForPacks } from "@/lib/transform";
import type { MediaType, MediaVariant, PackId, VariantCheck } from "@/types/media";
import { analyzeAsset } from "./analyze";
import { getBackgroundRemovalFeature } from "./features";
import type { BackgroundRemovalState, VariantsResult } from "./variants-schemas";
import { getCloudinary } from "./config";

async function checkVariant(url: string): Promise<VariantCheck> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { Accept: "image/avif,image/webp,image/*,video/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const length = Number(res.headers.get("content-length"));
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") ?? undefined,
      bytes: Number.isFinite(length) && length > 0 ? length : undefined,
    };
  } catch {
    return { ok: false };
  }
}

function backgroundRemoval(secureUrl: string, resourceType: MediaType): BackgroundRemovalState {
  if (resourceType !== "image") {
    return { available: false, reason: "Background removal applies to images only." };
  }
  const feature = getBackgroundRemovalFeature();
  if (!feature.enabled) {
    return { available: false, reason: "Feature unavailable in current Cloudinary configuration." };
  }
  const transformation = "e_background_removal/f_auto,q_auto";
  const variant: MediaVariant = {
    id: "background-removed",
    label: "Background removed",
    transformation,
    url: require("@/lib/transform").insertTransformation(secureUrl, transformation),
  };
  return { available: true, variant };
}

export async function generateVariants(
  publicId: string,
  resourceType: MediaType,
  packs: readonly PackId[],
): Promise<VariantsResult> {
  const asset = await analyzeAsset(publicId, resourceType);
  const ids = variantIdsForPacks(packs);
  const generated = ids.map((id) => buildVariant(asset.secureUrl, resourceType, id));
  const original: MediaVariant = {
    id: "original",
    label: "Original",
    url: asset.secureUrl,
    transformation: "",
  };
  const checked = await Promise.all(
    generated.map(async (variant) => ({ ...variant, check: await checkVariant(variant.url) })),
  );
  const delivered = checked.filter((v) => v.check?.ok).length;

  try {
    await getCloudinary().uploader.explicit(publicId, {
      type: "upload",
      resource_type: resourceType,
      context: { ...(asset.context ?? {}), variants: String(delivered) },
    });
  } catch {
    // Delivery results remain useful even if the informational count cannot be updated.
  }

  return {
    variants: [original, ...checked],
    backgroundRemoval: backgroundRemoval(asset.secureUrl, resourceType),
  };
}
