import { ok } from "@/lib/api-response";
import { toApiFailure } from "@/lib/cloudinary/errors";
import { checkCloudinary } from "@/lib/cloudinary/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await checkCloudinary());
  } catch (err) {
    return toApiFailure(err);
  }
}