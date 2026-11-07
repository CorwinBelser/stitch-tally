# 🧶 Stitch Tally
Mobile-first knitting pattern viewer: PDF import, counters, movable row/column guides, highlights, comment threads, and free cross-device sync with Google sign-in (Cloudflare Worker + KV).

## Layout
- `public/` – static app (Workers static assets)
- `worker.js` – `/api/*`: verifies Google ID tokens, issues sessions, stores data in KV. The first Google account to sign in owns the instance.
- `wrangler.jsonc` – config. The KV namespace is auto-created on first deploy; if your build can't do that, create one in the dashboard and add `"id": "<namespace id>"` to the binding.

## Google OAuth setup
Google Cloud Console → Credentials → OAuth client (Web). Authorized JavaScript origin: your `*.workers.dev` URL (and any custom domain). Put the client ID in `wrangler.jsonc` → `vars.GOOGLE_CLIENT_ID`.

## Features added in v3
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z, plus on-screen buttons) covers counters, guides, highlights and comments.
- Row text: reads the PDF's own text layer for "Row N", "Rnd N" and "1st row" lines and shows the one matching the active counter.
- Free library (`public/library.json`): public-domain vintage patterns. `/api/lib/:id` streams the listed archive.org PDFs through the Worker. Only catalog entries can be fetched.

## Features added in v4
- Continuous scroll mode (toolbar "Scroll"): all pages stacked, rendered lazily as you scroll; annotations and guides work on every page.
- Pinned regions (toolbar "Pin"): drag a box around a key or chart and it stays docked above the counter. Tap the active tab to jump to its page.
- Row reminders (counter settings): "at row 14, start decreases". Fires on increments, including +10 jumps and each round of repeat counters.

## Ravelry import (v5)
1. Create an app at <https://www.ravelry.com/pro/developer> (OAuth 2.0). Set the callback URL to `https://<your-worker>.workers.dev/api/rav/callback` (your real domain).
2. In Cloudflare: Workers & Pages → stitch-tally → Settings → Variables and Secrets → add two **Secrets**: `RAVELRY_CLIENT_ID` and `RAVELRY_CLIENT_SECRET`.
3. In the app: sign in with Google, tap 🧶, then Connect Ravelry. The Worker stores the Ravelry token in KV (never sent to the browser) and requests the `offline` and `library-pdf` scopes.
Imports are for your own purchased patterns, for personal use. Don't share downloaded PDFs.
