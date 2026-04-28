# MesaHomes — Steering Document

Living doc. Both Kiro agents and the human owner read this before making
architectural, naming, or process decisions. Updated when decisions change.

Last updated: 2026-04-27 (late) by Kiro A.

**Current status**: Live in production at https://mesahomes.com.
Deployed 2026-04-26. **879 tests passing, 0 TS errors. Fully
autonomous AI content pipeline shipping daily (8am MST).**
**CI/CD via GitHub Actions on push to main.** 18 Lambdas live.

**Naming convention** (as of 2026-04-26):
- Product tier in UI: **"Mesa Listing Service"** (was: "Flat-Fee MLS")
- Category term for SEO/legal/pricing-mechanism: **"flat-fee MLS"** — kept
  in URL slugs, `<title>` tags, blog H2s, FAQ questions, event-tracking
  tags, legal contracts, compliance docs
- Full tier family: **MesaHomes FSBO / Mesa Listing Service / Mesa Full Service**
- Research memo: `.kiro/specs/middle-tier-rebrand-research.md`

## How to use this doc (read before every session)

1. **Start here** — check "Current priorities" section for ordered
   next-task list before picking work.
2. **Check "Current production state"** before making changes — many
   older specs describe pre-deployment thinking that no longer applies.
3. **Link to specs** in your commit messages. Every significant change
   should reference a spec file OR update STEERING to reflect the new
   decision.
4. **Update this doc** when:
   - Production state changes (deploy, rollback, schema shift)
   - Priorities shift (something blocks, something unblocks)
   - A decision is made that future you or other agents need to know
   - A spec moves from "spec'd" to "implemented"
5. **Don't delete context** — prefer strikethrough or "deprecated" tags
   over deletion. Decisions have history.

## Conflict resolution

When STEERING.md conflicts with an individual spec file, STEERING wins.
Specs are proposals; STEERING records what was decided + deployed.

---

## Product north star

MesaHomes is **the hyper-local source for Mesa, AZ real estate, market data,
HOA news, city meetings, and community info.** Flat-fee MLS listing is one
service offered. The brand is a local information hub first, transactional
real estate second.

The win condition:

1. A Mesa-area resident, buyer, or seller visits the site to check a
   specific thing — home value, HOA rule update, city council agenda,
   neighborhood development news, market trends.
2. They get a real, dated, sourced answer.
3. They return because we're the fastest source for that info.
4. When they're ready to transact, we've built trust and they use our tools
   (net sheet, offer writer, home value estimator).
5. Contact info unlocks full reports + hands a qualified lead to an agent.
6. Seller saves money via flat fee; MesaHomes takes a flat listing fee
   + the $400 broker fee at closing.

Every feature decision passes one test: **does it make a Mesa-area resident
more likely to visit, trust, or transact than Zillow / Redfin / local
flat-fee rivals would?** If not, defer.

## What makes us different (the moat)

These are the things no direct competitor can copy cheaply:

1. **County-verified data**. We query Pinal and Maricopa assessor ArcGIS REST
   endpoints directly. Zillow scrapes. Redfin uses MLS. We show the county
   parcel ID, last sale date, and assessor value with a "verified from
   <County> County" badge.
2. **Free Zillow Research aggregation**. We pull all 13 Zillow Research CSVs
   via a cron Lambda and serve live metro-level market data. Most
   competitors pay vendors for this or don't display it.
