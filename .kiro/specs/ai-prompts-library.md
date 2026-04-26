# AI Prompts Library + Content Standards

Author: Kiro A, 2026-04-24. Status: spec — ready for Kiro B to use while
building Task 11-12 pages. Updated whenever we add a new generator.

## Purpose

Every AI-generated string MesaHomes ships — listing description, offer draft,
blog explainer, "what this means for you" tool summary, city page intro —
goes through a prompt in this library. One prompt, one output format, one
compliance gate. No ad-hoc prompts scattered across Lambdas.

Runs on the local RTX 4090 via Hydra MCP by default. Falls back to Amazon
Bedrock (Claude 3.5 Sonnet) only when Hydra is unreachable — same prompt
either way.

---

## Core principles (apply to every prompt)

1. **Facts in, facts out.** Prompt provides only verified property/market
   data. Model does NOT invent square footage, year built, school ratings,
   or anything verifiable.
2. **Fair Housing Act compliance is a hard gate, not a request.** Prompt
   lists prohibited phrases explicitly; post-generation `compliance-filter.ts`
   hard-blocks violations. Seven protected classes: race, color, religion,
   national origin, sex (incl. gender identity + sexual orientation per HUD
   2021 guidance), familial status, disability.
3. **Structured output required.** JSON only, schema-validated. No prose
   wrappers. If the task is a listing description, output is
   `{"description": "...", "keyFeatures": ["..."]}` not a paragraph.
4. **Citations for regulatory/market claims.** If the prompt references a
   statistic or rule, it includes the source URL and the model MUST echo it
   in output `sources: [...]`.
5. **Temperature low (0.2-0.4).** Creativity is a failure mode in this
   domain. Reuse patterns, don't innovate.
6. **Max tokens bounded per use case** (see table below). A listing
   description is 120-180 words, not 500.
7. **Negative prompting up front.** Tell the model what NOT to do — often
   more effective than saying what to do. See "Banned Phrases" section.

### Token budgets per use case

| Use case | Input tokens | Output max | Temperature |
|----------|-------------:|-----------:|------------:|
| Listing description | ~400 | 300 | 0.3 |
| Offer draft | ~600 | 500 | 0.2 |
| "What this means" tool summary | ~200 | 150 | 0.3 |
| City page intro (2 paragraphs) | ~500 | 400 | 0.4 |
| Blog explainer (reg change) | ~800 | 800 | 0.4 |
| Neighborhood blurb | ~300 | 200 | 0.4 |

---

## Banned Phrases (Fair Housing-compliant listings)

The model is explicitly told NOT to use these. If any slip through,
`compliance-filter.ts` rejects the output.

**Familial status violations:**
- "perfect for singles" / "suitable for young couple" / "no children"
- "adult community" (unless legally qualifying 55+)
- "mother-in-law suite" → use "in-law suite" or "accessory dwelling"
- "master bedroom" → use "primary bedroom" (industry convention post-2020)
- "bachelor pad" / "family-oriented"

**Disability violations:**
- "walking distance" → use "X minutes on foot" or distance in miles
- "able-bodied preferred"
- "no wheelchairs"

**Race/color/national origin violations:**
- Any ethnic neighborhood name used as a selection criterion
- "exclusive neighborhood" (can imply segregation)
- "private community" (careful — fine for gated, not fine as steering)
- "prestigious" paired with area name (can be steering code)
- References to specific religious institutions as selling points
  ("near St. Peter's") — mention neutrally: "near a church, Costco, and I-60"

**Weasel words that don't add value (skip even if legal):**
- "nestled" / "boasts" / "stunning" / "must see" / "won't last"
- "priced to sell" (implies distress)
- "needs TLC" → use specifics: "original kitchen", "roof replaced 2019"
- "cozy" (code for small) → give sqft
- "motivated seller" → drop entirely

**Required replacements:**
- Never describe people the property is "for"; describe the property
- Never claim school quality; state school district name + elementary/middle/high boundaries (factual)
- Never promise views/sunlight duration; state orientation ("south-facing patio")

---

## What buyers actually want in a listing description (2026 evidence)

From NAR + Saleswise + Placester + Realtor.com + Zillow research:

- **First two lines decide everything.** Buyer has seen photos + price +
  specs. Description must differentiate in a sentence.
