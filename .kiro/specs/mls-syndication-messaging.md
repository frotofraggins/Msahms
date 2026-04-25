# MLS Syndication Story — Marketing Messaging + Onboarding Copy

Author: Kiro A, 2026-04-24. Status: spec — applies to all listing-related
pages and the flat-fee onboarding flow.

## The core message

**Listing with MesaHomes puts your home in the MLS — and that feed syndicates
automatically to Zillow, Realtor.com, Redfin, Trulia, Homes.com, and hundreds
of other portals. Same listing, same exposure, same buyer reach. Flat fee,
not full commission.**

This is the single most important competitive message on the site. Most
sellers don't know that flat-fee MLS listings get the same distribution as
traditional commission listings — they think "flat fee" means "less
exposure." It doesn't.

## Why this works (the mechanics)

Once a listing goes into ARMLS (Arizona Regional MLS), the MLS data feed
is what powers:

- Zillow (via ZDP / direct-feed partnerships)
- Realtor.com (official NAR partner — gets MLS feed directly)
- Redfin (direct MLS subscriptions per region)
- Trulia (Zillow-owned, same feed)
- Homes.com
- Movoto, Compass, eXp and hundreds more
- Broker IDX sites across the metro
- Mobile apps for all of the above

A flat-fee MLS listing and a traditional 6% listing feed the same pipes.
Buyer-facing portals can't tell the difference and don't show it differently.

## License + brokerage prerequisites

Before we can publish this messaging, the human owner must:

1. **Active Arizona real estate license** (ADRE). The broker-of-record for
   the flat-fee listings must hold an active Arizona salesperson or
   broker license.
2. **Active ARMLS subscription** via the broker of record. This is the
   feed that syndicates.
3. **Broker disclosure** — every listing must name the employing broker
   and include the $400 broker transaction fee as disclosed in the
   Business Model section of STEERING.md.

Don't publish "we syndicate to Zillow" claims until all three are true.
Until then, use forward-looking language ("Once your listing goes live via
our MLS partner...") and require the user to contact us before entering
payment flow. Task 15 (Stripe integration) must not ship before license +
ARMLS are active.

## Approved copy (canonical — use verbatim where possible)

### Homepage hero or /sell landing

**H1 variant A (flat-fee emphasis):**
> Your home on Zillow, Realtor.com, Redfin — for a flat fee.

**H1 variant B (savings emphasis):**
> Same MLS. Same Zillow listing. Flat fee.

**Subhead:**
> List with MesaHomes for $999 + $400 broker fee. Your listing feeds into
> ARMLS — the same feed Zillow, Realtor.com, Redfin, Trulia, and Homes.com
> pull from. Traditional agents charge 5-6% of your sale price for the
> same distribution.

### Savings calculator result card

Add below the "YOU SAVE $X" line:

> Your listing appears on the same portals as traditional agent listings:
> Zillow · Realtor.com · Redfin · Trulia · Homes.com · and the ARMLS
> feed used by every Phoenix metro broker.

### Listing onboarding — Step 4 (pricing recommendation, before payment)

> **What you get when you list:**
> - Full MLS listing via ARMLS (our broker of record)
> - Automatic syndication to Zillow, Realtor.com, Redfin, Trulia,
>   Homes.com, and hundreds of other portals
> - Professional listing description (compliance-filtered, Fair Housing
>   verified)
> - Property photos uploaded by you (we supply a shot list)
> - Listing stays active until sold or you cancel
> - Listing removed within 24 hours of closing

### FAQ (add to the seller FAQ and the /compare page)

**Q: Does my flat-fee listing show up on Zillow and Realtor.com?**
A: Yes. When your listing goes live on ARMLS (Arizona Regional MLS)
through our broker of record, it's syndicated to Zillow, Realtor.com,
Redfin, Trulia, Homes.com, and hundreds of other portals automatically.
Buyers browsing those sites see your home exactly the same way they'd see
a home listed by a 6%-commission agent. The MLS feed is the distribution;
the commission is separate.

**Q: What's the difference between listing with you and listing with a
full-service agent?**
A: The MLS listing itself is identical — same portals, same exposure,
same photos, same remarks. The difference is service level. A full-service
agent handles pricing strategy, showings, negotiations, contract drafting,
inspection coordination, and closing. Our flat-fee listing handles the
MLS entry and syndication. If you want an agent to run the full
transaction, our Full Service Upgrade is available on every page.

**Q: Do I lose Zillow exposure by going flat-fee?**
A: No. Zillow doesn't distinguish between flat-fee and full-commission
listings. They pull the ARMLS feed and display whatever's in it. Your
home gets the same photo carousel, the same "X days on Zillow" counter,
the same search ranking.

**Q: Can I cancel my listing if it doesn't sell?**
A: Yes. You can cancel or relist at any time with no penalty. The
$999 flat fee is non-refundable once the listing is live, but you aren't
locked in.

**Q: Who is the broker of record?**
A: {brokerOfRecordName}, Arizona license #{brokerLicenseNumber},
employing broker for all MesaHomes flat-fee transactions. The $400 broker
transaction fee covers compliance, document handling, and MLS entry.

### Flat Fee vs Traditional comparison page

Add a row to the existing comparison table:

| Feature | Flat-Fee MesaHomes | Traditional Agent |
|---------|-------------------|-------------------|
| ... existing rows ... | | |
| MLS listing (ARMLS) | ✓ | ✓ |
| Zillow, Realtor.com, Redfin, Trulia, Homes.com syndication | ✓ | ✓ |
| Listing stays active until sold or cancelled | ✓ | Usually 3-6 month contract |
| Total cost on $450,000 sale | $1,399 | $27,000 (6%) |
| YOU KEEP | $448,601 | $423,000 |

### Listing success stories / reviews page

Pattern: name dropped, location, sale price, days to contract, "listed
via MesaHomes flat fee, syndicated to [portals]." Validates the claim.

## Claims we can make vs cannot make

### Can make (true once license + ARMLS active)

- "Your listing appears on Zillow, Realtor.com, Redfin, Trulia, Homes.com"
- "Same MLS exposure as a full-commission listing"
- "Hundreds of partner portals receive the feed"
- "Arizona licensed broker of record" (once {brokerOfRecordName} is active)

### Cannot make — don't write these

- "Better visibility than other brokers" — unsupported
- "Guaranteed sale" — illegal
- "Zillow partners with us" — Zillow is a MLS data consumer, not a
  partner; it's the syndication chain that carries the listing
- "Featured listing" unless we pay for a specific portal's paid placement
- "Premier listing" — same issue
- Anything implying MesaHomes has special access to Zillow beyond what
  any MLS member gets

## Compliance gates before this copy goes live

In order:

1. Owner confirms Arizona real estate license is active (ADRE renewal
   complete).
2. Broker of record identified, named, and confirmed. Their ARMLS
   subscription verified.
3. {brokerOfRecordName} and {brokerLicenseNumber} filled into all copy
   via environment config, not hardcoded.
4. Legal language reviewed by the owner's compliance counsel (or at
   minimum, counsel-on-retainer per STEERING.md content-strategy section).
