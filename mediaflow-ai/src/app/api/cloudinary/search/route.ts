import { ok } from "@/lib/api-response";
import { toApiFailure } from "@/lib/cloudinary/errors";
import { searchAssets } from "@/lib/cloudinary/search";
import { parseFilters } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  try {
    return ok({ assets: await searchAssets(parseFilters(params)) });
  } catch (err) {
    return toApiFailure(err);
  }
}