- **Specifics beat adjectives.** "Quartz counters, gas range, 2022 roof"
  beats "stunning updated kitchen."
- **Lifestyle framing sells faster.** 2026 NAR study: evocative lifestyle
  phrasing (e.g., "chef's kitchen", "private backyard oasis") sold 32%
  faster than generic-fact write-ups. Balance specifics WITH a single
  lifestyle sentence, not flowery overload.
- **Address what photos can't show.** Layout flow, HOA fees, recent repairs,
  renovation receipts, mechanicals (HVAC age, water heater age, roof age).
- **End with a concrete next step.** Not "don't miss" — use "Schedule a
  private showing" or "Tour Saturday 10am-noon."

### Length — what MLS systems and buyers actually allow

- **Zillow and ARMLS hard cap: ~250 words.** Longer gets truncated in
  portal displays.
- **Buyer engagement drops sharply past ~200 words.** Skim behavior:
  most users read the first 3 sentences and the bulleted features.
- **Our sweet spot: 120-180 words.** Tight enough to stay above the
  "read more" fold on mobile, long enough to carry 3-5 concrete features
  plus a lifestyle sentence. If a listing truly needs 200-250, the
  extra 70 words should be specific mechanical/renovation detail,
  not adjectives.

### Words that measurably move sale price (Zillow research + 2026 data)

Not "make the buyer happy" — words with statistical correlation to
higher-than-expected sale prices when present in MLS descriptions
(after controlling for property value). Safe to use; recommend.

**Feature-driven premiums (from Zillow 2026 Home Features Report — actual
sale-price lift):**

| Feature mentioned | Price lift vs expected |
|-------------------|-----------------------|
| Dock | +5.4% |
| Outdoor kitchen | +4.4% |
| Outdoor shower | +4.3% |
| "Cottage" (style term) | +3.2% |
| Outdoor fireplace | +2.8% |
| Pergola | +2.2% (sells 3 days faster too) |

**Descriptive words with price-lift correlation** (Zillow Talk research,
still holds per 2026 confirmations): "luxurious", "captivating",
"landscaped", "updated", "upgraded", "renovated", "custom", "granite",
"quartz", "stainless steel".

**Rule for our prompt:** the model should use feature-premium words
when they're TRUE (home actually has a dock, pergola, etc.) and never
invent them. When describing genuinely high-end finishes, prefer
"renovated" or "updated" over "stunning" or "must see."

Update the listing-description prompt's OUTPUT REQUIREMENTS to add:

> If the property facts include any of: dock, outdoor kitchen, outdoor
> shower, outdoor fireplace, pergola, or renovated/updated kitchen
> or bath — mention the feature by name in the first or second sentence.
> These features carry buyer-engagement premiums when explicitly cited.

---

## The canonical listing-description prompt

Copy this exactly. Every field marked `{...}` is filled by the caller from
validated property data. No other fields allowed. Model output MUST be JSON.

```
You are writing an MLS-compliant residential property description for a
licensed flat-fee brokerage in Mesa, Arizona (MesaHomes).

PROPERTY FACTS (do NOT invent beyond these):
  Address:               {address}
  Bedrooms:              {bedrooms}
  Bathrooms:             {bathrooms}
  Sq ft (living area):   {sqft}
  Lot size:              {lotSizeText}
  Year built:            {yearBuilt}
  HOA fees:              {hoaText}
  Subdivision:           {subdivision}
  School district:       {schoolDistrict}
  Known features:        {featuresList}
  Recent upgrades:       {upgradesList}
  Mechanicals notes:     {mechanicalsText}
  Orientation:           {orientationText}

MARKET CONTEXT:
  ZIP median home value (county-verified): {zipZhvi}
  Days on market (metro):                  {metroDom}

OUTPUT REQUIREMENTS:
- 120-180 words, plain English, no HTML.
- Open with ONE strong differentiator sentence using the property's
  most specific feature. No "nestled", "boasts", "stunning".
- Middle: 3-5 concrete features with specifics (materials, years, sqft).
  One lifestyle sentence allowed if the feature supports it.
- End with ONE clear next step: "Schedule a showing" or similar.
- Use "primary bedroom", not "master bedroom".
- Never describe people the property is "for".
- Never claim school quality; state district name only.
- Never reference religion, ethnicity, age-preference, or family status.

BANNED PHRASES (do NOT use any): nestled, boasts, stunning, must see,
won't last, priced to sell, needs TLC, cozy, motivated seller, perfect
for [anyone], suitable for [anyone], bachelor pad, family-oriented,
adult community, walking distance, mother-in-law suite, master bedroom,
exclusive, prestigious.

OUTPUT FORMAT (JSON, nothing else):
{
  "description": "<120-180 word plain-text listing description>",
  "headline": "<6-10 word listing headline>",
  "keyFeatures": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>", "<feature 5>"],
  "warnings": ["<any facts I could not include because they were missing>"]
}
```