5. Stripe payment flow (Task 15) gated — users can START onboarding but
   cannot complete payment until the prerequisites above are confirmed.
6. Listing-service Lambda (`lambdas/listing-service/index.ts`) already
   has a status field — add status `awaiting-broker-activation` so
   listings can be drafted pre-launch and flipped to `payment-pending`
   only after compliance sign-off.

## Implementation checklist for Kiro B

- [ ] Create `lib/brokerage.ts` exporting `BROKER_OF_RECORD` constant
      (reads from `process.env['BROKER_OF_RECORD_NAME']`,
      `BROKER_OF_RECORD_LICENSE`, `BROKER_OF_RECORD_ARMLS_ID`). Fails
      loudly if env vars are missing at Lambda cold start.
- [ ] Add `PORTAL_LIST` constant to `lib/brokerage.ts` — the canonical
      list of syndication destinations we claim (Zillow, Realtor.com,
      Redfin, Trulia, Homes.com). Import from this, don't hardcode in
      copy.
- [ ] Homepage hero H1 + subhead use the approved copy.
- [ ] SavingsCalculator result card appends the portal list.
- [ ] Onboarding Step 4 (Task 15.1) uses the "What you get when you list"
      bullet list.
- [ ] /sell, /compare, and /listing/start pages include the four FAQ
      items.
- [ ] /compare table row added.
- [ ] ListingStatus enum gains `awaiting-broker-activation`.
- [ ] Stripe payment endpoint checks an env flag `LISTINGS_PAYMENT_ENABLED`
      — if false, returns 503 with a helpful message. Default false
      until owner flips it.
- [ ] Post-license activation: owner flips the env flag in the Lambda
      config, not via code deploy.

## SEO implications (cross-reference seo-architecture.md)

Query "flat fee MLS Arizona Zillow" and "does flat fee listing show on
Zillow" — real searches with low commercial competition. Write a blog
post once license is active: "Flat-Fee Listings and Zillow: What Every
Arizona Seller Should Know" as a keyword-targeted SEO anchor, with
`Article` JSON-LD and internal links to the /compare page.

## Reminder: this is sellable only once license is active

Drafting this copy now so everything is ready to flip on. Do not publish
to production until the human owner confirms ADRE license + ARMLS +
broker-of-record are all active. Until then, the `/listing/start` flow
shows a "Coming soon — full service consultation available now" state
wired to the Full Service Upgrade lead capture.
