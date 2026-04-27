# Phase 2 — AI Article Drafter + Photo Finder

**Date**: 2026-04-27
**Status**: implementation starting
**Parent spec**: `.kiro/specs/content-ingest-pipeline.md` (Phase 1 complete)
**Tracker**: this file uses `[x]` / `[ ]` so we can mark tasks off

## Goal

Turn 613 ingested items (across 16 sources, 6 topics) into published articles automatically. Pipeline:

```
daily 8am MST
  │
  ▼
content-bundler (new)
  reads today's new CONTENT_INGEST items
  clusters by topic + keyword overlap
  writes BUNDLE#{topic}#{date} records
  │
  ▼
content-drafter (new)
  reads bundles
  calls Bedrock Claude Haiku per bundle
  compliance filter → check Fair Housing + AI tells
  writes CONTENT#DRAFT#{id} records
  │
  ▼
photo-finder (new)
  for each draft, finds 1-2 photos
  tries Wikimedia Commons first, Unsplash second
  downloads to S3 /articles/{draftId}/{idx}.jpg
  attaches attribution metadata to the draft
  │
  ▼
SES email to owner
  "5 drafts ready for review"
  │
  ▼
/dashboard/content/drafts (new UI)
  list + edit + approve/reject
  on approve → publishes to CONTENT#BLOG#{slug}
```

## Why this architecture (vs alternatives)

- **Separate bundler and drafter**: bundler is deterministic (keyword clustering), drafter is non-deterministic (LLM). Letting them share state in DDB means either can be re-run independently without reprocessing everything.
- **Photo-finder separate from drafter**: photo search + download is slow (~5-15s). If it blocks drafter, a Wikimedia timeout kills the whole article. Async + retry.
- **No Bedrock Knowledge Base / OpenSearch**: we evaluated this in the ingest-pipeline spec — $701/mo min for OSS, not justified at our scale. DDB query with topic + date works for the MVP.
- **Human approval required**: compliance filter can catch 80% of bad drafts, but real estate has Fair Housing consequences. Every draft goes through owner review.

## Task list

### Phase 2A — Bundler Lambda

- [x] 2A.1 Create `lambdas/content-bundler/` structure (index.ts, scoring.ts)
- [x] 2A.2 Implement topic bucketing logic (reuse source.topic as primary, keyword scoring for refinement)
- [x] 2A.3 Implement cluster detection — items within same bundle if they share 2+ keywords or reference the same entity (zoning case ID, address, subdivision)
- [x] 2A.4 Write bundler output to DDB: `PK: BUNDLE#{topic}#{date}`, `SK: v{version}`, with list of sourceIds + priority score
- [x] 2A.5 EventBridge cron: daily 7:30am MST (30 min after ingest)
- [ ] 2A.6 Tests — verify clustering via test fixtures
- [x] 2A.7 5-step verification: deploy, invoke, check DDB bundles, email count matches

### Phase 2B — Photo Finder Lambda

- [x] 2B.1 Create `lambdas/photo-finder/` structure
- [x] 2B.2 Wikimedia Commons search via MediaWiki API (free, no key)
- [x] 2B.3 Unsplash search via REST API (key from Secrets Manager `mesahomes/live/unsplash-access-key`)
- [ ] 2B.4 Bedrock Titan/Nova image gen fallback when no natural photo matches
- [x] 2B.5 Download → S3 `mesahomes-property-photos/articles/{draftId}/{idx}.jpg`
- [x] 2B.6 Store attribution metadata (photographer, license, source URL) alongside
- [x] 2B.7 5-step verification: manual invoke with test query, check S3, inspect response payload

### Phase 2C — Drafter Lambda

- [x] 2C.1 Create `lambdas/content-drafter/` structure
- [x] 2C.2 Build prompt template with 12 anti-AI-tells rules + compliance rules + citation-density requirement
- [x] 2C.3 Bedrock Claude Haiku invocation (invoke_model, us-west-2)
- [x] 2C.4 Parse response → extract title, body, meta description
- [ ] 2C.5 Call compliance filter (reuse `lambdas/ai-proxy/compliance-filter.ts`)
- [x] 2C.6 Call photo-finder for hero + supporting images
- [x] 2C.7 Write draft to DDB: `PK: CONTENT#DRAFT#{id}`, `SK: v1`, `status: pending-review`
- [x] 2C.8 EventBridge cron: daily 8am MST (30 min after bundler)
- [x] 2C.9 SES summary email: "N drafts ready, top priority: {title}"
- [ ] 2C.10 Tests — verify prompt doesn't include leaked secrets
- [x] 2C.11 5-step verification

