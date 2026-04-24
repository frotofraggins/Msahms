# Mortgage Cost Transparency — Messaging Spec

Author: Kiro A, 2026-04-24. Status: spec — copy + content strategy for the
affordability tool, buyer pages, and a dedicated blog post.

## Terminology fix first

"Lender commission" isn't the right term — no one in lending uses it. What
buyers pay a lender is really four separable things:

| Line item | 2026 typical range | Who it goes to | Notes |
|-----------|-------------------|----------------|-------|
| Loan Originator (LO) compensation | 1-2% of loan amount | Loan officer (paid by lender, not borrower directly) | Regulated by CFPB LO Comp Rule. Can't double-dip. |
| Origination fee | 0.5-1.5% of loan amount | Lender (on your Loan Estimate) | Covers processing/underwriting |
| Discount points (optional) | 0-2 points | Lender (buys down rate) | Each point = 1% of loan |
| Third-party closing fees | $1,500-$4,000 flat | Appraiser, title, recorder, credit | Lender coordinates, doesn't keep |

**The "3%" number sellers hear** is typically the all-in borrower-paid
lender cost (origination + points + underwriting + app fees) on conventional
loans. It IS real, it IS often negotiable, and it IS underdiscussed.

Total closing costs (everything — lender + title + taxes + prepaids) run
2-5% of loan amount in 2026, per multiple industry sources. Lender share of
that is 1-3%. Title/escrow is 1-2%. The rest is prepaids + taxes.

## Do flat-fee lenders exist?

Not exactly, but several lenders functionally approximate one:

| Lender | What they do | Catch |
|--------|--------------|-------|
| Better Mortgage | No application, origination, or underwriting fees | Fully self-service, limited hand-holding, no commission-paid LOs |
| Alliant Credit Union | No application fee | Members only, slower process |
| Navy Federal Credit Union | Waives 1% origination fee in exchange for +0.25% rate | Military-affiliated membership |
| Rocket (ONE+ program) | 1% down, no PMI | First-time buyer only, product-specific |
| Most credit unions | Lower origination than retail banks | Regional |

**Key insight for our content:** Better Mortgage publishes a price-match
guarantee — they'll match any competitor's Loan Estimate or credit $100
at closing. That's the closest thing to a flat-fee commitment in the
mainstream market.

Truly flat-fee (as in "here's our $X, no percentage tier") is mostly in
broker channels — independent mortgage brokers who quote a fee upfront.
Yield Spread Premium used to work this way but is tightly regulated now.

## The message MesaHomes should push

**The seller paid us a flat fee to list. Why are you paying a percentage
to borrow? Your lender costs are negotiable too — here's the real
breakdown most agents won't show you.**

This pairs perfectly with the flat-fee listing story. Same philosophy
(transparent, itemized, not percentage-tiered) applied to the other half
of the transaction.

We're NOT a lender. We're NOT giving financial advice. What we are is
the only local site that explains the numbers honestly.

## Concrete content to ship

### 1. Affordability tool addition

After the existing output (max purchase price, monthly payment, DTI),
add a new section:

**Estimated lender costs on your loan**
Based on a $X loan amount:
- Loan origination (0.5-1.5%): $Y - $Z
- Third-party fees (appraisal, title, credit): ~$2,500
- Total lender + title costs: $A - $B (~2-4% of loan)

Plus a "Shop at least 3 lenders" callout with a link to a new guide page.

### 2. New page: `/buy/shopping-lenders`

Short guide (~600 words) covering:

- What shows up on a Loan Estimate (required by CFPB)
- Origination + discount points explained with plain examples
- Three-day rule: once you have a Loan Estimate, you have 10 days to
  accept before pricing can change (Regulation Z / TRID)
- How to compare lenders apples-to-apples
- No-origination-fee lenders (Better, Alliant, Navy Federal for eligible
  members, Rocket ONE+)
- The rate-vs-fees trade-off (buying down rate = higher upfront, lower
  monthly)
- Arizona-specific down payment assistance (cross-link)

CTA at the bottom: affordability calculator, buyer consultation.

### 3. New page: `/buy/lender-costs-explained`

Long-form explainer (~1,200 words) targeting the search "mortgage
closing costs Arizona" and "lender fees explained." Structured for SEO:

- Title: "What Your Lender Actually Charges: A Plain-English Breakdown"
- H1: "Mortgage Lender Costs Explained (Arizona, 2026)"
- Sections: LO compensation, origination fee, discount points, third-party
  fees, prepaids, negotiation tips
- Schema.org Article + FAQPage
- Internal links to affordability, offer writer, first-time buyer guide

### 4. Blog post: "Flat-Fee Lenders: Do They Exist?"

Ties our flat-fee listing story to lender transparency. Honest answer:
no true flat-fee lenders exist in Arizona retail, but Better Mortgage
and select credit unions come close. Cite specifics.

### 5. FAQ additions on /buy page

