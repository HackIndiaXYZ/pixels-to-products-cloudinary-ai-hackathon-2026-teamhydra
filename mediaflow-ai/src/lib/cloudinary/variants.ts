import "server-only";
import { buildVariant, insertTransformation, variantIdsForPacks } from "@/lib/transform";
import type { MediaType, MediaVariant, PackId, VariantCheck } from "@/types/media";
import { analyzeAsset } from "./analyze";
import { getBackgroundRemovalFeature } from "./features";
import type { BackgroundRemovalState, VariantsResult } from "./variants-schemas";
import { getCloudinary } from "./config";

/** Requests the variant the way a modern browser would, so f_auto picks the real format. */
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
  // Derived on demand; the original asset is never modified. Not pre-checked because
  // the add-on processes the image asynchronously on first request.
  const transformation = "e_background_removal/f_auto,q_auto";
  const variant: MediaVariant = {
    id: "background-removed",
    label: "Background removed",
    transformation,
    url: insertTransformation(secureUrl, transformation),
  };
  return { available: true, variant };
}

  // Record how many variants were delivered so the dashboard stat is real.
  const delivered = checked.filter((v) => v.check?.ok).length;
  try {
    await getCloudinary().uploader.explicit(publicId, {
      type: "upload",
      resource_type: resourceType,
      context: { ...asset.context, variants: String(delivered) },
    });
  } catch {
    // The count is informational; variant URLs are already usable without it.
  }

 return {
    variants: [original, ...checked],
    backgroundRemoval: backgroundRemoval(asset.secureUrl, resourceType),
  };