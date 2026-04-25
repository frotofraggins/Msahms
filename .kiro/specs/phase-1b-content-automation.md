# Phase 1B — Content Automation Spec

Author: Kiro A, 2026-04-24. Status: draft — scoped for post-MVP build.

## Purpose

Operationalize the daily regulatory-change tracking described in
`content-sources.md` § "Housing Law & Regulatory Change Tracking" as a
serverless AWS pipeline that ingests, diffs, drafts, and queues blog posts
for human review. Runs on the existing MesaHomes stack (DynamoDB single
table, S3 `mesahomes-data`, local RTX 4090 via MCP). No new infra types.

## Outcome

Every business day by 09:00 MST, the Team_Admin dashboard has a review queue
of 0-5 AI-drafted blog posts on federal, state, and local housing rule
changes affecting Mesa-area buyers, sellers, and agents. Each post cites its
primary source and passes the Fair Housing compliance filter. A human
approves, edits, or rejects. Approved posts publish to
`/blog/<slug>` and appear in the sitemap.

## Non-goals

- **Auto-publish without review.** Explicitly out of scope. Legal risk is
  the entire point; a human signs off until edit-rate over trailing 30 days
  drops below 5%.
- **Generic blog generation.** The pipeline only generates posts when an
  upstream source changes. No "write me a post about Mesa real estate."
- **Chat or conversational interface.** Agent-style iteration lives in
  Hydra, not here.

## Reference architectures we reuse

Research done 2026-04-24 (steering rule: research first).

1. **aws-samples/serverless-content-service-from-rss**
   https://github.com/aws-samples/serverless-content-service-from-rss —
   provides the RSS-poller + ETag-caching pattern. We keep the ingest +
   poller components, replace their publishing flow with our review queue.
2. **Building Serverless Land: automating content aggregation** (AWS blog)
   https://aws.amazon.com/blogs/compute/building-serverless-land-part-1-automating-content-aggregation/ —
   references S3-backed static snapshots for diffing. We reuse this idea.
3. **AWS Content Moderation Guidance** — reference for "review before publish"
   queuing. Used for the drafter → DynamoDB review queue → approve endpoint
   → publish Lambda flow.
4. **RSS/Atom spec** — ETag + Last-Modified HTTP headers to avoid re-fetching.
   Cuts bandwidth ~95% across stable feeds.
5. **HUD 2024 AI guidance (PR-24-098)** and **Promptfoo Fair Housing red-team
   plugin** — reference for what the compliance step must enforce.

## Components (all Lambda, all Node.js 20 TypeScript)

### `lambdas/content-ingest/`

Role: RSS / JSON poller.

- Invoked by EventBridge cron `0 14 * * ? *` (07:00 MST = 14:00 UTC, daily).
- Reads source registry from `lib/content-sources.ts`.
- For each source: fetches feed using stored ETag + Last-Modified. On 304 →
  skip. On 200 → write to `s3://mesahomes-data/content-ingest/<source>/<YYYY-MM-DD>/raw.xml`
  and emit an EventBridge event `content.ingested` with source+date.
- Stores per-source last ETag and Last-Modified in DynamoDB:
  `PK=CONTENT#SOURCE#<sourceId>`, `SK=ETAG`.
- Respects robots.txt and per-source rate limits (config in registry).
- Retries 2x with 1s/2s backoff per `lib/retry.ts`.
- Memory: 256 MB. Timeout: 60s.

### `lambdas/content-diff/`

Role: identify genuinely new items vs previous snapshot.

- Triggered by `content.ingested` event.
- Loads current + previous snapshot from S3.
- For RSS: diff on `<item>` GUID. For Legistar JSON: diff on matter ID.
- For plain JSON: diff by natural key defined in source registry.
- Emits `content.changed` event per NEW item with:
  `{ sourceId, itemId, primaryUrl, title, publishedAt, bodyExcerpt }`.
- Memory: 256 MB. Timeout: 30s.

### `lambdas/content-drafter/`

Role: generate draft explainer via local AI (MCP), pass compliance filter,
queue for review.

- Triggered by `content.changed` event.
- Loads the item + source metadata.
- Calls MCP AI endpoint (via `lib/ai-proxy.ts` wrapper) with prompt:

  ```
  You are a Mesa, Arizona real estate content writer.
  A new regulatory item was published. Write a 300-600 word plain-English
  explainer for <bucket> readers. Must:
  - Start with one sentence describing what changed.
  - Explain what it means specifically for MesaHomes readers in the Mesa
    metro area.
  - Include 'what to do next' with a CTA to the relevant tool/agent.
  - End with a disclaimer: 'Educational only, not legal advice.'
  - Cite the primary source URL at the end.
  - Never give specific legal advice.
  - Respect Fair Housing Act — no references to protected classes in a
    discriminatory way.

  Item:
  <title>
  <publishedAt>
  <bodyExcerpt>

  Primary source: <primaryUrl>
  Bucket: <bucket>
  ```

