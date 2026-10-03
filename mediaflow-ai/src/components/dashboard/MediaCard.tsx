"use client";

import { Check, Copy, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MediaAsset, ModerationStatus } from "@/types/media";

const MODERATION_STYLE: Record<ModerationStatus, string> = {
  approved: "bg-emerald-500/15 text-emerald-300",
  review: "bg-amber-500/15 text-amber-300",
  rejected: "bg-red-500/15 text-red-300",
  pending: "bg-zinc-800 text-zinc-400",
  unavailable: "bg-zinc-800 text-zinc-500",
};

export function MediaCard({ asset }: { asset: MediaAsset }) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.secureUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const actionClass =
    "inline-flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
      {/* Thumbnail URLs are already Cloudinary-optimized (f_auto, q_auto). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.thumbnailUrl} alt={asset.filename} loading="lazy" className="aspect-video w-full object-cover" />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium" title={asset.filename}>{asset.filename}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", MODERATION_STYLE[asset.moderation])}>
            {asset.moderation}
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          {asset.type} · {asset.format.toUpperCase()} · {asset.width}×{asset.height} · {asset.processing}
        </p>
        {asset.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 5).map((t) => (
              <li key={t.name} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">{t.name}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/media/${encodeURIComponent(asset.publicId)}`} className={actionClass}>
            <Eye className="size-3" aria-hidden /> View
          </Link>
          <button type="button" onClick={copyUrl} className={actionClass}>
            {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            {copied ? "Copied" : "Copy URL"}
          </button>
          <a href={asset.secureUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <ExternalLink className="size-3" aria-hidden /> Open
          </a>
        </div>
      </div>
    </article>
  );
}