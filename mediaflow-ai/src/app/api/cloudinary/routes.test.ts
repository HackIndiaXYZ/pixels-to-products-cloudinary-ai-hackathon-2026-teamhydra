import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Body = {
  success: boolean;
  data?: { signature?: string; params?: Record<string, string> };
  error?: { code: string; message: string };
};

const CLOUD_ENV = [
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function postRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function read(res: Response) {
  return { status: res.status, body: (await res.json()) as Body };
}

function clearCloudinaryEnv() {
  for (const key of CLOUD_ENV) vi.stubEnv(key, "");
}

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/cloudinary/signature", () => {
  const load = async () => (await import("@/app/api/cloudinary/signature/route")).POST;

  it("rejects invalid JSON", async () => {
    const { status, body } = await read(await (await load())(postRequest("{not json")));
    expect(status).toBe(400);
    expect(body.error?.code).toBe("INVALID_INPUT");
  });

  it("rejects missing fields", async () => {
    const { status } = await read(await (await load())(postRequest({ mimeType: "image/png" })));
    expect(status).toBe(400);
  });

  it("rejects unsupported media", async () => {
    const { status, body } = await read(
      await (await load())(postRequest({ mimeType: "application/pdf", size: 1000 })),
    );
    expect(status).toBe(415);
    expect(body.error?.code).toBe("UNSUPPORTED_MEDIA");
  });

  it("rejects oversized files", async () => {
    const { status } = await read(
      await (await load())(postRequest({ mimeType: "image/jpeg", size: 11 * 1024 * 1024 })),
    );
    expect(status).toBe(413);
  });

  it("reports missing Cloudinary configuration", async () => {
    clearCloudinaryEnv();
    const { status, body } = await read(
      await (await load())(postRequest({ mimeType: "image/jpeg", size: 1000 })),
    );
    expect(status).toBe(503);
    expect(body.error?.code).toBe("ENV_MISSING");
  });

  it("returns a signature without exposing the API secret", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY", "123456");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret-value");

    const res = await (await load())(postRequest({ mimeType: "image/jpeg", size: 1000 }));
    const text = await res.clone().text();
    const { status, body } = await read(res);

    expect(status).toBe(200);
    expect(body.data?.signature).toBeTruthy();
    expect(body.data?.params?.tags).toBe("mediaflow");
    expect(body.data?.params?.allowed_formats).toContain("jpg");
    expect(text).not.toContain("test-secret-value");
  });
});

describe.each([
  ["analyze", "@/app/api/cloudinary/analyze/route", { publicId: "abc", resourceType: "image" }],
  ["enrich", "@/app/api/cloudinary/enrich/route", { publicId: "abc", resourceType: "image", stage: "TAG" }],
  ["variants", "@/app/api/cloudinary/variants/route", { publicId: "abc", resourceType: "image", packs: ["website"] }],
] as const)("POST /api/cloudinary/%s input validation", (_name, path, valid) => {
  const load = async () => (await import(/* @vite-ignore */ path)).POST as (r: Request) => Promise<Response>;

  const invalidBodies: [string, unknown][] = [
    ["invalid JSON", "{not json"],
    ["empty object", {}],
    ["missing publicId", { ...valid, publicId: undefined }],
    ["empty publicId", { ...valid, publicId: "" }],
    ["publicId over 255 characters", { ...valid, publicId: "x".repeat(256) }],
    ["unknown resourceType", { ...valid, resourceType: "raw" }],
  ];

  it.each(invalidBodies)("returns 400 for %s", async (_label, body) => {
    const { status, body: json } = await read(await (await load())(postRequest(body)));
    expect(status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("INVALID_INPUT");
  });
});

describe("stage and pack validation", () => {
  it("rejects an unknown enrich stage", async () => {
    const { POST } = await import("@/app/api/cloudinary/enrich/route");
    const res = await POST(postRequest({ publicId: "abc", resourceType: "image", stage: "TRANSFORM" }));
    expect(res.status).toBe(400);
  });

  it("rejects empty or unknown packs", async () => {
    const { POST } = await import("@/app/api/cloudinary/variants/route");
    for (const packs of [[], ["nope"]]) {
      const res = await POST(postRequest({ publicId: "abc", resourceType: "image", packs }));
      expect(res.status).toBe(400);
    }
  });
});

describe("GET routes without Cloudinary configuration", () => {
  it("search tolerates garbage filters and reports ENV_MISSING", async () => {
    clearCloudinaryEnv();
    const { GET } = await import("@/app/api/cloudinary/search/route");
    const res = await GET(
      new Request("http://localhost/api/cloudinary/search?type=banana&moderation=nope&search=%22%20OR%20x"),
    );
    const { status, body } = await read(res);
    expect(status).toBe(503);
    expect(body.error?.code).toBe("ENV_MISSING");
  });

  it("status reports ENV_MISSING", async () => {
    clearCloudinaryEnv();
    const { GET } = await import("@/app/api/cloudinary/status/route");
    const { status, body } = await read(await GET());
    expect(status).toBe(503);
    expect(body.error?.code).toBe("ENV_MISSING");
  });
});