- **Q: What does it actually cost to get a mortgage in Arizona?**
  A: Expect 2-5% of your loan amount in total closing costs. Your
  lender's share (origination, underwriting, app fee) is typically
  0.5-1.5% — negotiable. Third-party fees (appraisal, title, credit
  report) are another ~$2,500 flat. Prepaid taxes and insurance add the
  rest. We break it down in detail in our [lender costs explainer].

- **Q: Does MesaHomes work with specific lenders?**
  A: We're not a lender and we don't accept referral fees from lenders
  (that would violate RESPA Section 8). We recommend shopping at least
  three Loan Estimates. Lenders like Better Mortgage waive origination
  fees; credit unions like Alliant and Navy Federal often have lower
  costs for eligible members. Shop on the Loan Estimate, not the ad.

- **Q: What's a "flat-fee lender"?**
  A: No mainstream Arizona lender advertises as pure flat-fee, but
  several come close. Better Mortgage typically charges no origination
  fee on conventional loans. Some mortgage brokers quote a flat
  broker fee upfront instead of a percentage. The important thing is
  that lender fees are always negotiable and always disclosed on the
  Loan Estimate.

## Legal guardrails

Critical — we can get in trouble if we're sloppy here:

1. **No referral fees from lenders (RESPA Section 8).** We can recommend
   general categories ("credit unions", "online lenders") but cannot
   accept payment for steering users to a specific lender. Our steering
   doc already covers this in the Security/Compliance section.

2. **Not financial advice.** Every page MUST include the disclaimer:
   "Educational only. Consult a licensed mortgage professional for
   advice about your specific situation." Same pattern as our offer
   writer pages.

3. **CFPB LO Compensation Rule awareness.** Don't write anything
   implying consumers can pay loan officers directly outside their
   lender's structure — that's illegal since 2014.

4. **No rate quotes.** Don't display current mortgage rates unless
   we're pulling from a licensed data feed with freshness guarantees.
   Rate shopping is time-sensitive; stale quotes harm buyers and
   create legal exposure.

5. **Arizona-specific disclosure.** Arizona requires mortgage disclosures
   per A.R.S. § 6-901 et seq. We're not originating loans, so this
   doesn't directly apply, but content touching mortgages should not
   make us look like we are.

## SEO target queries (2026 research-backed)

Low-competition, high-intent queries we can rank for:

- "mortgage origination fee Arizona"
- "flat fee mortgage lender"
- "lender fees explained"
- "how much does a mortgage cost"
- "no origination fee lenders Arizona"
- "loan estimate vs closing disclosure"
- "mortgage closing costs Arizona"
- "should I pay discount points"

Every page gets Article + FAQPage JSON-LD per the `seo-architecture.md`
spec. Internal linking: affordability calculator ↔ lender costs pages ↔
first-time buyer guide.

## Implementation checklist for Kiro B

- [ ] `/buy/shopping-lenders` page (static, ~600 words).
- [ ] `/buy/lender-costs-explained` page (static, ~1,200 words).
- [ ] Affordability tool result section "Estimated lender costs" with the
      0.5-1.5% range calculation — server-side, static rendering.
- [ ] 3 FAQ items added to /buy landing.
- [ ] Blog post draft "Flat-Fee Lenders: Do They Exist?" queued in
      content review queue.
- [ ] Internal link pass: affordability result → lender costs; first-time
      buyer guide → shopping-lenders; homepage hero → "You save on the
      agent AND the lender — here's how."
- [ ] Compliance disclaimer on every mortgage-touching page.
- [ ] No rate quotes. No specific lender endorsements beyond factual
      category recommendations (no-origination-fee, credit union, etc.).

## Cross-references

- `.kiro/specs/mls-syndication-messaging.md` — paired differentiator story
  (flat-fee listing side)
- `.kiro/specs/seo-architecture.md` — JSON-LD + Metadata API patterns for
  the new pages
- `.kiro/specs/ai-prompts-library.md` — canonical prompts (use city-intro
  prompt pattern for /buy subpages)
- `.kiro/STEERING.md` — "No kickbacks from lenders" is already in
  security/compliance rules

## References

- CFPB Loan Estimate guide: https://www.consumerfinance.gov/owning-a-home/loan-estimate/
- CFPB LO Compensation Rule: https://www.consumerfinance.gov/rules-policy/regulations/1026/36/
- Better Mortgage fee structure (Askdoss 2026 review): https://askdoss.com/better-mortgage-review/
- Forbes Advisor "no origination fee" lender roundup: https://www.forbes.com/advisor/mortgages-oc/best-mortgage-lenders-no-origination-fee/
- 2026 mortgage origination fee data: https://mortgage-info.com/blog/mortgage-origination-fee-guide-2025
- 2026 closing cost averages: https://mortgage-info.com/blog/mortgage-closing-costs-2026-breakdown-reduce
- RESPA Section 8 (referral fee prohibition): https://www.consumerfinance.gov/compliance/supervisory-highlights/respa-section-8/
