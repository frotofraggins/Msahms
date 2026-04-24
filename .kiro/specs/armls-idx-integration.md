# ARMLS IDX Integration — Phase 2 Spec

Author: Kiro A, 2026-04-24. Status: spec — post-MVP, after license + ARMLS
subscription are active.

## What IDX is

IDX (Internet Data Exchange) lets a broker display OTHER brokers' MLS
listings on their own website. It's how Redfin, Zillow, and every
brokerage site shows "all homes for sale" — they pull the MLS feed.

For MesaHomes, IDX means: visitors can search active listings in Mesa
metro directly on mesahomes.com instead of being sent to Zillow.

## Prerequisites (must be true before any IDX work)

1. Owner's Arizona real estate license active (ADRE)
2. Broker of record identified and ARMLS-subscribed
3. IDX feed access requested through ARMLS ($10/month per showcaseidx.com)
4. ARMLS Rules of Cooperation reviewed and accepted (attribution,
   disclaimer, data freshness requirements)

## Data source: RESO Web API (not legacy RETS)

RESO Web API is the 2026 industry standard. RETS is legacy (still works
at some MLSs but being sunset). ARMLS supports both; we use RESO Web API.

| Aspect | RESO Web API | Legacy RETS |
|--------|-------------|-------------|
| Protocol | REST + OAuth2 | Custom binary over HTTP |
| Format | JSON (OData) | XML |
| Incremental sync | Native (ModificationTimestamp filter) | Possible but clunky |
| Certification | RESO-certified, standardized across MLSs | Per-MLS quirks |
| Future | Active development | Being sunset |

RESO Web API endpoint for ARMLS will be provided when IDX access is
granted. Typical pattern:
```
GET https://<armls-reso-host>/Property?$filter=ModificationTimestamp gt 2026-04-24T00:00:00Z and PostalCode in ('85140','85210',...)&$top=200&$skip=0
Authorization: Bearer <oauth2-token>
```

## Architecture (serverless, fits existing stack)

```
EventBridge cron (nightly 2am MST)
        │
        ▼
lambdas/idx-sync/
  1. OAuth2 token exchange with ARMLS RESO endpoint
  2. Incremental pull: Property where ModificationTimestamp > last sync
  3. Filter to service-area ZIPs (PINAL_COUNTY_ZIPS + Maricopa east valley)
  4. Normalize to our property model (reuse lib/property-normalizer.ts)
  5. Write to DynamoDB: PK=LISTING#MLS#{mlsNumber}, SK=ACTIVE
  6. Write photos to S3: s3://mesahomes-property-photos/mls/{mlsNumber}/
  7. Mark delisted properties (status changed or missing from feed)
  8. Log sync stats to CloudWatch
        │
        ▼
DynamoDB (mesahomes-main, same single table)
  PK=LISTING#MLS#{mlsNumber} / SK=ACTIVE
  GSI1PK=LISTING#MLS#ZIP#{zip} / GSI1SK=#{listPrice}
  GSI2PK=LISTING#MLS#STATUS#Active / GSI2SK=#{listDate}
        │
        ▼
lambdas/search-api/ (new, read-only)
  GET /api/v1/search?zip=85140&minPrice=300000&maxPrice=500000&beds=3
  Reads from DynamoDB GSI1/GSI2, returns paginated results
  No auth required (public IDX display)
        │
        ▼
frontend/src/app/search/page.tsx (new)
  Search form + results grid
  Static shell, client-side fetch from search-api
  Each listing card links to /listing/[mlsNumber]
        │
        ▼
frontend/src/app/listing/[mlsNumber]/page.tsx (new)
  Detail page with photos, property data, map
  JSON-LD RealEstateListing schema
  Lead capture CTA: "Interested? Talk to an agent"
```

## What we sync from ARMLS (RESO Property resource fields)

| RESO field | Our field | Notes |
|------------|-----------|-------|
| ListingKey | mlsNumber | Primary identifier |
| StandardStatus | status | Active, Pending, Closed, etc. |
| ListPrice | listPrice | |
| PostalCode | zip | Filter key |
| City | city | |
| StreetAddress (unparsed) | address | |
| BedroomsTotal | bedrooms | |
| BathroomsTotalInteger | bathrooms | |
| LivingArea | sqft | |
| LotSizeSquareFeet | lotSize | |
| YearBuilt | yearBuilt | |
| PublicRemarks | description | The listing agent's MLS remarks |
| Media[] | photos | Array of photo URLs to cache in S3 |
| ListingContractDate | listDate | |
| ModificationTimestamp | lastModified | Incremental sync key |
| ListOfficeName | listingOffice | Attribution requirement |
| ListAgentFullName | listingAgent | Attribution requirement |

## ARMLS Rules of Cooperation (attribution requirements)

Every displayed IDX listing MUST show:

1. **Listing office name and agent name** — visible on the listing card
   and detail page
2. **ARMLS disclaimer text** — provided by ARMLS, displayed in footer of
   every search results page and listing detail page
3. **Data freshness timestamp** — "Listing data last updated: {date}"
4. **No commingling** — IDX listings must be visually distinguishable
   from our own flat-fee listings (different card style or label)
5. **No scraping/redistribution** — data stays on mesahomes.com only

## DynamoDB key patterns

Fits existing single-table design. No new GSIs needed (GSI1 and GSI2
already exist).

