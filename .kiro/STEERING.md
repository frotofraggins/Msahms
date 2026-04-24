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

1. `npx tsc --noEmit` returns 0 errors before every commit. No `// @ts-nocheck`.
   No `as any` in source code. In tests, prefer making mocks satisfy the real
   interface over casting.
2. `npx vitest run` passes 100%. No skipped tests in main without a linked issue.
3. No bare `except` / `catch(e)` without at least `console.error(e)` — hot
   polling paths (system metrics, WebSocket send to dead client) excluded.
4. Every Lambda has: a unit test, a property test (if logic is non-trivial),
   and a co-located index test exercising the handler.
5. Every shared lib has: unit tests. Property tests encouraged for anything
   with invariants (validators, serializers).
6. UTF-8, LF line endings, no BOM. (We've been burned by UTF-16 `.gitignore`.)

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
