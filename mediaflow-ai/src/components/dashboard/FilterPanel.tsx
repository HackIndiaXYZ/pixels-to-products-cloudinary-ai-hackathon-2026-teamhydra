"use client";

import { cn } from "@/lib/utils";
import { useUpdateQuery } from "@/lib/use-update-query";
import type { DashboardFilters } from "@/types/media";

const GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [["all", "All"], ["image", "Images"], ["video", "Videos"]],
  },
  {
    key: "moderation",
    label: "Moderation",
    options: [["all", "All"], ["approved", "Approved"], ["review", "Review"], ["rejected", "Rejected"]],
  },
] as const;

export function FilterPanel({ filters }: { filters: DashboardFilters }) {
  const updateQuery = useUpdateQuery();

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {GROUPS.map((group) => (
        <fieldset key={group.key} className="flex items-center gap-2">
          <legend className="sr-only">{group.label}</legend>
          <span aria-hidden className="text-xs text-zinc-500">{group.label}</span>
          {group.options.map(([value, label]) => {
            const active = filters[group.key] === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => updateQuery(group.key, value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-sky-500",
                  active
                    ? "border-sky-500/60 bg-sky-500/15 text-sky-300"
                    : "border-zinc-800 text-zinc-400 hover:bg-zinc-900",
                )}
              >
                {label}
              </button>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}