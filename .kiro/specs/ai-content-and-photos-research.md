# AI Content Generation + Image Strategy — Research Memo

**Date**: 2026-04-27
**Status**: Research complete, ready to implement
**Context**: Owner asked "can AI read this content and make natural posts? Can it add photos and download them for us?"

## Answer to "can AI do this naturally"

Yes. The pattern is well-established:

1. **Ingest** — we already have 10 sources flowing into S3 + DDB with citation URLs (done)
2. **Bundle** — group related items into a per-topic digest (lambdas/content-bundler — next)
3. **Draft** — one Bedrock Claude Haiku call per bundle → produces 500-800 word article draft with citations (lambdas/content-drafter — next)
4. **Review** — owner approves in /dashboard/content/drafts (next)
5. **Publish** — article lands on /blog/{slug} with attribution to primary sources (next)

What makes it "natural" vs AI-sounding:
- The prompt explicitly bans 12 AI tells (em-dashes, "whether you're X or Y," "leverage/ecosystem," etc. — already in the existing ai-proxy compliance filter)
- Short sentences, contractions allowed, no tripartite lists
- Human approval before publish means bad drafts never ship

Claude Haiku costs ~$0.001 per draft (1K input + 800 output tokens). At 10 drafts/day = $0.30/month. Negligible.

## Answer to "can it add photos"

Yes, but photos have **legal constraints** that matter:

| Source | Cost | Legal | Quality | Action |
|--------|------|-------|---------|--------|
| **Unsplash API** | Free, 50 req/hr | Attribution required | Professional | ✅ PRIMARY |
| **Wikimedia Commons** | Free, unlimited | License varies (CC-BY-SA, public domain) | Hit-or-miss, genuine Mesa photos | ✅ SECONDARY |
| **Pexels** | Free | Required: attribution in code | Professional | 🟡 backup |
| **Google Places Photos** | $7/1k | Attribution required | Medium | 🟡 for businesses |
| **Street View** | Free 10K/mo | Already licensed | Address-level | ✅ for properties |
| **AI image generation (Bedrock Titan/Nova)** | $0.04 per image | Zero | Variable | 🟡 hero illustrations only |
| **Scrape news/listing sites** | Free | 🔴 **LAWSUIT RISK** | High | ❌ never |

### Recommended photo pipeline

```
For each draft article:
  1. Check Wikimedia Commons first (genuine Mesa photos, public license)
     e.g. "Downtown Mesa Arizona.jpg", "Mesa City Hall.jpg"
  2. If no match OR low quality, search Unsplash for topic keywords
     ("Arizona desert home," "modern kitchen interior," etc.)
  3. Download + cache photo to S3 (mesahomes-property-photos/articles/)
  4. Store attribution + source URL with the article metadata
  5. Article renders photo with required attribution footer
```

**Why Wikimedia first**: genuine Mesa photos (Mesa Arts Center, Hohokam Stadium, Superstitions, etc.) beat generic stock every time for SEO.

**Why Unsplash second**: fills gaps where Wikimedia has no match (e.g., "modern kitchen" article needs a kitchen photo, Wikimedia doesn't have one).

## More Mesa data sources discovered

Ran feasibility scan of 25+ endpoints. Already added: 10 sources producing 420 items. New discoveries:

### ✅ VERIFIED WORKING — add now
1. **mesanow.org RSS** (Mesa city news, 20 recent items)
   - URL: `https://www.mesanow.org/news/feeds/rss?cat=all`
   - Gotcha: redirects without `?cat=all` query param
2. **Wikimedia Commons API** (for photos)
3. **Unsplash API** (for photos — need free API key from owner)

### 🔴 BLOCKED — documented, skipped
- **East Valley Tribune / Mesa Tribune RSS** (429 rate-limited persistently)
- **AZ Legislature bills RSS** (404 — no RSS service anymore)
- **Federal Register** (IP-blocks AWS ranges)
- **Phoenix Business Journal** (Cloudflare)
- **Gilbert/Chandler/Queen Creek Legistar** (they use different CMS vendors)

### 🟡 FEASIBLE BUT NOT YET TESTED
- Mesa Public Library event calendar
- Mesa Arts Center events (iCal feed)
- Arizona Department of Real Estate bulletins (HTML scrape)
- Maricopa County Superior Court case filings (HTML)
- ADOT road closures (HTML / Twitter)

## Concrete build plan

### Phase 2A — mesanow RSS (15 min)

Add 1 new source:
```ts
{
  id: 'mesa-now-news',
  name: 'Mesa City Official News (mesanow.org)',
  type: 'rss',
  url: 'https://www.mesanow.org/news/feeds/rss?cat=all',
  topic: 'news',
  cadence: 'daily',
}
```

### Phase 2B — Content bundler (2 hr)

`lambdas/content-bundler/` triggered by DDB stream:
- Reads new `CONTENT_INGEST` items
- Classifies into topic bucket (already have source.topic, but enriches with per-item keyword scoring)
- Clusters related items (same zoning case mentioned in Legistar + Reddit → 1 bundle, not 3)
- Writes bundle to DDB: `BUNDLE#{topic}#{date}` / `v{version}`

### Phase 2C — Photo attachment service (1-2 hr)

New Lambda `lambdas/photo-finder/`:
- Input: article draft + topic keywords
- Tries Wikimedia Commons API first
- Falls back to Unsplash
- Downloads image → S3 `mesahomes-property-photos/articles/{articleId}/{idx}.jpg`
- Returns photo URL + attribution + source

### Phase 2D — Content drafter (2-3 hr)

`lambdas/content-drafter/` triggered on cron (daily 8am MST after ingest):
- Reads BUNDLE records for today
- One Bedrock Claude Haiku call per bundle
- Prompt includes:
  - The 12 "no-AI-tells" rules
  - Bundle of source items with URLs + titles + descriptions
  - Request: 500-800 word article with citations
- Calls photo-finder for 1-2 photos
- Writes to DDB: `CONTENT#DRAFT#{id}` / `v1` / status=pending-review
- Emails owner: "N drafts ready to review"

### Phase 2E — Review + publish (1-2 hr)

New dashboard pages:
- `/dashboard/content/drafts/` — list pending drafts
- `/dashboard/content/drafts/[id]/` — view + edit + approve/reject
- Approve → publishes to `/blog/{slug}` via existing content API
- Reject → archives (feeds drafter signal for future tuning)

## Cost estimate at scale

At 10 drafts/day, 2 photos each:

| Component | Cost |
|-----------|------|
| Bedrock Claude Haiku (10 drafts × 2K tokens) | ~$0.30/mo |
| Wikimedia Commons API | $0 |
| Unsplash API (if we stay under 50/hr) | $0 |
| Photo downloads + S3 storage (~500 MB) | $0.02/mo |
| Lambda invocations (bundler + drafter + photo-finder) | $0.50/mo |
| **Monthly total** | **~$1/mo** |

If we outgrow Unsplash free tier (50 req/hr), upgrade to $50/mo business plan — still trivial.

## Recommendation

Build Phase 2A now (mesanow, 15 min). Then Phase 2B+2D together next session — those are the AI core. Phase 2C can run parallel, Phase 2E last.

Starting on 2A.
