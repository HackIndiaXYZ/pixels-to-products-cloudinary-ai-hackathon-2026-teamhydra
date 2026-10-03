"use client";

import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";

type State =
  | { kind: "loading" }
  | { kind: "connected"; cloudName: string; plan?: string }
  | { kind: "error"; message: string };

export function CloudinaryStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cloudinary/status", { signal: controller.signal })
      .then((res) => res.json() as Promise<ApiResponse<{ cloudName: string; plan?: string }>>)
      .then((body) =>
        setState(
          body.success
            ? { kind: "connected", ...body.data }
            : { kind: "error", message: body.error.message },
        ),
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ kind: "error", message: "Could not check Cloudinary status." });
      });
    return () => controller.abort();
  }, []);

  return (
    <p role="status" className="flex items-center gap-2 text-xs text-zinc-400">
      {state.kind === "loading" && (
        <><Loader2 className="size-3.5 animate-spin" aria-hidden /> Checking Cloudinary…</>
      )}
      {state.kind === "connected" && (
        <>
          <CircleCheck className="size-3.5 text-emerald-400" aria-hidden />
          Cloudinary connected ({state.cloudName}
          {state.plan ? `, ${state.plan} plan` : ""})
        </>
      )}
      {state.kind === "error" && (
        <><CircleAlert className="size-3.5 text-red-400" aria-hidden /> {state.message}</>
      )}
    </p>
  );
}