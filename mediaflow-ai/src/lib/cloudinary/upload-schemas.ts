import { z } from "zod";

export const signatureRequestSchema = z.object({
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive(),
});

export type SignatureData = {
  cloudName: string;
  apiKey: string;
  resourceType: "image" | "video";
  signature: string;
  /** Exactly the params that were signed. The client must send them unchanged. */
  params: Record<string, string>;
};

export const uploadResultSchema = z.object({
  public_id: z.string(),
  secure_url: z.string().url(),
  resource_type: z.enum(["image", "video", "raw"]),
  format: z.string().optional(),
  bytes: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type UploadResult = z.infer<typeof uploadResultSchema>;