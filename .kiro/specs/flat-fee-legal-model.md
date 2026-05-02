# Flat-Fee MLS Legal Model — What's Legal, What Competitors Do

> **Public-facing naming note (added 2026-04-26)**: The tier described in
> this legal memo is marketed to consumers as **"Mesa Listing Service."**
> The phrase "flat-fee MLS" is the technical/regulatory descriptor used
> in this document and in broker-of-record agreements. See
> `.kiro/specs/middle-tier-rebrand-research.md` for the rebrand rationale.
> All legal obligations in this memo still apply — only the consumer-
> facing product name changed.

Author: Kiro A, 2026-04-25. Status: spec — binds Task 15 implementation
and listing onboarding UI copy. Review with Arizona real estate counsel
before any payment flow goes live.

## CRITICAL: Salesperson vs broker distinction

**The human owner is a real estate SALESPERSON (agent), not a broker.**
In Arizona (ARS § 32-2155 and ADRE rules), a salesperson:

- MUST work under a licensed designated broker at all times
- CANNOT receive compensation directly from a consumer
- CANNOT be "broker of record" on any listing
- All fees, commissions, and client payments MUST flow THROUGH the
  employing brokerage
- The brokerage then pays the salesperson per their written employment
  or independent-contractor agreement

This changes the structure, not the architecture. MesaHomes can still
operate with the exact tech stack we've built — but the LEGAL ENTITY
that collects Stripe payments, holds the ARMLS subscription, and appears
as broker of record on listings MUST be a licensed designated broker or
brokerage, not the owner personally.

### Three business-structure paths (pick one before Task 15 goes live)

**Path A: Partner with a designated broker (recommended for speed)**
- Find a designated broker willing to be broker of record for MesaHomes listings
- Stripe merchant account and ARMLS subscription under the brokerage
- Broker pays the owner per commission split agreement (standard 70/30,
  80/20, etc. — negotiate with the broker)
- Owner remains the face of MesaHomes, drives marketing + tech + leads
- Fastest path to revenue. Starts day the broker agrees.

**Path B: Hang license at an existing flat-fee brokerage**
- Join a brokerage that already runs the flat-fee model (AZ Flat Fee,
  HomeSmart, My Home Group, etc.)
- MesaHomes becomes your personal lead-gen + branding platform under
  their umbrella
- They own the broker-of-record + Stripe side; you drive the tech
- Less control but fastest to start — they already have the infra

**Path C: Get broker's license (long-term)**
- Arizona requires 3 years full-time salesperson experience + 90 hours
  broker education + state exam
- Only viable if owner has years of experience already
- Not a MVP-timeframe option

### Implications for what we've built

Nothing architectural changes. All the following still work as designed:
- `lib/brokerage.ts` env-sourced broker-of-record — just populate with
  the PARTNER broker's info, not the owner's
- Stripe Checkout flow — but the Stripe account is the partner
  brokerage's, not the owner's personal account
- ARMLS subscription — held by the partner brokerage
- Listing agreement — signed between seller and the partner brokerage,
  with MesaHomes listed as the marketing/tech platform
- `LISTINGS_PAYMENT_ENABLED=false` stays false until the partnership is
  formalized and the Stripe account is active

### What the owner does right now

1. Decide between Path A, B, or C
2. For Path A: identify 2-3 designated brokers in Mesa area, pitch the
   partnership (you bring tech + leads, they bring the license). Good
   candidates: brokers running 50-200 agents who'd welcome a new
   lead-gen channel.
3. For Path B: pick the flat-fee brokerage whose culture fits and hang
   the license there.
4. Once decided, the env vars get set:
   - `BROKER_OF_RECORD_NAME` = partner brokerage legal name
   - `BROKER_OF_RECORD_LICENSE` = partner brokerage's ER license number
   - `BROKER_OF_RECORD_ARMLS_ID` = partner brokerage's ARMLS ID
5. Written agreement between owner (salesperson) and the brokerage
   covering: commission split, MesaHomes as DBA or referral source,
   who controls the Stripe account, marketing language boundaries, E&O
   coverage.

### Things to NEVER do as a salesperson