- Runs output through `lambdas/ai-proxy/compliance-filter.ts`. Hard-block
  on any Fair Housing violation — drafter emits `content.rejected` with
  reason and exits.
- Runs citation-density check: at least one quoted phrase or section
  reference per paragraph. Fail → reject.
- On pass: writes draft to DynamoDB with status `pending-review`.
  Keys: `PK=CONTENT#DRAFT#<draftId>`, `SK=DRAFT#<createdAt>`,
  `GSI1PK=CONTENT#DRAFT`, `GSI1SK=#<createdAt>`.
- SES notification to Team_Admin with review link.
- Memory: 512 MB. Timeout: 60s.
- Circuit breaker: if MCP endpoint fails 3x in 5 minutes, queue to DLQ and
  alert via SES.

### `lambdas/content-api/` additions

(Extends existing lambda from Task 6.)

- `GET /api/v1/dashboard/content/drafts?status=pending-review&limit=20` —
  auth: Team_Admin. Returns paginated drafts via GSI1.
- `GET /api/v1/dashboard/content/drafts/{id}` — returns full draft with
  metadata.
- `PATCH /api/v1/dashboard/content/drafts/{id}` — auth: Team_Admin.
  Body: `{ action: 'approve' | 'edit' | 'reject', body?, rejectionReason? }`.
  - `approve` → update existing draft's status to `approved`, invoke
    content-publisher via direct Lambda call.
  - `edit` → update body, status stays `pending-review`.
  - `reject` → status `rejected`, optional reason.
- All three touch existing `putItem` / `getItem` via `lib/dynamodb.ts`.

### `lambdas/content-publisher/`

Role: move approved drafts to published blog posts.

- Takes `draftId`, reads draft, writes BlogPost record:
  `PK=CONTENT#BLOG#<slug>`, `SK=CONTENT#BLOG#<slug>`,
  `GSI1PK=CONTENT#BLOG`, `GSI1SK=#<publishDate>`.
- Assigns slug from title + date (deterministic).
- Invalidates CloudFront cache for `/blog`, `/blog/<slug>`, `/sitemap.xml`.
- Posts to SNS topic `mesahomes-content-published` (future: social webhooks).
- Memory: 256 MB. Timeout: 30s.

## Shared library additions

### `lib/content-sources.ts`

Source registry — single source of truth. Matches §7 of
`content-sources.md`.

```ts
export interface ContentSource {
  id: string;               // unique id, kebab-case
  name: string;             // human-readable
  bucket: 'consumer-transaction' | 'agent-practice' | 'finance-mortgage'
        | 'hoa-community' | 'local-zoning';
  url: string;
  format: 'rss' | 'atom' | 'json' | 'legistar' | 'html';
  cadence: 'daily' | 'weekly' | 'monthly' | 'event';
  respectsRobots: boolean;  // fallback html scrapers must set true
  lastVerified: string;     // ISO date — alert if >90 days
  // Source-specific config (e.g., Legistar body IDs, JSON path to items)
  config?: Record<string, unknown>;
}

export const SOURCES: ContentSource[] = [
  { id: 'hud-press', name: 'HUD Press Releases',
    bucket: 'consumer-transaction',
    url: 'https://www.hud.gov/rss',
    format: 'rss', cadence: 'daily', respectsRobots: true,
    lastVerified: '2026-04-24' },
  // ... ~30 sources total, mirroring content-sources.md appendix
];
```

### `lib/ai-proxy.ts`

Thin wrapper around the MCP AI endpoint. Adds retry + compliance post-check.
Current `lambdas/ai-proxy/index.ts` already exists — likely we promote its
client logic to `lib/` and thin the Lambda to just routing.

### `lib/content-diff.ts`

Pure functions for diffing snapshot A vs B by natural key. Property tests:
- No item in A∩B appears in output (only truly new).
- Deleted items don't appear as "new".
- Idempotent when run on identical snapshots.

## DynamoDB key patterns

| Entity | PK | SK | GSI1PK | GSI1SK | TTL |
|--------|----|----|--------|--------|-----|
| Source state | `CONTENT#SOURCE#<id>` | `ETAG` | — | — | — |
| Raw snapshot pointer | `CONTENT#SOURCE#<id>` | `SNAPSHOT#<date>` | — | — | 90d |
| Draft | `CONTENT#DRAFT#<id>` | `DRAFT#<createdAt>` | `CONTENT#DRAFT` | `#<createdAt>` | — |
| Rejected draft | `CONTENT#DRAFT#<id>` | `REJECTED#<createdAt>` | `CONTENT#DRAFT#REJECTED` | `#<createdAt>` | 180d |
| Published post (existing) | `CONTENT#BLOG#<slug>` | `CONTENT#BLOG#<slug>` | `CONTENT#BLOG` | `#<publishDate>` | — |

All patterns fit the existing single-table design in `lib/models/keys.ts` —
no new GSI required.

## S3 key layout

```
s3://mesahomes-data/content-ingest/
  <sourceId>/
    <YYYY-MM-DD>/
      raw.xml or raw.json
      extracted-items.json
```

