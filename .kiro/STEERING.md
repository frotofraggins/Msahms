# MesaHomes — Steering Document

Living doc. Both Kiro agents and the human owner read this before making
architectural, naming, or process decisions. Updated when decisions change.

Last updated: 2026-04-24 by Kiro A.

---

## Product north star

MesaHomes is a **lead-generation platform for the Mesa, AZ metro**, not a
listing portal. The win condition is:

1. A seller or buyer visits the site with a question.
2. They use a tool (net sheet, affordability calc, home value, offer writer).
3. The tool gives them a real, data-backed answer before we ask for contact info.
4. The contact info unlocks a full report + hands a qualified lead to an agent.
5. The agent closes. Seller saves money via flat fee; MesaHomes takes a small
   flat listing fee + the $400 broker fee.

Every feature decision passes one test: **does it make a seller or buyer more
likely to convert at a higher quality than Zillow/Redfin/local flat-fee rivals
would?** If not, defer.

## What makes us different (the moat)

These are the things no direct competitor can copy cheaply:

1. **County-verified data**. We query Pinal and Maricopa assessor ArcGIS REST
   endpoints directly. Zillow scrapes. Redfin uses MLS. We show the county
   parcel ID, last sale date, and assessor value with a "verified from
   <County> County" badge. Lean on this in UI.
2. **Local RTX 4090 inference via MCP** (through the Hydra repo). Unlimited
   listing descriptions and offer drafts. Competitors pay per OpenAI token and
   ration usage. We don't.
3. **Guided decision engine with save/resume + path history**. The agent gets
   the visitor's journey, not just a form submission. That's qualification.
4. **Fair Housing compliance filter** on every AI output, not as a backstop.
   Marketing asset: "Fair-Housing-verified descriptions."
5. **Progressive disclosure with honest teasers**. Show the number before asking
   for email. Most of the industry does the opposite.
6. **Flat-fee with an honest Full-Service Upgrade banner**. Not "flat-fee lite"
   pretending to be full service. Explicit escape hatch on every page.

Things we will NOT build:
- Zestimate competitor. We show county data, not an algorithm guess.
- Listing aggregator / MLS search portal. Link out to MLS.
- Mobile app. Web-first + sticky mobile contact bar.

## Scope: MVP (Phase 1A)

Covered by `.kiro/specs/mesahomes-lead-generation/tasks.md`. In-scope
requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 16, 17, 18, 19, 20, 45,
46, 48, 49.

Service area: Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache
Junction. ZIP-level routing between Pinal (23 ZIPs in `PINAL_COUNTY_ZIPS`) and
Maricopa (everything else).

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | AWS Lambda (Node.js 20, TypeScript strict) | Serverless, scale-to-zero, cheap at MVP traffic |
| API | API Gateway REST + Cognito JWT authorizer | Well-understood, cheap enough |
| Data | DynamoDB single-table (mesahomes-main) + GSI1/GSI2 | Lowest ops, predictable cost |
| Storage | S3 (mesahomes-data, mesahomes-property-photos) | CSV archives + Street View cache |
| Secrets | AWS Secrets Manager | No hardcoded keys, ever |
| Auth | Cognito User Pool | Custom attrs: `custom:role`, `custom:teamId` |
| Frontend | Next.js 15 / React 19 / Tailwind / shadcn-ui | SSR for SEO, modern React, typed |
| AI | Local RTX 4090 via MCP server (Hydra repo) | No per-token cost, unlimited |
| Payments | Stripe | Standard |
| Email | SES | Standard |
| Tests | Vitest + fast-check | Unit + property-based |
| Infra-as-code | CDK (Task 19+, not yet implemented) | Typed, generates CFN |

## Naming + file conventions

| Thing | Convention | Example |
|-------|------------|---------|
| Lambda dir | `lambdas/<kebab-case>` | `lambdas/leads-capture/` |
| Handler file | `index.ts` exports `handler` | `export async function handler(event)` |
| Test co-location | Same dir, `.test.ts` / `.property.test.ts` | `index.test.ts` |
| Shared code | `lib/<module>.ts` | `lib/errors.ts` |
| Shared types | `lib/types/<entity>.ts` | `lib/types/lead.ts` |
| Data models | `lib/models/<entity>.ts` | `lib/models/lead.ts` |
| DDB key helpers | `lib/models/keys.ts` | `generateLeadKeys(...)` |
| Interfaces | PascalCase, no `I` prefix | `DynamoDBItem` |
| Enums | PascalCase name, SCREAMING_SNAKE values | `ErrorCode.VALIDATION_ERROR` |
| Error classes | `*Error` suffix | `AppError` |
| Env var access | Bracket notation (strict mode) | `process.env['AWS_REGION']` |
| Commits | Conventional commits | `feat(auth-api): add refresh endpoint` |

