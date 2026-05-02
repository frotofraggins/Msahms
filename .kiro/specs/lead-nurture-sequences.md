# Lead Nurture Sequences (Path-Specific Welcome Emails)

Author: Kiro A, 2026-04-27 (backfilled from implementation).
Status: SHIPPED. Live in production.

## Purpose

When a prospect fills out any form on mesahomes.com, they should get
a welcome email that speaks to **what they actually did**, not a
generic "we got your message, we'll be in touch." The email tells
them:
- What happens next, specifically
- When/how we'll follow up
- What action they can take right now (optional CTA button)

Addresses `mesahomes-lead-generation/requirements.md` req:
> "CRM_System SHALL support configuring different Nurture_Sequences
>  based on lead source channel, allowing tailored follow-up for
>  organic leads versus paid leads versus referral leads"

## Outcome

Every lead form sends a path-specific welcome email within seconds
of submission. Owner already sees these emails (we're the "from"
address), so the copy is also a trust signal for the owner: this
is the actual message that goes out.

15 distinct sources mapped with custom content. Unknown sources
fall back to a generic 3-step welcome so new forms never send
nothing.

## Non-goals

- **Drip sequences / multi-email sequences.** Single welcome only
  at MVP. Day-3 / day-7 follow-ups deferred until we see open rates.
- **Personalization beyond name + source.** No "hi Jane, here's a
  market report for 85203 specifically" — too brittle at this
  stage. Generic-but-source-specific is the sweet spot.
- **SMS nurture.** Email only for now. Twilio was evaluated + deferred.

## The 15 paths

Sources categorized by user intent. Each path has:
- `intro`: headline after the "Here's what happens next" block
- `steps`: 3-4 ordered bullet items
- `cta?`: optional button + URL to the next logical page

### Sellers (7 paths)

| toolSource | Intent | Primary CTA |
|---|---|---|
| `home-value` | Valuation request | /sell (compare listing options) |
| `net-sheet` | Net-sheet calculator | /listing/start |
| `sell-now-or-wait` | Timing analysis | (none) |
| `listing-generator` | AI listing copy | /listing/start |
| `flat-fee-listing` | Mesa Listing Service inquiry | /listing/start |
| `full-service-request` | Full-service agent consult | /booking |
| `sell-landing` | Generic sell landing | /sell |

### Buyers (5 paths)

| toolSource | Intent | Primary CTA |
|---|---|---|
| `affordability` | Mortgage affordability | /areas/mesa |
| `offer-writer` | AI offer draft | /booking |
| `first-time-buyer` | First-home roadmap | /tools/affordability |
| `offer-guidance` | Offer strategy support | /booking |
| `buy-landing` | Generic buy landing | /tools/affordability |

### Renters, investors, misc (6 paths)

| toolSource | Intent | Primary CTA |
|---|---|---|
| `rent-landing` | Rental inquiry | (none) |
| `invest-landing` | Investment property | /invest |
| `comparison` | Flat-fee vs agent breakdown | /sell |
| `contact-form` | General message | (none) |
| `direct-consult` | Consultation request | /booking |
| `valuation-request` | Direct valuation | (none) |

Fallback applies to any unknown toolSource.

## Implementation

### `lib/email-templates/welcome-steps.ts`

Pure mapping module. No I/O, no side effects. Exports:

```ts
export interface StepContent {
  intro: string;
  steps: string[];
  cta?: { label: string; url: string };
}

export function getStepsForSource(source?: string): StepContent;
```

Fallback is `{ intro: "Here's what happens next:", steps: [3
generic lines], cta: undefined }`.

### `lib/email-templates/lead-capture.ts`

Imports `getStepsForSource` and renders both plain-text and HTML
bodies with the step content inlined. CTA becomes a button in HTML,
a labeled URL line in plain text.

### `lambdas/leads-capture/index.ts`

Already called `leadCaptureTemplate` on every lead create. No change
needed — the template reads `toolSource` from the lead payload.

## Example output

**Path: `home-value` (seller requesting valuation)**

> Hi Nick,
>
> Thanks for your **home value estimate**. It's in our queue.
>
> **Here are your next steps for a home valuation:**
>
> 1. We'll pull county records, recent Mesa-area comps, and current
>    market trends for your address.
> 2. Within 24 hours you'll get a detailed valuation report with
>    low/high/most-likely price ranges.
> 3. If you're ready to list, we can walk you through the $999 Mesa
>    Listing Service or full-service options.
>
> **[Compare our listing options]** → https://mesahomes.com/sell
>
> Anything time-sensitive? Reply to this email or text (480) 269-0502.
>
> — The MesaHomes Team

## Voice rules (from STEERING)

The step copy follows the same voice rules as AI content:
- No em-dashes
- No "whether you're X or Y" pivots
- No corporate filler ("leverage," "ecosystem," "streamline")
- Short sentences, contractions allowed
- Active voice
- Specific where possible ("county records, recent comps"),
  not vague ("we'll look at your info")

## Tasks completed

- [x] `lib/email-templates/welcome-steps.ts` with 15-source mapping +
      fallback
- [x] `lib/email-templates/lead-capture.ts` renders from StepContent
      in both plain text + HTML
- [x] CTA button styled with brand color in HTML
- [x] Strip-trailing-whitespace + content escaping via existing `esc()`
- [x] All 879 tests still pass
- [x] Deployed 2026-04-27, verified in production via a test lead

## Open work (Phase 2)

- [ ] Day-3 follow-up email for non-responders (per source)
- [ ] Day-7 "last chance" follow-up (per source)
- [ ] A/B test subject lines once we have >100 leads/source for
      statistical power
- [ ] SMS opt-in checkbox + Twilio integration for high-intent
      sources (full-service-request, flat-fee-listing)
- [ ] Track email opens + clicks to see which paths convert best
      (needs SES config set + event destination)
- [ ] Personalized subject line ("Re: your $X home estimate in 85203")
      once we have the data at send time

## Related

- `lambdas/leads-capture/index.ts` — fires the email on lead create
- `lib/email-sender.ts` — SES wrapper
- `lib/email-templates/lead-capture.ts` — the template itself
- `.kiro/specs/mesahomes-lead-generation/requirements.md` — originally
  defined Nurture_Sequences requirement