Lifecycle rule: delete raw files after 90 days. Extracted JSON kept
indefinitely as audit trail.

## Metrics

Every Lambda emits CloudWatch metrics under namespace `MesaHomes/Content`:

| Metric | Dimension | Alarm threshold |
|--------|-----------|-----------------|
| `SourceFetchSuccess` | source | <95% over 24h → page |
| `SourceFetchLatencyMs` | source | p99 > 10s → warn |
| `DraftsGenerated` | bucket | — (observability) |
| `DraftsRejectedByCompliance` | reason | >10/day → review prompts |
| `HumanEditRate` | — | <5% over 30d → graduate to auto-publish path |
| `MCPLatencyMs` | — | p99 > 30s → warn |

## Security + compliance

1. **Fair Housing filter is a HARD block**, not a warn. Drafts failing it
   are rejected with reason logged, not queued. Uses the existing
   `lambdas/ai-proxy/compliance-filter.ts`.
2. **Every draft and published post cites its primary source URL.** No
   citations = no publish. Enforced in drafter.
3. **Disclaimer on every post**: "Educational only, not legal advice."
   Appended in publisher if drafter omitted.
4. **"Last verified" date on source registry.** Alert at 90 days so an
   owner re-confirms the URL hasn't moved.
5. **No PII in logs.** CloudWatch redaction via logger in `lib/`.
6. **CloudFront cache invalidation** on publish so readers see updates
   immediately.
7. **robots.txt respected** for HTML fallback scrapers. RSS and JSON APIs
   are explicit consent to poll.

## Rollout plan

1. **Week 1:** Ship source registry + content-ingest Lambda only. Confirm
   we can fetch all ~30 sources with ETag caching. Review S3 snapshots
   manually.
2. **Week 2:** Ship content-diff. Review new-items emission manually for
   one week — confirm we're not flooding with false positives.
3. **Week 3:** Ship content-drafter with compliance filter. Observe reject
   rate. Tune prompts.
4. **Week 4:** Ship dashboard review queue endpoints. Team_Admin starts
   reviewing drafts.
5. **Week 5:** Ship content-publisher. First approved drafts land in
   production blog.
6. **Month 2+:** Watch HumanEditRate and DraftsRejectedByCompliance. If
   edit rate <5% and reject rate stable, consider auto-publish for
   `consumer-transaction` bucket only (never HOA or agent-practice; those
   stay human-reviewed indefinitely).

## Open questions

1. **Do we want multi-language output?** Mesa metro has large Spanish-speaking
   population. MVP: English only. Follow-up: Spanish on same prompts, human
   reviews English first then confirms Spanish.
2. **What's the SLA for review queue?** If Team_Admin doesn't review within
   48h, do we auto-publish, auto-reject, or escalate? Recommendation:
   auto-reject with `stale-queue` reason; Team_Admin can un-reject within
   30 days.
3. **Per-source quality weighting.** HUD releases ≠ a random blog post. Some
   sources always merit posts; others only when specific keywords appear.
   Add `alwaysPublish: boolean` and `requiredKeywords: string[]` to
   ContentSource config.
4. **Legal review for high-risk buckets.** `hoa-community` and
   `finance-mortgage` can cross into unauthorized practice of law. Consider
   a paid retainer with an AZ real estate attorney for weekly spot-checks.

## Rough cost estimate

All numbers at ~5 new items/day across 30 sources:

- Lambda invocations: ~150/day ingest + 5/day drafter + 10/day API. Free
  tier covers it.
- DynamoDB: PAY_PER_REQUEST. Few dozen writes/day. ~$0.01/month.
- S3: ~10 MB/month raw snapshots. ~$0.0005/month storage, free egress.
- CloudWatch logs + metrics: ~500 MB/month. ~$0.25/month.
- MCP calls: local RTX 4090 = zero AWS cost.
- SES: Team_Admin notification emails. ~$0.0001/day.
- **Estimated total: under $1/month.** Stays in owner's stated "free tier
  until leads come in" constraint.

## Deliverable checklist

When Kiro B (or whoever picks this up) is ready to implement:

- [ ] Create source registry `lib/content-sources.ts` from content-sources.md
- [ ] `lambdas/content-ingest/` with EventBridge cron + ETag caching
- [ ] `lambdas/content-diff/` with property-tested diff functions
- [ ] `lambdas/content-drafter/` with MCP call + compliance filter
- [ ] `lambdas/content-api/` review queue endpoints (additive to existing)
- [ ] `lambdas/content-publisher/` with CloudFront invalidation
- [ ] DynamoDB key helpers in `lib/models/keys.ts` for DRAFT, REJECTED
- [ ] `lib/content-diff.ts` shared library with tests
- [ ] Dashboard UI: draft review queue page
- [ ] CloudWatch alarms for SourceFetchSuccess, DraftsRejectedByCompliance,
      HumanEditRate
- [ ] Runbook for "a source URL moved / feed format changed"