## Architecture rules

1. **One Lambda per bounded concern**. Never put two unrelated endpoints in
   one Lambda to save on deployment. Cold-start isolation beats DRY.
2. **Lambdas only call shared code via `lib/`**. Never import across
   `lambdas/A/` into `lambdas/B/`. If shared, promote to `lib/`.
3. **All AWS SDK calls go through `lib/<service>.ts` wrappers**. Callers never
   import `@aws-sdk/*` directly. Makes mocking trivial.
4. **Errors bubble as `AppError` with an `ErrorCode`**. Handler converts to
   `LambdaProxyResponse` at the boundary with `toLambdaResponse()`.
5. **Every error response has a correlationId** from
   `event.requestContext.requestId` or `generateCorrelationId()`.
6. **Retry policy lives in `lib/retry.ts`**. Use the pre-built circuit
   breakers: `countyGisCircuit`, `streetViewCircuit`, `aiProxyCircuit`.
7. **TTL-backed cache for anything external**. 24h for property lookups,
   5min for secrets, per-tool for AI.
8. **Secrets never touch code**. Always `getSecret('mesahomes/<name>')`.
9. **DynamoDB writes go through `putItem()` in `lib/dynamodb.ts`** — it fills
   `createdAt`/`updatedAt` so callers don't need to.
10. **Single-table design**. PK/SK patterns live in `lib/models/keys.ts`.
    New entity? Add its key generator there.

## Quality bars (non-negotiable)

1. **Research first, then build.** Before implementing any non-trivial
   algorithm, scoring system, data model, or API pattern, use the available
   MCP/web-search tools to check how others solve the problem. Adopt the
   accepted convention unless we have a documented reason to deviate. Only
   invent something new when nothing out there fits. Cite the source in the
   code docstring or commit message.
2. `npx tsc --noEmit` returns 0 errors before every commit. No `// @ts-nocheck`.
   No `as any` in source code. In tests, prefer making mocks satisfy the real
   interface over casting.
3. `npx vitest run` passes 100%. No skipped tests in main without a linked issue.
4. **Frontend changes**: `cd frontend && npm run build` exits 0. Static
   export to `out/` must succeed — this catches Next.js static-export
   incompatibilities that `tsc` and `vitest` miss (dynamic routes
   without generateStaticParams, metadata routes without force-static,
   etc.). Do NOT claim "ready to deploy" without running this.
5. No bare `except` / `catch(e)` without at least `console.error(e)` — hot
   polling paths (system metrics, WebSocket send to dead client) excluded.
6. Every Lambda has: a unit test, a property test (if logic is non-trivial),
   and a co-located index test exercising the handler.
7. Every shared lib has: unit tests. Property tests encouraged for anything
   with invariants (validators, serializers).
