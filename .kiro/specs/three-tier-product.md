# Three-Tier Product Strategy — FSBO + Mesa Listing Service + Full-Service

Author: Kiro A, 2026-04-25. Status: spec — restructures the whole MesaHomes
product model to three offerings instead of one.

> **Naming update 2026-04-26**: The middle tier renamed from "Flat-Fee MLS"
> to **"Mesa Listing Service"** in all user-facing UI. The term "flat-fee MLS"
> is still used in URL slugs, meta tags, and legal/pricing-mechanism
> descriptions (see `.kiro/specs/middle-tier-rebrand-research.md`). In this
> doc, all occurrences of "Flat-Fee" below refer to the product now
> marketed as **Mesa Listing Service** unless clearly a pricing-mechanism
> descriptor.

## The insight

Owner is a licensed salesperson AND owns a real estate photography business
(Virtual Home Zone). That combination unlocks a product tier the
salesperson/broker constraint can't block: **FSBO support services sold
directly by Virtual Home Zone**.

FSBO services (selling a home yourself, not on the MLS) do NOT require a
real estate license. The owner can legally sell photography, virtual tours,
yard-sign packages, Zillow-FSBO upload assistance, contract templates, and
consultation on FSBO sales TODAY — no broker partnership needed.

The three-tier model:

