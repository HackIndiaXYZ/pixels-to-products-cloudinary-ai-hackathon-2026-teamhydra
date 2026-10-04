import type { ApiResponse } from "@/types/api";
import {
  uploadResultSchema,
  type SignatureData,
  type UploadResult,
} from "@/lib/cloudinary/upload-schemas";

export class UploadError extends Error {}

async function requestSignature(file: File): Promise<SignatureData> {
  let res: Response;
  try {
    res = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mimeType: file.type, size: file.size }),
    });
  } catch {
    throw new UploadError("Network error while preparing the upload.");
  }
  const body = (await res.json()) as ApiResponse<SignatureData>;
  if (!body.success) throw new UploadError(body.error.message);
  return body.data;
}

function cloudinaryMessage(json: unknown): string {
  if (typeof json === "object" && json !== null && "error" in json) {
    const err = (json as { error?: { message?: unknown } }).error;
    if (typeof err?.message === "string") return err.message;
  }
  return "Cloudinary rejected the upload.";
}

export async function uploadToCloudinary(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const sig = await requestSignature(file);

  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("signature", sig.signature);
    for (const [key, value] of Object.entries(sig.params)) form.append(key, value);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new UploadError("Network error while uploading."));
    xhr.onload = () => {
      let json: unknown;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new UploadError("Unexpected response from Cloudinary."));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new UploadError(cloudinaryMessage(json)));
        return;
      }
      const parsed = uploadResultSchema.safeParse(json);
      if (parsed.success) resolve(parsed.data);
      else reject(new UploadError("Unexpected response from Cloudinary."));
    };

    xhr.send(form);
  });
}