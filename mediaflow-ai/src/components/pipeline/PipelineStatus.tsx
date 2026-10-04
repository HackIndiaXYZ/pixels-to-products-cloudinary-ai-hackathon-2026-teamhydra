import {
  Check, Crop, FolderTree, Gauge, Loader2, Minus, ScanSearch,
  Send, ShieldCheck, Tags, UploadCloud, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PIPELINE_STAGE_IDS, type PipelineState, type PipelineStageId, type StageStatus,
} from "@/types/pipeline";

const STAGES: Record<PipelineStageId, { label: string; hint: string; icon: LucideIcon }> = {
  INGEST: { label: "Ingest", hint: "Signed upload to Cloudinary", icon: UploadCloud },
  ANALYZE: { label: "Analyze", hint: "Read asset info and dimensions", icon: ScanSearch },
  TAG: { label: "Tag", hint: "AI auto-tagging", icon: Tags },
  MODERATE: { label: "Moderate", hint: "Content moderation", icon: ShieldCheck },
  ORGANIZE: { label: "Organize", hint: "Structured metadata", icon: FolderTree },
  TRANSFORM: { label: "Transform", hint: "Smart crops and variants", icon: Crop },
  OPTIMIZE: { label: "Optimize", hint: "f_auto and q_auto", icon: Gauge },
  DELIVER: { label: "Deliver", hint: "Optimized CDN URLs", icon: Send },
};

const STATUS_STYLE: Record<StageStatus, string> = {
  pending: "border-zinc-800 bg-zinc-900/40 text-zinc-500",
  processing: "border-sky-500/50 bg-sky-500/10 text-sky-300",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-500/50 bg-red-500/10 text-red-300",
  skipped: "border-dashed border-zinc-700 bg-zinc-900/40 text-zinc-500",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
  skipped: "unavailable",
};

function StatusIcon({ status, className = "size-4" }: { status: StageStatus; className?: string }) {
  if (status === "completed") return <Check className={className} aria-hidden />;
  if (status === "failed") return <X className={className} aria-hidden />;
  if (status === "skipped") return <Minus className={className} aria-hidden />;
  if (status === "processing") return <Loader2 className={cn(className, "animate-spin")} aria-hidden />;
  return <span className="size-2 rounded-full bg-current" aria-hidden />;
}

type Props = {
  /** Omit with variant="overview" to show the pipeline description only. */
  state?: PipelineState;
  variant?: "live" | "overview";
  compact?: boolean;
  className?: string;
};

export function PipelineStatus({ state, variant = "live", compact = false, className }: Props) {
  const overview = variant === "overview";
  return (
    <ol
      className={cn(
        compact ? "flex flex-wrap gap-1.5" : "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8",
        className,
      )}
    >
      {PIPELINE_STAGE_IDS.map((id, i) => {
        const { label, hint, icon: Icon } = STAGES[id];
        const status = state?.[id] ?? "pending";

        if (compact) {
          return (
            <li
              key={id}
              aria-label={`${label}: ${STATUS_LABEL[status]}`}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] tracking-wide uppercase",
                STATUS_STYLE[status],
              )}
            >
              <StatusIcon status={status} className="size-3" />
              {label}
            </li>
          );
        }

        return (
          <li
            key={id}
            aria-label={overview ? label : `${label}: ${STATUS_LABEL[status]}`}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3 backdrop-blur transition-colors",
              overview ? "border-zinc-800 bg-zinc-900/50 text-zinc-300" : STATUS_STYLE[status],
            )}
          >
            <div className="flex items-center justify-between">
              <Icon className="size-5" aria-hidden />
              {overview ? (
                <span className="font-mono text-xs text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
              ) : (
                <StatusIcon status={status} />
              )}
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase">{label}</p>
            <p className="text-xs text-zinc-500">{overview ? hint : STATUS_LABEL[status]}</p>
          </li>
        );
      })}
    </ol>
  );
}