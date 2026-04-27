# HOA Hyper-Local Content Strategy

**Date**: 2026-04-27
**Status**: Tier 1 implementation starting
**Context**: Owner asked for "HOA meetings and stuff like that for hyperlocal targeting"

## The hard truth about HOA data

HOAs are the most fragmented content source in Arizona real estate.
Unlike city governments (Legistar API), crime data (Socrata), or market
data (Zillow CSVs), there is **no standardized HOA data source**.

Options ranked by feasibility:

| Source | Availability | Effort | Value |
|--------|-------------|--------|-------|
| ✅ County GIS subdivision enumeration | 100% | Low | High (unique SEO) |
| ✅ Legistar CFD board meetings (Eastmark, Cadence) | Already ingesting | Done | Very high |
| ✅ AZ Dept of Real Estate HOA registry (contacts only) | Public | Medium (scrape) | Medium |
| 🟡 Top 20 master-planned community public pages | Varies | Per-HOA parser | High |
| 🔴 Individual HOA meeting minutes | 5-15% publicly posted | Very high | Very high (long-tail) |
| 🔴 Management company portals | Locked | Impossible | — |
| 🔴 Nextdoor / Facebook | ToS blocks scraping | Impossible | — |

## Strategy: 3 tiers

### 🟢 Tier 1 — Subdivision directory pages (now)

Generate one `/hoa/{slug}/` page per subdivision in our service area from
county GIS data. Each page shows:

- Subdivision name, city, ZIP
- **Parcel count + avg assessed value + avg sqft + typical year built**
  (all from GIS aggregate query — no per-property personally-
  identifiable info)
- Recent sales in the subdivision (linked from existing comp query)
- Market trend vs ZIP median
- Links to Zillow, Realtor.com for the subdivision
- "Submit HOA info" CTA — owner-sourced meeting dates, board contacts,
  fees, amenities

Est. output: **400-500 subdivision pages** in Mesa alone, 1000+ across
all 6 service cities. Each page has unique content, unique data,
unique SEO opportunity.

**Zero external dependencies** — uses county GIS we already hit for
property lookups.

### 🟡 Tier 2 — Master-planned community deep dives (week 2)

Pick 20 big MPCs with public info:

- **Eastmark** (Mesa) — CFD meetings in Legistar, lifestyle magazine
- **Cadence at Gateway** (Mesa) — CFD meetings in Legistar
- **Morrison Ranch** (Gilbert)
- **Power Ranch** (Gilbert)
- **Seville** (Gilbert)
- **DC Ranch** (Scottsdale)
- **Estrella** (Goodyear — outside direct service area but still relevant)
- **Las Sendas** (East Mesa)
- **Red Mountain Ranch** (East Mesa)
- **Superstition Foothills** (Apache Junction)
- **Queen Creek Station** (Queen Creek)
- **Pecan Creek** (San Tan Valley — owner's own subdivision)
- **Meridian** (Queen Creek)
- **Ocotillo** (Chandler)
- **Fulton Ranch** (Chandler)
- **The Islands** (Gilbert)
- **Val Vista Lakes** (Gilbert)
- **Stonegate** (Chandler)
- **Dobson Ranch** (Mesa)
- **Sun Lakes** (Chandler — 55+)

Each gets a per-MPC parser that pulls:
- CFD/HOA board meeting dates (if Legistar)
- Public events calendar
- Community newsletter (RSS if available, HTML scrape fallback)
- Any public announcements

Bundled into `/hoa/{slug}/` pages — enriches the Tier 1 page for these
specific communities.

### 🟢 Tier 3 — User-contributed HOA info (ship with Tier 1)

Every `/hoa/{slug}/` page has a "Submit info" form:
- Your HOA name (auto-filled from subdivision)
- Meeting schedule
- Board president / management company
- Monthly fees
- Recent newsletter highlights (paste text)
- Upcoming events

Submissions go to DDB `HOA#{slug}` / `SUBMISSION#{timestamp}`, owner
approves in `/dashboard/content/`, approved info merges into the page.

This turns our 500-page directory into a community-maintained knowledge
base. Classic Wikipedia-style growth curve — gets more valuable with
every user.

## Why this is better than trying to scrape HOA sites

| Approach | Content quality | Maintenance cost | Legal risk |
|----------|----------------|------------------|------------|
| Scrape 500 HOA sites | Patchy, stale | Very high (breakage) | Medium (ToS) |
| This 3-tier approach | Consistent baseline + rich for MPCs + user-curated | Low | Zero |

## Implementation — what to build first

### Task 1 — Subdivision enumeration Lambda

Add a new source to `lib/content-sources.ts`:

```ts
{
  id: 'maricopa-subdivisions',
  name: 'Maricopa County — Subdivision Directory',
  type: 'gis',
  url: '...Parcels/MapServer/0/query',
  topic: 'hoa',
  cadence: 'monthly',
  config: {
    distinct: 'SUBNAME',
    cities: ['MESA', 'GILBERT', 'CHANDLER', 'QUEEN CREEK', 'APACHE JUNCTION'],
  },
}
```

Add a GIS parser at `lambdas/content-ingest/parsers/gis.ts`. Output:
one record per distinct subdivision with aggregate stats (parcel count,
avg assessed value, year-built range).

### Task 2 — `/hoa/{slug}/` page generator

Add to the frontend — a Next.js static-generation page that reads from
DDB `HOA#{slug}` items and renders:
- Subdivision summary
- Aggregate stats
- Recent sales (from existing property-lookup comp query)
- Community submissions (Tier 3)
- "Submit info" form

Given 500+ slugs, use `generateStaticParams` with ISR-style cache so
each slug renders on first visit and stays cached.

### Task 3 — Tier 2 master-planned community parsers

One file per MPC at `lambdas/content-ingest/parsers/mpc-*.ts`. Start
with Eastmark + Cadence (we already have their Legistar CFD boards).

Est. 1-2 hours per MPC parser, pick 3-5 for first batch.

### Task 4 — Community submission flow

- Form at the bottom of each `/hoa/{slug}/` page
- POST `/api/v1/hoa/submit` — authless, CAPTCHA-protected
- Stores in DDB `HOA#{slug}` / `SUBMISSION#{timestamp}`
- Owner reviews in `/dashboard/content/hoa-submissions/`
- Approved submissions get moved to the HOA record's public fields

## Cost estimate

| Component | Cost |
|-----------|------|
| Monthly subdivision enumeration Lambda | <$0.01 |
| DDB storage (500 HOAs × 2KB each) | <$0.50/mo |
| Page renders (static export via Next.js) | included |
| Per-MPC scrapers (5-20 × daily Lambda) | <$0.50/mo |
| **Total** | **<$1/mo** |

## What to tell users on the page

The key UX is being upfront about what we know and what we don't:

```
> **Data sources on this page:**
> Aggregate property statistics come from the Maricopa County Assessor.
> Sale prices are public records. HOA details (meeting schedule, fees,
> board contacts) are either sourced from the management company's
> public pages OR contributed by community members — see "Contribute
> info" below. If something's out of date, tell us.
```

This matches the tone of the rest of MesaHomes: honest, local,
data-first.
