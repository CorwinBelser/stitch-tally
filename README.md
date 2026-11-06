# 🧶 Stitch Tally
Mobile-first knitting pattern viewer: PDF import, counters, movable row/column guides, highlights, comment threads, and free cross-device sync with Google sign-in (Cloudflare Worker + KV).

## Layout
- `public/` – static app (Workers static assets)
- `worker.js` – `/api/*`: verifies Google ID tokens, issues sessions, stores data in KV. The first Google account to sign in owns the instance.
- `wrangler.jsonc` – config. The KV namespace is auto-created on first deploy; if your build can't do that, create one in the dashboard and add `"id": "<namespace id>"` to the binding.

## Google OAuth setup
Google Cloud Console → Credentials → OAuth client (Web). Authorized JavaScript origin: your `*.workers.dev` URL (and any custom domain). Put the client ID in `wrangler.jsonc` → `vars.GOOGLE_CLIENT_ID`.
