# Verified Content Sources — Live Data Flow Record

**Purpose**: Track every content source that's been verified working
end-to-end (endpoint → parser → S3 → DDB). Update this file every
time a source is added, parser changes, or source drifts.

**Last audit**: 2026-04-27 by Kiro A
**Env**: production (mesahomes-main DDB + mesahomes-content-ingest S3)

---

## Phase 1 — ACTIVE

### `mesa-legistar-events`

**Source**: Mesa City public meetings via Legistar REST API
**URL**: `https://webapi.legistar.com/v1/mesa/events`
**Auth**: None (public API)
**Gotcha**: Requires `Accept: application/json` header. Returns 403 on
  HEAD requests — always use GET for verification.
**Rate limits**: None documented; we poll once daily.

**Parser behavior** (verified 2026-04-27 Lambda run):
- Builds OData filter: `EventBodyId eq {id}` across 8 bodies
- Date window: last 14 days + next 30 days (44 day window)
- Orders by `EventDate desc`, max 100 items

**First run**:
- Direct API (curl): 50 events returned for all-bodies filter
- Lambda invocation: **4 items ingested** (filtered by 8 body IDs + date window)
- S3 objects: `s3://mesahomes-content-ingest/mesa-legistar-events/2026-04-27/event-{4484,4658,4662,4665}.json` (~880 bytes each)
- DDB: 4 items with PK=`SOURCE#mesa-legistar-events`, SK=`HASH#{16-char-sha}`, GSI1PK=`TOPIC#zoning`
- Dedup: Re-invoking immediately returns 0 new, 4 duplicates ✅

**Sample payload**:
```json
{
  "EventId": 4662,
  "EventBodyName": "Planning & Zoning Board - Public Hearing",
  "EventDate": "2026-04-22T00:00:00",
  "EventLocation": "Council Chambers",
  "EventAgendaFile": "...",
  "EventMinutesFile": "..."
}
```

**Gaps**:
- `/events/{id}/eventitems` (agenda detail) not yet fetched. Phase 2 work.
- `/matters` (zoning cases) is a separate Phase 2 source.

---

### `mesa-pd-incidents`

**Source**: Mesa Police Department incident data via Socrata Open Data
**URL**: `https://data.mesaaz.gov/resource/hpbg-2wph.json`
**Auth**: None (open data)
**Gotcha**: HEAD requests return 404; always GET. Requires `$where`
  parameter — unparameterized GET returns empty set.
**Rate limits**: 1000 requests/hour unauthenticated.

**Parser behavior** (verified 2026-04-27):
- 7-day lookback window (`occurred_date > {now-7d}`)
- Limit 1000 records
- **Aggregates counts by crime_type + crime_against** — Fair Housing
  compliance: individual incidents NOT persisted
- Returns 1 weekly summary record per run

**First run**:
- Direct API: 195 incidents in last 7 days
- Lambda: **1 aggregate record ingested** (this is the point — the
  raw 195 records stay transient; only the city-wide aggregate
  lands in S3/DDB)
- S3: `mesa-pd-incidents/2026-04-27/mesa-pd-weekly-2026-04-27.json` (1.6 KB)
- DDB: 1 item with PK=`SOURCE#mesa-pd-incidents`, GSI1PK=`TOPIC#safety`
- Dedup: subsequent same-day invocations return 0 new, 1 duplicate ✅

**Sample payload**:
```json
{
  "windowStart": "2026-04-20",
  "windowEnd": "2026-04-27",
  "totalIncidents": 195,
  "byCrimeType": {
    "THEFT": 87,
    "BURGLARY": 23,
    "ASSAULT": 15,
    ...
  },
  "byCategory": {
    "Property": 134,
    "Person": 42,
    "Society": 19
  },
  "note": "Aggregate counts only. Individual incident records intentionally not persisted per Fair Housing policy."
}
```

**Fair Housing safeguard**: The parser hardcodes aggregation. Even
if config changes, individual records never hit S3 or DDB.

**Cadence**: Weekly (cron Mon 7am MST). Daily would produce near-
zero incremental value — crime data is slow-moving.

---

### `reddit-mesaaz`

**Source**: Reddit r/mesaaz community posts via Atom feed
**URL**: `https://www.reddit.com/r/mesaaz/.rss`
**Auth**: None
**Gotcha**: Reddit blocks generic User-Agent strings. Must send
  `User-Agent: MesaHomesBot/1.0 (+https://mesahomes.com)` or similar
  descriptive UA. Default Node/curl UAs return 403.
**Rate limits**: ~1 req/s per IP unauthenticated. Daily poll is fine.

**Parser behavior**:
- Generic RSS/Atom parser (`parsers/rss.ts`)
- No keyword filter — all community posts ingested for sentiment layer
- Extracts title + description + link + pubDate + guid
- Strips HTML, collapses whitespace

