import { computeStats } from "@/lib/media";
import type { MediaAsset } from "@/types/media";

export function StatsBar({ assets }: { assets: MediaAsset[] }) {
  const s = computeStats(assets);
  const items = [
    ["Total Media", s.total],
    ["Processed", s.processed],
    ["Approved", s.approved],
    ["Needs Review", s.needsReview],
    ["Variants Generated", s.variants],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur">
          <dt className="text-xs text-zinc-500">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}