1. NEVER open a Stripe account in owner's personal name for listing fees
2. NEVER sign a listing agreement with a seller in owner's personal name
3. NEVER claim "MesaHomes" is a brokerage unless it's registered as a
   DBA of the partner brokerage
4. NEVER advertise MesaHomes without the partner brokerage's name and
   license number clearly visible per ADRE advertising rules
5. NEVER accept a fee directly from a seller (even if seller offers)
6. NEVER operate before a signed broker-agent agreement is in place

This isn't a "nice to have" — violating ARS § 32-2155 is grounds for
license revocation.

---

## Short answer on the original question (upfront payment legality)

**Yes, upfront credit-card payment for flat-fee MLS listings is legal
and standard.** It's what every major competitor does (Houzeo, Homecoin,
AZ Flat Fee, Clever, Beycome, mls500, mlsflatfeearizona.com). The only
legal constraints are:

1. The broker must be licensed in Arizona (ADRE active).
2. Payment for LISTING SERVICES is fine via Stripe / normal merchant
   processing. It's treated like any online service fee.
3. Payment for COMMISSION / CLOSING COSTS / EARNEST MONEY must NOT ride
   through Stripe — those flow through licensed escrow per ARS § 32-2171.
4. Trust-account rules (3-day deposit, no commingling, monthly
   reconciliation) apply to CLIENT funds the broker holds, not to
   service fees the broker has already earned.

Our architecture already distinguishes these correctly. The only clarity
we need is in the onboarding UI and the listing-agreement language.

## Two separate money flows (same spec as mortgage one, reinforced here)

| Flow | Purpose | Amount | Timing | Channel | Legal framework |
|------|---------|--------|--------|---------|-----------------|
| Activation fee | Seller pays MesaHomes for listing services | ~\$999 | Upfront, at listing-service enrollment | Stripe Checkout | Standard merchant services — MesaHomes earns it on enrollment in exchange for MLS entry + photos + description |
| Broker transaction fee | Seller pays our broker at closing | \$400 | At closing | HUD-1 / ALTA Settlement Statement via escrow | Broker compensation line-item on settlement — same as any brokerage |
| Buyer agent commission | Seller pays buyer's broker at closing | Negotiable, often 2-3% | At closing | Settlement statement via escrow | Post-NAR-settlement: explicit, negotiated in purchase contract |
| Any earnest money seller might hold back | N/A — seller doesn't hold earnest money | — | — | — | Earnest money is buyer-to-escrow, never touches us |

**Stripe only handles the first row. Everything else is escrow/settlement-statement only.**

## Legal framework summary (Arizona-specific)

### What allows this business model

- **ARS § 32-2101 et seq.** — Real estate licensing law. A licensed
  broker can offer any lawful service for a flat fee, percentage fee, or
  any agreed compensation. Arizona does NOT require commission-based pay.
- **ADRE Substantive Policy Statement** — Allows "limited service" and
  "entry-only" MLS listings where the broker's duties are narrower than
  a full-service listing agreement. Must be disclosed in writing.
- **ARMLS Rules of Cooperation** — Permit flat-fee / limited-service
  members in good standing. MLS entry and syndication work identically
  to full-commission listings. No "second-class" status.

### What the broker must do

- **Written listing agreement** stating scope of services, fees, and
  duration. AAR has a Limited Service Listing Agreement form (LSL).
- **Disclose the compensation model** to all parties in the transaction.
- **Maintain E&O insurance** at the ADRE-required level.
- **Keep client records 5 years** per ADRE rule.
- **Trust account** required if we ever hold client funds (earnest money
  deposits, refundable retainers). NOT required for already-earned
  service fees.

### What would get us in trouble

1. Representing we're a brokerage without an active ADRE license.
2. Running earnest money or closing disbursements through Stripe.
3. Charging a seller commission percentage while also charging a
   "processing fee" at closing that isn't disclosed upfront (undisclosed
   split = ADRE discipline).
4. Using "flat fee" in copy while actually tacking on success-fee
   percentages at closing (the "Houzeo model change" that's been
   criticized in 2026 — see below).
5. Accepting referral fees from lenders for routing buyers (RESPA § 8).
6. Collecting payment BEFORE a written listing agreement is signed.

## Competitor landscape (how other flat-fee companies actually do it)

