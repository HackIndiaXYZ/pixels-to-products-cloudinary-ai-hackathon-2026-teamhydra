"use client";

import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import type { VariantsResult } from "@/lib/cloudinary/variants-schemas";
import { formatBytes } from "@/lib/media";
import { post } from "@/lib/pipeline-client";
import { PACKS } from "@/lib/transform";
import type { MediaType, MediaVariant, PackId } from "@/types/media";

type Props = {
  publicId: string;
  resourceType: MediaType;
  initial: VariantsResult | null;
};

const PACK_ORDER = Object.keys(PACKS) as PackId[];

function VariantCard({ variant, original, resourceType }: { variant: MediaVariant; original?: number; resourceType: MediaType }) {
  const [copied, setCopied] = useState(false);
  const { check } = variant;
  const isVideo = resourceType === "video" && variant.id !== "thumbnail";
  const saved = original && check?.bytes && check.bytes < original ? Math.round((1 - check.bytes / original) * 100) : null;
  const size = variant.height ? `${variant.width}×${variant.height}` : variant.width ? `≤${variant.width}px wide` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(variant.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <li className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60">
      {isVideo ? (
        <video src={variant.url} muted controls preload="metadata" className="aspect-video w-full bg-black object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={variant.url} alt={variant.label} loading="lazy" className="aspect-video w-full bg-black object-contain" />
      )}
      <div className="space-y-1 p-2 text-xs">
        <p className="font-medium text-zinc-200">{variant.label}</p>
        <p className="text-zinc-500">
          {size}
          {check?.contentType ? ` · ${check.contentType.split("/")[1]}` : ""}
          {check?.bytes ? ` · ${formatBytes(check.bytes)}` : ""}
          {saved ? <span className="text-emerald-400"> · −{saved}%</span> : null}
        </p>
        {check && !check.ok && <p className="text-red-400">Not delivered{check.status ? ` (HTTP ${check.status})` : ""}</p>}
        {variant.transformation && <code className="block break-all text-[11px] text-sky-300">{variant.transformation}</code>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-0.5 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500">
            {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            {copied ? "Copied" : "Copy URL"}
          </button>
          <a href={variant.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-0.5 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500">
            <ExternalLink className="size-3" aria-hidden /> Open
          </a>
        </div>
      </div>
    </li>
  );
}

export function MediaPack({ publicId, resourceType, initial }: Props) {
  const [selected, setSelected] = useState<PackId[]>(PACK_ORDER);
  const [result, setResult] = useState<VariantsResult | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(pack: PackId) {
    setSelected((s) => (s.includes(pack) ? s.filter((p) => p !== pack) : [...s, pack]));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setResult(await post<VariantsResult>("/api/cloudinary/variants", { publicId, resourceType, packs: selected }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the media pack.");
    } finally {
      setLoading(false);
    }
  }

  const originalBytes = result?.variants.find((v) => v.id === "original")?.check?.bytes;

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="sr-only">Media pack targets</legend>
        {PACK_ORDER.map((pack) => (
          <label key={pack} className="flex items-center gap-1.5 text-xs text-zinc-300">
            <input type="checkbox" checked={selected.includes(pack)} onChange={() => toggle(pack)} className="accent-sky-500" />
            {PACKS[pack].label}
          </label>
        ))}
        <button
          type="button"
          onClick={generate}
          disabled={loading || selected.length === 0}
          className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-50"
        >
          {loading && <Loader2 className="size-3 animate-spin" aria-hidden />}
          Generate Media Pack
        </button>
      </fieldset>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

      {result && (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.variants.map((v) => (
              <VariantCard key={v.id} variant={v} original={originalBytes} resourceType={resourceType} />
            ))}
            {result.backgroundRemoval.available && (
              <VariantCard variant={result.backgroundRemoval.variant} original={originalBytes} resourceType={resourceType} />
            )}
          </ul>
          {!result.backgroundRemoval.available && (
            <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Background removed:</span> {result.backgroundRemoval.reason}
            </p>
          )}
          <p className="text-[11px] text-zinc-500">
            Variants are Cloudinary transformations of the original, not separate copies. Sizes and formats were
            measured from the CDN for a browser that accepts AVIF/WebP.
          </p>
        </>
      )}
    </div>
  );
}