# MesaHomes

Hyper-local Mesa, Arizona real estate platform. Flat-fee MLS listings,
FSBO support, full-service agent option, autonomous content pipeline
for local market news + guides, and a dashboard for lead + content
management.

**Production**: https://mesahomes.com  •  live since 2026-04-26

---

## What the product does

Three service tiers for sellers:

1. **FSBO** (lead-only launch mode) — lead capture, home-value tools, paperwork guidance
2. **Mesa Listing Service** (flat-fee MLS, $999) — ARMLS listing with Zillow/Realtor.com/Redfin syndication
3. **Full-service** — traditional agent representation via local broker partnership

Plus self-serve tools:

- Home value estimator (ARMLS comps + Zillow + Maricopa GIS)
- Net sheet calculator
- Sell-now-or-wait modeler
- Affordability calculator
- AI offer writer

Plus an autonomous content pipeline (16 ingest sources → bundler →
Bedrock drafter → photo finder → dashboard review → GHA auto-deploy
on approve) that produces hyper-local Mesa market news and guides.

---

## Architecture

**Frontend** — Next.js 14 static export, deployed to S3 + CloudFront
at mesahomes.com. No server-side rendering in production.

**Backend** — 18 AWS Lambda functions (Node.js 20), all written in
TypeScript. Fronted by a single API Gateway.

**Data** — DynamoDB single-table design (`mesahomes-main`) with GSI1
for entity lookups, plus an S3 data lake for raw ingested content.

**AI** — Bedrock for content drafting (Claude Haiku 4.5 / Nova Micro)
and image generation fallback (Nova Canvas).

**Deploy** — CDK for infrastructure, GitHub Actions for CI/CD. Push
to `main` triggers test → deploy → frontend build → S3 sync → CloudFront
invalidation. Full deploy runs in 3-5 minutes. Frontend-only rebuilds
run in 90 seconds via `workflow_dispatch` with `skip_cdk=true`.

---

## Repository structure

```
├── frontend/              Next.js app (static export target)
│   ├── src/app/          App Router pages
│   ├── src/components/   Shared React components
│   └── public/           Static assets + llms.txt
├── lambdas/              All 18 Lambda functions (each a dir)
│   ├── content-*         Content pipeline (ingest, bundler, drafter, photo-finder)
│   ├── dashboard-*       Dashboard API handlers
│   ├── leads-*           Lead capture
│   ├── property-lookup/  Multi-source property data (Maricopa GIS + Zillow + Street View)
│   ├── listing-service/  MLS listing intake
│   └── ...
├── lib/                  Shared code (DDB utils, email templates, types)
├── infrastructure/
│   └── cdk/              Full CDK stack
├── scripts/              Ops scripts (errors.sh, etc.)
├── .github/workflows/    GHA CI/CD
└── .kiro/                Specs, steering, handoff docs
    ├── STEERING.md       Product + engineering north star
    ├── AGENTS.md         AI-agent coordination rules
    └── specs/            All specs (see .kiro/specs/INDEX.md)
```

---

## Local development

```bash
# Install
npm ci
npm ci --prefix frontend

# Type check
npx tsc --noEmit

# Run tests
npx vitest run

# Local frontend
npm run dev --prefix frontend

# CDK diff
npx cdk diff --profile Msahms
```

**Required env vars** for local frontend (create `frontend/.env.production`
locally — this file is gitignored):

```
NEXT_PUBLIC_API_BASE=https://<gw>.execute-api.us-west-2.amazonaws.com/prod/api/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_fvS8h2OSM
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...    # from Secrets Manager mesahomes/live/google-maps-api-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4447H4DSLJ
NEXT_PUBLIC_CLARITY_ID=whvce3nreo
```

