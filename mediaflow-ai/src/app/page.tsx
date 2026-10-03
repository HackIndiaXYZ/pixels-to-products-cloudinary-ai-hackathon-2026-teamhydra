import Link from "next/link";
import {
  ArrowRight, Braces, Crop, Eraser, Gauge, Search, ShieldCheck, Tags, UploadCloud,
} from "lucide-react";
import { PipelineStatus } from "@/components/pipeline/PipelineStatus";

const FEATURES = [
  { icon: UploadCloud, title: "Signed uploads", body: "Uploads are signed on the server, so the API secret never reaches the browser." },
  { icon: Tags, title: "Auto-tagging", body: "AI tags from Cloudinary, shown as chips on every asset." },
  { icon: ShieldCheck, title: "Moderation", body: "Approved, review or rejected, reported only when the feature is enabled." },
  { icon: Eraser, title: "Background removal", body: "Non-destructive: the original stays untouched." },
  { icon: Crop, title: "Smart crop", body: "Content-aware cropping for web and social sizes instead of naive center crops." },
  { icon: Search, title: "Search API", body: "Find assets by tags, metadata and public ID." },
  { icon: Braces, title: "Structured metadata", body: "Category, tags and moderation status stored with each asset." },
  { icon: Gauge, title: "f_auto + q_auto", body: "Every delivered URL uses automatic format and quality." },
];

const DEMO_STEPS = [
  { title: "Upload", body: "Drop an image or video into the dashboard." },
  { title: "Pipeline runs", body: "Eight stages run automatically and you can watch each one." },
  { title: "Get your media pack", body: "Website, Instagram, Story and thumbnail variants, delivered optimized." },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-sky-500/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <p className="mb-4 inline-block rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
            Cloudinary Hackathon · PS-04 · AI Media Pipelines
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Upload once.{" "}
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              AI does the rest.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            MediaFlow AI understands, organizes, transforms and delivers your media through one
            automated pipeline built on Cloudinary.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-zinc-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Upload Media <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/#pipeline"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 font-medium text-zinc-200 hover:bg-zinc-900"
            >
              See the pipeline
            </Link>
          </div>
        </div>
      </section>

      <section id="pipeline" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
        <h2 className="text-2xl font-semibold">The pipeline</h2>
        <p className="mt-2 mb-6 text-zinc-400">Every upload moves through the same eight stages.</p>
        <PipelineStatus variant="overview" />
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
        <h2 className="text-2xl font-semibold">Powered by Cloudinary</h2>
        <p className="mt-2 mb-8 max-w-2xl text-zinc-400">
          Some AI features need Cloudinary add-ons. MediaFlow checks what your account supports and
          reports unavailable features instead of faking results.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur">
              <Icon className="mb-3 size-5 text-sky-400" aria-hidden />
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="demo" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
        <h2 className="mb-8 text-2xl font-semibold">Demo workflow</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {DEMO_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-zinc-800 p-5">
              <span className="font-mono text-sm text-sky-400">0{i + 1}</span>
              <h3 className="mt-2 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="team" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">Team_Hydra</h2>
        <p className="mt-2 text-zinc-400">Building the media pipeline for PS-04, Track 1.</p>
      </section>
    </>
  );
}