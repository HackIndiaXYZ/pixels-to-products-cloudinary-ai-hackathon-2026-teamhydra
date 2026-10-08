import { fail, ok } from "@/lib/api-response";
import { AssetNotFoundError } from "@/lib/cloudinary/analyze";
import { toApiFailure } from "@/lib/cloudinary/errors";
import { generateVariants } from "@/lib/cloudinary/variants";
import { variantsRequestSchema } from "@/lib/cloudinary/variants-schemas";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_INPUT", "Request body must be valid JSON.", 400);
  }

  const parsed = variantsRequestSchema.safeParse(json);
  if (!parsed.success) return fail("INVALID_INPUT", "Invalid variants request.", 400);

  try {
    return ok(await generateVariants(
      parsed.data.publicId,
      parsed.data.resourceType,
      parsed.data.packs,
    ));
  } catch (err) {
    if (err instanceof AssetNotFoundError) return fail("CLOUDINARY_ERROR", "Asset not found.", 404);
    return toApiFailure(err);
  }
}