| Tier | Who owns it legally | Who gets paid | Owner can do today? |
|------|--------------------|--------------|--------------------|
| **List on Your Own (FSBO)** | Virtual Home Zone (owner's existing company, no license required for FSBO services) | Virtual Home Zone directly (Stripe → Virtual Home Zone business account) | YES — ship this first |
| **List Flat-Fee on MLS** | Partner brokerage (broker of record) | Partner brokerage, then owner per split agreement | No — requires broker partnership first |
| **List Full Service** | Partner brokerage | Commission on sale → broker → owner per split | No — requires broker partnership + active license |

This lets us launch revenue-generating product (FSBO) while the broker
partnership is still being negotiated.

## Tier 1: List on Your Own — "FSBO Done Right"

Operated by **Virtual Home Zone** (owner's existing photography company).
No real estate license required. Owner is the merchant of record on
Stripe. All revenue flows to Virtual Home Zone.

### What's legal vs not

**LEGAL as Virtual Home Zone / non-broker:**
- Real estate photography + virtual tours + floor plans + drone
- Yard signs, lockbox rentals, marketing flyers
- Coaching and consultation on pricing, staging, negotiation
- Document preparation assistance (NOT legal advice — templates only)
- Listing syndication to FSBO sites (Zillow FSBO, ForSaleByOwner.com,
  FSBO.com, Craigslist) — these accept owner-uploaded listings
- MesaHomes tools: net sheet, affordability calculator, offer writer
  (all already built, no change)

**NOT LEGAL without a license (don't ever offer these in this tier):**
- Posting the home to ARMLS (only licensed agents + brokers can)
- Representing the seller in negotiations
- Handling earnest money
- Advising on offer acceptance as a fiduciary
- Claiming the home is "listed on MLS" when it's on FSBO sites only

### Pricing tiers (competitive with 2026 Phoenix-area photography)

Based on actual Phoenix-metro photographer pricing data:
- Basic real estate photography: $150-$250 (per Listing Marketing Pros,
  Listing Bees)
- Standard with floor plan: $250-$350
- Premium with drone + 3D tour: $400-$650 (per Desert Lens, Archi-pix)
- Full production (drone + twilight + video + 3D + virtual staging):
  $600-$800

Suggested MesaHomes "List on Your Own" packages:

| Package | Price | Includes |
|---------|-------|----------|
| **Starter** | $299 | Pro photos (up to 30), 2D floor plan, 1 yard sign, FSBO listing upload to Zillow FSBO + Craigslist, MesaHomes tool access (net sheet, affordability, etc.), PDF flyer template, 30-day listing |
| **Standard** | $549 | Everything in Starter PLUS drone photos, 3D Matterport tour, twilight photo, 60 days, unlimited price adjustments, 3 flyer revisions |
| **Pro** | $899 | Everything in Standard PLUS cinematic video walkthrough, virtual staging (up to 5 rooms), dedicated consultation call (60 min), professional listing description (written by MesaHomes AI + human-reviewed), contract template library, 90 days |

Add-ons (all priced standalone):
- Extra drone photos: $75
- Virtual staging: $35/room
- Additional price adjustment: included (unlimited)
- Open house signs + flyers: $49
- Twilight photo shoot: $150
- 60-minute consultation call: $99 if bought separately
- Lockbox rental: $49/month

### Why this works as differentiator #1

- **Revenue day 1** — Virtual Home Zone already exists, probably already has
  a Stripe account, photographers ready. No broker partnership bottleneck.
- **Owner's real expertise** — owner IS a photographer; this is the
  highest-margin product we can honestly sell today.
- **Positioning moat** — "MesaHomes: start on your own with pro photos,
  upgrade to flat-fee listing when you're ready, full-service if you want
  an agent." One funnel, three tiers, seller self-selects.
- **Data collection** — every FSBO package enrollment is a warm lead for
  the flat-fee/full-service upgrade path later. Tool data + property data
  from the onboarding flow feeds the Lead record.
- **Fair Housing + legal clean** — FSBO services don't require broker
  supervision. Virtual Home Zone is a media/services company, not a
  brokerage.

### Tech implementation

Frontend changes (Kiro B for Task 15 scope):
- Rename / restructure `/listing/start` → pricing page with 3 tiers
  (FSBO + Flat-Fee + Full-Service), user picks
- `/listing/fsbo/*` flow: package selection → property intake →
  photography scheduling → Stripe checkout → intake confirmation email
- Separate Stripe account: Virtual Home Zone business Stripe (not the
  not-yet-existing brokerage Stripe). This is owner's existing Stripe.
- New env: `VIRTUAL_HOME_ZONE_STRIPE_ACCOUNT_ID` and
  `VIRTUAL_HOME_ZONE_STRIPE_PUBLIC_KEY` — FSBO tier uses these
- New env: `VHZ_STRIPE_WEBHOOK_SECRET` for webhook verification

Backend (Kiro B or later):
- `lambdas/listing-service/` gains a `packageType` field on the listing
  record: `'fsbo-starter' | 'fsbo-standard' | 'fsbo-pro' | 'flat-fee' | 'full-service'`
- DynamoDB: `LISTING#{listingId}` with `data.packageType` distinguishes
  tier, no broker-of-record required for FSBO records
- Photography scheduling workflow: send calendar invite via SES to
  Virtual Home Zone photographer + seller
- Different confirmation emails per tier
- NO MLS submission workflow for FSBO tier — that's the difference

### UI copy

**Pricing page headline:**
> Three ways to sell. You choose how much you want to do.

**FSBO card:**
> **List on Your Own** — from $299
>
> You run the sale. We hand you the tools: professional photos from Virtual
> Home Zone, yard sign, listing upload to Zillow FSBO and Craigslist, PDF
> flyer, and full access to our pricing + offer tools. Great for confident
> sellers who know their home and want to save the most money.
>
> **What you save:** no commissions, no broker fee. Just a one-time
> service fee.
>
> **What you give up:** MLS listing (Zillow and Realtor.com show your home
> but without the same prominence as MLS listings), agent guidance on
> negotiations, buyer-agent handling.
>
> **[See packages →]**

**Flat-Fee card:**
> **List Flat-Fee on MLS** — $999 + $400 at closing
>
> Same MLS exposure as a full-commission listing. Your home on Zillow,
> Realtor.com, Redfin, Trulia, Homes.com. Licensed brokerage handles the
> MLS side; you handle showings and negotiations. You keep more of your
> sale proceeds.
>
> **[Start flat-fee listing →]**

**Full-Service card:**
> **Full Service** — traditional commission
>
> Licensed agent handles everything: pricing strategy, photos, marketing,
> showings, negotiations, contract, inspection, closing. Best for sellers
> who want hands-off or have a complex transaction.
>
> **[Talk to an agent →]**

All three include a comparison table showing what's included in each.

## Tier 2: List Flat-Fee on MLS

Unchanged from prior specs. Requires broker partnership per
`flat-fee-legal-model.md`. `LISTINGS_PAYMENT_ENABLED=false` until
partnership active.

## Tier 3: Full Service

Traditional commission listing. Also requires broker partnership.
Lead capture only until broker on board.

## FSBO-specific content to build (Task 12+ adjustment)

New pages under `/sell/fsbo/`:

- `/sell/fsbo` — tier landing page, what FSBO is, who it's for, when it
  makes sense
- `/sell/fsbo/packages` — 3 package tiers with pricing calculator
- `/sell/fsbo/how-it-works` — 5-step walkthrough (sign up → schedule
  photos → listing upload → negotiate offers → close with escrow)
- `/sell/fsbo/tools` — explains which MesaHomes tools are included
  (net sheet, affordability calc to share with buyers, offer writer,
  contract library, price adjustment)

New blog content:
- "Arizona FSBO Done Right: Your Legal Checklist"
- "What Documents You Need to Sell Your Home Yourself in AZ"
- "When to Choose FSBO vs Flat-Fee vs Full-Service"
- "Arizona SPDS and Seller Disclosures for FSBO"
- "How to Negotiate with Buyers and Their Agents as a FSBO"

## Virtual Home Zone brand integration

**Decision: keep MesaHomes as the consumer-facing brand, cite Virtual Home
Zone as the service provider for FSBO-tier media.**

Why:
- MesaHomes is the broader real estate platform (FSBO + flat-fee +
  full-service). Virtual Home Zone is the photography arm within the
  FSBO tier.
- Consumers don't want to navigate two brands.
- Legal clarity: FSBO-tier contracts are between seller and Virtual Home
  Zone (as photography/media services company). Footer on FSBO pages
  includes: "Photography and media services by Virtual Home Zone, an
  MesaHomes partner."

Footer block on FSBO pages:
> Photography, virtual tours, and listing production by Virtual Home Zone.
> MesaHomes and Virtual Home Zone are affiliated companies serving Mesa,
> Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction.

## Implementation priority — revised

Given this opens an immediate revenue path:

1. **Task 15a (NEW — PROMOTE TO PRIORITY)** — FSBO tier build:
   - 3 new frontend pages (/sell/fsbo/*)
   - Pricing page updated to 3-tier
   - Stripe Checkout for Virtual Home Zone (existing account, different
     from not-yet-existing brokerage account)
   - Photography scheduling workflow (SES email to photographer)
   - Listing record with packageType field
   - No MLS integration, no broker-of-record requirement
2. **Task 15b (DEFER)** — Flat-Fee tier build — waits for broker partnership
3. **Task 15c (DEFER)** — Full-Service lead capture — can ship alongside
   flat-fee when broker on board

This means FSBO tier ships as part of Task 15, generating revenue from day
one. Flat-fee and full-service tiers are scaffolded but return 503 from
the listing-service Lambda (via `LISTINGS_PAYMENT_ENABLED` env) until
partnership finalized.

## Compliance — FSBO tier specific

FSBO tier MUST NOT claim:
- "We list on the MLS for you" (we don't for FSBO; only flat-fee tier does)
- "Your agent will negotiate" (there's no agent; seller handles it)
- "We'll draft the purchase contract" (illegal UPL — provide templates only)
- Any advice that constitutes practicing real estate without a license
- Any advice that constitutes practicing law without a license

FSBO tier MUST display:
- "FSBO package. Seller is responsible for listing, negotiations, and
  contract handling. MesaHomes provides media, marketing support, and
  tools only. Legal and brokerage services sold separately."
- Clear upsell to flat-fee or full-service at every decision point

## Open questions

1. **Does Virtual Home Zone have a Stripe account already?** If yes, use
   it. If no, create one in VHZ's name (LLC or sole prop per existing
   business structure).
2. **Does Virtual Home Zone have photographer capacity for projected
   volume?** At $299-$899 per package, even 20 packages/month requires
   20 photo shoots. Staff up or subcontract.
3. **Insurance?** Virtual Home Zone should have general liability + errors
   & omissions for media services (separate from real estate E&O).
4. **Tax treatment?** FSBO fees are service revenue to VHZ. Keep books
   separate from any future brokerage income.
5. **Arizona consumer protection — FSBO buyer-side disclosure?** Sellers
   must provide SPDS; we provide the template but not completion.
   Document in package agreement.

## References

- FSBO Arizona legal guide (Generis Online, 2026): https://generisonline.com/a-comprehensive-guide-to-fsbo-transactions-in-arizona/
- How to sell FSBO in AZ (HomeLight): https://www.homelight.com/blog/how-to-sell-a-house-by-owner-in-arizona/
- MLS by-owner listing options (Real Estate Queen): https://www.realestatequeen.com/how-to-list-on-mls-in-arizona/
- Phoenix real estate photography pricing (Sean Colon, 2026 — $250-$800 range): https://www.seancolon.com/blog/2026/1/11/real-estate-photography-pricing-in-arizona-what-professional-visual-standards-reflect-in-2026
- Desert Lens pricing tiers: https://desertlens.net/simple-upfront-pricing/
- Listing Bees pricing: https://www.thelistingbees.com/pricing

## Cross-references

- `.kiro/specs/flat-fee-legal-model.md` — Tier 2 details (unchanged)
- `.kiro/specs/mls-syndication-messaging.md` — Tier 2 syndication claims
- `.kiro/specs/mortgage-cost-transparency.md` — content cross-linked from
  all 3 tier pages (buyer side is tier-agnostic)
- `lib/brokerage.ts` — used by Tier 2 only, not Tier 1
- `lib/ai-prompts/` — listing-description prompt used across all 3 tiers
  for generating the listing copy
