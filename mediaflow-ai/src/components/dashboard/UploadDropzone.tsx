"use client";

import { CircleAlert, CircleCheck, FileVideo, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { UploadResult } from "@/lib/cloudinary/upload-schemas";
import { formatBytes, mediaTypeOf, validateFile } from "@/lib/media";
import { uploadToCloudinary } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

type ItemStatus = "ready" | "uploading" | "uploaded" | "failed";

type QueuedFile = {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  message?: string;
  result?: UploadResult;
};

export function UploadDropzone() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);

  const patch = (id: string, changes: Partial<QueuedFile>) =>
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...changes } : f)));

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file): QueuedFile => {
      const error = validateFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: error ? "failed" : "ready",
        message: error ?? undefined,
      };
    });
    setQueue((q) => [...q, ...added]);
  }

  async function uploadAll() {
    setBusy(true);
    for (const item of queue.filter((f) => f.status === "ready")) {
      patch(item.id, { status: "uploading", progress: 0 });
      try {
        const result = await uploadToCloudinary(item.file, (progress) => patch(item.id, { progress }));
        patch(item.id, { status: "uploaded", progress: 100, result });
      } catch (err) {
        patch(item.id, {
          status: "failed",
          message: err instanceof Error ? err.message : "Upload failed.",
        });
      }
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
            {queue.map(({ id, file, status, progress, message, result }) => {
              const Icon = mediaTypeOf(file.type) === "video" ? FileVideo : ImageIcon;
              return (
                <li key={id} className="rounded-lg border border-zinc-800 p-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {file.type || "unknown type"} · {formatBytes(file.size)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs">
                      {status === "ready" && <span className="text-zinc-400">Ready</span>}
                      {status === "uploading" && (
                        <span className="flex items-center gap-1 text-sky-300">
                          <Loader2 className="size-3 animate-spin" aria-hidden /> {progress}%
                        </span>
                      )}
                      {status === "uploaded" && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <CircleCheck className="size-3" aria-hidden /> Uploaded
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
                      disabled={status === "uploading"}
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
                      className="mt-2 h-1 overflow-hidden rounded bg-zinc-800"
                    >
                      <div className="h-full bg-sky-500 transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  {status === "uploaded" && result && (
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {result.public_id} ·{" "}
                      <a href={result.secure_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
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
            {busy ? "Uploading…" : `Upload ${readyCount || ""} to Cloudinary`.replace("  ", " ")}
          </button>
        </>
      )}
    </section>
  );
}

