# Content Ingest Pipeline — Architecture Decision

**Date**: 2026-04-27
**Status**: design approved, ready to implement
**Owner**: Kiro A
**Context**: Owner proposed "pull all data sources into S3, let AI read everything daily and generate content." Research below validates the core idea with one critical refinement.

## Owner's original proposal

> All data sources → S3 → AI reads everything daily → generates articles → human approves → publish

## What's right about this proposal

1. **S3 as durable archive** — correct. Raw source data lands in S3 by source+date. Cheap, permanent, auditable.
2. **Single AI pass per day** — correct. One Bedrock/Hydra invocation per topic, not one per source.
3. **Human approval gate** — correct. Never auto-publish; every post goes through owner review.

## What needs refinement

**Problem**: If the AI reads ALL of S3 every day:
- Slow — tokens for 15 sources × 30 days of files = 100K+ tokens per run, most unchanged
- Expensive — Bedrock Haiku charges per input token; Hydra is slow on 100K prompts
- Undedupable — same zoning case in Legistar + news + Reddit → AI writes 3 articles
- Context-window overflow — even 128K windows run out on 30 days of city council minutes

**Solution**: Index layer between S3 and the LLM.

## Recommended architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: INGEST (every day, 7am MST via EventBridge cron)              │
└─────────────────────────────────────────────────────────────────────────┘

  Legistar API    Mesa PD API     County GIS      Zillow CSVs    RSS feeds
       │              │               │                │              │
       └──────────────┼───────────────┼────────────────┼──────────────┘
                      │               │                │
                      ▼               ▼                ▼
            ┌──────────────────────────────────────────────┐
            │  content-ingest Lambda (per-source fan-out)  │
            │  - Fetch + normalize                         │
            │  - Compute content hash (dedup key)          │
            │  - Write raw to S3 (audit trail)             │
            │  - Write indexed record to DDB (searchable)  │
            └──────────┬───────────────────────┬───────────┘
                       │                       │
                       ▼                       ▼
            ┌──────────────────┐     ┌──────────────────────┐
            │  S3 data lake    │     │  DynamoDB index      │
            │  s3://mesahomes- │     │  (existing table)    │
            │  content-ingest/ │     │  PK: SOURCE#{src}    │
            │  {src}/{date}/   │     │  SK: ITEM#{hash}     │
            │  {id}.json       │     │  GSI1: TOPIC#{topic} │
            └──────────────────┘     │    SK: SEEN#{date}   │
                                     └──────────┬───────────┘
                                                │
                                                │ DynamoDB Stream
                                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: TOPIC BUNDLING (runs continuously as new items arrive)        │
└─────────────────────────────────────────────────────────────────────────┘

            ┌──────────────────────────────────────────────┐
            │  content-bundler Lambda (stream trigger)     │
            │  - Classifies item into topic bucket:        │
            │    zoning / market / HOA / housing-law /     │
            │    news / relocation / safety                │
            │  - Clusters related items (same zoning case  │
            │    from multiple sources → one bundle)       │
            │  - Writes bundle to DDB:                     │
            │    PK: BUNDLE#{topic}#{date}                 │
            │    SK: v{version}                            │
            └──────────┬───────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: DRAFT GENERATION (runs daily at 8am MST, after ingest)        │
└─────────────────────────────────────────────────────────────────────────┘

            ┌──────────────────────────────────────────────┐
            │  content-drafter Lambda (scheduled)          │
            │  - Reads today's BUNDLE records              │
            │  - Calls Hydra (preferred) or Bedrock Haiku  │
            │  - One LLM call per bundle (~2K tokens in,   │
            │    600 tokens out)                           │
            │  - Applies Fair Housing compliance filter    │
            │  - Writes to DDB:                            │
            │    PK: CONTENT#DRAFT#{id}                    │
            │    SK: v{version}                            │
            │    status: pending-review                    │
            └──────────┬───────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────────────────┐
            │  SES notification to owner: "N drafts ready" │
            └──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: REVIEW + PUBLISH (human in the loop)                          │
└─────────────────────────────────────────────────────────────────────────┘

            Owner visits /dashboard/content/drafts
                       │
                       ▼
            ┌──────────────────────────────────────────────┐
            │  Approve → writes to PK: CONTENT#BLOG#{slug} │
            │    Publish + tweet/social schedule (later)   │
            │  Edit → saves v{n+1} and re-submits to Haiku │
            │    for polish                                │
            │  Reject → marks archived                     │
            └──────────────────────────────────────────────┘
