# Smoke test checklist

Run with real Cloudinary credentials in `.env.local`. Tick each item before a demo or deploy.

## Setup
- [ ] `npm install`, `npm run lint`, `npm run typecheck`, `npm test` all pass
- [ ] `npm run build` succeeds
- [ ] `git status` does not list `.env.local`; `.env.example` is tracked

## Connection
- [ ] `/api/cloudinary/status` returns `connected: true`
- [ ] Dashboard shows "Cloudinary connected"
- [ ] With a wrong `CLOUDINARY_API_SECRET`, status returns `CLOUDINARY_ERROR` (restore afterwards)
- [ ] With the secret blank, status returns `ENV_MISSING`

## Upload and pipeline
- [ ] JPG uploads: progress reaches 100% and INGEST, ANALYZE, ORGANIZE, TRANSFORM, OPTIMIZE, DELIVER turn green
- [ ] TAG and MODERATE show "unavailable" with a reason when add-on env vars are blank
- [ ] With an add-on configured, tags and/or moderation appear (not faked)
- [ ] A short MP4 uploads and its thumbnail variant is a JPG
- [ ] A PDF is rejected before upload; a file over the size limit is rejected
- [ ] Contextual metadata (`source`, `processed_at`, `tagging`, `moderation`) is visible on the asset in the Cloudinary Media Library

## Media pack and delivery
- [ ] Media pack shows Original, Web optimized, Website, Square, Portrait, Story, Thumbnail
- [ ] Variant URLs contain `c_fill,g_auto` and `f_auto,q_auto`
- [ ] Optimized variants report a smaller byte size than the original
- [ ] Unticking a pack and regenerating removes those variants
- [ ] Background removal shows "Feature unavailable in current Cloudinary configuration." when not enabled

## Search and detail page
- [ ] Uploaded assets appear in the dashboard grid after processing
- [ ] `/dashboard?search=<term>` filters without a full page reload
- [ ] Type and moderation filters work; empty results show the empty state
- [ ] `/media/<publicId>` shows original, tags, moderation, metadata, variants and pipeline
- [ ] An unknown public ID shows the not-found page

## Security
- [ ] After `npm run build`, no client bundle contains the secret name:
      `Get-ChildItem .next\static -Recurse -File | Select-String "CLOUDINARY_API_SECRET"` returns nothing
- [ ] DevTools Network tab never shows the API secret
- [ ] API errors return `{ success: false, error: { code, message } }` without stack traces
