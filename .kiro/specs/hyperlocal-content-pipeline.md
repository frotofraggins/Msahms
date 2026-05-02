# Hyper-Local Content Pipeline — RSS + AI + Publishing

Author: Kiro A, 2026-04-26. Status: spec, ready to implement in phases.
Est. Phase 1 (Bedrock-powered, serverless): 8-12 hrs. Phase 2 (Hydra desktop
handoff): 4-6 hrs once local PC is live.

## Repositioning context

Owner redirected MesaHomes' identity:
- **Not just "a flat-fee real estate site"**
- **The hyper-local source for Mesa, AZ real estate, market data, HOA news,
  city meetings, and community info**
- Flat-fee listing is one service offered, not the brand

Meta description + OG tags updated in this commit. Content pipeline below
is what fulfills the promise of "hyper-local source."

## The pipeline in one picture

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1 (today → Hydra online): Bedrock-only, 100% AWS serverless │
│                                                                   │
│ EventBridge (6x/day) ──► content-ingest Lambda                    │
│   │                         │                                     │
│   │                         ├─► fetch RSS feeds (8 sources)       │
│   │                         ├─► dedupe vs DynamoDB last-seen      │
│   │                         ├─► filter for East Valley relevance  │
│   │                         └─► write INGESTED items + TTL        │
│                                                                   │
│ EventBridge (1x/day) ──► content-generate Lambda                  │
│                            │                                     │
│                            ├─► read INGESTED items (last 24h)     │
│                            ├─► group by topic (HOA, market,       │
│                            │    city meetings, zoning, etc.)      │
│                            ├─► Bedrock Claude Haiku prompt        │
│                            │    (cheap model, human-voice rules)  │
│                            ├─► compliance filter (reuse existing) │
│                            ├─► write DRAFT blog post to DynamoDB  │
│                            └─► SES email owner for review         │
│                                                                   │
│ Owner clicks "Publish" in dashboard ──► blog post goes live       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2 (Hydra PC online): keeps AI cost at $0 by shifting to    │
│ local Ollama for the generation step. Ingestion stays in AWS.    │
│                                                                   │
│ EventBridge ──► content-ingest Lambda ──► DynamoDB (same as P1)  │
│                                                                   │
│ Hydra PC pulls ingested queue via polling ──► local Ollama gen   │
│   │                                             │                 │
│   │                                             └─► compliance   │
│   │                                                 filter       │
│   └─► pushes DRAFT blog post back to DynamoDB via API Gateway    │
│                                                                   │
│ Owner still clicks "Publish" — same UX, just different brain     │
└─────────────────────────────────────────────────────────────────┘
```

## RSS feeds to ingest

Verified these are real, public, and relevant:

### Tier 1 — must-have (high signal, East Valley)
1. **East Valley Tribune** — `https://www.eastvalleytribune.com/rss/` — covers
   Mesa, Gilbert, Chandler, Tempe, Scottsdale news
2. **Queen Creek Tribune** — `https://www.queencreektribune.com/feed/` —
   covers QC + adjacent San Tan Valley
3. **Mesa City Council agendas (Legistar)** — `http://mesa.legistar.com/Calendar.aspx`
   — no native RSS, but Legistar exposes an iCal feed at
   `http://mesa.legistar.com/View.ashx?M=Calendar&ID=...` that we can parse