```

## Why this over pure-S3

| Concern | Pure S3 "read everything" | This architecture |
|---------|--------------------------|-------------------|
| Cost per daily run | ~$1-5 (100K input tokens x ~15K output) | ~$0.10 ($15 DDB reads + ~5K tokens x 10 bundles) |
| Dedup | Impossible | Content hash in DDB = O(1) lookup |
| Diff detection | Compare today's S3 to yesterday's S3 (slow) | SEEN#{date} SK sorts chronologically |
| LLM context overflow | Daily risk | Per-bundle cap ~3-5K tokens |
| Source drift | Silent | Ingest Lambda alerts on 404 per source |
| Audit | ✅ | ✅ (same S3 lake preserved) |

## Why NOT RAG / vector store (for now)

- OpenSearch Serverless: **$701/month minimum**. Dealbreaker.
- Aurora pgvector: $30/month minimum. Feasible but overkill.
- **S3 Vectors (native, July 2025)**: $0.024/GB/month. Feasible, but we don't have the retrieval pattern that benefits from semantic search — we have structured topics + dates, DDB handles it.

When to revisit: Once we have 500+ published articles AND users searching the site for content.

## Tech stack decisions

| Concern | Choice | Why |
|---------|--------|-----|
| Ingest trigger | **EventBridge Scheduler** cron `0 14 ? * * *` (7am MST) | Replaces deprecated CloudWatch Events |
| Per-source fanout | **Step Functions Express Workflow** with Map state | Parallel fetch of 15 sources, independent failure |
| Raw storage | S3 bucket `mesahomes-content-ingest` with lifecycle policy (90 day → Glacier) | Cheap, durable, auditable |
| Index | DynamoDB (existing `mesahomes-main` single-table) | No new infra, same GSI patterns |
| Dedup | Content hash (SHA256 of canonical text) as partition of SK | O(1) |
| Classification | Simple keyword rules + source category (no ML needed) | 15 sources, 8 topics — pattern-match is fine |
| Draft LLM | **Bedrock Claude Haiku** initially, swap to **local Hydra 70B** once RTX 4090 ready | Low cost ~$0.001/draft, can upgrade |
| Review UI | New pages at `/dashboard/content/drafts/` and `/dashboard/content/drafts/[id]/` | Extends existing dashboard |
| Publish | Existing `/api/v1/content/blog` POST endpoint (already built for seed scripts) | Zero new API work |
| Compliance | Reuse `lambdas/ai-proxy/compliance-filter.ts` (Fair Housing) | Already tested |

## Cost estimate (monthly, at scale)

| Component | Cost |
|-----------|------|
| S3 storage (90 days raw = ~1 GB) | $0.02 |
| DynamoDB reads/writes (on-demand, ~50K RCU/day) | $5 |
| Lambda invocations (~500/day) | $0.50 |
| Step Functions (Express, 15 states × 30 days) | $0.25 |
| Bedrock Claude Haiku (10 drafts/day × 3K tokens/draft) | $6 |
| EventBridge Scheduler | $0.01 |
| SES outbound notifications (~30/month) | negligible |
| **Total** | **~$12/month** |

At 100 drafts/day (10x growth) the cost goes to ~$60/month. Still cheap. When Hydra backend comes online, subtract the Bedrock line and the total drops to ~$6/month.

## What to build FIRST (task breakdown)

I'll start on tasks 1-3 right now. Remainder deferred until owner confirms the Phase 1 is working.

### Phase 1 — Foundation (~1 day)

- [x] **1.1 Create `mesahomes-content-ingest` S3 bucket** via CDK — 90-day lifecycle to Glacier, KMS-encrypted, CloudFront never exposed
- [x] **1.2 Add `lib/content-sources.ts`** — registry of sources with name, URL, parser type, topic bucket, cadence (daily/weekly/monthly)
- [x] **1.3 Build `lambdas/content-ingest/`** — per-source fetchers dispatched by source id, normalize to a canonical record shape, write to S3 + DDB with content hash for dedup
- [x] **1.4 EventBridge Scheduler cron** — 7am MST daily trigger
- [x] **1.5 Initial 3 sources**: Legistar (Mesa city meetings), Mesa PD Socrata (crime stats), Mesa Open Data RSS (press releases). Prove the pattern works.
- [x] **1.6 Observability** — CloudWatch alarms on per-source failure, daily summary email with counts

### Phase 2 — Topic bundling + draft generation (~1-2 days)

- [x] **2.1 `lambdas/content-bundler/`** — DDB stream trigger, cluster by topic + date
- [x] **2.2 `lambdas/content-drafter/`** — daily 8am MST, Bedrock Haiku with topic bundles as input, writes CONTENT#DRAFT#{id} records
- [x] **2.3 Compliance filter pass** — reuse existing Fair Housing filter
- [x] **2.4 SES "N drafts ready" email to owner** — fires when drafter finishes

### Phase 3 — Review UI (~1 day)

- [x] **3.1 `/dashboard/content/drafts/` page** — list of pending drafts with title, source, topic, created date
- [x] **3.2 `/dashboard/content/drafts/[id]/` page** — inline edit, preview, Approve/Edit/Reject buttons
- [x] **3.3 Approve flow** — moves draft to CONTENT#BLOG#{slug}, publishes via existing content API, updates sitemap
- [x] **3.4 Reject flow** — marks archived, drafter learns (log for future tuning)

### Phase 4 — Expansion (~1-2 weeks, ongoing)

- [x] **4.1 Add remaining 12 sources** — one source at a time, with auto-rollback on failures
- [ ] **4.2 Relocation hub content** — `/moving-to-mesa` seeded from Zillow + BLS + state-tax-API data
- [ ] **4.3 Housing law tracker** — HUD/CFPB/FHFA/ADRE/AAR Federal Register RSS
- [ ] **4.4 Social media auto-scheduler** — on approval, also post to Facebook page, LinkedIn, Instagram (via Meta API / Buffer)

## Risks + mitigations

1. **Source drift** (URL changes) — monitored per-source lastVerified timestamp; 404 → CloudWatch alarm + owner email within 24 hours
2. **Hallucination** — every draft MUST cite primary source; citation density check blocks publishing drafts with <1 citation per paragraph
3. **Bedrock rate limits** — Express Workflow retries with exponential backoff; falls back to queue-for-tomorrow on sustained throttle
4. **Compliance** — Fair Housing compliance filter runs BEFORE draft is persisted, not just before publish (catch early)
5. **Cost creep** — CloudWatch alarm at $25/month on Bedrock spend, auto-disable drafter if exceeded

## Starting point

Going to build tasks 1.1-1.3 first. That's the whole foundation.
I'll come back for your review before kicking off Phase 2.