**Caller validation after model returns:**
1. Parse JSON. If invalid → regenerate once, then fail closed.
2. Check `description` word count is 100-200. Reject if outside.
3. Run `compliance-filter.ts`. Reject on any flag.
4. Check `description` does not contain any BANNED PHRASES string-match.
5. Check that `bedrooms` and `bathrooms` counts from input appear somewhere
   in the description (simple integrity test — they should be mentioned).

---

## Offer-draft prompt

```
You are drafting a residential purchase offer for a buyer represented by
MesaHomes (flat-fee brokerage in Mesa, Arizona). This is an EDUCATIONAL
DRAFT, not legal advice, and will be reviewed by a licensed Arizona agent
or attorney before submission.

OFFER INPUTS (do not invent beyond these):
  Property address:     {propertyAddress}
  Offered price:        ${offeredPrice}
  Earnest money:        ${earnestMoney}
  Financing type:       {financingType}    # Cash | Conventional | FHA | VA
  Contingencies:        {contingenciesList}  # inspection, appraisal, financing, sale-of-home
  Requested closing:    {closingDate}
  Buyer name(s):        {buyerNames}
  Buyer-agent compensation: {buyerAgentCompText}
  Seller concessions requested: ${sellerConcessions}
  Additional terms:     {additionalTerms}

ARIZONA-SPECIFIC REQUIREMENTS:
- This is an Arizona Association of REALTORS (AAR) Residential Resale
  Purchase Contract context. Use AAR form section names when referencing
  sections (e.g., "Section 3a — Earnest Money", "Section 6 — Financing").
- Include the SPDS (Seller Property Disclosure Statement) and BINSR
  (Buyer's Inspection Notice Seller's Response) process references.
- Reference the buyer-broker agreement per NAR settlement practice
  changes effective Aug 17, 2024.

OUTPUT REQUIREMENTS:
- Tone: professional, precise, never advisory.
- No legal advice verbs ("you should", "you must"). Instead: "The AAR
  contract section 3a governs earnest money handling."
- Include legal disclaimer as first line of draftBody.
- End with a Full Service Upgrade CTA.

OUTPUT FORMAT (JSON, nothing else):
{
  "previewTerms": {
    "offeredPrice": "{offeredPrice}",
    "earnestMoney": "{earnestMoney}",
    "financing": "{financingType}",
    "contingencies": [{contingenciesList}],
    "closingDate": "{closingDate}"
  },
  "draftBody": "<educational offer draft text, starts with disclaimer>",
  "disclaimer": "This is an educational draft, not legal advice. Have a licensed Arizona agent or attorney review before submission.",
  "fullServiceCta": "Want a licensed agent to handle this offer end-to-end? Upgrade to full service.",
  "sources": ["https://www.aaronline.com/manage-risk/sample-forms/"]
}
```

---

## "What this means for you" prompt (tool result summary)

Used after every tool (net-sheet, affordability, sell-now-or-wait). Adds a
plain-English interpretation the guided decision engine can show.

```
You are interpreting a real estate tool result for a MesaHomes user in
Mesa, Arizona. Keep it plain, grounded, and actionable.

TOOL: {toolName}
USER INPUTS: {userInputsJson}
TOOL OUTPUT: {toolOutputJson}
MARKET CONTEXT: {marketContextJson}

OUTPUT REQUIREMENTS:
- 2-4 sentences, first person ("Your estimate...").
- Ground every claim in the inputs or outputs above. No new numbers.
- End with ONE specific next action the user can take on MesaHomes
  (name a tool or page).
- Never give legal, tax, or financial advice.
- Never reference the user's age, family status, or demographics.

OUTPUT FORMAT (JSON, nothing else):
{
  "summary": "<2-4 sentences>",
  "nextAction": {
    "label": "<short CTA text>",
    "href": "<MesaHomes relative path>"
  },
  "confidence": "high" | "medium" | "low"   # based on data completeness
}
```