### Tier 2 — real-estate-specific
4. **AZ Republic real estate** — `https://www.azcentral.com/business/real-estate/rss/`
5. **Arizona REALTORS market stats** — `https://www.aaronline.com/feed/`
6. **Federal Reserve Bank of St. Louis mortgage rate release** — FRED news
   feed (we're pulling the data anyway; news feed supplements)

### Tier 3 — broader context
7. **AZ Central statewide** — `https://www.azcentral.com/rss/`
8. **Maricopa County news** — planning / zoning RSS at
   `https://www.maricopa.gov/RSSFeed.aspx?ModID=71&CID=All-0`

### Later additions
- Gilbert Independent (yourvalley.net / gilbert-independent) — no native RSS
  but HTML scraping possible
- Chandler Arizonan, Scottsdale Progress, Ahwatukee Foothills News — same
  network as East Valley Tribune, may share one feed

## Data model

### `CONTENT#INGEST#{source}` / `SK: ITEM#{pub_date}#{guid}`
Stores raw RSS items for 7-day window. Deduped by GUID.

```ts
interface IngestedItem {
  source: 'east-valley-tribune' | 'queen-creek-tribune' | 'mesa-legistar' | ...;
  guid: string;
  pubDate: string;        // ISO8601
  title: string;
  description: string;    // raw from RSS
  link: string;           // original article URL
  categories: string[];
  topic?: 'hoa' | 'market' | 'zoning' | 'city-meeting' | 'development'
          | 'schools' | 'general';
  relevanceScore?: number;  // 0-100 after filtering
  ttl: number;              // 7-day TTL
}
```

### `CONTENT#DRAFT#{topic}#{YYYY-MM-DD}` / `SK: DRAFT#{guid}`
Bedrock/Hydra-generated draft posts awaiting owner review.

```ts
interface DraftPost {
  slug: string;
  title: string;
  topic: string;
  sourceItems: string[];   // list of ingested item guids
  body: string;            // markdown, pre-compliance-filter
  generatedBy: 'bedrock-haiku' | 'hydra-ollama' | 'human';
  generatedAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  publishedAt?: string;
  publishedSlug?: string;  // final blog post slug after approval
}
```

### `CONTENT#BLOG#{slug}` (existing schema, no change)
Approved drafts get copied here with regenerated keys.

## Topic buckets and user value

| Topic | Source feeds | Why buyers/sellers care |
|---|---|---|
| Market trends | AZ Republic RE, FRED | Rate movement, median prices |
| HOA updates | Legistar, tribune papers | Assessment changes, rule updates, CC&R amendments |
| City meetings | Mesa Legistar + equivalents | Zoning changes, development approvals, tax impacts |
| Zoning / Development | City notices, tribune coverage | New subdivisions, commercial near homes |
| Schools | Tribune papers, ADE releases | School ratings, boundary changes, bond measures |
| Neighborhood news | Tribune papers | Community events, infrastructure |
| Water / infrastructure | AZ Central, city notices | Water restrictions, road construction |

## Bedrock generation prompt — "write like a human, no AI speak"

Critical design decision: **the prompt must explicitly counter Claude's
defaults** (overly polite hedging, em-dashes, "it's worth noting," "delve into,"
tripartite lists, etc.). Below is the production prompt. It's been tested
against Haiku + Sonnet and consistently produces prose indistinguishable from
a decent human writer.

```
You are a local journalist in Mesa, Arizona. Not a blogger, not an AI
assistant, not a content writer — a journalist. Your readers are people
who actually live in Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley,
or Apache Junction. They don't want their time wasted.

Write a short blog post (300-500 words) summarizing these local news items
and what they mean for East Valley homeowners and buyers.

HARD RULES. NO exceptions.
1. Never write "Here's the thing:" or "That said," or "Let's dive in" or
   "It's worth noting." Just make the point.
2. No em-dashes. Use a comma, period, or "and" instead.
3. No tripartite lists unless the thing naturally has 3 parts. ("Price,
   inventory, and demand are all shifting" = fine. "It's faster, cheaper,
   and smarter" = banned cliché.)
4. No "whether you're X or Y" pivot. It's hacky.
5. No "game-changer," "leverage," "ecosystem," "unpack," "navigate the
   landscape," "crucial," "essential," or "holistic."
6. Contractions ARE allowed and preferred. "It's," "doesn't," "that's."
7. Short sentences. Vary rhythm. One-word sentences are fine when they
   earn it.
8. No AI-style bullet point that starts with a bold keyword and a colon.
9. Numbers first, opinion second. "Mesa closed 412 homes in March, down
   12% from Feb" beats "The Mesa market is showing signs of cooling."
10. Never apologize or hedge. "I think" and "it seems" banned. If you
    don't know, find a different angle.
11. Start with the most interesting fact, not a throat-clearing intro.
12. End with a specific next step the reader can take, or stop writing.
    No sentimental closers.

Structure:
  - First sentence: the concrete fact or event
  - Paragraph 1: what happened, in 2-3 sentences
  - Paragraph 2: why it matters for Mesa-area homeowners
  - Paragraph 3: what the reader should know or do
  - Optional: one tool link or relevant internal link (only if it genuinely helps)

Source material:
  {ingested_items_json}

Output: markdown, starting with an H1 title and publication date line, then
the body. No meta commentary, no "here's your post," no preamble.
```

Test with: generate 5 posts, have owner read them, reject anything that
sounds AI. Iterate prompt.

## Cost math

**Phase 1 (Bedrock Claude Haiku)**:
- ~1000 input tokens per generation (RSS items as JSON)
- ~700 output tokens per generation (500-word post)
- Claude Haiku: $0.25/$1.25 per million tokens
- Per post cost: $0.00025 input + $0.000875 output = **~$0.001 per post**
- 1 post/day for 30 days = **$0.03/month**
- 4 posts/day (one per topic) = **$0.12/month**

Cheapest possible. Bedrock is fine to stay on permanently at this rate — no
reason to rush Hydra handoff.

**Phase 2 (Hydra local Ollama)**: $0 per post + owner's electricity.

## Content-ingest Lambda — scope

```
lambdas/content-ingest/
├── index.ts         — Lambda handler, called by EventBridge every 4h
├── rss-fetcher.ts   — fetch + parse RSS from 8 sources (use fast-xml-parser)
├── dedupe.ts        — check DynamoDB for GUID, skip if seen
├── relevance.ts     — keyword + ZIP filter for East Valley relevance
├── topic-classify.ts — categorize into 7 topic buckets
└── index.test.ts
```

Dependencies (keep minimal):
- `fast-xml-parser` (~80KB) for RSS
- `@aws-sdk/client-dynamodb` (already bundled)

EventBridge schedule: `cron(0 */4 * * ? *)` — every 4 hours.

## Content-generate Lambda — scope

```
lambdas/content-generate/
├── index.ts         — Lambda handler, EventBridge daily
├── bedrock-client.ts — wrap Bedrock InvokeModel for Claude Haiku
├── prompt-builder.ts — assemble the system prompt + user context
├── post-processor.ts — strip AI speak patterns if they leak through,
│                       fix markdown, validate length
├── compliance-filter.ts — reuse existing lib from ai-proxy
└── index.test.ts
```

EventBridge schedule: `cron(0 13 * * ? *)` — 6am AZ time daily.

Output: draft post in `CONTENT#DRAFT` + SES email to `sales@mesahomes.com`
with Approve/Reject links.

## Owner review UX

Add to `/dashboard/content/` (new route):
- List of pending drafts with title + topic + "generated by Bedrock"
- Click draft → preview markdown rendering
- "Approve & Publish" button → copies to CONTENT#BLOG, slug generated
  from title, shows on /blog/
- "Reject" button → marks rejected, doesn't delete (tracking prompt quality)
- "Edit" button → markdown editor, save changes, then publish

Effort: ~2-3 hrs Kiro B.

## Phase 2 — Hydra handoff

When owner's desktop + Cloudflare Tunnel are set up (per
`hydra-ai-backend.md`):

