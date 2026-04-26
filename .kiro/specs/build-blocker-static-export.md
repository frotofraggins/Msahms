# 🛑 Build Blocker — Static Export Fails on Current Main

Author: Kiro A, 2026-04-25T17:35Z. Status: **Blocks deploy.**
Discovered when Kiro B reported "Ready to merge and deploy" — but
`npm run build` in the frontend never actually ran.

## The problem

`cd frontend && npm run build` currently fails with **two** errors:

### Error 1 — sitemap.ts and robots.ts incompatible with static export

```
Error: export const dynamic = "force-static"/export const revalidate not
configured on route "/robots.txt" with "output: export"
```

Next.js 15 treats `MetadataRoute.Sitemap` and `MetadataRoute.Robots`
as dynamic by default. With `output: 'export'` in `next.config.ts`
they have to be explicitly marked static.

**Fix** (confirmed locally by Kiro A):

```diff
// frontend/src/app/sitemap.ts
  import type { MetadataRoute } from 'next';
+ export const dynamic = 'force-static';
  const BASE_URL = 'https://mesahomes.com';
```

```diff
// frontend/src/app/robots.ts
  import type { MetadataRoute } from 'next';
+ export const dynamic = 'force-static';
  export default function robots(): MetadataRoute.Robots {
```

Two lines. Build continues past this point with those fixes.

### Error 2 — Dashboard dynamic route can't static-export

```
Error: Page "/dashboard/leads/[id]" is missing "generateStaticParams()"
so it cannot be used with "output: export" config.
```

The dashboard is a logged-in SPA. Dashboard data loads client-side at
runtime. But Next.js needs to know what static paths to prerender at
build time, and there's no way to know which lead IDs exist at that
point.

**Options**, in order of preference:

#### Option A — Split to server wrapper + client component (recommended)

Pattern: server `page.tsx` exports `generateStaticParams` returning a
placeholder, then renders the client component which handles routing
from window.location.

```tsx
// frontend/src/app/dashboard/leads/[id]/page.tsx  (new server file)
import LeadDetailClient from './LeadDetailClient';

export function generateStaticParams(): Array<{ id: string }> {
  // Static export needs at least one known param; the client component
  // reads window.location.pathname to get the real id at runtime.
  return [{ id: '_' }];
}

export default function Page() {
  return <LeadDetailClient />;
}
```

Then rename the current `page.tsx` to `LeadDetailClient.tsx` keeping
`'use client'` directive, and update it to read the id from
`window.location.pathname` instead of `useParams()` since `useParams()`
returns the placeholder `'_'` after static export.

**Gotcha**: CloudFront must serve
`/dashboard/leads/:id` → same static page. Options:
1. S3 static site hosting with error document set to `404.html`
   (works but SEO-unfriendly)
2. CloudFront function that rewrites any `/dashboard/leads/*` to
   `/dashboard/leads/_/index.html` (recommended)
3. Stop pre-rendering dashboard — use a single `/dashboard` entry
   that handles client routing for all sub-routes

#### Option B — Remove the dynamic dashboard route, use query string

Move `/dashboard/leads/[id]` to `/dashboard/leads/detail?id=...`.
Dashboard is behind auth, so no SEO loss. Change links to use the
query param.

#### Option C — Switch away from static export (don't do this now)

Next.js SSR on Lambda@Edge is possible but invasive. Would require
rebuilding the CloudFront distribution and CDK stack. Not worth it
for MVP.

**Recommendation**: Option A with CloudFront function rewrite. Kiro B
can handle this in ~30 min. Don't escalate to Option C.

## Impact

Until this is fixed:
- `npm run build` fails → nothing to upload to S3
- `cdk deploy` succeeds but CloudFront will serve stale/empty content
- Deploy is blocked

## What Kiro B needs to do

1. Apply the 2-line sitemap/robots fix above
2. Pick Option A or B for dashboard route
3. If Option A, coordinate with Kiro A on CloudFront function
   (simple JS rewrite rule added to the CDK stack)
4. Re-run `npm run build` — confirm exit code 0 and `out/` directory
   is populated
5. Run full test suite `npx vitest run` — confirm still at 852 tests
6. Commit: `fix(build): repair static-export build blockers — sitemap,
   robots, dashboard dynamic route`

## Verification after fix

```bash
cd frontend
rm -rf .next out
npm run build
ls -la out/  # should contain index.html + all 30+ pages
```

## Why this matters for the claim "ready to deploy"

Kiro B's message said "Ready to merge to main and deploy" but did not
run the static export build. This is exactly what Phase F verification
in `frontend-visual-upgrade-2026.md` exists to catch. It was skipped.

Updating STEERING.md to require `npm run build` in the verification
gate would prevent recurrence. Will add that in a follow-up commit.

## Status

🛑 **Do not merge to main or run `cdk deploy` until `npm run build`
exits 0.**
