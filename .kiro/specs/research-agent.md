# Research-Augmented Content Drafter (MCP-connected)

Author: Kiro A, 2026-04-28.
Status: draft — deferred until traffic justifies the cost.
Triggered by: owner observation that any AI worth running must be
connected to MCP-style tool use; current drafter only sees what's
in the bundle and can't pull additional context.

## Why this matters

Today's drafter operates in a closed loop:
```
content-ingest (16 sources) -> bundler -> drafter prompt
                                            |
                                            v
                                      Bedrock -> draft
```

The model only knows what's in the bundle. If a zoning case cites
"ADJ 26012" with a 2-sentence summary, the drafter can only reproduce
that limited context. It can't check:
- Whether the Maricopa GIS parcel record has more detail
- Whether any prior coverage exists on mesanow.org or KTAR
- What neighboring subdivisions exist at that address
- What the current Zillow market data says for that ZIP

A research-augmented drafter can fill those gaps and produce richer,
better-cited articles without increasing our input data cost (the
primary sources are already free).

## Three ways to do MCP-style research

### Option A: Bedrock Tool Use (AWS-native)
Claude Haiku 4.5 supports Bedrock tool use. We define `tools = [web_search,
query_ddb, query_maricopa_gis]` and the model decides when to call them
during drafting.
- **Pros**: single AWS bill, no third-party keys, tight IAM
- **Cons**: web_search via Bedrock requires Brave Search API enabled at
  AWS account level, not yet rolled out everywhere
- **Cost**: ~$0.01 per tool call roundtrip at current pricing

### Option B: External MCP server (self-hosted or hosted)
Run a local MCP server that exposes our internal tools (DDB lookups,
Maricopa GIS, Zillow data, internal post search) and the model calls
it via the MCP protocol.
- **Pros**: fully controlled, extensible, works with any model that
  supports MCP
- **Cons**: we have to host + maintain the MCP server
- **Cost**: server ops + model inference

### Option C: Hard-coded pre-flight research step
Before calling the drafter, the orchestrator runs 2-3 fixed lookups
(DDB query for related published posts, GIS lookup if bundle has an
address, Zillow metro data) and stuffs the results into the prompt.
- **Pros**: simplest, deterministic, testable
- **Cons**: model can't iteratively decide to look up more
- **Cost**: $0 beyond our current infrastructure

## Recommendation

**Start with Option C. Move to Option A when traffic justifies it.**

Option C captures 80% of the value at 10% of the complexity. Most of
our bundles have predictable context needs:
- Zoning bundle -> Maricopa GIS parcel lookup
- Big-sale bundle -> Zillow ZIP trend pull
- HOA bundle -> existing CONTENT#BLOG entries for the subdivision
- Market-news bundle -> Zillow metro metrics

Hard-coding these 4 lookups is a week of work. Bedrock tool use is a
multi-month architectural investment that only pays off when we have
10x more traffic and the model's judgment about what to look up
actually matters.

## Phase 1: Pre-flight research (Option C)

Pipeline:
```
bundler output
    |
    v
pre-flight researcher Lambda
    - For each bundle, inspect topic + items
    - If zoning topic: query Maricopa GIS by extracted parcel/case ID
    - If market-news topic: query DDB for latest Zillow metrics
    - If HOA topic: query DDB BLOG#PUBLISHED for prior coverage of
      mentioned subdivisions
    - If big-sale topic: query DDB for ZIP-level ZHVI trend
    - Write `enrichedContext` back onto the bundle record
    |
    v
drafter reads bundle AND enrichedContext -> richer prompt
```

Trigger: runs 15 minutes after bundler (14:45 UTC). Feeds the 15:00
UTC drafter cron.

## Phase 2 (deferred): Full Bedrock tool use

When Phase 1 is live and we have data on:
- How much enrichedContext improves article quality (measured by
  citation count per article + owner approval rate)
- Which bundles consistently lack the right pre-flight lookup

...then consider graduating to Bedrock tool use so the model can
iteratively request the right data per article.

## Non-goals

- **Paid Google search**. See `.kiro/specs/seo-audit-2026-04-28.md`
  Phase 2 note — not justified until we have traffic.
- **Scraping third-party sites**. Owner raised this; we rejected
  because of ToS + copyright risk. Only use sources we have a right
  to consume (public APIs, government data, primary sources in our
  content-sources.ts registry).
- **Real-time web browsing during drafting**. Too expensive, too
  unpredictable. Pre-flight batch lookups are better at our scale.

## Tasks (if/when we build Phase 1)

- [ ] Create `lambdas/content-researcher/` Lambda (triggered by
      EventBridge 14:45 UTC)
- [ ] For each bundle in BUNDLE#PENDING, run topic-specific lookups
- [ ] Write `enrichedContext` back to the bundle record
- [ ] Update drafter buildPrompt() to include enrichedContext section
- [ ] Add CloudWatch metric: `bundles.enrichmentHits`, `bundles.enrichmentMisses`
- [ ] After 2 weeks of data, review whether citation count went up
- [ ] Add spec `.kiro/specs/phase-2-bedrock-tool-use.md` if the
      Phase 1 data warrants graduating

## Cost envelope for Phase 1

- Extra Lambda invocations: ~210 bundles/day × a few API calls each
  = maybe 1,000 Maricopa GIS / Zillow / DDB calls/day
- Maricopa GIS is free (public API)
- Zillow data already ingested; reading from our DDB is free
- DDB reads: ~$0.50/month extra
- Lambda compute: ~$0.30/month extra
- **Total added cost: well under $2/month**

## Related

- `.kiro/specs/content-pipeline-phase-2.md` — where the drafter lives
- `.kiro/specs/seo-audit-2026-04-28.md` — the audit that made us think
  about content depth harder
- `.kiro/specs/seller-hub-content.md` — hand-written articles are the
  editorial anchor that AI research-augmented drafts expand around
