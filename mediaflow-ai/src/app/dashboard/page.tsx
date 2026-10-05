import type { Metadata } from "next";
import { CloudinaryStatus } from "@/components/dashboard/CloudinaryStatus";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { MediaGrid } from "@/components/dashboard/MediaGrid";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { classifyError } from "@/lib/cloudinary/errors";
import { searchAssets } from "@/lib/cloudinary/search";
import { DEFAULT_FILTERS, hasActiveFilters, parseFilters } from "@/lib/media";
import type { MediaAsset } from "@/types/media";

export const metadata: Metadata = { title: "Dashboard · MediaFlow AI" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const filtered = hasActiveFilters(filters);

  let assets: MediaAsset[] = [];
  let all: MediaAsset[] = [];
  let error: string | null = null;
  try {
    assets = await searchAssets(filters);
    // Stats describe the whole library, not the current filter.
    all = filtered ? await searchAssets(DEFAULT_FILTERS) : assets;
  } catch (err) {
    error = classifyError(err).message;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <CloudinaryStatus />
      </div>
      <StatsBar assets={all} />
      <UploadDropzone />
      <section aria-labelledby="media-heading" className="space-y-4">
        <h2 id="media-heading" className="font-medium">Recent media</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchBar />
          <FilterPanel filters={filters} />
        </div>
        {error ? (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Could not load media: {error}
          </div>
        ) : (
          <MediaGrid assets={assets} filtered={filtered} />
        )}
      </section>
    </div>
  );
}