---

## City page intro prompt

Generates the opening ~200 words of a city page (Mesa, Gilbert, Chandler,
Queen Creek, San Tan Valley, Apache Junction). Facts only.

```
You are writing the opening two paragraphs of a city page for MesaHomes
about {cityName}, Arizona.

VERIFIED FACTS (use only these, do not invent):
  Population:              {population}
  Median home value (ZHVI): ${medianHomeValue}
  Days on market (metro):   {metroDom}
  ZIP codes:                {zipCodesList}
  School district(s):       {schoolDistrictsList}
  Notable features:         {notableFeaturesList}
  Distance to Phoenix:      {distanceToPhoenixText}

OUTPUT REQUIREMENTS:
- Two paragraphs, ~200 words total.
- Paragraph 1: market position in two sentences, then a differentiating
  local fact.
- Paragraph 2: who tends to buy here based on objective factors (price
  range, lot sizes, new construction mix). Never describe demographics.
- End with: "See {cityName} listings →" (internal link placeholder).
- No "nestled", "boasts", "stunning", "perfect for".

OUTPUT FORMAT (JSON, nothing else):
{
  "intro": "<~200 words, two paragraphs separated by \\n\\n>",
  "metaTitle": "<title up to 60 chars>",
  "metaDescription": "<description up to 155 chars>",
  "h1": "<H1 text for the page>"
}
```

---

## Regulatory change explainer prompt (Phase 1B)

Used by the `content-drafter` Lambda described in
`.kiro/specs/phase-1b-content-automation.md`. Takes one new regulatory
item and drafts a blog post.

```
You are a Mesa, Arizona real estate content writer. A new regulatory item
was published. Write a 300-600 word plain-English explainer for
{audienceBucket} readers.

ITEM:
  Title:         {itemTitle}
  Published:     {itemPublishedAt}
  Body excerpt:  {itemBodyExcerpt}
  Primary URL:   {itemPrimaryUrl}
  Source:        {sourceName}
  Bucket:        {audienceBucket}  # consumer-transaction | agent-practice | finance-mortgage | hoa-community | local-zoning

OUTPUT REQUIREMENTS:
- 300-600 words.
- Open with ONE sentence: what changed.
- Middle: what it means for MesaHomes readers in Mesa metro specifically.
- End with ONE concrete "What to do next" with a MesaHomes CTA.
- Include at least one quoted phrase or section reference from the source.
- Footer: "Educational only, not legal advice."
- Cite {itemPrimaryUrl} at the end.
- Never give specific legal advice, no "you should/must" — use "The rule
  states..." or "The agency provides...".
- Never reference protected classes discriminatorily.

OUTPUT FORMAT (JSON, nothing else):
{
  "slug": "<kebab-case slug, 40 chars max>",
  "title": "<SEO title up to 60 chars>",
  "metaDescription": "<up to 155 chars>",
  "bodyMarkdown": "<300-600 word explainer>",
  "tags": ["<tag1>", "<tag2>"],
  "bucket": "{audienceBucket}",
  "primarySourceUrl": "{itemPrimaryUrl}",
  "disclaimer": "Educational only, not legal advice."
}
```

---

## Data sources agents actually use (including Cromford)

Most Phoenix-area agents anchor their pitch on **The Cromford Report**. If
our data doesn't match up, we look amateur. Here's what they pull and what
we can credibly replicate or beat.

### The Cromford Report — what it actually does

Source: cromfordreport.com — paid subscription, ~$40/mo, used by most AZ
agents. Covers Greater Phoenix residential resale only (single-family,
condos, townhomes — not new build, not land). Published daily.

**Data source:** ARMLS (Arizona Regional Multiple Listing Service) — the
MLS covering Phoenix, Scottsdale, Mesa, Chandler, Tempe, Glendale, etc.
Cromford pulls raw ARMLS feed and computes derived metrics.

