import { fail, ok } from "@/lib/api-response";
import { AssetNotFoundError } from "@/lib/cloudinary/analyze";
import { toApiFailure } from "@/lib/cloudinary/errors";
import { enrichRequestSchema } from "@/lib/cloudinary/enrich-schemas";
import { runModeration, runOrganize, runTagging } from "@/lib/cloudinary/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_INPUT", "Request body must be valid JSON.", 400);
  }

  const parsed = enrichRequestSchema.safeParse(json);
  if (!parsed.success) return fail("INVALID_INPUT", "Invalid request.", 400);

  const { publicId, resourceType, stage } = parsed.data;
  try {
    switch (stage) {
      case "TAG":
        return ok(await runTagging(publicId, resourceType));
      case "MODERATE":
        return ok(await runModeration(publicId, resourceType));
      case "ORGANIZE":
        return ok(await runOrganize(publicId, resourceType));
    }
  } catch (err) {
    if (err instanceof AssetNotFoundError) return fail("CLOUDINARY_ERROR", "Asset not found.", 404);
    return toApiFailure(err);
  }
}