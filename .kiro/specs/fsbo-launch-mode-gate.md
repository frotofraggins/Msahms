# FSBO Launch-Mode Gate — Ship MesaHomes Without VHZ

Author: Kiro A, 2026-04-25. Status: execute before production deploy.
Est. 30 minutes for Kiro B. Unblocks MesaHomes launch without
requiring VHZ to be live first.

## Why

Owner reviewed the Stripe wiring question and concluded "we need to
get Virtual Home Zone up before we can resume Stripe payment."

True — but VHZ shouldn't block MesaHomes launch. Every day MesaHomes
isn't live is lost SEO runway (Google takes 3-6 months to index
and rank). MesaHomes has value on its own via free tools, educational
content, and lead capture.

This spec adds a launch-mode gate so FSBO intake captures leads but
doesn't attempt the Stripe handoff until VHZ is live.

## The change

### New env var

`NEXT_PUBLIC_FSBO_LAUNCH_MODE` — values:
- `"lead-only"` (default for initial launch): intake captures data,
  creates a listing in status `awaiting-vhz-launch`, shows a "thanks,
  we'll email you within 24 hours" confirmation. No redirect, no
  Stripe handoff.
- `"stripe"`: current behavior — POST to intake endpoint, receive
  signed redirect URL, navigate browser to VHZ /checkout.

Add to `deploy/env-template.txt`:
```
# FSBO flow mode. Set to "lead-only" until VHZ /checkout is live.
# Flip to "stripe" when VHZ is ready to receive signed handoffs.
NEXT_PUBLIC_FSBO_LAUNCH_MODE=lead-only
```

### Frontend: `FsboClient.tsx` line 144 region

Current:
```tsx
const res = await api.listingIntake({ ... });
window.location.href = res.redirectUrl;
```

New:
```tsx
const res = await api.listingIntake({ ... });
const mode = process.env['NEXT_PUBLIC_FSBO_LAUNCH_MODE'] ?? 'lead-only';
if (mode === 'stripe') {
  // Future state: hand off to VHZ for payment
  window.location.href = res.redirectUrl;
} else {
  // Launch state: show confirmation, no redirect
  setSubmitted(true); // or however the component tracks state
}
```

Add a new success-state view that says:

> **Thanks, your listing is in our queue.**
>
> We'll email you within 24 hours to schedule your photography session
> with Virtual Home Zone and collect payment for your $299 / $549 /
> $899 package. Any questions, reach us at hello@mesahomes.com.

No Stripe link, no payment collection, no VHZ redirect.

### Backend: `lambdas/listing-service/index.ts`

The intake endpoint already creates a Listing with
`status: 'awaiting-payment'`. Rename status or add new status:

```ts
type ListingStatus =
  | 'draft'
  | 'awaiting-vhz-launch'   // NEW: lead captured, VHZ not ready
  | 'awaiting-payment'      // intake done, redirected to VHZ, no payment yet
  | 'paid'                  // VHZ webhook confirmed payment
  | 'photography-scheduled'
  | 'active'
  | 'awaiting-broker-activation'  // flat-fee waiting on BoR
  | 'expired'
  | 'cancelled';
```

Intake endpoint reads `FSBO_LAUNCH_MODE` env var (backend, no NEXT_PUBLIC_
prefix):
- If `lead-only`: create listing with `status: 'awaiting-vhz-launch'`,
  skip the signed-redirect URL generation, return
  `{ listingId, leadId, status: 'awaiting-vhz-launch' }` only.
- If `stripe`: existing behavior — create listing `awaiting-payment`,
  generate signed redirect URL, return it.

Dashboard listings page already filters by status; no changes needed
there. Owner sees `awaiting-vhz-launch` leads in the dashboard and
can email them back manually.

### Config: new Lambda env var

Add `FSBO_LAUNCH_MODE` to `listing-service` in
`deploy/lambda-config.json` + `infrastructure/cdk/stack.ts` (inside
`LAMBDA_CONFIGS['listing-service'].env`):

```ts
'listing-service': {
  source: 'listing-service',
  memory: 256,
  timeout: 15,
  env: {
    LISTINGS_PAYMENT_ENABLED: 'false',
    FSBO_LAUNCH_MODE: 'lead-only',   // ← new
  },
},
```

### Tests

- Update FsboClient tests: `lead-only` mode shows confirmation, does
  NOT call `window.location.href`
- Update listing-service intake tests: `lead-only` mode returns
  `{listingId, leadId, status: 'awaiting-vhz-launch'}` without
  `redirectUrl`
- Add test: `stripe` mode still works as before (regression guard)

Target: 855+ tests after (add ~3 new tests, no existing ones break).

## Deploy sequence

1. Kiro B ships this change (~30 min)
2. Owner deploys with `NEXT_PUBLIC_FSBO_LAUNCH_MODE=lead-only` +
   `FSBO_LAUNCH_MODE=lead-only` (via Secrets or direct Lambda env)
3. MesaHomes goes live. FSBO intake captures leads. Owner responds
   manually.
4. When VHZ /checkout is live: flip env vars to `stripe`, rebuild
   frontend, redeploy Lambda. ~10 min.

## Owner follow-up workflow (while in lead-only mode)

When a FSBO intake arrives:
- Dashboard lists it as `awaiting-vhz-launch`
- Owner emails seller: "Thanks for signing up. Virtual Home Zone's
  payment system is launching in X days. We'll email you a Stripe
  Payment Link [or VHZ checkout URL] shortly to reserve your package."
- Owner manually creates a Stripe Payment Link or sends an invoice
  via Stripe dashboard
- Seller pays → owner manually updates listing status in dashboard

## Alternative: Use Stripe Payment Links right now (Option 2A from prior discussion)

If owner wants FSBO payments to actually work before VHZ is built,
use Payment Links in `lead-only`-style flow:

1. Owner creates 3 Stripe Payment Links in VHZ's Stripe dashboard
2. Instead of "we'll email you" confirmation, show:
   "Complete your $X payment here" with the matching Payment Link
3. Owner manually updates listing status when payment notification
   arrives via Stripe dashboard

This is strictly better than pure `lead-only` because payment can
happen immediately. But it requires the owner to create the Payment
Links in Stripe first (~5 min work).

## Decision point for owner

Pick one:
- **Pure lead-only** (30 min Kiro B work, FSBO leads captured, payment
  is 100% manual via Stripe dashboard email invoices)
- **Lead-only + Payment Links** (30 min Kiro B work, Owner creates 3
  Payment Links in Stripe, FSBO intake confirms with payment URLs, no
  automation of status updates until full VHZ flow is built)
- **Wait for full VHZ flow** (unknown timeline — VHZ transfer 5-7 days,
  then VHZ rebuild, then Stripe integration, then test — total 2-4
  weeks)

Recommend Lead-only + Payment Links. Ship MesaHomes today, capture
leads + payments + email manually for the first month, build VHZ
automation when you have 10+ FSBO signups validating the thesis.

## Commit messages

```
feat(fsbo): launch-mode gate — lead-only | stripe | payment-links
```

## Verification

Normal gate: `npx tsc --noEmit && npx vitest run && cd frontend && npm run build`.
Manual: visit `/listing/fsbo`, complete all 4 steps in dev with
`NEXT_PUBLIC_FSBO_LAUNCH_MODE=lead-only`, confirm you see the
confirmation state and NOT a redirect.