**Key metrics they publish** (what we should be fluent in when talking
to agents):

| Metric | What it means | Our equivalent |
|--------|---------------|----------------|
| Active listings | Count of homes currently for sale | Not in MVP (no MLS feed) |
| Days on Market — Sales | Median days from list to close | Zillow metro metric we already ingest |
| Average Sales Price per Sq Ft | $/sqft trend | Derivable from county comps |
| Monthly Average by City / ZIP | Median price by geography | We have (ZHVI by ZIP) |
| Contract Ratio | (under-contract + pending) / active — measures demand | Not in MVP |
| Days Inventory | Inventory / daily sales rate | Proxy via metro inventory we ingest |
| Months of Supply | Active / monthly sales | Same |
| List Price vs Sales Price | Negotiation leverage indicator | Zillow sale-to-list ratio we ingest |
| Listing Success Rate | % of listings that close vs expire/cancel | Not in MVP |
| Foreclosures — Notices of Trustee Sale | Distressed pipeline | From Maricopa recorder (we can poll) |
| Trustee Deeds | Completed foreclosures | From recorder |
| New Contracts vs Closed | Pace comparison | Not in MVP |
| Cromford® Market Index (CMI) | Proprietary heat index 0-400+, 100 = balanced, >110 seller, <90 buyer | We have our own (Zillow-aligned 0-100 heat index) |

**What agents quote daily from Cromford:**
- "CMI is at [X], up [Y] from last month" — their flagship number
- Contract Ratio by city — who has demand
- Months of Supply by price band (0-250K, 250-500K, 500-1M, 1M+)
- List-to-sales ratio trend

### What we can credibly cover without ARMLS subscription

From our existing pipeline:

1. **ZIP-level ZHVI + trend + 6-mo change** — we already have (Zillow
   Research CSVs, ingested monthly).
2. **Metro-level Days on Market, sale-to-list, inventory, price cuts %,
   median sale price** — we already have.
3. **County assessor comps (sold parcels)** — we already have, unique vs
   Cromford since our data comes from Pinal + Maricopa direct. Cromford
   does NOT have non-ARMLS sales.
4. **Our own Market Heat Index (0-100, Zillow-aligned)** — shipped in
   `lib/market-signals.ts`. Different methodology than CMI but
   industry-recognized scale.
5. **Foreclosure activity** — pollable from Maricopa + Pinal recorder
   feeds (see `content-sources.md` appendix). Cromford has this; we can
   too.
6. **Regulatory context** — full Phase 1B regulatory tracker is genuinely
   differentiated. Cromford does not cover this.

### What we cannot replicate without ARMLS

- Active listing count / under-contract count — ARMLS MLS-only.
- Listing Success Rate — needs MLS.
- New Contracts (pending) by day — needs MLS feed.
- Price-band segmentation of supply — needs MLS property-level data.

### Recommendation

Position ourselves as **complementary to Cromford, not replacement**:
- Pitch line: "Cromford for the pulse of the MLS — MesaHomes for
  county-verified sale data, regulatory change tracking, and Mesa-specific
  flat-fee economics."
- Cross-reference: on our `/tools/sell-now-or-wait` output, add a note
  "Cromford's CMI is the industry benchmark for MLS-based heat. Our
  index uses county + Zillow data for ZIP-level specificity."
- ARMLS-derived metrics for agents (if we want to reach them): pay the
  ~$40/mo Cromford subscription and cite it manually in dashboard
  performance views. Don't rebuild.

---

## Local AI (Hydra MCP) vs Bedrock decision

### Default: Hydra MCP (local RTX 4090)

- Zero per-request cost.
- Zero PII leaves our network.
- qwen3:14b recommended per STEERING.md — reliable tool use + JSON output
  at 16K context.
- Latency ~3-8s for a listing description.
- Kill switch: `~/.hydra/STOP` halts all inference.

### Fallback: Amazon Bedrock (Claude 3.5 Sonnet)

Only when Hydra is unreachable OR load exceeds local capacity.

- Model: `anthropic.claude-3-5-sonnet-20240620-v1:0` (or newer).
- Use Bedrock **Structured Output** feature (schema-compliant JSON
  enforced at API level — no retry logic needed).
