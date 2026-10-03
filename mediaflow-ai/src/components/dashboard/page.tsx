import type { Metadata } from "next";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { MediaGrid } from "@/components/dashboard/MediaGrid";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { hasActiveFilters, parseFilters } from "@/lib/media";
import type { MediaAsset } from "@/types/media";

export const metadata: Metadata = { title: "Dashboard · MediaFlow AI" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  // Loaded from the Cloudinary Search API once Phase 9 is implemented.
  const assets: MediaAsset[] = [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <StatsBar assets={assets} />
      <UploadDropzone />
      <section aria-labelledby="media-heading" className="space-y-4">
        <h2 id="media-heading" className="font-medium">Recent media</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchBar />
          <FilterPanel filters={filters} />
        </div>
        <MediaGrid assets={assets} filtered={hasActiveFilters(filters)} />
      </section>
    </div>
  );
}