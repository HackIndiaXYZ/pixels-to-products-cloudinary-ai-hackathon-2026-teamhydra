import "server-only";
import { getCloudinary } from "./config";

export type CloudinaryStatus = {
  connected: true;
  cloudName: string;
  plan?: string;
};

export async function checkCloudinary(): Promise<CloudinaryStatus> {
  const cloudinary = getCloudinary();
  await cloudinary.api.ping();

  let plan: string | undefined;
  try {
    const usage: { plan?: unknown } = await cloudinary.api.usage();
    plan = typeof usage.plan === "string" ? usage.plan : undefined;
  } catch {
    plan = undefined; // plan info is optional; the connection itself is verified
  }

  return { connected: true, cloudName: cloudinary.config().cloud_name ?? "", plan };
}