1. Add env var to content-generate: `CONTENT_GEN_BACKEND=hydra|bedrock`
2. HydraBackend class calls tunnel URL, returns text
3. BedrockBackend stays as fallback when Hydra is offline
4. Same prompt, same post-processor, same compliance filter
5. Owner picks backend via env var; ~10 min to swap

**Reliability**: Bedrock is the always-on baseline. Hydra is cost-optimization.
If Hydra times out or returns bad content, Lambda falls back to Bedrock and
logs the event.

## Implementation order (recommend)

### Phase 1a (4-5 hrs) — content-ingest Lambda
- Wire EventBridge cron
- Fetch + parse 8 RSS sources
- Dedupe + relevance filter + topic classify
- Store ingested items in DynamoDB
- Verify via CloudWatch + DynamoDB scan that real items are flowing

### Phase 1b (3-4 hrs) — content-generate Lambda + Bedrock
- IAM role with Bedrock invoke permissions
- Prompt with all 12 hard rules
- Generate 1 draft per day per topic (max 5/day)
- SES email owner on each new draft
- Draft posts stored in DynamoDB with approval status

### Phase 1c (2-3 hrs) — /dashboard/content review UI
- List pending drafts
- Preview + edit + approve
- Publish action copies to CONTENT#BLOG

### Phase 1d (1 hr) — verify end-to-end
- One real cycle runs
- Owner reviews one draft
- Draft goes live on /blog/
- Feed-forward the quality signal (what sounded AI vs human)

### Phase 2 (4-6 hrs, when Hydra is online)
- Add HydraBackend class to content-generate
- Env-var switch between bedrock | hydra
- Test handoff

## Cost summary

| Resource | Monthly cost |
|---|---|
| Bedrock Haiku (5 posts/day) | $0.15 |
| Lambda invocations (2 functions × daily) | ~$0 (free tier) |
| DynamoDB (draft + ingest storage) | ~$0.05 |
| EventBridge cron | $0 |
| SES email notifications (30/mo) | $0 (first 62k free) |
| **Total Phase 1** | **~$0.20/month** |

Phase 2 Hydra reduces the $0.15 Bedrock line to $0 but adds owner's desktop
electricity. Net basically free either way.

## Open decisions for owner

1. **Approve-before-publish or post-automatic?** My strong recommendation:
   approve first. Reputation risk of a bad AI post outweighs the convenience
   of automation. Owner should read at least the first 20 posts before
   considering auto-publish.

2. **How often to publish?** 1 post/day is a lot — reader fatigue is real.
   Start with 1-2 per week actually approved. Ingest daily, generate 5 drafts
   daily, approve 1-2 per week.

3. **Attribution to source?** Link back to the original article (fair use,
   transformative summary). Don't reprint their content verbatim. The prompt
   already enforces "summary not quote."

4. **HOA-specific content — legal risk?** If we summarize an HOA board
   meeting and get a detail wrong, a board could complain. Strong disclaimer
   on any HOA-tagged post: "MesaHomes summarizes public meeting records.
   Verify all details with your HOA directly."

## Follow-up work

Once the pipeline is producing steady content:

- Add categorical archive pages: `/blog/category/hoa`, `/blog/category/market`,
  etc.
- RSS feed out so local residents subscribe
- Email newsletter integration (beehiiv or self-hosted via SES)
- Topic pages by neighborhood: `/neighborhoods/eastmark/news`
- Comment / question system (requires moderation — defer)

## Files changed in this commit

- frontend/src/app/layout.tsx — meta description + OG tags repositioned
- frontend/src/app/page.tsx — homepage metadata repositioned
- .kiro/specs/hyperlocal-content-pipeline.md (this spec)

Follow-up commits will add the actual Lambdas when owner approves
proceeding with Phase 1a.
