"use client";

import { CircleAlert, CircleCheck, FileVideo, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { MediaPack } from "@/components/dashboard/MediaPack";
import { PipelineStatus } from "@/components/pipeline/PipelineStatus";
import type { UploadResult } from "@/lib/cloudinary/upload-schemas";
import { formatBytes, mediaTypeOf, validateFile } from "@/lib/media";
import { createPipelineState, withStage } from "@/lib/pipeline";
import { runPipeline, type PipelineOutput } from "@/lib/pipeline-client";
import { uploadToCloudinary } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import type { PipelineStageId, PipelineState, StageStatus } from "@/types/pipeline";

type ItemStatus = "ready" | "uploading" | "analyzing" | "done" | "failed";

type QueuedFile = {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  pipeline: PipelineState;
  message?: string;
  upload?: UploadResult;
  output?: PipelineOutput;
};

export function UploadDropzone() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);

  const patch = (id: string, changes: Partial<QueuedFile>) =>
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...changes } : f)));

  const setStage = (id: string, stage: PipelineStageId, status: StageStatus) =>
    setQueue((q) =>
      q.map((f) => (f.id === id ? { ...f, pipeline: withStage(f.pipeline, stage, status) } : f)),
    );

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file): QueuedFile => {
      const error = validateFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        pipeline: createPipelineState(),
        status: error ? "failed" : "ready",
        message: error ?? undefined,
      };
    });
    setQueue((q) => [...q, ...added]);
  }

  async function processItem(item: QueuedFile) {
    patch(item.id, { status: "uploading", progress: 0 });
    setStage(item.id, "INGEST", "processing");

    let upload: UploadResult;
    try {
      upload = await uploadToCloudinary(item.file, (progress) => patch(item.id, { progress }));
    } catch (err) {
      setStage(item.id, "INGEST", "failed");
      patch(item.id, { status: "failed", message: err instanceof Error ? err.message : "Upload failed." });
      return;
    }

    patch(item.id, { status: "analyzing", progress: 100, upload });
    try {
      const output = await runPipeline(upload, (stage, status) => setStage(item.id, stage, status));
      patch(item.id, { status: "done", output });
      router.refresh();
    } catch (err) {
      patch(item.id, { status: "failed", message: err instanceof Error ? err.message : "Processing failed." });
    }
  }

  async function uploadAll() {
    setBusy(true);
    for (const item of queue.filter((f) => f.status === "ready")) {
      await processItem(item);
    }
    setBusy(false);
  }

  const readyCount = queue.filter((f) => f.status === "ready").length;

  return (
    <section aria-labelledby="upload-heading" className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur">
      <h2 id="upload-heading" className="mb-3 font-medium">Upload media</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-sky-500 bg-sky-500/10" : "border-zinc-700",
        )}
      >
        <UploadCloud className="size-8 text-sky-400" aria-hidden />
        <p className="text-sm text-zinc-300">Drag and drop images or videos here</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          Browse files
        </button>
      </div>

      {queue.length > 0 && (
        <>
          <ul className="mt-4 space-y-2" aria-live="polite">
            {queue.map(({ id, file, status, progress, pipeline, message, upload, output }) => {
              const Icon = mediaTypeOf(file.type) === "video" ? FileVideo : ImageIcon;
              const active = status === "uploading" || status === "analyzing";
              const info = output?.info;
              return (
                <li key={id} className="space-y-2 rounded-lg border border-zinc-800 p-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {info
                          ? `${info.width ?? "?"}×${info.height ?? "?"} · ${(info.format ?? "").toUpperCase()} · ${formatBytes(info.bytes)}`
                          : `${file.type || "unknown type"} · ${formatBytes(file.size)}`}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs">
                      {status === "ready" && <span className="text-zinc-400">Ready</span>}
                      {status === "uploading" && (
                        <span className="flex items-center gap-1 text-sky-300">
                          <Loader2 className="size-3 animate-spin" aria-hidden /> {progress}%
                        </span>
                      )}
                      {status === "analyzing" && (
                        <span className="flex items-center gap-1 text-sky-300">
                          <Loader2 className="size-3 animate-spin" aria-hidden /> Processing
                        </span>
                      )}
                      {status === "done" && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <CircleCheck className="size-3" aria-hidden /> Analyzed &amp; organized
                        </span>
                      )}
                      {status === "failed" && (
                        <span className="flex items-center gap-1 text-red-400">
                          <CircleAlert className="size-3" aria-hidden /> {message}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      disabled={active}
                      onClick={() => setQueue((q) => q.filter((f) => f.id !== id))}
                      className="rounded p-1 text-zinc-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-40"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  {status === "uploading" && (
                    <div
                      role="progressbar"
                      aria-label={`Uploading ${file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      className="h-1 overflow-hidden rounded bg-zinc-800"
                    >
                      <div className="h-full bg-sky-500 transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                  )}

                  {status !== "ready" && !(status === "failed" && !upload && pipeline.INGEST === "pending") && (
                    <PipelineStatus state={pipeline} compact />
                  )}

                  {output && output.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1">
                      {output.tags.map((t) => (
                        <li key={t.name} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {output?.moderation && (
                    <p className="text-xs text-zinc-400">
                      Moderation: <span className="capitalize">{output.moderation}</span>
                    </p>
                  )}
                  {output &&
                    Object.entries(output.notes).map(([stage, note]) => (
                      <p key={stage} className="text-xs text-zinc-500">
                        {stage}: {note}
                      </p>
                    ))}

                  {output && (
                    <details className="rounded-lg border border-zinc-800 p-2">
                      <summary className="cursor-pointer text-xs font-medium text-zinc-300">Media pack</summary>
                      <div className="mt-3">
                        <MediaPack
                          publicId={output.info.publicId}
                          resourceType={output.info.resourceType}
                          initial={output.variants}
                        />
                      </div>
                    </details>
                  )}

                  {upload && (
                    <p className="truncate text-xs text-zinc-500">
                      {upload.public_id} ·{" "}
                      <a href={upload.secure_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                        Open
                      </a>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={uploadAll}
            disabled={busy || readyCount === 0}
            className="mt-3 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Processing…" : "Upload & run pipeline"}
          </button>
        </>
      )}
    </section>
  );
}