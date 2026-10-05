import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { CopyUrlButton } from "@/components/media/CopyUrlButton";
import { MediaPack } from "@/components/dashboard/MediaPack";
import { PipelineStatus } from "@/components/pipeline/PipelineStatus";
import { AssetNotFoundError, findAsset } from "@/lib/cloudinary/analyze";
import { generateVariants } from "@/lib/cloudinary/variants";
import { formatBytes } from "@/lib/media";
import { overallModeration } from "@/lib/moderation";
import { PACK_IDS } from "@/lib/transform";
import type { ModerationStatus } from "@/types/media";
import type { VariantsResult } from "@/lib/cloudinary/variants-schemas";
import type { PipelineState } from "@/types/pipeline";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ publicId: string }> };

function valueOrUnavailable(value: string | number | undefined | null) {
  return value === undefined || value === null || value === "" ? "Not available" : String(value);
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function moderationLabel(status: ModerationStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "review" || status === "pending") return "Review";
  return "Unavailable";
}

function buildPipeline(
  context: Record<string, string>,
  moderation: ModerationStatus,
  variantChecks: Array<{ ok: boolean; bytes?: number }>,
  variantError = false,
): PipelineState {
  const derived = variantChecks.length > 0;
  const optimized = variantChecks.some((check) => check.bytes !== undefined);
  const delivered = derived && variantChecks.every((check) => check.ok);

  return {
    INGEST: "completed",
    ANALYZE: "completed",
    TAG: context.tagging && context.tagging !== "unavailable" ? "completed" : "skipped",
    MODERATE: moderation !== "unavailable" ? "completed" : "skipped",
    ORGANIZE: context.processed_at ? "completed" : "skipped",
    TRANSFORM: variantError ? "failed" : (derived ? "completed" : "skipped"),
    OPTIMIZE: variantError ? "skipped" : (optimized ? "completed" : "skipped"),
    DELIVER: variantError ? "skipped" : (derived ? (delivered ? "completed" : "failed") : "skipped"),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={title.toLowerCase().replaceAll(" ", "-")} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur">
      <h2 id={title.toLowerCase().replaceAll(" ", "-")} className="mb-4 text-sm font-semibold tracking-wide text-zinc-200">{title}</h2>
      {children}
    </section>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `${publicId.split("/").pop() ?? "Media"} · MediaFlow AI` };
}

export default async function MediaDetailPage({ params }: Props) {
  const { publicId } = await params;
  let decodedPublicId: string;
  try {
    decodedPublicId = decodeURIComponent(publicId);
  } catch {
    notFound();
  }

  let asset;
  try {
    asset = await findAsset(decodedPublicId);
  } catch (err) {
    if (err instanceof AssetNotFoundError) notFound();
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-lg font-semibold">Could not load media asset</h1>
          <p className="mt-2 text-sm text-zinc-400">The media service is currently unavailable.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-sky-400">
            <ArrowLeft className="size-4" aria-hidden /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  let variants: VariantsResult | null = null;
  let variantError = false;
  try {
    variants = await generateVariants(asset.publicId, asset.resourceType, [...PACK_IDS]);
  } catch {
    variantError = true;
  }
  const derived = variants?.variants.filter((variant) => variant.id !== "original") ?? [];
  const optimized = variants?.variants.find((variant) => variant.id === "optimized" && variant.check?.ok)?.url;
  const previewUrl = optimized ?? asset.secureUrl;
  const moderation = overallModeration(asset.moderation) ?? (
    asset.context?.moderation === "approved" ? "approved"
      : asset.context?.moderation === "rejected" ? "rejected"
      : asset.context?.moderation === "pending" ? "review"
      : "unavailable"
  );
  const context = asset.context ?? {};
  const pipeline = buildPipeline(context, moderation, derived.map((variant) => ({
    ok: variant.check?.ok ?? false,
    bytes: variant.check?.bytes,
  })), variantError);
  const tags = asset.tags.filter((tag) => tag !== "mediaflow");
  const filename = asset.filename ?? asset.publicId.split("/").pop();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="size-4" aria-hidden /> Dashboard
          </Link>
          <h1 className="mt-3 truncate text-2xl font-semibold" title={filename}>{filename}</h1>
          <p className="mt-1 break-all text-sm text-zinc-500">{asset.publicId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyUrlButton url={asset.secureUrl} />
          <a href={asset.secureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500">
            <ExternalLink className="size-3.5" aria-hidden /> Open media
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section aria-labelledby="preview-heading" className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <h2 id="preview-heading" className="sr-only">Media preview</h2>
          {asset.resourceType === "video" ? (
            <video src={previewUrl} controls playsInline preload="metadata" className="max-h-[70vh] min-h-80 w-full bg-black object-contain" aria-label={filename} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={filename} className="max-h-[70vh] min-h-80 w-full object-contain" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
            <span>{optimized ? "Optimized preview · f_auto · q_auto" : "Original secure delivery"}</span>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Open delivery</a>
          </div>
        </section>

        <Section title="Asset information">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div><dt className="text-xs text-zinc-500">Filename</dt><dd className="mt-1 break-words">{valueOrUnavailable(filename)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Resource type</dt><dd className="mt-1 capitalize">{valueOrUnavailable(asset.resourceType)}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-zinc-500">Public ID</dt><dd className="mt-1 break-all font-mono text-xs">{valueOrUnavailable(asset.publicId)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Format</dt><dd className="mt-1 uppercase">{valueOrUnavailable(asset.format)}</dd></div>
            <div><dt className="text-xs text-zinc-500">File size</dt><dd className="mt-1">{asset.bytes === undefined ? "Not available" : formatBytes(asset.bytes)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Dimensions</dt><dd className="mt-1">{asset.width === undefined || asset.height === undefined ? "Not available" : `${asset.width}×${asset.height}`}</dd></div>
            <div><dt className="text-xs text-zinc-500">Created</dt><dd className="mt-1">{formatDate(asset.createdAt)}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-zinc-500">Secure URL</dt><dd className="mt-1 break-all font-mono text-xs text-zinc-400">{valueOrUnavailable(asset.secureUrl)}</dd></div>
          </dl>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="AI tags">
          {tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="AI-generated tags">
              {tags.map((tag) => <li key={tag} className="rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-300">{tag}</li>)}
            </ul>
          ) : <p className="text-sm text-zinc-500">No AI tags available.</p>}
        </Section>

        <Section title="Moderation">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-400">Current result</span>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs">{moderationLabel(moderation)}</span>
          </div>
        </Section>
      </div>

      <Section title="Structured metadata">
        {Object.keys(context).length > 0 ? (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {Object.entries(context).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <dt className="text-xs font-medium text-zinc-500">{key}</dt>
                <dd className="mt-1 break-words text-sm text-zinc-200">{valueOrUnavailable(value)}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-sm text-zinc-500">Not available.</p>}
      </Section>

      <Section title="Pipeline processing status">
        <PipelineStatus state={pipeline} />
      </Section>

      <Section title="Generated transformations">
        {variantError && (
          <p role="alert" className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Generated variants are temporarily unavailable. No transformation URL is shown as generated until Cloudinary confirms delivery.
          </p>
        )}
        <MediaPack publicId={asset.publicId} resourceType={asset.resourceType} initial={variants} />
      </Section>

      <Section title="Optimized delivery">
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500">Optimized delivery URL</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-300">{previewUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500">
              <ExternalLink className="size-3.5" aria-hidden /> Preview / Open
            </a>
            <CopyUrlButton url={previewUrl} label={optimized ? "Copy optimized URL" : "Copy delivery URL"} />
          </div>
        </div>
      </Section>
    </div>
  );
}
