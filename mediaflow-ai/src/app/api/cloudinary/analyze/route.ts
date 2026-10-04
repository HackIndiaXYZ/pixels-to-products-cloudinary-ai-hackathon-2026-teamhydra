import { fail, ok } from "@/lib/api-response";
import { AssetNotFoundError, analyzeAsset } from "@/lib/cloudinary/analyze";
import { analyzeRequestSchema } from "@/lib/cloudinary/analyze-schemas";
import { toApiFailure } from "@/lib/cloudinary/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_INPUT", "Request body must be valid JSON.", 400);
  }

  const parsed = analyzeRequestSchema.safeParse(json);
  if (!parsed.success) return fail("INVALID_INPUT", "Invalid analyze request.", 400);

  try {
    return ok(await analyzeAsset(parsed.data.publicId, parsed.data.resourceType));
  } catch (err) {
    if (err instanceof AssetNotFoundError) return fail("CLOUDINARY_ERROR", "Asset not found.", 404);
    return toApiFailure(err);
  }
}