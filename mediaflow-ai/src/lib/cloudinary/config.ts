import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export class CloudinaryConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing Cloudinary environment variables: ${missing.join(", ")}`);
    this.name = "CloudinaryConfigError";
  }
}

let configured = false;

/** Returns the configured Cloudinary SDK. Server-only: reads the API secret. */
export function getCloudinary() {
  if (!configured) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new CloudinaryConfigError(parsed.error.issues.map((i) => String(i.path[0])));
    }
    cloudinary.config({
      cloud_name: parsed.data.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: parsed.data.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: parsed.data.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}