# SEO Architecture — Bake It In From Day One

Author: Kiro A, 2026-04-24. Status: spec — actionable before/during Task 11.

## Why this matters (2026 reality)

Three crawler groups each behave differently:

1. **Googlebot + Bingbot** — render JavaScript. Use a two-wave indexer:
   wave 1 reads raw HTML immediately, wave 2 renders JS hours-to-days later.
   Content only in wave 2 gets indexed slower and ranks lower.
2. **AI search crawlers** (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot,
   Google-Extended, Meta-ExternalAgent) — **do NOT execute JavaScript at all.**
   They read the raw HTML response and move on. Client-side-rendered content
   is invisible to them. Confirmed across multiple 2026 sources (ziptie.dev,
   metaflow.life, fiftyfiveandfive.com).
3. **Social preview crawlers** (Facebook, LinkedIn, X, iMessage) — read Open
   Graph + Twitter Card meta only. No JS execution.

Consequence for MesaHomes: when a Mesa buyer asks ChatGPT "should I sell my
house in San Tan Valley," we're only in the answer if our HTML (not our JS)
has the content, the schema, and the canonical URL right.

## Current state (what Kiro B already did right)

`frontend/next.config.ts`:
```ts
output: 'export',
images: { unoptimized: true },
```

This is Next.js Static Site Generation. Every page gets pre-built to HTML at
build time, served from S3 + CloudFront. First-wave Googlebot and every AI
crawler see the full content with zero JS execution required. This is the
best possible rendering mode for SEO in 2026.

Kiro B's `FAQSection` already outputs JSON-LD Schema.org `FAQPage`. That's
the pattern for every page type.

## What's missing (Task 11 must include)

### 1. Per-page metadata via Next.js Metadata API

Every `page.tsx` exports a `metadata` object or `generateMetadata()` async
function. Minimum fields per public page:

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seller Net Sheet Calculator | MesaHomes',
  description: 'See exactly what you'll net from your home sale in Mesa, AZ. Itemized deductions, flat-fee vs traditional comparison, no contact info required for the estimate.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/net-sheet',
  },
  openGraph: {
    title: 'Seller Net Sheet Calculator',
    description: 'See what you'll net on your Mesa home sale.',
    url: 'https://mesahomes.com/tools/net-sheet',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seller Net Sheet Calculator',
    description: 'See what you'll net on your Mesa home sale.',
  },
};
```

For dynamic pages (`/areas/[slug]`, `/blog/[slug]`) use `generateMetadata({ params })`.

### 2. Root layout metadata defaults

`frontend/src/app/layout.tsx` sets base values overridable per page:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://mesahomes.com'),
  title: {
    default: 'MesaHomes — Flat-Fee Real Estate in Mesa, AZ',
    template: '%s | MesaHomes',
  },
  description: 'Flat-fee MLS listings, county-verified home data, and honest tools for buyers and sellers in the Mesa metro.',
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};
```

The `template` auto-appends `| MesaHomes` to every page title.

### 3. JSON-LD per page type

Render as `<script type="application/ld+json">` in the page's server
component (not client). Next.js official guidance (April 2026) — sanitize
`<` to `\u003c` to prevent XSS:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

Schemas per page type:

| Page | Schema.org type | Why |
|------|-----------------|-----|
| Homepage | `RealEstateAgent` + `LocalBusiness` | Name, address, phone, service area, reviews |
| `/areas/[slug]` | `Place` + `FAQPage` | City name, geo coordinates, FAQ |
| `/tools/*` | `WebApplication` | App name, description, pricing (free) |
| `/blog/[slug]` | `Article` | headline, author, datePublished, dateModified |
| `/reviews` | `AggregateRating` + individual `Review` | Star count, review text |
| Property lookup result | `Place` with postal address | Already county-verified |
| `/compare/flat-fee-vs-traditional-agent` | `Service` with `offers` | Service tier breakdown |

Use the `schema-dts` npm package for TypeScript type safety:
```ts
import type { RealEstateAgent, WithContext } from 'schema-dts';
const jsonLd: WithContext<RealEstateAgent> = { ... };
```

### 4. robots.txt with AI-crawler allowlist

Create `frontend/src/app/robots.ts` (Next.js convention):

```ts
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // Explicitly allow AI crawlers
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Meta-ExternalAgent', allow: '/' },
      // Block nothing for now — we want maximum visibility
    ],
    sitemap: 'https://mesahomes.com/sitemap.xml',
  };
}
```

### 5. sitemap.xml (already in spec as Task 12.12)

Create `frontend/src/app/sitemap.ts`. Includes every published static page,
every city page slug, every blog post slug. Regenerates on each build.

### 6. Additional technical SEO checklist

- Every page has a unique `<h1>` (one, not zero, not two)
- All images have alt text (`<Image alt="..." />`)
- All links use descriptive anchor text (not "click here")
- Trailing slash policy decided and consistent (Next.js default: no trailing slash for pages)
- No `noindex` on public pages accidentally
- Canonical URL on every page (via `alternates.canonical` above)

## Content-side SEO (copy guidance for tools/pages)

This is the part Kiro B (or you) shape with content:

### Page titles — pattern

`<Primary Keyword> + <Geographic Modifier> + <Brand>`

| Page | Title |
|------|-------|
| Homepage | MesaHomes — Flat-Fee Real Estate in Mesa, AZ |
| `/sell` | Sell Your Mesa Home for a Flat Fee \| MesaHomes |
| `/tools/net-sheet` | Seller Net Sheet Calculator — Mesa, AZ \| MesaHomes |
| `/tools/home-value` | What's My Mesa Home Worth? Free County-Verified Estimate |
| `/tools/affordability` | How Much House Can I Afford in Mesa, AZ? |
| `/areas/mesa` | Mesa, AZ Home Values & Market Trends (2026) |
| `/areas/san-tan-valley` | San Tan Valley, AZ (85140) Home Values & Market |
| `/areas/gilbert` | Gilbert, AZ Home Values & Market Trends |
| `/blog/[slug]` | {post title} \| MesaHomes |
| `/compare/flat-fee-vs-traditional-agent` | Flat Fee vs Traditional Agent — What You'll Save |

Keep under 60 characters after the `| MesaHomes` suffix.

### Meta descriptions — pattern

`<What the page answers> + <Why it's unique> + <Action>`

Target 140-155 characters. Examples:

- "/tools/net-sheet" — "See exactly what you'll net from your Mesa home sale. Itemized deductions, flat-fee vs traditional comparison. No contact info required for the estimate."
- "/areas/san-tan-valley" — "San Tan Valley (85140) home values, days on market, and price trends from Pinal County assessor data. Updated monthly."
- "/compare/flat-fee-vs-traditional-agent" — "Compare MesaHomes flat fee ($999 + $400 broker) vs traditional 5-6% commission. See your exact savings based on your home's price."

### H1 per page

The H1 restates the title in natural language (not keyword-stuffed). The
title is for search results; the H1 is for the human who clicks through.

### Keywords worth ranking for (seed list)

Based on the differentiator analysis: county-verified, flat-fee, local.

| Intent | Query | Page |
|--------|-------|------|
| Seller commercial | "flat fee realtor Mesa AZ" | /sell, /compare/flat-fee-vs-traditional-agent |
| Seller informational | "how much will I net selling my house Mesa" | /tools/net-sheet |
| Seller timing | "should I sell my house now or wait Arizona" | /tools/sell-now-or-wait |
| Buyer commercial | "homes for sale Queen Creek AZ" | /areas/queen-creek (informational only, link out to MLS) |
| Buyer informational | "how much house can I afford Mesa" | /tools/affordability |
| First-time | "first time home buyer Arizona assistance programs" | /buy/first-time-buyer |
| Hyperlocal | "San Tan Valley real estate trends 2026" | /areas/san-tan-valley |
| Hyperlocal | "85140 home values" | /areas/san-tan-valley |
| Regulatory | "NAR settlement Arizona buyer agreement" | /blog/nar-settlement-arizona |

AI-crawler traffic (ChatGPT, Claude, Perplexity) rewards genuinely unique
content — county assessor data + Mesa specificity is our moat. Write like
you're the only site that has the answer, not the 47th blog rehash.

## Validation

After implementation:

1. Run Google's [Rich Results Test](https://search.google.com/test/rich-results)
   on every page type.
2. Run [Schema Markup Validator](https://validator.schema.org/) on the
   homepage, a city page, a blog post, a tool page.
3. `curl -A "GPTBot" https://mesahomes.com/tools/net-sheet` — confirm the
   HTML response contains the title, description, and core content.
4. `curl -s https://mesahomes.com | grep -c "application/ld+json"` — should
   be at least 1.
5. Check `sitemap.xml` has every public URL and no drafts/duplicates.

## Task 11 implementation checklist (add to tasks.md)

When Kiro B starts Task 11 pages:

- [ ] Root `layout.tsx` sets `metadataBase` + default `title.template` + `description`
- [ ] Each `page.tsx` exports typed `metadata` or `generateMetadata()`
- [ ] JSON-LD `<script>` in every page's server component with sanitized stringify
- [ ] `schema-dts` installed for typed schemas
- [ ] `frontend/src/app/robots.ts` with AI-crawler allowlist
- [ ] `frontend/src/app/sitemap.ts` generating from static routes + content API
- [ ] Unique `<h1>` per page
- [ ] All `<Image>` have `alt`
- [ ] Canonical URL set per page
- [ ] Rich Results Test passes on every page type before merge

## References

- Next.js Metadata API: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Next.js JSON-LD guide (Apr 2026): https://nextjs.org/docs/app/guides/json-ld
- Next.js robots.ts convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- schema-dts TypeScript schemas: https://www.npmjs.com/package/schema-dts
- AI crawler technical SEO (2026): https://ziptie.dev/blog/technical-seo-for-ai-crawlability/
- GEO audit methodology: https://fiftyfiveandfive.com/resources/how-to-run-a-geo-audit-so-ai-search-engines-can-actually-find-your-content/
- Next.js 16 SEO checklist: https://www.lunover.com/blog/nextjs-16-seo-checklist-for-production/
