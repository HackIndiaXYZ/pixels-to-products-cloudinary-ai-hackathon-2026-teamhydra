"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = { url: string; label?: string };

export function CopyUrlButton({ url, label = "Copy URL" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} aria-label={copied ? "URL copied" : label}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-sky-500">
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}
