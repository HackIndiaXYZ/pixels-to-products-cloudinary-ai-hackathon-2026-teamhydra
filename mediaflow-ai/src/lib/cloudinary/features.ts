import "server-only";

const TAGGING_ADDONS = ["google_tagging", "aws_rek_tagging", "imagga_tagging"] as const;
const MODERATION_ADDONS = ["aws_rek", "webpurify"] as const;

export const AUTO_TAGGING_THRESHOLD = 0.6;

export type Feature<P extends string> =
  | { enabled: true; provider: P }
  | { enabled: false; reason: string };

function readFeature<P extends string>(envName: string, label: string, allowed: readonly P[]): Feature<P> {
  const raw = process.env[envName]?.trim();
  if (!raw) return { enabled: false, reason: `${label} add-on is not configured.` };
  const provider = allowed.find((a) => a === raw);
  return provider
    ? { enabled: true, provider }
    : { enabled: false, reason: `${envName} has an unsupported value.` };
}

export const getTaggingFeature = () =>
  readFeature("CLOUDINARY_TAGGING_ADDON", "Auto-tagging", TAGGING_ADDONS);

export const getModerationFeature = () =>
  readFeature("CLOUDINARY_MODERATION_ADDON", "Moderation", MODERATION_ADDONS);