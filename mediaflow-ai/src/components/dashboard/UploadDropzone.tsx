"use client";

import { FileVideo, ImageIcon, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatBytes, mediaTypeOf, validateFile } from "@/lib/media";

type QueuedFile = { id: string; file: File; error: string | null };

export function UploadDropzone() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      error: validateFile(file),
    }));
    setQueue((q) => [...q, ...added]);
  }

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
            {queue.map(({ id, file, error }) => {
              const Icon = mediaTypeOf(file.type) === "video" ? FileVideo : ImageIcon;
              return (
                <li key={id} className="flex items-center gap-3 rounded-lg border border-zinc-800 p-2 text-sm">
                  <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {file.type || "unknown type"} · {formatBytes(file.size)}
                    </p>
                  </div>
                  <span className={cn("text-xs", error ? "text-red-400" : "text-zinc-400")}>
                    {error ?? "Ready"}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setQueue((q) => q.filter((f) => f.id !== id))}
                    className="rounded p-1 text-zinc-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-sky-500"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            disabled
            title="Cloudinary upload is connected in Phase 5"
            className="mt-3 rounded-lg bg-sky-500/40 px-4 py-2 text-sm font-medium text-zinc-950/70"
          >
            Upload &amp; run pipeline (not connected yet)
          </button>
        </>
      )}
    </section>
  );
}