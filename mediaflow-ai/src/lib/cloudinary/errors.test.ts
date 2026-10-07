import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudinaryConfigError } from "@/lib/cloudinary/config";
import { classifyError } from "@/lib/cloudinary/errors";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("classifyError", () => {
  it("reports missing configuration without naming secrets", () => {
    const e = classifyError(new CloudinaryConfigError(["CLOUDINARY_API_SECRET"]));
    expect(e).toMatchObject({ code: "ENV_MISSING", status: 503 });
    expect(e.message).not.toContain("CLOUDINARY_API_SECRET");
  });

  it("hides Cloudinary's message for credential errors", () => {
    const e = classifyError({ error: { http_code: 401, message: "Invalid api_key 12345" } });
    expect(e.message).toBe("Cloudinary rejected the credentials.");
  });

  it("maps 404 to asset not found", () => {
    expect(classifyError({ error: { http_code: 404 } })).toMatchObject({ status: 404, message: "Asset not found." });
  });

  it("surfaces Cloudinary's explanation for 400 errors", () => {
    expect(classifyError({ error: { http_code: 400, message: "Invalid transformation" } })).toMatchObject({
      code: "CLOUDINARY_ERROR",
      status: 400,
      message: "Cloudinary: Invalid transformation",
    });
  });

  it("detects network failures", () => {
    expect(classifyError({ error: { code: "ENOTFOUND" } })).toMatchObject({ code: "NETWORK_ERROR", status: 502 });
  });

  it("handles uploader-style errors with a top-level http_code", () => {
    expect(classifyError({ http_code: 500, message: "boom" })).toMatchObject({ code: "CLOUDINARY_ERROR", status: 502 });
  });

  it("never leaks internal error text", () => {
    const e = classifyError(new Error("secret=abc at /srv/app/stack.js:1"));
    expect(e).toEqual({ code: "INTERNAL_ERROR", message: "Something went wrong.", status: 500 });
    expect(classifyError("a thrown string").code).toBe("INTERNAL_ERROR");
  });
});