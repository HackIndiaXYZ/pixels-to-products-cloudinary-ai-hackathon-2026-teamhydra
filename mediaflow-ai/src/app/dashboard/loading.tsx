export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-900" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-900" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-zinc-900" />
    </div>
  );
}