8. UTF-8, LF line endings, no BOM. (We've been burned by UTF-16 `.gitignore`.)

## Process rules

1. **Branch-per-agent + worktree-per-agent**. See `.kiro/AGENTS.md` and
   `.kiro/SYNC_PROMPT.md`. Never push to `main`. Never commit on the other
   agent's branch. Always `git branch --show-current` before commit/push.
2. **Shared module changes need a handoff row**. `lib/`, `lib/types/`,
   `lib/models/`, `infrastructure/` are shared. Post a Handoffs Needed row in
   your AGENTS.md before editing.
3. **Task IDs in commit subjects**. `Task 8.3: implement dashboard leads filter`.
4. **Checkpoints are mandatory gates**. Tasks 3, 7, 9, 13, 17, 20 are
   checkpoints. Both builds must be green before proceeding.
5. **Property tests validate real properties, not examples**. If it's just
   "with these inputs, expect this output," it's a unit test. Property tests
   use `fc.assert(fc.property(...))`.

## Research workflow (mandatory before non-trivial work)

We have MCP/web-search tools available. Use them. We don't reinvent wheels
when a well-documented convention exists.

Before you implement:

1. **Does an industry-standard methodology exist?** (ZHVI, Zillow Market Heat
   Index, HUD definitions, NAR practice, RESO MLS schemas, ArcGIS REST
   conventions, etc.) If yes — adopt the convention. Cite the source in a
   docstring.
2. **Does an open-source reference implementation exist?** (crates, npm
   packages, GitHub repos.) If yes and the license is compatible — use it.
   If the license isn't compatible but the approach is public — re-implement
   with attribution in the commit message.
3. **Is this genuinely novel?** (Rare — maybe the combination of county data
   + flat-fee economics + guided decision path.) Then build it, but document
   what research you did and why nothing existing fit.
4. **Cite in code, not just in commits.** Future readers see the docstring
   first. Commit messages are archaeology.

Anti-pattern (do not do this):
- Implement first, realize something standard exists, retrofit. That's what
  I did for market-signals.ts (commit 151f42e) and it forced a follow-up
  alignment commit (119f294) to map my home-grown scale to Zillow's published
  0-100 convention. If I'd spent 10 minutes researching first, I'd have saved
  an hour.

Good examples of research-first done right in this repo:
- `lib/county-router.ts` — checked Pinal + Maricopa ArcGIS schemas before
  writing field mappings.
- `lib/errors.ts` — modeled after AWS Lambda proxy integration error shape
  documented in API Gateway docs.
- `lib/retry.ts` — exponential backoff + jitter per AWS SDK defaults.

MCP tools available to Kiro agents include web search (`web_search`), web
fetch (`web_fetch`), internal search for Amazon-specific docs, code search,
and more. If you don't see the tool you need, ask the human.

## Structural debt to address before Task 10 (frontend)

These are intentional "do later" calls so far. Flag-planted here so we don't
forget:

1. **pnpm workspaces + `apps/` restructure**. Currently every Lambda shares
   the root `package.json`, so `leads-capture` bundles S3 and Cognito SDKs it
   doesn't use. Cost: ~2 MB per Lambda, ~100-300 ms extra cold start. Fix
   before prod, and before `apps/frontend/` lands — frontend as a workspace
   package from day one is far easier than retrofitting.
2. **Biome for lint/format**. Currently we rely on `tsc --noEmit`. Biome
   replaces ESLint+Prettier, faster, single config.
3. **Conventional commits via commitlint**. Currently informal. Enforce once
   both agents are used to the prefix.
4. **CDK stacks under `infra/stacks/`**. Current `infrastructure/*.ts` files
   are config-shaped, not deployable CDK. Task 19 rewrites them.
5. **Per-Lambda `package.json`**. Trims cold-start bundle, enables per-Lambda
   runtime pinning. Ship with #1.

Owned by: Kiro B when they wrap current task stream. Kiro A reviews.

## Environments

| Env | Branch | AWS account | Trigger |
|-----|--------|-------------|---------|
| local dev | feature branches | — | `npm run test:watch` |
| dev | `main` (after merge) | TBD | auto on merge |
| stage | TBD | TBD | manual promote |
| prod | TBD | TBD | manual promote |

Stage and prod not yet set up. Do before Task 19 (deployment).

## Security rules

1. Every endpoint behind `/dashboard/*` requires Cognito JWT + the
   authorizer's role check (`lib/authorizer.ts`).
2. Agent sees own leads (filter by `assignedAgentId`). Team_Admin sees all
   team leads. Enforced in both authorizer AND handler.
3. Account lockout: 3 failed attempts → 15 min lock. Counter resets on success.
4. Password policy: min 8 chars, upper + lower + number + special.
5. Tokens: access 24h, refresh 30d.
6. API keys in Secrets Manager only. `mesahomes/<service>-<kind>` naming.
7. All AI-generated content (listing, offer, any copy) passes
   `compliance-filter` before reaching the user. Fair Housing is a legal
   requirement, not a nice-to-have.
8. Legal disclaimer on every offer/contract page: "educational only, not
   legal advice."
9. PII goes in DynamoDB encrypted at rest (default). Nothing PII in
   CloudWatch logs. `lib/errors.ts` redacts correlationId in logs.

## Performance targets (rough)

| Operation | Target | Current |
|-----------|--------|---------|
| Net sheet calc | < 2s (client-side math, no external) | ✓ |
| Affordability calc | < 2s | ✓ |
| Property lookup (cold) | < 5s (GIS + DDB + Street View) | tbd |
| Property lookup (cached) | < 500ms | tbd |
| Market data | < 300ms (DynamoDB LATEST) | tbd |
| Lead capture | < 1s | tbd |
| AI listing gen | < 30s | bounded by MCP |
| Confirmation email (SES) | < 60s from lead create | tbd |
| Notification to agent | < 60s from assignment | tbd |

## Open questions (decide before they bite)

1. **What happens when Pinal/Maricopa GIS is down?** Circuit breaker returns
   cached response if recent. If no cache: return partial data + CTA to
   "request a full analysis" (captures lead).
2. **Do we auto-assign leads to agents or human-triage?** Current: human via
   Team_Admin. Long term: round-robin by specialty + workload.
3. **Do we support non-Mesa metro ZIPs at all?** Current: no (return error).
   Consider: capture lead + note "outside service area" tag for partner
   referral revenue.
4. **Payment method for flat-fee listing?** Current spec: Stripe Checkout,
   one-time. Consider: success-fee model (charge only on close).
5. **What's the domain?** `mesahomes.com` per spec, CloudFront
   `E3TBTUT3LJLAAT`. Confirm Route 53 + ACM cert status.

## Anti-patterns we've already avoided

Listed so we don't regress:

- ❌ Multiple AI agents pushing to `main`. Fix: branch-per-agent, human
  merges. See `.kiro/AGENTS.md`.
- ❌ Shared working directory → branch collisions. Fix: git worktrees, one
  per agent. See `.kiro/SYNC_PROMPT.md`.
- ❌ `// @ts-nocheck` to silence compiler. Fix: relax the type at the source
  (e.g., `createdAt?: string` on `DynamoDBItem`) so callers don't lie.
- ❌ Committing `backend.log` / other runtime logs. Fix: `*.log` in
  `.gitignore`, UTF-8 LF only.
- ❌ `memory_search` with substring-match on full query (Hydra lesson).
  Fix: tokenize and AND each token.
- ❌ 9 specialists for an 8B model (Hydra lesson). Fix: upgrade model or
  cut specialists.

## Linked docs

- Spec: `.kiro/specs/mesahomes-lead-generation/requirements.md` (77 KB)
- Design: `.kiro/specs/mesahomes-lead-generation/design.md` (49 KB)
- Data sources: `.kiro/specs/mesahomes-lead-generation/data-sources.md`
- Frontend design: `.kiro/specs/mesahomes-lead-generation/frontend-design.md`
- Content sources: `.kiro/specs/mesahomes-lead-generation/content-sources.md`
- Tasks: `.kiro/specs/mesahomes-lead-generation/tasks.md`
- Agent coordination: `.kiro/AGENTS.md`
- Agent onboarding: `.kiro/SYNC_PROMPT.md`

## How to update this doc

Append-only for decisions. Overwrite sections only when a decision is
reversed and the old version is captured in the commit message. Both agents
can edit; both should cite the commit + date of any change. Substantive
architecture changes need human sign-off.

## Data sources — verified endpoints (Kiro B, 2026-04-24)

These were discovered, tested, and verified during the build. Do not change
URLs without re-verifying.

| Source | Endpoint | Free tier | Notes |
|--------|----------|-----------|-------|
| Pinal County ArcGIS | `gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query` | Unlimited, no auth | Layer 3. Returns parcel ID, owner, sqft, year built, assessed value, sale price/date, subdivision, floors, tax info |
| Maricopa County ArcGIS | `gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query` | Unlimited, no auth | Layer 0. Returns address, sale price/date, year built, living space, assessed value, lat/lon, zoning |
| Zillow Research CSVs | `files.zillowstatic.com/research/public_csvs/` | Free, monthly | 13 datasets. ZIP-level ZHVI + metro-level metrics. Downloaded on 17th of each month |
| Google Street View | Static API via `maps.googleapis.com` | 10,000 images/month free, unlimited metadata | Cache in S3 at `streetview/{zip}/{address}.jpg`. Alarm at 8,000/month |
| Mesa Legistar API | `webapi.legistar.com/v1/mesa` | Free, no auth | City council meetings, zoning cases, 29 boards/committees |
| Mesa Police Open Data | `data.mesaaz.gov/resource/hpbg-2wph.json` | Free, no auth | Crime incidents with GPS coordinates |
| RentCast API | `api.rentcast.io` | 50 calls/month free | Backup for property estimates only |

**ZIP-to-county routing**: San Tan Valley (85140) → Pinal County. Mesa/Gilbert/Chandler → Maricopa County. Full list in `lib/county-router.ts` (`PINAL_COUNTY_ZIPS` set, 23 ZIPs).

## Cost constraints

The owner explicitly said: **keep everything in free tier until we start getting leads.** Current estimated monthly cost at low traffic: ~$3/month (DynamoDB on-demand + S3 storage + occasional Lambda invocations).

Known costs to watch:
- Google Street View: 10K free images/month. CloudWatch alarm at 8K.
- RentCast: 50 free calls/month. Use only as backup.
- ALB from StackPro: ~$18/month (owner chose to keep it for now, may remove).
- RDS from StackPro: stopped (was $15/month with zero connections).

## Content strategy

The platform is not just a tool site — it's a local information hub for Mesa, AZ. Content sources include:

1. **City pages** for Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction
2. **Blog posts** for SEO — market updates, first-time buyer guides, neighborhood profiles
3. **Government meeting summaries** from Mesa Legistar API (zoning, city council)
4. **Crime statistics** from Mesa Police Open Data
5. **HOA data and community sentiment** from Reddit and local forums (Phase 1B)
6. **Relocation guides** for people moving to Mesa from other states (high-value lead capture)
7. **News and election info** relevant to Mesa residents

Content is generated/summarized by the local RTX 4090 AI via MCP, then stored in DynamoDB as blog posts and city page data.

## Business model

| Revenue stream | Amount | When |
|---------------|--------|------|
| Flat-fee MLS listing | $999 | At listing start |
| Broker transaction fee | $400 | At listing start |
| Full-service upgrade | Standard commission | When seller opts for full agent |

The flat-fee model is the primary differentiator. Every page has a Full Service Upgrade banner — we're honest about the option, not hiding it.

## AWS account details

- Account ID: 304052673868
- Profile name: `Msahms` (capital M)
- Region: us-west-2 (primary), us-west-1 (existing S3 bucket)
- CloudFront distribution: E3TBTUT3LJLAAT
- Domain: mesahomes.com (Route 53 + ACM cert for mesahomes.com + www.mesahomes.com)
- GitHub repo: `https://github.com/frotofraggins/Msahms.git`

## Implementation status (Kiro B, 2026-04-24)

| Task | Status | Tests | Key files |
|------|--------|-------|-----------|
| 1. Infrastructure | ✅ Complete | 147 | `infrastructure/*.ts`, `lib/dynamodb.ts`, `lib/cognito.ts`, `lib/s3.ts`, `lib/secrets.ts` |
| 2. Shared modules | ✅ Complete | 165 | `lib/errors.ts`, `lib/retry.ts`, `lib/models/*.ts`, `lib/types/*.ts` |
| 3. Checkpoint | ✅ Pass | — | — |
| 4. Data pipeline | ✅ Complete | 69 | `lambdas/data-pipeline/*`, `lambdas/property-lookup/*`, `lib/county-router.ts`, `lib/property-normalizer.ts` |
| 5. Tool calculators | ✅ Complete | 75 | `lambdas/tools-calculator/*` (net-sheet, affordability, comparison, sell-now-or-wait) |
| 6. Lead capture + AI + content | ✅ Complete | 60 | `lambdas/leads-capture/*`, `lambdas/ai-proxy/*`, `lambdas/market-data/*`, `lambdas/content-api/*` |
| 7. Checkpoint | ✅ Pass | — | — |
| 8. Auth + dashboard + notifications + listing | ✅ Complete | 148 | `lambdas/auth-api/*`, `lib/authorizer.ts`, `lambdas/dashboard-api/*`, `lambdas/notification-worker/*`, `lambdas/listing-service/*` |
| 9. Checkpoint | ✅ Pass (0 tsc errors, 719 tests) | — | — |
| 10-20. Frontend + deployment | ⬜ Not started | — | — |

Total: **719 tests passing**, **52 test files**, **0 TypeScript errors**.