Based on 2026 public pricing pages and third-party reviews:

### Houzeo — $199-$349 upfront + variable closing fees

- Originally pure flat-fee, upfront via Stripe/merchant processor
- **Changed model in 2025-2026** to add 0.5-1.25% closing percentage,
  which critics (Beycome review, 2026) argue disqualifies them from
  "flat fee" claims
- Lesson for us: if we advertise "flat fee," the total cost cannot
  scale with sale price. The broker transaction fee at closing must be
  fixed ($400 flat) and disclosed upfront.

### Homecoin — $95-$295 upfront, truly flat

- Pure flat-fee, credit card at enrollment
- Charges vary by state and tier (bronze/silver/gold)
- No closing percentage

### Clever — $0 upfront, 1% at closing

- Not actually flat-fee — takes a commission at closing
- Avoids the legal "flat fee" labeling issue by calling it "1% listing fee"
- Different model; not what we're doing

### AZ Flat Fee — Phoenix/Mesa local competitor

- Upfront card payment model
- Tiered packages $299-$999+
- Includes MLS entry, syndication, photo support

### mls500.com, mlsflatfeearizona.com, arizonamlsflatfee.com

- All three use upfront payment models
- Tiers from $99-$500
- Credit card processing standard
- None attempt to run commissions or closing funds through the payment
  processor

### Common pattern across all of them

1. Seller fills out property info → gets listing agreement PDF →
   e-signs → pays upfront fee via card → broker lists on MLS within
   24-48 hours
2. Broker is NOT a transaction coordinator at closing. Title/escrow
   handles the rest.
3. Any commission offered to buyer's agent is stated in the MLS listing
   and paid at closing through the settlement statement.
4. If seller wants "full service" at any point during the listing, they
   pay an upgrade fee and the broker's scope expands via an addendum.

## Our MesaHomes implementation — verified legal

### Listing activation fee ($999 — Stripe)

- Legal ✓
- Standard ✓
- Earned at enrollment (we do work: create listing, upload to MLS)
- Non-refundable once live (disclosed in agreement)
- NOT a commission, NOT a closing fee, NOT trust-account-required

### Broker transaction fee ($400 — settlement statement)

- Legal ✓
- Disclosed upfront in listing agreement and on every marketing page
- Paid at closing through escrow, line-item on HUD-1
- Never touches Stripe

### Buyer agent commission (negotiable — settlement statement)

- Seller and buyer's broker negotiate in the purchase contract
- Appears as a line item on the settlement statement at closing
- NAR settlement (Aug 2024) requires explicit written buyer-broker
  agreement on the buyer side; listing broker still optional on offering
  compensation
- MesaHomes doesn't collect or disburse this — escrow handles it

### Full Service Upgrade (variable — paid via invoice or Stripe)

- Legal ✓
- If seller upgrades mid-listing, we invoice for the delta. Can be paid
  via Stripe or wire.
- Requires a written addendum to the listing agreement before work begins

## Onboarding flow UI copy — legal clarity

These strings go in `/listing/start` and the pricing page. Plain English,
no legalese, but precise.

### Pricing breakdown box

> **What you pay:**
>
> $999 today — listing activation fee, paid via secure card checkout.
> Covers MLS entry, syndication to Zillow and other major portals, AI
> listing description, and listing support until sold or cancelled.
>
> $400 at closing — broker transaction fee, paid through the title
> company on your settlement statement. This is how our licensed broker
> of record gets compensated.
>
> Buyer agent commission (negotiable) — if your buyer has an agent,
> you'll agree on compensation in the purchase contract. This is paid
> from your sale proceeds at closing through the title company, not by
> you directly. Typical range: 2-3% in Arizona.

### Next to "Pay $999 to activate" button

> Paying this activates your listing within 24 hours of receiving your
> property photos and signed listing agreement. The fee is non-refundable
> once your listing goes live on the MLS. It does NOT include commissions
> or closing costs — those are handled by the title company at closing.

### Footer of the listing agreement e-sign page

> This Limited Service Listing Agreement is between you (Seller) and
> {brokerOfRecordName}, Arizona License #{brokerLicenseNumber}. Your $999
> activation fee is for the services listed above. The $400 broker
> transaction fee at closing is our broker's compensation for the
> transaction and appears on your settlement statement. Questions?
> Contact us before signing.

