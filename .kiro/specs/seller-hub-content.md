# Seller Hub — Editorial Map

Author: Kiro A, 2026-04-28.
Status: draft → implementation in flight.

Triggered by the 2026-04-28 ChatGPT SEO audit
(`.kiro/specs/seo-audit-2026-04-28.md`) which scored content depth
4/10 and specifically called out that `/blog/selling-guides/` is
empty. Sellers are our monetizable audience (FSBO package,
Mesa Listing Service, Full-Service). This spec defines the 6
canonical seller-intent pages we will hand-write to own the
non-branded seller queries for Mesa, AZ.

## Goals

1. Own 6 non-branded seller queries on Google within 90 days
2. Each article directly feeds at least one conversion point
   (tool CTA, listing intake, consult booking)
3. Establish the editorial map so the AI drafter knows these
   are "claimed" territory and won't redundantly rewrite them

## Non-goals

- Per-ZIP landing pages (85201, 85203, etc). Phase 2 follow-up.
- AI drafting of these 6 articles. These are hand-written because
  they define our voice baseline + link structure for everything
  else to follow. Once live, the AI drafter sees them in its
  DO-NOT-DUPLICATE list.

## Target queries + canonical URLs

| # | Target query | URL | Primary conversion |
|---|---|---|---|
| 1 | flat fee MLS Mesa AZ | `/blog/selling-guides/flat-fee-mls-mesa-az/` | `/listing/start` |
| 2 | how to sell a house in Mesa AZ | `/blog/selling-guides/how-to-sell-a-house-in-mesa-az/` | `/sell` (3 tiers) |
| 3 | Mesa AZ seller closing costs | `/blog/selling-guides/mesa-seller-closing-costs/` | `/tools/net-sheet` |
| 4 | sell home without realtor Mesa | `/blog/selling-guides/sell-home-without-realtor-mesa/` | `/listing/fsbo` |
| 5 | Mesa seller net sheet | `/blog/selling-guides/mesa-seller-net-sheet-guide/` | `/tools/net-sheet` |
| 6 | best time to sell a house in Mesa | `/blog/selling-guides/best-time-to-sell-mesa-az/` | `/tools/home-value` |

Additional bonus article (if time permits):

| # | Target query | URL | Primary conversion |
|---|---|---|---|
| 7 | FSBO vs flat fee MLS Mesa | `/compare/fsbo-vs-flat-fee-vs-agent/` | `/sell` |

## Each article must have

- **1,500-2,000 words** of real content (no padding)
- **Local specificity**: Mesa ZIPs, cross streets, neighborhoods,
  schools, corridors. Not generic Arizona content.
- **One primary conversion CTA** halfway through + one at the end
- **Internal links** to:
  - 2 other seller-hub pages (cluster)
  - Relevant tool (`/tools/net-sheet`, `/tools/home-value`, etc.)
  - Relevant area page (`/areas/mesa`, `/areas/gilbert`, etc.)
- **Proper schema**: `Article` JSON-LD with `articleSection: "Selling Guides"`
- **H2 + H3 structure** for scannability
- **FAQ block** at the bottom with 5 common questions (FAQPage schema)
- **No AI tells**: no em-dashes, no "ever-evolving," no "whether you're X or Y,"
  no tripartite adjective lists, short sentences, contractions allowed,
  opinionated stance not fence-sitting

## Voice baseline

Writing like a licensed local Realtor talking to a neighbor over
coffee. Specific, opinionated, honest about tradeoffs. Examples:

BAD: "Selling a home in Mesa, AZ, can be an exciting yet
complex process. It is important to understand the various
options available to homeowners looking to sell their property."

GOOD: "You have three real options for selling a Mesa house in
2026. FSBO is the cheapest and hardest. A flat-fee MLS listing
at $999 hits the sweet spot for most sellers. Traditional
full-service agents earn their 5-6% when the house is
complicated or the market's tight."

## Cross-linking map

```
flat-fee-mls-mesa-az ─┬─► /listing/start
                     ├─► /sell (compare tiers)
                     ├─► sell-home-without-realtor-mesa (alternative)
                     └─► how-to-sell-a-house-in-mesa-az (broader)

how-to-sell-a-house-in-mesa-az ─┬─► /tools/home-value
                                ├─► /tools/net-sheet
                                ├─► mesa-seller-closing-costs
                                ├─► best-time-to-sell-mesa-az
                                └─► flat-fee-mls-mesa-az

mesa-seller-closing-costs ─┬─► /tools/net-sheet (hero CTA)
                           ├─► mesa-seller-net-sheet-guide
                           └─► how-to-sell-a-house-in-mesa-az

sell-home-without-realtor-mesa ─┬─► /listing/fsbo
                                ├─► flat-fee-mls-mesa-az (upgrade path)
                                └─► /tools/listing-generator

mesa-seller-net-sheet-guide ─┬─► /tools/net-sheet
                             ├─► mesa-seller-closing-costs
                             └─► /tools/home-value

best-time-to-sell-mesa-az ─┬─► /tools/home-value
                           ├─► /tools/sell-now-or-wait
                           └─► /areas/mesa (market data)
```

## Content scaffolding

All 6 articles are static MDX-free React pages under
`frontend/src/app/blog/selling-guides/{slug}/page.tsx`.
Not AI-drafted, not DDB-backed. Hand-written, committed to git,
deployed via normal CI/CD. Lives forever.

## Tasks

- [ ] 4.1 Write this spec (DONE - you're reading it)
- [ ] 4.2 Article 1: flat-fee MLS Mesa AZ
- [ ] 4.3 Article 2: how to sell a house in Mesa AZ
- [ ] 4.4 Article 3: Mesa seller closing costs
- [ ] 4.5 Article 4: sell home without realtor Mesa
- [ ] 4.6 Article 5: Mesa seller net sheet guide
- [ ] 4.7 Article 6: best time to sell a house in Mesa
- [ ] 4.8 Update `/blog/selling-guides/` category index to reflect
       these 6 pages as "Featured Guides"
- [ ] 4.9 Add each to `frontend/src/app/sitemap.ts` static entries
       with `priority: 0.9` (high, since they're conversion pages)

## Success criteria (measure at 30/60/90 days)

- Google Search Console impressions + clicks per slug
- Organic impressions for target queries from
  `/news/market/` and `/blog/market-updates/`
- Downstream form submissions per session that landed on a
  seller-hub page first

## Related

- `.kiro/specs/seo-audit-2026-04-28.md` — the audit that triggered this
- `.kiro/specs/content-pipeline-phase-2.md` — where AI-drafted
  content lives; these hand-written guides are its foundation
- `.kiro/specs/three-tier-product.md` — the product descriptions
  these articles must accurately represent
