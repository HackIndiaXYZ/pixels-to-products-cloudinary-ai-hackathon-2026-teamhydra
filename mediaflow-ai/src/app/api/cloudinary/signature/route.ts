import { fail, ok } from "@/lib/api-response";
import { toApiFailure } from "@/lib/cloudinary/errors";
import { createUploadSignature } from "@/lib/cloudinary/upload";
import { signatureRequestSchema } from "@/lib/cloudinary/upload-schemas";
import { formatBytes, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, mediaTypeOf } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_INPUT", "Request body must be valid JSON.", 400);
  }

  const parsed = signatureRequestSchema.safeParse(json);
  if (!parsed.success) return fail("INVALID_INPUT", "Invalid upload request.", 400);

  const { mimeType, size } = parsed.data;
  const resourceType = mediaTypeOf(mimeType);
  if (!resourceType) {
    return fail("UNSUPPORTED_MEDIA", "Unsupported file type. Upload an image or video.", 415);
  }

  const limit = resourceType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (size > limit) {
    return fail("INVALID_INPUT", `File is larger than the ${formatBytes(limit)} limit.`, 413);
  }

  try {
    return ok(createUploadSignature(resourceType));
  } catch (err) {
    return toApiFailure(err);
  }
}