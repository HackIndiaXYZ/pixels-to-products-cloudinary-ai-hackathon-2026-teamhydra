import Link from "next/link";
import { Layers } from "lucide-react";

const LINKS = [
  { href: "/#pipeline", label: "Pipeline" },
  { href: "/#features", label: "Features" },
  { href: "/#demo", label: "Demo" },
  { href: "/#team", label: "Team" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Layers className="size-5 text-sky-400" aria-hidden />
          MediaFlow AI
        </Link>
        <ul className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-zinc-100">{l.label}</Link>
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Upload Media
        </Link>
      </nav>
    </header>
  );
}