export default function MediaDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8" aria-busy="true" aria-label="Loading media detail">
      <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
      <div className="h-9 w-2/3 animate-pulse rounded bg-zinc-800" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="min-h-96 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
        <div className="min-h-96 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-32 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
        <div className="h-32 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
      </div>
    </div>
  );
}
