"use client";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-400">The page could not be loaded. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        Try again
      </button>
    </div>
  );
}