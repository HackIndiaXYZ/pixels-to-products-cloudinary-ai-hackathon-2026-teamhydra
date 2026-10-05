import "server-only";
import type { MediaType } from "@/types/media";
import { CloudinaryConfigError, getCloudinary } from "./config";
import type { SignatureData } from "./upload-schemas";

export const UPLOAD_TAG = "mediaflow";

const ALLOWED_FORMATS: Record<MediaType, string> = {
  image: "jpg,jpeg,png,webp,gif,avif",
  video: "mp4,mov,webm,mkv",
};

export function createUploadSignature(resourceType: MediaType): SignatureData {
  const cloudinary = getCloudinary();
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    throw new CloudinaryConfigError(["Cloudinary credentials"]);
  }

  const params = {
    use_filename: "true",
    timestamp: String(Math.round(Date.now() / 1000)),
    tags: UPLOAD_TAG,
    allowed_formats: ALLOWED_FORMATS[resourceType],
  };

  return {
    cloudName: cloud_name,
    apiKey: api_key,
    resourceType,
    signature: cloudinary.utils.api_sign_request(params, api_secret),
    params,
  };
}