# Pre-Launch Punchlist — Close Before Production

Author: Kiro A, 2026-04-25. Status: required before `mesahomes.com` DNS
flip. Three blocking items + five acceptable-debt items. Total effort:
~6-8 hours for Kiro B.

## Context

Kiro B's Task 1-20 shipped clean code: 783 tests passing, 0 TS errors,
30 pages, 14 Lambdas. Audit found **three items that the tasks marked
`[x]` but didn't actually complete end-to-end**. This spec closes those
gaps.

None of these are architecture rework. All three are "finish the wiring
you stubbed."

---

## 🛑 BLOCKER 1 — Task 15 Stripe integration is stubbed

### Current state

`frontend/src/app/listing/fsbo/FsboClient.tsx` step 4 payment flow does
`href="https://virtualhomezone.com"` — a plain link to an external site.
No Stripe Session created. No correlation between the intake form a user
filled out on MesaHomes and the payment that may or may not happen on
VHZ's GoDaddy site.

### Why this blocks launch

- User fills out 4-step FSBO intake → bounces to virtualhomezone.com →
  VHZ site has no matching package offering → conversion drops.
- We can't track which intakes converted to paid packages.
- We can't trigger photography scheduling or confirmation emails on
  payment success (there's no success signal).

### Fix — two approved approaches, pick ONE

**Approach A: Query-param handoff (fastest, ~2 hours total split across sites)**

1. **On MesaHomes side** (`FsboClient.tsx` step 4):
   - Replace the static `href="https://virtualhomezone.com"` with:
     ```tsx
     const params = new URLSearchParams({
       package: selectedPackage,      // 'starter' | 'standard' | 'pro'
       lead_id: leadId,               // UUID from intake form submit
       source: 'mesahomes-fsbo',
       email: email,
     });
     const vhzUrl = `https://virtualhomezone.com/checkout?${params.toString()}`;
     ```
   - Wire a `POST /api/v1/listing/fsbo/intake` endpoint on `listing-service`
     that creates the listing record with `packageType: fsbo-<tier>`,
     `status: awaiting-payment`, and returns the `leadId` / `listingId`
     for the URL.

2. **On virtualhomezone.com side** (must happen, owner's work):
   - Add a `/checkout` page that reads the query params and shows the
     matching package
   - Stripe Checkout Session uses the package price
   - Stripe success webhook hits `POST https://mesahomes.com/api/v1/listing/fsbo/vhz-webhook`
     with `{ leadId, packageType, stripeSessionId, amountPaid, status: 'paid' }`
     (signed with a shared secret in `VHZ_MESAHOMES_WEBHOOK_SECRET`)

3. **On MesaHomes side** (webhook receiver):
   - New endpoint `POST /api/v1/listing/fsbo/vhz-webhook` in listing-service
   - Verifies shared secret
   - Updates listing `status: paid`
   - Triggers SES email to seller + VHZ photographer with scheduling link
   - Triggers Team_Admin notification

**Approach B: Stripe Checkout from MesaHomes side (more code, but keeps user on our domain)**

1. Get VHZ's Stripe account connected to MesaHomes as a Stripe Connect
   "Standard" account (1-time VHZ action, Stripe has a standard flow)
2. MesaHomes creates Checkout Sessions on VHZ's behalf using
   `stripe_account: VHZ_STRIPE_ACCOUNT_ID` header
3. User stays on mesahomes.com for payment; money lands in VHZ's account
4. Webhook lands on MesaHomes' listing-service; no cross-site coordination

Approach B is cleaner but requires Stripe Connect onboarding on VHZ's side
(~20 min) plus the Connect code (~3 hours). Approach A is faster if VHZ's
GoDaddy site can accept query-param handoff.

### Owner decision needed

Which approach? **I'd recommend A for MVP.** Rebuild VHZ to match our
packages anyway (per `three-tier-product.md`), and A keeps things decoupled.

### OWNER DECISION: Approach A (confirmed 2026-04-25)

Full implementation detail below. Zero ambiguity for Kiro B.

#### Handoff data contract — MesaHomes → VHZ

MesaHomes redirects the user to virtualhomezone.com/checkout with these
query params:

| Param | Type | Example | Notes |
|-------|------|---------|-------|
| `package` | enum | `starter` | One of: starter, standard, pro |
| `lead_id` | uuid | `550e8400-e29b-...` | From the FSBO intake record |
| `listing_id` | uuid | `650e9500-...` | From the FSBO listing record |
| `email` | string | `seller@example.com` | Pre-fills VHZ checkout |
| `source` | string | `mesahomes-fsbo` | Always this value |
| `ts` | integer | `1735100000` | Unix seconds; VHZ rejects if >30min old |
| `sig` | hex | `a3b7c9...` | HMAC-SHA256 of all other params, see below |

**Signing (MesaHomes side):**
```ts
import { createHmac } from 'node:crypto';

function signHandoff(params: Record<string, string>): string {
  const secret = process.env['VHZ_HANDOFF_SECRET']!;
  const canonical = Object.keys(params).sort()
    .filter(k => k !== 'sig')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return createHmac('sha256', secret).update(canonical).digest('hex');
}
```

**Verifying (VHZ side):** same function; reject if signature doesn't match
or `ts` is more than 30 minutes old. Same `VHZ_HANDOFF_SECRET` on both
sides.

#### Webhook data contract — VHZ → MesaHomes

After Stripe Checkout succeeds on VHZ, VHZ POSTs to:
`https://mesahomes.com/api/v1/listing/fsbo/vhz-webhook`

Body (JSON):
```json
{
  "event": "payment.succeeded",
  "lead_id": "550e8400-...",
  "listing_id": "650e9500-...",
  "package": "standard",
  "stripe_session_id": "cs_live_...",
  "stripe_payment_intent_id": "pi_live_...",
  "amount_paid_cents": 54900,
  "currency": "usd",
  "email": "seller@example.com",
  "paid_at": "2026-04-25T15:30:00Z"
}
```

Headers:
```
Content-Type: application/json
X-VHZ-Signature: sha256=<hex>
```

Signature header = HMAC-SHA256 of the raw request body using
`VHZ_MESAHOMES_WEBHOOK_SECRET`. Standard webhook verification pattern.

**Idempotency:** VHZ sends `stripe_session_id`; MesaHomes rejects
duplicates (don't double-trigger photography scheduling).

#### Failure events (future-proofing)

Same webhook endpoint, different `event`:
- `payment.failed` — update listing status to `payment-failed`, send
  seller an email with retry link
- `payment.refunded` — update status to `refunded`, notify Team_Admin

For MVP: only handle `payment.succeeded`; log + ignore others.

#### MesaHomes implementation (Kiro B's work)

**New file: `lib/listing-webhooks.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyVhzWebhook(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env['VHZ_MESAHOMES_WEBHOOK_SECRET'];
  if (!secret) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signHandoff(params: Record<string, string | number>): string {
  const secret = process.env['VHZ_HANDOFF_SECRET'];
  if (!secret) throw new Error('VHZ_HANDOFF_SECRET not set');
  const canonical = Object.keys(params).sort()
    .filter(k => k !== 'sig')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return createHmac('sha256', secret).update(canonical).digest('hex');
}
```

Co-located tests: `lib/listing-webhooks.test.ts` — valid sig passes,
tampered sig fails, wrong secret fails, timing-safe comparison verified.

**New endpoint: `POST /api/v1/listing/fsbo/intake` in `lambdas/listing-service/`**

Input body:
```json
{
  "package": "starter" | "standard" | "pro",
  "email": "seller@example.com",
  "phone": "+15555551234",
  "name": "Jane Seller",
  "propertyAddress": "...",
  "bedrooms": 3,
  "bathrooms": 2,
  "sqft": 1800,
  ...
}
```

Response:
```json
{
  "leadId": "550e8400-...",
  "listingId": "650e9500-...",
  "redirectUrl": "https://virtualhomezone.com/checkout?package=starter&lead_id=...&sig=..."
}
```

Steps:
1. Validate input (existing validation patterns)
2. Create Lead record with `toolSource: 'fsbo-intake'`
3. Create Listing record with `status: 'awaiting-payment'`, `packageType: 'fsbo-<tier>'`
4. Build handoff URL with `signHandoff()`
5. Return JSON with IDs + redirectUrl

**New endpoint: `POST /api/v1/listing/fsbo/vhz-webhook`**

Steps:
1. Read raw request body (API Gateway proxy integration: `event.body`)
2. Verify `X-VHZ-Signature` header via `verifyVhzWebhook()`
3. Parse JSON, validate required fields
4. Idempotency check: DynamoDB `PK=LISTING#{listingId}` — if
   `stripeSessionId` already set, return 200 no-op
5. Update listing: `status: 'paid'`, `stripeSessionId`, `amountPaidCents`,
   `paidAt`
6. Trigger SES email to seller: "Photography scheduling link"
7. Trigger SES to VHZ photographer: new booking
8. Trigger Team_Admin notification via DynamoDB Streams (existing pattern)
9. Return `{ok: true}` with 200

**Frontend update: `FsboClient.tsx`**

Step 4 (currently static link) becomes:
```tsx
const handlePaymentStep = async () => {
  const res = await api.listingIntake({
    package: selectedPackage,
    email, phone, name,
    propertyAddress, bedrooms, bathrooms, sqft,
    // ... other intake fields
  });
  // res.redirectUrl is the signed URL; browser navigates there
  window.location.href = res.redirectUrl;
};
```

`api.ts` adds:
```ts
listingIntake: (body: unknown) =>
  apiRequest<{ leadId: string; listingId: string; redirectUrl: string }>('/listing/fsbo/intake', { method: 'POST', body }),
```

**Env additions (`deploy/env-template.txt`):**
```
VHZ_HANDOFF_SECRET=<hex, 64 chars, same on both sites>
VHZ_MESAHOMES_WEBHOOK_SECRET=<hex, 64 chars, same on both sites>
VHZ_CHECKOUT_URL=https://virtualhomezone.com/checkout
```

Generate secrets once (owner):
```bash
openssl rand -hex 32   # run twice, save both values, put on both sites
```

#### VHZ site changes (owner's work)

Minimum for MVP (until VHZ rebuild per `three-tier-product.md`):

1. Add a `/checkout` page that:
   - Reads query params
   - Verifies signature (same HMAC logic as above)
   - Checks `ts` freshness (<30 min)
   - Shows package info with price
   - Creates Stripe Checkout Session with:
     - Line item: "MesaHomes FSBO — {Package} Package"
     - Amount from package param: starter=29900, standard=54900, pro=89900
     - `metadata: { lead_id, listing_id, package, source: 'mesahomes-fsbo' }`
   - Redirects to Stripe Checkout URL

2. Stripe webhook handler at `POST /stripe/webhook`:
   - Standard Stripe signature verification
   - On `checkout.session.completed`:
     - Build payload per webhook data contract above
     - Sign with `VHZ_MESAHOMES_WEBHOOK_SECRET` (HMAC-SHA256 of JSON body)
     - POST to `https://mesahomes.com/api/v1/listing/fsbo/vhz-webhook`

The VHZ `/checkout` page can be a simple PHP/static page or part of the
upcoming VHZ Next.js rebuild. Minimum viable is a single HTML page with
a Stripe Checkout button and a webhook handler script.

#### Testing end-to-end

Before DNS flip:
1. Set Stripe to test mode on VHZ
2. Click through `/listing/fsbo` → complete 4 steps → land on VHZ checkout
3. Pay with Stripe test card 4242 4242 4242 4242
4. Verify MesaHomes DynamoDB: listing status = `paid`, `stripeSessionId` set
5. Verify email received to seller
6. Verify idempotency: trigger same webhook twice → second is no-op
7. Verify signature failure: tamper with handoff URL → VHZ rejects
8. Flip to live keys only after all 7 pass

### Kiro B tasks

- [ ] `lambdas/listing-service/index.ts`: add `POST /listing/fsbo/intake`
      endpoint that creates a listing record with FSBO package type and
      returns listingId
- [ ] `lambdas/listing-service/index.ts`: add `POST /listing/fsbo/vhz-webhook`
      endpoint with shared-secret verification (env: `VHZ_MESAHOMES_WEBHOOK_SECRET`)
- [ ] `FsboClient.tsx`: replace the static link with a query-param URL
      built from the intake form data
- [ ] `lib/listing-webhooks.ts`: shared-secret verification helper + tests
- [ ] `deploy/env-template.txt`: add `VHZ_MESAHOMES_WEBHOOK_SECRET`
- [ ] 3-5 unit tests for the new endpoints
- [ ] Wire SES notification on paid webhook (reuse notification-worker
      patterns)

Estimated effort: ~3-4 hours.

---

## 🛑 BLOCKER 2 — Task 18 event tracking wired to 1 of 10 touchpoints

### Current state

`frontend/src/lib/tracking.ts` built with `trackEvent(name, source, meta)`,
session ID, UTM capture/persist. Only called in **one place**:
`frontend/src/app/booking/BookingClient.tsx`.

### Why this blocks launch

The spec requires tracking on every lead-capture touchpoint. Without it,
post-launch analytics will show only the booking page, not where visitors
actually engage. We can't optimize a funnel we can't see.

### Fix

Add `trackEvent()` calls at these 10 touchpoints:

| Touchpoint | Event name | Source |
|------------|------------|--------|
| `LeadCaptureModal.tsx` submit success | `lead_capture_submit` | `<toolSource>` prop |
| `LeadCaptureModal.tsx` first field focus | `lead_capture_start` | `<toolSource>` prop |
| `FullServiceUpgradeBanner.tsx` CTA click | `full_service_click` | `'banner'` |
| `StickyContactBar.tsx` phone tap (`tel:` link) | `call_click` | `'sticky-bar'` |
| `StickyContactBar.tsx` "Book Consult" click | `book_consult_click` | `'sticky-bar'` |
| `Header.tsx` phone link click | `call_click` | `'header'` |
| Net sheet form submit | `tool_submit` | `'net-sheet'` |
| Affordability form submit | `tool_submit` | `'affordability'` |
| Listing generator form submit | `tool_submit` | `'listing-generator'` |
| Offer writer form submit | `tool_submit` | `'offer-writer'` |
| Home value request form submit | `valuation_request_submit` | `'home-value'` |
| FSBO intake step 4 reached | `fsbo_intake_complete` | `'/listing/fsbo'` |

### Kiro B tasks

- [ ] Add `import { trackEvent } from '@/lib/tracking'` to each of the
      above files
- [ ] Wire `trackEvent()` call at the right lifecycle moment
- [ ] Confirm UTM params persist across navigation (already built into
      `tracking.ts` but test it with a real `?utm_source=google` URL)
- [ ] Verify `getLeadTrackingContext()` is attached to every `api.createLead()`
      payload — currently the LeadCaptureModal may not include it

Estimated effort: ~1 hour.

---

## 🛑 BLOCKER 3 — Task 19.4 seed-content.ts doesn't exist

### Current state

`deploy/README.md` says:
```bash
npx tsx deploy/seed-content.ts
```

File doesn't exist. `/areas/mesa`, `/areas/gilbert`, etc. will render with
"Market data unavailable" on launch because no city page records exist in
DynamoDB. `/blog` will be empty.

### Fix

Create `deploy/seed-content.ts` that inserts:

**6 city page records** (one per service-area city):
- Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction
- DynamoDB keys: `PK=CONTENT#CITY#<slug>`, `SK=CONTENT#CITY#<slug>`,
  `GSI1PK=CONTENT#CITY`, `GSI1SK=#<slug>` (per existing `generateCityPageKeys`)
- Fields: `{slug, name, state: 'AZ', heroTitle, metaTitle, metaDescription,
  h1, intro, zipCodes[], schoolDistricts[], notableFeatures[], faq[]}`
- Intro text: 200 words, use the `city-intro` prompt from `lib/ai-prompts/`
  with real city data (population, median home value, distance to Phoenix)
- 4-5 city-specific FAQ items

**3 foundational blog posts** for SEO launch:
- "Should You Sell Your Mesa Home Now or Wait? (2026 Market Outlook)"
- "Arizona Flat-Fee MLS: How It Actually Works"
- "First-Time Buyer's Guide to Buying a Home in Mesa, AZ"
- Each: 800-1200 words, Article JSON-LD-compatible, published 2026-04-25
- DynamoDB keys per `generateBlogPostKeys`

Script structure:
```ts
// deploy/seed-content.ts
import { putItem } from '../lib/dynamodb.js';
import { generateCityPageKeys, generateBlogPostKeys } from '../lib/models/keys.js';
import { EntityType } from '../lib/types/dynamodb.js';

const cities = [/* 6 city objects */];
const posts = [/* 3 blog objects */];

async function seedCities() { /* iterate + putItem */ }
async function seedBlog() { /* iterate + putItem */ }

async function main() {
  await seedCities();
  await seedBlog();
  console.log('Seeded 6 cities + 3 blog posts');
}
main().catch(e => { console.error(e); process.exit(1); });
```

Run before DNS flip:
```bash
npx tsx deploy/seed-content.ts
```

### Kiro B tasks

- [ ] Write `deploy/seed-content.ts` with 6 cities + 3 blog posts
- [ ] Use `lib/ai-prompts/city-intro.ts` via Hydra MCP (local AI) to
      generate the intro paragraphs — or hand-write for MVP
- [ ] Handwrite the 3 blog posts (these are the SEO foundation; human
      voice matters)
- [ ] Test: run against a local DynamoDB mock or against our real
      mesahomes-main table in dev
- [ ] Add `seed-content.ts` to `.gitignore`? NO — keep it in git. It's
      infrastructure-as-code.
- [ ] Document in `deploy/README.md`: "Run once before first deploy;
      safe to re-run (idempotent via conditional writes or just
      overwrites)"

Estimated effort: ~2-3 hours including writing 3 blog posts.

---

## ⚠️ ACCEPTABLE DEBT — Document, don't fix now

These are concerns from the audit that are NOT launch blockers. File as
follow-ups after production.

### Large files to split post-launch

- `lambdas/auth-api/index.ts` (434 lines, 4 endpoints in 1 file) — split
  to `login.ts`, `refresh.ts`, `register.ts`, `lockout.ts`
- `lambdas/property-lookup/index.ts` (413 lines) — partial split started
  with `gis-client.ts` and `street-view.ts`; finish the split
- `lambdas/leads-capture/index.ts` (338 lines, 4 endpoints) — split by
  endpoint
- `frontend/src/app/listing/fsbo/FsboClient.tsx` (508 lines, 4-step
  wizard) — split each step into its own component

### Design system spec not fully applied

`.kiro/specs/design-system.md` had a ready-to-paste Tailwind token block.
Kiro B's Task 11-12 pages used the existing ad-hoc color names which
happen to match roughly. The formal Tailwind config additions didn't
happen. Visually fine today; systematically enforceable later.

### No staging environment

`deploy/README.md` deploys straight to `mesahomes.com`. No `beta.mesahomes.com`
or dev account separation. Safe for MVP launch with low traffic; risky
later.

### `useGuidedPath.ts` duplicates types

Client hook duplicates `PathStep`, `GuidedPath`, `PathProgressInfo`,
`WhatsNextMessage` types from `lib/guided-engine/`. They documented why
("avoid server-only imports in client bundle"). Tsconfig path alias
`@mesahomes/lib/*` was set up for brokerage; could reuse for types here.
~30 duplicated lines.

### Checkpoint tasks don't integration-test

Tasks 13, 17, 20 verify `tsc --noEmit` + `vitest run`. Neither verifies
Lambda → DynamoDB → frontend render paths. Real integration tests
(Playwright against a deployed environment) are post-MVP.

### Infrastructure files are config objects, not CDK

`infrastructure/*.ts` defines resources as plain objects. Deploy is
manual via AWS CLI. CDK migration is a Phase 1B item.

---

## Execution order for Kiro B

Do them in this order (least risky first):

1. **Blocker 2** (event tracking) — 1 hour, pure frontend additions, no
   integration surface
2. **Blocker 3** (seed-content.ts) — 2-3 hours, new file + sample content,
   no existing code touched
3. **Blocker 1** (Stripe integration) — 3-4 hours, owner decision (A vs B)
   required first, requires coordinating VHZ changes

Total: ~6-8 hours of focused work.

## Definition of done

Before `mesahomes.com` DNS flip:

- [ ] 3 blockers all closed with commits + tests
- [ ] Full test suite passes: `npx tsc --noEmit && npx vitest run`
- [ ] Frontend test: `cd frontend && npx tsc --noEmit && npm run build`
- [ ] Seed script run successfully against production DynamoDB
- [ ] Manual smoke test: visit `/areas/mesa`, `/blog`, `/listing/fsbo`,
      `/` and confirm no "data unavailable" messages
- [ ] Stripe flow tested end-to-end with a $1 test charge to VHZ's
      Stripe account
- [ ] `LISTINGS_PAYMENT_ENABLED=false` verified (flat-fee and full-service
      tiers show "Coming Soon")
- [ ] Analytics pipeline verified: open chrome devtools, click a CTA,
      confirm `trackEvent` fires

## Cross-references

- `.kiro/specs/three-tier-product.md` — FSBO tier definition
- `.kiro/specs/mls-syndication-messaging.md` — `LISTINGS_PAYMENT_ENABLED`
  gate and broker-of-record env vars
- `.kiro/specs/flat-fee-legal-model.md` — why Stripe only handles
  activation fee, never commissions
- `.kiro/specs/ai-prompts-library.md` — city-intro prompt for seed content
- `deploy/README.md` — the existing deploy runbook
- `deploy/env-template.txt` — where new env vars go

## After launch

Once production is live and stable for a week:

1. File acceptable-debt items as individual follow-up tasks
2. Set up staging environment (branch: `main` deploys to beta subdomain,
   tagged releases deploy to prod)
3. Migrate `infrastructure/*.ts` to real CDK stacks
4. Apply design-system.md tokens to Tailwind config
5. Finish the Lambda file splits noted above