3. **Hyper-local content pipeline** (spec'd, not yet built). Ingests RSS
   from East Valley Tribune, Queen Creek Tribune, Mesa Legistar, AZ Republic
   real estate, and Maricopa County planning. AI-generated summaries with
   owner approval. No competitor does this for the East Valley specifically.
4. **Guided decision engine with save/resume + path history**. The agent gets
   the visitor's journey, not just a form submission. That's qualification.
5. **Fair Housing compliance filter** on every AI output, not as a backstop.
   Marketing asset: "Fair-Housing-verified descriptions."
6. **Progressive disclosure with honest teasers**. Show the number before
   asking for email. Most of the industry does the opposite.
7. **Mesa Listing Service tier with an honest Full-Service Upgrade banner**.
   Not "flat-fee lite" pretending to be full service. Explicit escape hatch
   on every page.
8. **Local Hydra AI (post-launch)** for content generation. Owner's RTX 4090
   via Cloudflare Tunnel. Zero per-token cost for hyper-local blog posts
   once Phase 2 is wired. Bedrock Claude Haiku is current baseline.

Things we will NOT build:
- Zestimate competitor. We show county data, not an algorithm guess.
- Listing aggregator / MLS search portal. Link out to MLS.
- Mobile app. Web-first + sticky mobile contact bar.
- Client-facing login / portal. Agent dashboard is owner-only; clients
  interact via forms + email until volume justifies building a portal.

## Current production state (as of 2026-04-27)

Deployed and live on https://mesahomes.com:

| Layer | State |
|---|---|
| DNS + SSL | Route 53 + CloudFront E3TBTUT3LJLAAT, ACM cert, HTTPS |
| Frontend | 50+ static pages via Next.js export, S3 mesahomes.com bucket. `/blog/` + `/news/` content hub with 9 category index pages. |
| Backend | 18 Lambdas deployed via CDK MesaHomesStack |
| Data | DynamoDB mesahomes-main with 16 live content-ingest sources producing 475 items/day, market data, city pages, leads, blog records |
| Content pipeline | **Fully autonomous**: content-ingest → content-bundler → content-drafter (Bedrock Nova Micro) → photo-finder (Wikimedia + Unsplash) → dashboard review UI → approve → GitHub Actions → live on /blog/ or /news/. See `.kiro/specs/CONTENT-PIPELINE-STATUS.md`. |
| Property lookup | Working end-to-end: Maricopa + Pinal GIS + 70-comp comps + Street View photos |
| Market data | Zillow Research ingested, metro endpoint returns 12 metrics |
| Email | Google Workspace (sales@mesahomes.com) with SPF/DKIM/DMARC. SES production access PENDING AWS approval since 2026-04-26 |
| Stripe | Live + sandbox keys in Secrets Manager; FSBO flow in `lead-only` mode until VHZ `/checkout` is built |
| FSBO intake | Working: POST /listing/fsbo/intake returns listingId+leadId, status=awaiting-vhz-launch |
| CI/CD | GitHub Actions on push to main via OIDC. IAM role `mesahomes-github-actions-deploy`. Workflow `.github/workflows/deploy.yml` runs tsc + vitest + cdk deploy + frontend build + s3 sync + CF invalidate. |
| AI SEO | llms.txt at /llms.txt, 20 AI crawler user-agents allowed in robots.txt, Article + NewsArticle + OfferCatalog + LocalBusiness JSON-LD, per-category changefreq in sitemap. |
| Dashboard | /dashboard/leads (lead CRM), /dashboard/content/drafts (AI-draft review queue), /dashboard/performance (team + source conversion metrics), /dashboard/team, /dashboard/listings, /dashboard/settings. Cognito auth. |
| Lead nurture | Every lead form triggers a path-specific welcome email with tailored next steps + CTA, branched by `toolSource` (15 paths covered). See `lib/email-templates/welcome-steps.ts`. |

## Scope: MVP (Phase 1A) — DONE

Covered by `.kiro/specs/mesahomes-lead-generation/tasks.md`. All 20 tasks
complete, code shipped, deployed, live. In-scope requirements: 1, 2, 3, 4,
5, 6, 7, 8, 9, 11, 12, 15, 16, 17, 18, 19, 20, 45, 46, 48, 49.

Service area: Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache
Junction. ZIP-level routing between Pinal (23 ZIPs in `PINAL_COUNTY_ZIPS`)
and Maricopa (everything else, in `MARICOPA_SERVICE_ZIPS`).

## Scope: Phase 1B (in-flight → mostly DONE 2026-04-27)

Post-launch enrichment. Content pipeline + CI/CD shipped this sprint:

**DONE 2026-04-27**:
- ✅ **Hyperlocal content pipeline** (`.kiro/specs/CONTENT-PIPELINE-STATUS.md`):
  16 sources × 475 items/day → bundler → drafter → photo-finder → dashboard
  review → approve → live on /blog/ or /news/ in ~3 min. Bedrock Nova Micro
  default, Claude Haiku 4.5 fallback via env. Total cost <$1/mo.
- ✅ **Content hub** — `/blog/` (evergreen) + `/news/` (daily) with 9
  category indexes, related-posts blocks, breadcrumbs, Article + NewsArticle
  JSON-LD, latest-posts on /areas/{city}/, 5-column footer with "News &
  Guides" column, per-content-type changefreq in sitemap.
- ✅ **AI SEO** — `llms.txt`, 20 AI crawlers allowed in robots.txt,
  OfferCatalog + Service + @id + alternateName on LocalBusiness JSON-LD.
- ✅ **CI/CD via GitHub Actions + OIDC** — push to main deploys
  automatically. No secrets in GitHub. See Deployment section.

**Still pending Phase 2**:
- **Public data enrichment** (`.kiro/specs/public-data-enrichment.md`):
  FRED mortgage rates, FEMA flood zones, Census ACS demographics, HUD FMR.
  Tier 1 + 2 = 18-22 hrs.
- **Hydra AI backend** (`.kiro/specs/hydra-ai-backend.md`): local Ollama
  replaces Bedrock for generation when owner's PC is online.
- **Per-city market aggregation**: currently metro-only.
- **SES production access** + mesahomes.com sender identity verification.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | AWS Lambda (Node.js 20, TypeScript strict) | Serverless, scale-to-zero, cheap at MVP traffic |
| API | API Gateway REST + Cognito JWT authorizer | Well-understood, cheap enough |
| Data | DynamoDB single-table (mesahomes-main) + GSI1/GSI2 | Lowest ops, predictable cost |
| Storage | S3 (mesahomes-data, mesahomes-property-photos, mesahomes.com) | CSV archives + Street View cache + static site |
| CDN | CloudFront E3TBTUT3LJLAAT with ACM cert, us-west-1 S3 website origin | HTTPS, SPA-friendly |
| Secrets | AWS Secrets Manager (mesahomes/live/* + mesahomes/sandbox/*) | No hardcoded keys, ever |
| Auth | Cognito User Pool (mesahomes-userpool) | Custom attrs: `custom:role`, `custom:teamId` |
| Frontend | Next.js 15 / React 19 / Tailwind v4 (CSS @theme) / shadcn-ui | Static export for S3 + CloudFront |
| AI (current) | Bedrock Claude Haiku via ai-proxy Lambda | Cheap (~$0.001/post), reliable |
| AI (Phase 2) | Local Ollama/llama3.2 via Cloudflare Tunnel | $0 per token when owner's desktop is on |
| Payments | Stripe (via Virtual Home Zone account for FSBO) | Separate merchant for the photography LLC |
| Email | Google Workspace inbound + AWS SES outbound | Professional inbox + transactional at scale |
| Tests | Vitest + fast-check | Unit + property-based, 874 tests across 61 files |
| Infra-as-code | CDK (infrastructure/cdk/*, MesaHomesStack) | Typed, imports existing secrets, 327 CFN resources |

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

1. `npx tsc --noEmit` returns 0 errors before every commit. No `// @ts-nocheck`.
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
6. **Research before writing any content article**. Any hand-written
   article for the seller hub, `/blog/`, `/news/`, or future editorial
   content must be grounded in actual research, not AI memory. Before
   drafting:
   a. Run `web_search` for the target query + "Arizona Mesa 2026"
      to verify current facts, statistics, and seasonality
   b. Fetch at least one primary-source page (gov, law firm, real
      estate stat aggregator) to cite
   c. Include a "Sources consulted" list in the commit message
      so anyone auditing the article can check the research
   Skip research only for explicitly speculative / opinion pieces,
   and label them as such in the article itself. This rule exists
   because the 2026-04-28 SEO audit showed our articles were
   readable but thin on primary-source citations — the fix is at
   the research stage, not at edit time.

## Change tracking + deployment process (2026-04-27)

**Every change MUST be visible in three places or it's not done:**

1. **Git commit with conventional-commit message** — subject line under 50
   chars, body explains what + why (not how). Commits are the ground truth.
2. **Spec file updated** — if the change is described in a spec, update
   the `[ ]`/`[x]` marks. If no spec exists for the change, add a note in
   the closest spec OR create a new one (see "When to write a spec" below).
3. **STEERING.md updated if it changes any of**:
   - Production state (new service, new Lambda, new table)
   - Current priorities (something finishes, something starts)
   - Architecture rules (new pattern, new convention)
   - CI/CD or deploy process

### When to write a spec before building

Write a spec first (under `.kiro/specs/`) when:
- The change touches 3+ files across different layers
- It introduces a new service, integration, or product feature
- It changes how a user flow works
- It requires infrastructure changes (CDK, IAM, new AWS resource)

Skip the spec when:
- Single-file bugfix or typo
- Rendering adjustment (copy change, button color, icon swap)
- Adding a missing test for existing behavior

### Deployment process

**Production deploys happen automatically on push to `main`** via GitHub
Actions (`.github/workflows/deploy.yml`). The workflow:
1. Checks out code
2. Installs deps (root + frontend)
3. Runs `npx tsc --noEmit` and `npx vitest run`
4. Assumes AWS IAM role via OIDC (no long-lived creds in GitHub)
5. Packages Lambdas via `bash infrastructure/cdk/package-lambdas.sh`
6. Runs `npx cdk deploy --require-approval never`
7. Builds frontend (`npm run build --prefix frontend`)
8. Syncs `frontend/out/` to S3
9. Invalidates CloudFront

**Emergency override**: push with `workflow_dispatch` input `skip_cdk: true`
to skip infra + redeploy only the frontend.

**Approve-triggered deploys**: when the owner approves an AI-drafted blog
post in `/dashboard/content/drafts`, the `dashboard-content` Lambda fires
`workflow_dispatch` with `skip_cdk: true` via GitHub REST API. The GHA
run rebuilds the frontend with the new post baked in. ~3-4 min end-to-end.

### Required Secrets Manager entries

| Name | Purpose |
|---|---|
| `mesahomes/live/github-pat` | Dashboard approve handler uses this to trigger GHA workflow_dispatch. Needs `repo` + `workflow` scopes. |
| `mesahomes/live/unsplash-access-key` | Photo-finder fallback when Wikimedia returns nothing |
| `mesahomes/live/google-maps-api-key` | Places autocomplete + Street View |
| `mesahomes/live/stripe-*` | Live + sandbox Stripe keys |
| `mesahomes/live/ses-smtp-credentials` | SMTP fallback (SES API is primary) |
| `mesahomes/live/rentcast-api-key` | Property comps (backup to GIS) |
| `mesahomes/live/vhz-*` | Virtual Home Zone handoff + webhook secrets |

Missing one of these silently breaks the related feature. Keep this list
current whenever a new secret is added to CDK `SECRET_NAMES`.

## Current priorities — ordered (2026-04-27)

What to work on next, in order. Update this every significant session.

### 🟢 Immediate (this week)

1. **Create `mesahomes/live/github-pat` Secrets Manager entry** (owner, 1 min).
   Needed by dashboard-content Lambda's approve handler to trigger
   GitHub Actions workflow_dispatch. Token needs `repo` + `workflow`
   scopes. Command:
   ```
   aws secretsmanager create-secret \
     --name mesahomes/live/github-pat \
     --secret-string ghp_YOUR_TOKEN \
     --profile Msahms --region us-west-2
   ```
2. **Verify GitHub Actions runs on push** — check
   https://github.com/frotofraggins/Msahms/actions after any push.
   First run must succeed end-to-end or CI/CD is broken.
3. **Verify SES domain identity** (owner, 2 min in Console).
4. **Roll leaked Stripe live test key** (owner, 30 sec).

### 🟡 Short-term (next 1-2 weeks)

5. **Mobile-responsive review UI** (`.kiro/specs/content-pipeline-phase-2.md`
   task 2D.5). Owner reviews drafts from phone, current UI assumes desktop.
6. **CloudWatch alarm on Bedrock spend >$5/day** (phase 2F.2). Cheap
   safety net for model runaway.
7. **Agent email actions on lead detail** (phase-1b-lead-gen-amplification
   §1, 3 hr). Send follow-up templates from /dashboard/leads/[id]/.
8. **More Zillow datasets rendered** (phase-1b-lead-gen-amplification §5):
   affordability context on /tools/affordability, city trends on
   /areas/{slug}/.

### 🟡 Medium-term (next month)

9. **`/moving-to-mesa` relocation hub** (phase-1b-lead-gen-amplification §6,
   1-2 days). Cost-of-living calculator, state-comparison pages.
10. **HOA directory auto-build from Maricopa GIS** (§7, 1 day). Hundreds
    of long-tail subdivision pages at zero content cost.
11. **Housing law tracker rendering** — ingested daily from HUD/CFPB/ADRE
    but not yet surfaced on site.

### 🔴 Owner-blocked (can't proceed without action)

- **Broker-of-record partnership signed**. Unblocks Mesa Listing Service
  and Full-Service tiers.
- **ADRE salesperson license reactivation**. Required before brokerage
  activity.
- **SES production access** — AWS ticket pending since 2026-04-26.
- **Legal memo for privacy/terms** — external research in flight.
- **Google Business Profile completion** (description, hours, photos).
- **VHZ /checkout page** for full FSBO payment automation.

### 🔵 Deferred (Phase 2+)

- **Hydra AI backend**: Bedrock → local Ollama.
- **ARMLS IDX integration** (requires paid feed + MLS membership).
- **Client portal** (deferred until 10+ paying customers ask).
- **Social media auto-scheduler** (Facebook / LinkedIn on approve).
- **Compliance filter extensions** (phase 2E).
- **Staging environment** (useful when team grows).

## Structural debt (tracked, intentionally deferred)

Flag-planted here so we don't forget:

1. **pnpm workspaces + `apps/` restructure**. Currently every Lambda shares
   the root `package.json`. Cost: ~2 MB per Lambda, ~100-300 ms extra cold
   start. At current traffic (~0 users), not worth the disruption. Revisit
   when cold-start complaints appear.
2. **Biome for lint/format**. Currently relies on `tsc --noEmit`. Biome
   would be faster + unified config. Low value until the codebase grows.
3. **Conventional commits via commitlint**. Currently informal. Enforce
   once there are more than 2 committers.
4. **Per-Lambda `package.json`**. Trims cold-start bundle. Ships with #1.
5. **MesaHomes.com domain transfer GoDaddy → Route 53**. Currently still
   on GoDaddy registrar (DNS delegated to Route 53, so no functional
   difference). Transfer after site is stable in production.

Owned by: Kiro B or Cline when they pick up next task batch. Kiro A
reviews structural changes.

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

### Primary specs (original MVP)
- Spec: `.kiro/specs/mesahomes-lead-generation/requirements.md` (77 KB)
- Design: `.kiro/specs/mesahomes-lead-generation/design.md` (49 KB)
- Data sources: `.kiro/specs/mesahomes-lead-generation/data-sources.md`
- Frontend design: `.kiro/specs/mesahomes-lead-generation/frontend-design.md`
- Content sources: `.kiro/specs/mesahomes-lead-generation/content-sources.md`
- Tasks: `.kiro/specs/mesahomes-lead-generation/tasks.md` (20/20 complete)

### Product + legal specs
- Three-tier product model: `.kiro/specs/three-tier-product.md`
- Flat-fee legal model: `.kiro/specs/flat-fee-legal-model.md`
- Legal reference library: `.kiro/specs/legal-reference-library.md` +
  indexed 2026 ADRE Law Book at `.kiro/reference/` (gitignored)
- MLS syndication messaging: `.kiro/specs/mls-syndication-messaging.md`
- ARMLS IDX (Phase 2): `.kiro/specs/armls-idx-integration.md`
- Mortgage cost transparency: `.kiro/specs/mortgage-cost-transparency.md`

### Design + UI specs
- Design system: `.kiro/specs/design-system.md`
- Frontend visual upgrade 2026: `.kiro/specs/frontend-visual-upgrade-2026.md`
- Frontend content gaps: `.kiro/specs/frontend-content-gaps.md`

### Backend specs
- AI prompts library: `.kiro/specs/ai-prompts-library.md`
- Hydra AI backend (Phase 2): `.kiro/specs/hydra-ai-backend.md`
- SEO architecture: `.kiro/specs/seo-architecture.md`
- Notification-worker SES: `.kiro/specs/notification-worker-ses-wireup.md`
- Build blocker static export: `.kiro/specs/build-blocker-static-export.md`
  (resolved)
- FSBO launch-mode gate: `.kiro/specs/fsbo-launch-mode-gate.md`

### Operations + launch
- Owner launch checklist (root): `OWNER-LAUNCH-CHECKLIST.md`
- VHZ standup runbook (root): `VHZ-STANDUP-RUNBOOK.md`
- Pre-launch punchlist: `.kiro/specs/pre-launch-punchlist.md` (all 3 closed)
- Deploy recovery runbook: `.kiro/DEPLOY_RECOVERY.md`
- CDK infrastructure README: `infrastructure/cdk/README.md`

### Post-launch enrichment (spec'd, not yet built)
- Hyperlocal content pipeline: `.kiro/specs/hyperlocal-content-pipeline.md`
- Public data enrichment (FRED, FEMA, Census, etc):
  `.kiro/specs/public-data-enrichment.md`
- Phase 1B content automation (broader): `.kiro/specs/phase-1b-content-automation.md`

### Coordination
- Agent coordination: `.kiro/AGENTS.md`
- Agent onboarding: `.kiro/SYNC_PROMPT.md`
- Kiro B visual upgrade handoff: `.kiro/B-VISUAL-UPGRADE-HANDOFF.md`

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

The Mesa Listing Service tier (and the flat-fee pricing mechanism behind it) is the primary seller differentiator. Every page has a Full Service Upgrade banner — we're honest about the option, not hiding it.

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
