import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function MediaNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
      <div>
        <SearchX className="mx-auto size-10 text-zinc-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">Media asset not found</h1>
        <p className="mt-2 text-sm text-zinc-500">The requested Cloudinary asset is unavailable or is not part of this media library.</p>
        <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
          <ArrowLeft className="size-4" aria-hidden /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
