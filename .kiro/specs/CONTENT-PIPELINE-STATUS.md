# Content Pipeline — Status Overview (2026-04-27)

Top-level navigator so we don't lose track of what shipped vs what's pending across the multiple content specs.

## Specs that describe the AI content pipeline (read order)

1. **`content-ingest-pipeline.md`** — original blueprint (2026-04-25). Phases 1-3 + 4.1 done. Phases 4.2-4.4 deferred.
2. **`phase-1b-content-automation.md`** — earlier spec (2026-04-24) with partial overlap. Marked `[~]` on items superseded by phase-2 implementation (no separate content-diff or content-publisher — merged into ingest + CodeBuild).
3. **`content-pipeline-phase-2.md`** — this session's tracker for phases 2A-2F. Phases 2A + 2B + 2C + 2D all done. Phases 2E (compliance filter enhancements) + 2F (cost monitoring) deferred.
4. **`content-ingest-verified-sources.md`** — live data-flow record (narrative, no checkboxes). Updated when we add/change sources.
5. **`ai-content-and-photos-research.md`** — research memo (no checkboxes).
6. **`hoa-hyperlocal-strategy.md`** — 3-tier HOA product approach (narrative).
7. **`hyperlocal-content-pipeline.md`** — broader content strategy (narrative).

## What shipped end-to-end this session (2026-04-27)

```
Data sources (16 live)      content-ingest     content-bundler    content-drafter
  Mesa Legistar events      daily 7am MST ─►   7:30am ─►          8am MST
  Legistar matters          475 items/day      210 bundles/day    5 drafts/day
  Mesa PD Socrata                              (clustered)        (Bedrock Nova Micro)
  Mesa historic registry
  Reddit x3                                                       ▼
  Mesa now news                                             photo-finder
  Maricopa subdivisions                                    (Wikimedia → Unsplash)
  Maricopa big sales                                              ▼
  NOAA weather alerts                                      SES email to owner
  AZ Governor news                                                ▼
  Realtor.com news                                         /dashboard/content/drafts/
  HousingWire news                                                ▼
  The Mortgage Reports                                     [Owner clicks Approve]
  Redfin blog                                                     ▼
                                                           dashboard-content Lambda
                                                                  ▼
                                                    DDB: CONTENT#BLOG#{slug}
                                                                  ▼
                                                    CodeBuild: mesahomes-frontend-rebuild
                                                    (npm build + S3 sync + CF invalidate)
                                                                  ▼
                                                    https://mesahomes.com/blog/{slug}/
                                                    with Article JSON-LD, photo, citations
```

Verified live: https://mesahomes.com/blog/hoa-fees-mesa-az/

## AI SEO layer shipped

- `llms.txt` at https://mesahomes.com/llms.txt
- robots.txt allows 20 AI crawlers (OpenAI, Anthropic, Perplexity, Google AI, Meta, Apple, Amazon, etc.)
- Enhanced homepage JSON-LD with `hasOfferCatalog`, `@id`, `alternateName`, real phone
- Article JSON-LD on blog posts with `image`, `publisher.logo`, canonical URL
- Sitemap auto-includes AI-published slugs

## Still open (by priority)

### Near-term (keep momentum)
- **content-pipeline-phase-2 § 2F**: CloudWatch alarm at $5/day Bedrock spend
- **content-pipeline-phase-2 § 2D.5**: mobile-responsive review UI polish
- **phase-1b-lead-gen-amplification § 1**: agent email actions
- **phase-1b-lead-gen-amplification § 5**: more Zillow datasets throughout site

### Medium-term (content moat)
- **content-ingest-pipeline § 4.2**: `/moving-to-mesa` relocation hub
- **content-ingest-pipeline § 4.3**: Housing law tracker (HUD/CFPB/ADRE Federal Register)
- **phase-1b-lead-gen-amplification § 6**: `/moving-to-mesa` with state-tax data
- **phase-1b-lead-gen-amplification § 7**: HOA directory auto-build from Maricopa GIS

### Owner-blocked (external)
- Broker-of-record partnership (unblocks Mesa Listing Service public launch)
- SES production access (pending AWS approval since 2026-04-26)
- Legal memo for privacy/terms
- Google Business Profile completion (owner task)

### Deferred
- Phase 2E compliance filter extensions (add when we see a real-world miss)
- Social media auto-scheduler (§ 4.4)
- Hydra AI backend swap (local RTX 4090)
- ARMLS IDX integration (requires paid data feed)
