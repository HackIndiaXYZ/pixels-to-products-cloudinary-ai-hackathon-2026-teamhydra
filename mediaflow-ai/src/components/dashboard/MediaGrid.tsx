import { ImageOff } from "lucide-react";
import type { MediaAsset } from "@/types/media";
import { MediaCard } from "./MediaCard";

type Props = { assets: MediaAsset[]; filtered: boolean };

export function MediaGrid({ assets, filtered }: Props) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
        <ImageOff className="size-8 text-zinc-600" aria-hidden />
        <p className="font-medium">{filtered ? "No media matches your filters" : "No media yet"}</p>
        <p className="text-sm text-zinc-500">
          {filtered ? "Try a different search or clear the filters." : "Upload an image or video to start the pipeline."}
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <li key={asset.publicId}>
          <MediaCard asset={asset} />
        </li>
      ))}
    </ul>
  );
}