"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUpdateQuery } from "@/lib/use-update-query";

export function SearchBar() {
  const searchParams = useSearchParams();
  const current = searchParams.get("search") ?? "";
  const updateQuery = useUpdateQuery();
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => updateQuery("search", value.trim()), 300);
    return () => clearTimeout(t);
  }, [value, current, updateQuery]);

  return (
    <div role="search" className="relative w-full md:max-w-sm">
      <label htmlFor="media-search" className="sr-only">
        Search media by tag, metadata or name
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
      <input
        id="media-search"
        type="search"
        value={value}
        maxLength={100}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tags, metadata, name…"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pr-3 pl-9 text-sm placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-sky-500"
      />
    </div>
  );
}