### Phase 2D — Review Dashboard UI

- [x] 2D.1 `/dashboard/content/drafts/` list page
- [x] 2D.2 `/dashboard/content/drafts/[id]/` edit page with rich-text editor + photo swap
- [x] 2D.3 Approve flow: move to `CONTENT#BLOG#{slug}`, hit existing content-api POST
- [x] 2D.4 Reject flow: archive status, log rejection reason for drafter tuning
- [ ] 2D.5 Mobile-responsive (owner reviews from phone)
- [ ] 2D.6 5-step verification

### Phase 2E — Compliance hardening

- [ ] 2E.1 Extend compliance filter to check for "reference to primary source" in every paragraph
- [ ] 2E.2 Block drafts that lack citation density (<1 cite per 3 paragraphs)
- [ ] 2E.3 Add Fair Housing keyword blocklist for Reddit content (race, religion, family status comments in Reddit posts should not propagate into AI-generated text)
- [ ] 2E.4 Tests for all blocklist rules

### Phase 2F — Observability + safety

- [ ] 2F.1 CloudWatch metric: drafter cost per day (Bedrock input/output tokens)
- [ ] 2F.2 CloudWatch alarm at $5/day Bedrock spend (emergency brake)
- [ ] 2F.3 Daily summary email with drafter outcome: N drafted, N rejected by filter, N queued for review
- [ ] 2F.4 Cost dashboard on `/dashboard/admin/costs` (future)

## Bedrock access check

Before committing to Haiku, confirm:
1. Account has Bedrock enabled in us-west-2
2. Claude 3 Haiku model access approved (can take 0-15 min after request)
3. Haiku cost confirmed: $0.00025/1K input tokens, $0.00125/1K output tokens

If Haiku is NOT yet granted, swap to Amazon Nova Micro ($0.000035/1K input, $0.00014/1K output — 8x cheaper, similar quality for this use case).

## Prompt template (draft)

```
You are writing a 500-800 word blog post for MesaHomes, a hyper-local
Mesa, AZ real estate platform. Follow these rules strictly:

NEVER use: em-dashes, "whether you're X or Y" pivots, "that said,"
tripartite lists, "leverage/ecosystem/unpack/game-changer," adjective
chains, or hollow transitional phrases.

DO use: short sentences. Contractions. Active voice. Specific numbers
from the source material. Direct quotes with attribution.

Every paragraph MUST cite at least one primary source from the bundle
below. Use inline links in markdown: [source name](URL).

Topic: {topic}
Bundle of source items (from MesaHomes content ingest, all verified
primary sources):

{bundleItems}

Generate:
1. A title under 70 characters, optimized for 'Mesa' or '{city}' SEO
2. A meta description under 160 characters
3. A 500-800 word article body
4. A plain-English disclaimer sentence at the end ("This is educational
   content, not legal advice. Consult a licensed Arizona Realtor for
   your specific situation.")

Output as JSON:
{
  "title": "...",
  "meta_description": "...",
  "body_markdown": "...",
  "citation_sources": ["..."]
}
```

## What to build FIRST

Task 2A (bundler) then 2B (photo-finder) in parallel with 2C (drafter),
then 2D (review UI) last. Tasks 2E + 2F get folded into 2C as it's built.

Cadence: pausing between phases for owner approval of each phase's output.

## Cost forecast

At 5-10 drafts/day:
- Bedrock Haiku: ~$0.30/mo
- Bedrock Nova Micro (fallback): ~$0.04/mo
- Unsplash API: $0 (we stay under 50/hr)
- Wikimedia: $0
- Lambda invocations: $0.50/mo
- S3 photo storage (~1 GB): $0.03/mo
- **Total: ~$1/month**

## Kill switches (in case it goes wrong)

- CloudWatch alarm $5/day → SNS → lambda auto-disabled flag in DDB
- Manual env var `CONTENT_DRAFTER_DISABLED=true` halts the daily cron
- Delete stale drafts: `aws dynamodb query ... PK begins_with CONTENT#DRAFT#`
- S3 purge: `aws s3 rm s3://mesahomes-property-photos/articles/ --recursive`

Rollback: revert commit + `cdk deploy`. Data is durable in DDB.