## Task 15 Stripe implementation — safe-by-design checks

- [ ] Stripe Checkout Session created for $999 (from env
      `LISTING_ACTIVATION_FEE_CENTS`, default 99900)
- [ ] Success webhook moves `ListingStatus` from `draft` → `paid` →
      triggers MLS submission workflow
- [ ] `LISTINGS_PAYMENT_ENABLED` env flag default false until ADRE
      license + ARMLS active (already in `lib/brokerage.ts`)
- [ ] Listing agreement e-signature REQUIRED before Stripe Checkout
      Session is created — no payment without agreement. Use HelloSign,
      DocuSign, or BoldSign. (Task 15 spec didn't mention e-sign; add it.)
- [ ] Refund policy documented: refundable only if listing has not yet
      been published to MLS. After MLS entry, non-refundable.
- [ ] Stripe webhook signature verification before trusting payment
      status
- [ ] No Stripe Connect / split-pay / marketplace features — we are the
      merchant of record, not a platform passing through funds to other
      parties
- [ ] No line items for "commission," "broker fee," "closing cost," or
      "earnest money" on the Stripe product. Single line: "MesaHomes
      Listing Activation — Flat Fee MLS Service."

## Compliance review checklist — must happen before payment goes live

1. [ ] ADRE license active (human owner's responsibility)
2. [ ] Broker of record identified and ARMLS-subscribed
3. [ ] E&O insurance bound and certificate filed with ADRE
4. [ ] Written listing agreement template reviewed by Arizona real
       estate attorney
5. [ ] AAR Limited Service Listing Agreement (LSL) form or custom
       equivalent used
6. [ ] Refund policy published publicly
7. [ ] Stripe terms of service reviewed for real estate flat-fee
       eligibility (Stripe sometimes restricts per-state)
8. [ ] Privacy policy and terms of service published
9. [ ] Fair Housing notice displayed per ADRE advertising rules
10. [ ] Attorney review of all listing onboarding copy — particularly
        the "what you pay" box above

**Do not publish any pricing page or run any Stripe test charges until
all 10 are complete.**

## If something goes sideways — jurisdictional guardrails

If a seller disputes a Stripe charge:
- We show the signed listing agreement, the MLS listing confirmation,
  and the refund policy
- Stripe dispute resolution handles it like any service charge dispute
- Does NOT become an ADRE matter unless the seller alleges we failed to
  deliver the contracted service

If ADRE inquires:
- Trust account NOT implicated (no client funds held)
- License records, E&O, and the listing agreement file are what they
  look at
- Advertising (our website) must comply with ADRE rules — broker name
  and license number visible on every page (already spec'd in
  design-system.md footer rules)

## References

- Arizona Revised Statutes Title 32 Chapter 20 (real estate broker law)
- ADRE Substantive Policy Statements: https://azre.gov/document-category/substantive-policy-statements
- AAR forms (Limited Service Listing Agreement): https://www.aaronline.com/manage-risk/sample-forms/
- Arizona trust account rules: https://open-exam-prep.com/exams/az-real-estate/arizona-contracts-disclosures/arizona-trust-accounts
- Houzeo pricing model change critique (2026): https://www.beycome.com/blog/houzeo-reviews-pros-cons/
- Flat-fee MLS Arizona competitors (2026 ranking): https://www.houzeo.com/blog/best-flat-fee-mls-companies-in-arizona/
- NAR August 17, 2024 settlement practice changes
- RESPA Section 8 (referral fee prohibition): https://www.consumerfinance.gov/compliance/supervisory-highlights/respa-section-8/

## Cross-references

- `.kiro/specs/mls-syndication-messaging.md` — portal syndication claims,
  broker-of-record env wiring
- `.kiro/specs/mortgage-cost-transparency.md` — RESPA Section 8 lender
  referral fee prohibition (same principle applies to all settlement
  service providers)
- `.kiro/STEERING.md` — business model row ($999 listing + $400 broker
  transaction)
- `lib/brokerage.ts` — `LISTINGS_PAYMENT_ENABLED` env gate