| Entity | PK | SK | GSI1PK | GSI1SK | TTL |
|--------|----|----|--------|--------|-----|
| Active MLS listing | `LISTING#MLS#{mlsNumber}` | `ACTIVE` | `LISTING#MLS#ZIP#{zip}` | `#{listPrice}` | — |
| Delisted | `LISTING#MLS#{mlsNumber}` | `DELISTED#{date}` | — | — | 90d |
| Sync state | `IDX#SYNC` | `LATEST` | — | — | — |

## S3 photo caching

```
s3://mesahomes-property-photos/mls/{mlsNumber}/
  photo-1.jpg
  photo-2.jpg
  ...
```

Photos cached on first sync, refreshed if Media[] URLs change. Served
via CloudFront with 24h cache. Avoids hotlinking ARMLS photo servers
(which they prohibit).

## Lambda specs

### `lambdas/idx-sync/`
- Memory: 1024 MB (photo downloads are memory-intensive)
- Timeout: 300s (same as data-pipeline)
- EventBridge: `0 9 * * ? *` (2am MST = 9am UTC)
- Circuit breaker: `armlsApiCircuit` (3 failures → 300s open)
- Secret: `mesahomes/armls-oauth-credentials` in Secrets Manager
- Metrics: `MesaHomes/IDX/SyncSuccess`, `ListingsUpdated`, `PhotosCached`

### `lambdas/search-api/`
- Memory: 256 MB
- Timeout: 10s
- No auth (public IDX display)
- Reads DynamoDB only, no external calls
- Pagination: cursor-based via DynamoDB ExclusiveStartKey

## Cost estimate

At ~5,000 active listings in service-area ZIPs:

- ARMLS IDX fee: $10/month
- DynamoDB: ~5,000 items × ~2KB each = 10MB. PAY_PER_REQUEST reads for
  search: ~$0.50/month at low traffic
- S3 photos: ~5,000 listings × 10 photos × 200KB = ~10GB. Storage
  ~$0.23/month. CloudFront egress depends on traffic.
- Lambda: nightly sync ~60s × 1024MB = ~$0.001/day. Search API depends
  on traffic.
- **Estimated total: ~$15/month** (dominated by ARMLS fee + S3 storage)

## Relationship to our own listings

Two separate flows, same DynamoDB table:

| Flow | Direction | Key pattern | Source |
|------|-----------|-------------|--------|
| IDX (other brokers' listings) | ARMLS → us | `LISTING#MLS#{mlsNumber}` | idx-sync Lambda |
| Our flat-fee listings | us → ARMLS | `LISTING#{listingId}` | listing-service Lambda |

Our listings go OUT to ARMLS via the broker-of-record's MLS submission
(manual or API, depending on ARMLS's broker tools). They come BACK in
the IDX feed like any other listing. We should detect our own listings
in the IDX feed (match on address or mlsNumber) and link them to the
existing `LISTING#{listingId}` record rather than creating duplicates.

## Frontend: search vs browse

We are NOT building a Zillow clone. The search page is a lead-capture
tool, not a browsing experience.

- Default view: service-area ZIPs only (no statewide search)
- Prominent CTA on every listing: "Want to see this home? Talk to an
  agent" → LeadCaptureModal with toolSource="idx-search"
- Every listing detail page has: PropertyDataCard (our county data),
  NearbyComps (our GIS data), MarketSnapshot (our Zillow data) — this
  is the differentiator vs Zillow's own listing page
- No saved-search or alert features in Phase 2 (Phase 3 if ever)

## Implementation checklist

- [ ] ARMLS IDX access granted (broker-of-record requests)
- [ ] `mesahomes/armls-oauth-credentials` secret created
- [ ] `lambdas/idx-sync/` — OAuth2 + RESO Property pull + normalize +
      DDB write + S3 photo cache
- [ ] `lambdas/search-api/` — public search endpoint with ZIP/price/beds
      filters + pagination
- [ ] `lib/idx-normalizer.ts` — maps RESO Property fields to our model
      (reuses property-normalizer patterns)
- [ ] `lib/models/keys.ts` — add `generateMlsListingKeys()`
- [ ] `frontend/src/app/search/page.tsx` — search form + results grid
- [ ] `frontend/src/app/listing/[mlsNumber]/page.tsx` — detail page with
      JSON-LD RealEstateListing
- [ ] ARMLS disclaimer component in footer of search/listing pages
- [ ] Attribution: listing office + agent name on every card
- [ ] De-duplication: detect our own listings in IDX feed
- [ ] CloudWatch alarms: SyncSuccess <95%, ListingsUpdated = 0 (stale)
- [ ] Runbook: "ARMLS changed their RESO endpoint URL" recovery steps

## Timeline

Phase 2 — after MVP launch, after license + ARMLS active, after flat-fee
listings are live and generating revenue. Estimated 2-3 weeks of
development once ARMLS access is granted.

## References

- RESO Web API guide: https://www.reso.org/api-guide/
- RESO certification: https://www.reso.org/certification/
- ARMLS IDX fee ($10/mo): https://showcaseidx.com/mls-coverage/arizona-regional-multiple-listing-service-armls/
- RETS vs RESO Web API 2026: https://oyelabs.com/rets-vs-reso-web-api-for-real-estate-platforms-in-2026/
- SimplyRETS developer API (reference implementation): https://simplyrets.com/idx-developer-api
