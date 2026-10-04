import "server-only";
import { buildVariant, insertTransformation, variantIdsForPacks } from "@/lib/transform";
import type { MediaType, MediaVariant, PackId, VariantCheck } from "@/types/media";
import { analyzeAsset } from "./analyze";
import { getBackgroundRemovalFeature } from "./features";
import type { BackgroundRemovalState, VariantsResult } from "./variants-schemas";

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

export async function generateVariants(
  publicId: string,
  resourceType: MediaType,
  packs: PackId[],
): Promise<VariantsResult> {
  const asset = await analyzeAsset(publicId, resourceType); // ownership check + real asset URL

  const original: MediaVariant = {
    id: "original",
    label: "Original",
    url: asset.secureUrl,
    transformation: "",
    width: asset.width,
    height: asset.height,
    check: asset.bytes ? { ok: true, bytes: asset.bytes } : undefined,
  };

  const derived = variantIdsForPacks(packs).map((id) => buildVariant(asset.secureUrl, resourceType, id));
  const checked = await Promise.all(derived.map(async (v) => ({ ...v, check: await checkVariant(v.url) })));

  return {
    variants: [original, ...checked],
    backgroundRemoval: backgroundRemoval(asset.secureUrl, resourceType),
  };
}