- Region: us-west-2 (matches MesaHomes stack).
- Cost estimate: listing desc ~$0.003, offer draft ~$0.005, explainer
  ~$0.01. Budget cap: $10/month initial, alarm at $8.
- Use Bedrock Prompt Management to store prompts — they're versioned and
  overridable without code deploys.

### Same prompt, both backends

Both implementations accept the exact same prompt template from this
library. The only per-backend difference is the API call wrapper:
- Hydra: MCP tool call over WebSocket, local
- Bedrock: `InvokeModel` with `anthropic_version` + structured output schema

This lets us A/B quality between models without changing any prompt.

---

## Implementation: where the prompts live

```
lib/ai-prompts/
  listing-description.ts    → exports LISTING_PROMPT, validateListing()
  offer-draft.ts            → exports OFFER_PROMPT, validateOffer()
  tool-summary.ts           → exports SUMMARY_PROMPT, validateSummary()
  city-intro.ts             → exports CITY_INTRO_PROMPT, validateCityIntro()
  reg-explainer.ts          → exports REG_EXPLAINER_PROMPT, validateExplainer()
  banned-phrases.ts         → shared BANNED_PHRASES regex + check()
  schemas.ts                → JSON schemas for each output
```

Every prompt module exports two things:
1. `<NAME>_PROMPT` — string with `{placeholders}` matching the input type
2. `validate<Name>(raw: string): Result<TypedOutput, ValidationError[]>` — 
   JSON.parse + schema check + banned-phrases check + input-echo check

Callers (Lambdas, drafters) use only these two. Never inline a prompt.

Tests:
- Each prompt module has a property test: random valid inputs always produce
  a prompt that is under its input-token budget.
- Each validator has a unit test covering: valid JSON passes, invalid JSON
  fails, banned phrase fails, word-count out of range fails, missing
  required field fails.

---

## Task list for Kiro B (copy into tasks.md under new section)

When Kiro B picks this up:

- [ ] `lib/ai-prompts/banned-phrases.ts` with the BANNED_PHRASES list
      from this doc, exported as `readonly string[]` and a `checkBanned()` helper.
- [ ] `lib/ai-prompts/schemas.ts` with JSON Schemas for each output shape.
- [ ] `lib/ai-prompts/listing-description.ts` — prompt + validator + tests.
- [ ] `lib/ai-prompts/offer-draft.ts` — prompt + validator + tests.
- [ ] `lib/ai-prompts/tool-summary.ts` — prompt + validator + tests.
- [ ] `lib/ai-prompts/city-intro.ts` — prompt + validator + tests.
- [ ] `lib/ai-prompts/reg-explainer.ts` — prompt + validator + tests.
- [ ] `lib/ai-client.ts` — unified backend wrapper with Hydra-first,
      Bedrock-fallback behavior.
- [ ] Update `lambdas/ai-proxy/index.ts` to import the prompt library
      instead of building prompts inline.
- [ ] Integration test: feed 10 realistic property records through the
      listing-description pipeline end-to-end, assert compliance passes
      on all 10 and each output references the correct bed/bath count.

---

## References

- NAR 2026 listing description study (32% faster sales with lifestyle phrasing) — cited via Saleswise.ai 2026 blog
- Realtor.com listing description do's and don'ts: https://www.realtor.com/marketing/resources/the-dos-and-donts-of-writing-real-estate-listing-descriptions-that-actually-convert/
- Fair Housing banned words (Greater Boston Real Estate Board): https://www.gbreb.com/GBAR/Sites/GBAR/News/Agent_Insider/2022/Dont_Violate_Fair_Housing_15_Words_to_Ban_From_Property_Descriptions.aspx
- HUD 2024 AI Fair Housing guidance (PR-24-098) — referenced in `content-sources.md`
- AWS Bedrock Structured Outputs: https://aws.amazon.com/blogs/machine-learning/structured-outputs-on-amazon-bedrock-schema-compliant-ai-responses/
- AWS Bedrock Prompt Management: https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management-create.html
- Negative prompting for real estate AI: https://aiacceleration.ai/blog/negative-prompts-ai-real-estate
- The Cromford Report: https://cromfordreport.com/
- ARMLS coverage: https://showcaseidx.com/mls-coverage/arizona-regional-multiple-listing-service-armls/