**First run**:
- Direct fetch: 25 `<entry>` items
- Lambda: **25 items ingested** on first run
- S3: `reddit-mesaaz/2026-04-27/rss-t3-{reddit-id}-{index}.json` (~1.1-1.7 KB each)
- DDB: 25 items with PK=`SOURCE#reddit-mesaaz`, GSI1PK=`TOPIC#news`
- Dedup: re-invocations return 0 new, 25 duplicates ✅

**Sample payload**:
```json
{
  "title": "lgbtq youth 🤫",
  "description": "hello my family is moving to mesa in like august—october...",
  "link": "https://www.reddit.com/r/mesaaz/comments/1sx49cf/lgbtq_youth/",
  "pubDate": "2026-04-27T13:49:17+00:00",
  "guid": "t3_1sx49cf"
}
```

**Topic drift note**: Reddit posts span every topic (housing, driving,
jobs, events, sentiment). The bundler Lambda (Phase 2, not yet built)
will classify each item into a secondary topic before LLM consumption.
For now everything is tagged `news` in GSI1.

---

## Storage layout — verified 2026-04-27

```
s3://mesahomes-content-ingest/
  ├── mesa-legistar-events/
  │     └── 2026-04-27/
  │           ├── event-4484.json    (894 B)
  │           ├── event-4658.json    (876 B)
  │           ├── event-4662.json    (926 B)
  │           └── event-4665.json    (882 B)
  ├── mesa-pd-incidents/
  │     └── 2026-04-27/
  │           └── mesa-pd-weekly-2026-04-27.json  (1.6 KB)
  └── reddit-mesaaz/
        └── 2026-04-27/
              ├── rss-t3-1sx49cf-0.json    (~1.1 KB)
              ├── rss-t3-1swse27-1.json    (~1.2 KB)
              └── ... (23 more files)
```

**Total first-run footprint**: 30 S3 objects, ~35 KB total. 90-day
Glacier transition kicks in automatically.

## DDB access patterns — verified

| Access pattern | Query | Who uses it |
|----------------|-------|-------------|
| Get all items from a source | `PK = SOURCE#{id}` | Phase 2 bundler, re-processing |
| Check if hash already seen | `PK = SOURCE#{id}, SK = HASH#{hash}` | Dedup on every ingest |
| Get all items in a topic by date | `GSI1PK = TOPIC#{topic}, GSI1SK begins_with SEEN#{date}` | Phase 2 bundler |
| Chronological topic feed | `GSI1PK = TOPIC#{topic}` sort SK desc | Phase 2 bundler |

## Data flow diagram (actual, as-built)

```
                                    07:00 MST daily
                                         │
                                         ▼
                        EventBridge: ContentIngestDailyCron
                                         │
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  content-ingest Lambda (512MB/5min) │
                    └─────────────────────────────────────┘
                                         │
                       Reads sources from lib/content-sources.ts
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
        parsers/legistar.ts    parsers/socrata.ts      parsers/rss.ts
                   │                     │                     │
                   ▼                     ▼                     ▼
          webapi.legistar.com    data.mesaaz.gov          reddit.com
              (4 events)         (195 incidents →     (25 community posts)
                                  1 aggregate)
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                                           ▼
         ┌──────────────────┐                    ┌───────────────────┐
         │   S3 audit lake  │                    │  DynamoDB index   │
         │  Key: {src}/     │                    │  PK: SOURCE#{src} │
         │    {date}/       │                    │  SK: HASH#{hash}  │
         │    {itemId}.json │                    │  GSI1: TOPIC#...  │
         └──────────────────┘                    └───────────────────┘
             30 items                                30 items
                                                         │
                                           [Phase 2 bundler reads here]
                                           [Phase 3 drafter reads bundles]
```

## How to re-verify at any time

```bash
# Quick sanity check (runs all 3 sources, returns counts):
aws lambda invoke --function-name mesahomes-content-ingest \
  --payload '{"cadence":"daily"}' \
  --profile Msahms --region us-west-2 /tmp/ingest.json
cat /tmp/ingest.json

# Check S3:
aws s3 ls s3://mesahomes-content-ingest/ --recursive \
  --profile Msahms --region us-west-2 | \
  awk '{print $NF}' | awk -F/ '{print $1}' | sort | uniq -c

# Check DDB by source:
for src in mesa-legistar-events mesa-pd-incidents reddit-mesaaz; do
  echo -n "$src: "
  aws dynamodb query --table-name mesahomes-main \
    --key-condition-expression "PK = :pk" \
    --expression-attribute-values "{\":pk\":{\"S\":\"SOURCE#$src\"}}" \
    --profile Msahms --region us-west-2 \
    --select COUNT --output text | grep -oE '[0-9]+$'
done
```
