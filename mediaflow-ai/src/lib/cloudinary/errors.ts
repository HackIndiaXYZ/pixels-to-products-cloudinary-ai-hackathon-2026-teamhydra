import "server-only";
import { fail } from "@/lib/api-response";
import { CloudinaryConfigError } from "./config";

const NETWORK_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]);

function innerError(err: unknown): Record<string, unknown> | null {
  if (typeof err !== "object" || err === null) return null;
  const maybe = (err as { error?: unknown }).error;
  const inner = typeof maybe === "object" && maybe !== null ? maybe : err;
  return inner as Record<string, unknown>;
}

/** Maps any thrown value to a structured response without leaking secrets or stack traces. */
export function toApiFailure(err: unknown) {
  if (err instanceof CloudinaryConfigError) {
    console.error("[cloudinary] not configured:", err.missing.join(", "));
    return fail("ENV_MISSING", "Cloudinary is not configured on the server.", 503);
  }

  const inner = innerError(err);
  const httpCode = typeof inner?.http_code === "number" ? inner.http_code : null;
  const code = typeof inner?.code === "string" ? inner.code : null;
  console.error("[cloudinary] request failed:", httpCode ?? code ?? "unknown");

  if (code && NETWORK_CODES.has(code)) {
    return fail("NETWORK_ERROR", "Could not reach Cloudinary. Check your connection.", 502);
  }
  if (httpCode === 401 || httpCode === 403) {
    return fail("CLOUDINARY_ERROR", "Cloudinary rejected the credentials.", 502);
  }
  if (httpCode !== null) {
    return fail("CLOUDINARY_ERROR", "Cloudinary request failed.", 502);
  }
  return fail("INTERNAL_ERROR", "Something went wrong.", 500);
}