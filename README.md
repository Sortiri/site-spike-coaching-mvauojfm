# Sortiri Sites template: Coach Studio

A spec-driven coach website. Every page renders from a single validated
*site spec* (see the control plane's `web/convex/lib/websiteSpec.ts` in the
Sortiri monorepo; keep `lib/spec.ts` types in sync with it).

## How editing works (three tiers)

1. **Content edits are live.** The spec lives in this site's own Convex
   deployment as `draft`/`published` documents (`convex/site.ts`). The
   Sortiri editor writes the draft; opening any page with
   `?preview=<token>` subscribes to the draft and re-renders in place — no
   build, no reload.
2. **Publishing takes seconds.** Publish copies draft to published in Convex
   and calls `POST /api/revalidate` (header `x-revalidate-secret`), which
   invalidates the cached spec so the next request serves fresh static HTML.
3. **Code changes deploy through git.** Template upgrades and integration
   installs are commits: Vercel builds the frontend, and
   `.github/workflows/deploy-convex.yml` runs `convex deploy` for the
   backend when `convex/**` changes.

## Running locally

```bash
npm install
npm run dev
```

With no environment set, the site renders from the bundled
`site.spec.json` snapshot. To run against a real backend:

- `NEXT_PUBLIC_CONVEX_URL` — this site's Convex deployment URL.
- `SITE_EDITOR_SECRET` — Convex env var the Sortiri control plane presents
  when writing specs (`npx convex env set SITE_EDITOR_SECRET ...`).
- `REVALIDATE_SECRET` — Vercel env var checked by `/api/revalidate`.
- `CONVEX_DEPLOY_KEY` — GitHub Actions secret for backend deploys.

Seed the spec documents after the first backend deploy:

```bash
npx convex run site:setSpec '{"editorSecret":"...","key":"draft","spec":{...},"revision":1}'
npx convex run site:setSpec '{"editorSecret":"...","key":"published","spec":{...},"revision":1}'
```

The backend uses generic Convex constructors on purpose: there is no
checked-in codegen, so `convex deploy` works from a fresh clone.