For CI builds, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` comes from the
`NEXT_PUBLIC_GOOGLE_MAPS_KEY` GitHub Actions secret. All other
server-side secrets are in AWS Secrets Manager under
`mesahomes/live/*`.

---

## Deploying

**Automatic**: push to `main`.

**Manual (frontend-only)**: run the `Deploy to Production` workflow
from the GitHub Actions tab with `skip_cdk: true`.

**Manual CDK-only** (no frontend change):
```bash
npx cdk deploy --profile Msahms --require-approval never
```

See [`.kiro/specs/ci-cd-github-actions.md`](.kiro/specs/ci-cd-github-actions.md)
for full CI/CD architecture.

---

## Testing

Vitest test suite. 890+ tests across 63 files.

```bash
npx vitest run                      # all tests
npx vitest run lambdas/content-drafter/   # specific dir
npx vitest --watch                  # watch mode
```

Property-based tests (fast-check) used for lead-capture serialization
and the content-drafter date-window logic.

---

## Content pipeline

Daily cron pipeline runs autonomously:

```
07:00 MST  content-ingest     → scrapes 16 sources → S3 data lake + DDB index
07:30 MST  content-bundler    → clusters recent items into topic bundles
08:00 MST  content-drafter    → picks top N bundles, drafts with Claude/Nova Micro
           └─ photo-finder   → 5-tier cascade: Street View → Wikimedia →
                                Pexels → Unsplash → Nova Canvas → curated
08:30 MST  SES summary email  → owner reviews drafts in dashboard
           └─ Owner approves → GHA rebuild → blog post live in 90 sec
```

Dedup at three layers (topic cooldown, title dedup, slug uniqueness).
Cost capped by $5/day Bedrock budget alarm.

See [`.kiro/specs/CONTENT-PIPELINE-STATUS.md`](.kiro/specs/CONTENT-PIPELINE-STATUS.md)
for the full picture.

---

## Secrets inventory

Production secrets live in AWS Secrets Manager (us-west-2, account
304052673868):

- `mesahomes/live/google-maps-api-key` — Places + Street View
- `mesahomes/live/stripe-*-key` — payment rails (4 secrets)
- `mesahomes/live/unsplash-*-key` — photo search (2 secrets)
- `mesahomes/live/rentcast-api-key` — rental data
- `mesahomes/live/ses-smtp-credentials` — outbound email
- `mesahomes/live/vhz-*` — VirtualHomeZone integration (3 secrets)
- `mesahomes/live/github-pat` — GHA dispatch from approve handler
- `mesahomes/live/pexels-api-key` — **not yet created, optional**

Never paste secrets in chat, commits, or source files. Use Secrets
Manager exclusively for server-side, GitHub Actions secrets for
frontend build-time injection.

---

## Key docs

- [STEERING.md](.kiro/STEERING.md) — product + engineering principles
- [AGENTS.md](.kiro/AGENTS.md) — AI-agent coordination
- [specs/INDEX.md](.kiro/specs/INDEX.md) — spec catalog grouped by status
- [HANDOFF-2026-04-28.md](.kiro/HANDOFF-2026-04-28.md) — most recent session handoff
- [OWNER-LAUNCH-CHECKLIST.md](OWNER-LAUNCH-CHECKLIST.md) — launch punchlist
- [VHZ-STANDUP-RUNBOOK.md](VHZ-STANDUP-RUNBOOK.md) — VirtualHomeZone bring-up guide

---

## Voice / content guidelines

Hand-written content must sound like a human Realtor, not a
corporate content-farm. Hard rules:

- No em-dashes, no "whether you're X or Y" pivots
- No hollow words: leverage, ecosystem, game-changer, navigate, ensure, utilize, streamline, enhance
- No "that said," "in today's market," "ever-evolving," "dynamic," "vibrant," "thriving"
- No tripartite adjective lists ("modern, sleek, stylish")
- Short sentences, contractions OK, opinionated stance required
- Specific numbers (ZIPs, dollar amounts, days on market)
- Apostrophes in JSX escaped as `&apos;`

Research-first rule (STEERING §6): before writing any hand-written
article, do `web_search` + at least one primary-source `web_fetch`.
Commit messages must list sources consulted.

---

## License

Proprietary. © MesaHomes 2026. All rights reserved.
