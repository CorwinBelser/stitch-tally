# 🧶 Stitch Tally
Mobile-first knitting pattern viewer + counters. Static site, no build step. All data (PDFs, counts, notes) stays in your browser (IndexedDB) — use ⋯ → Export for backups.

## Deploy
1. `git init && git add . && git commit -m "Initial commit"`
2. Create an empty GitHub repo, then `git remote add origin <url> && git branch -M main && git push -u origin main`
3. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   Framework preset: **None**, build command: *(blank)*, output directory: `/`.
4. On your phone, open the `*.pages.dev` URL → browser menu → **Add to Home screen**.

Every `git push` to `main` redeploys automatically. Bump `V` in `sw.js` when you ship changes so installed copies refresh.
