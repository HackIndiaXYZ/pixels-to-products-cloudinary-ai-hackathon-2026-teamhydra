import "server-only";
import { fail } from "@/lib/api-response";
import { CloudinaryConfigError } from "./config";
import "server-only";
import { fail } from "@/lib/api-response";
import type { ApiErrorCode } from "@/types/api";
import { CloudinaryConfigError } from "./config";

const NETWORK_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]);

export type ClassifiedError = { code: ApiErrorCode; message: string; status: number };

function innerError(err: unknown): Record<string, unknown> | null {
  if (typeof err !== "object" || err === null) return null;
  const maybe = (err as { error?: unknown }).error;
  const inner = typeof maybe === "object" && maybe !== null ? maybe : err;
  return inner as Record<string, unknown>;
}

/** Maps any thrown value to a safe code and message without leaking secrets or stack traces. */
export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof CloudinaryConfigError) {
    console.error("[cloudinary] not configured:", err.missing.join(", "));
    return { code: "ENV_MISSING", message: "Cloudinary is not configured on the server.", status: 503 };
  }

  const inner = innerError(err);
  const httpCode = typeof inner?.http_code === "number" ? inner.http_code : null;
  const code = typeof inner?.code === "string" ? inner.code : null;
  const message = typeof inner?.message === "string" ? inner.message : null;
  console.error("[cloudinary] request failed:", httpCode ?? code ?? "unknown");

  if (code && NETWORK_CODES.has(code)) {
    return { code: "NETWORK_ERROR", message: "Could not reach Cloudinary. Check your connection.", status: 502 };
  }
  if (httpCode === 401 || httpCode === 403) {
    return { code: "CLOUDINARY_ERROR", message: "Cloudinary rejected the credentials.", status: 502 };
  }
  if (httpCode === 404) {
    return { code: "CLOUDINARY_ERROR", message: "Asset not found.", status: 404 };
  }
  if (httpCode === 400 && message) {
    return { code: "CLOUDINARY_ERROR", message: `Cloudinary: ${message}`, status: 400 };
  }
  if (httpCode !== null) {
    return { code: "CLOUDINARY_ERROR", message: "Cloudinary request failed.", status: 502 };
  }
  return { code: "INTERNAL_ERROR", message: "Something went wrong.", status: 500 };
}

export function toApiFailure(err: unknown) {
  const e = classifyError(err);
  return fail(e.code, e.message, e.status);
}

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

  rconst message = typeof inner?.message === "string" ? inner.message : null;
  if (httpCode === 400 && message) {
    return fail("CLOUDINARY_ERROR", `Cloudinary: ${message}`, 400);
  }

  if (code && NETWORK_CODES.has(code)) {
    return fail("NETWORK_ERROR", "Could not reach Cloudinary. Check your connection.", 502);
  }
  if (httpCode === 401 || httpCode === 403) {
    return fail("CLOUDINARY_ERROR", "Cloudinary rejected the credentials.", 502);
  }
    if (httpCode === 404) {
    return fail("CLOUDINARY_ERROR", "Asset not found.", 404);
  }
  if (httpCode !== null) {
    return fail("CLOUDINARY_ERROR", "Cloudinary request failed.", 502);
  }
  return fail("INTERNAL_ERROR", "Something went wrong.", 500);
}