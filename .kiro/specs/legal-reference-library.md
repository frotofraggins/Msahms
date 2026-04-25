# AZ Real Estate Legal Reference — Forms, Statutes, Administrative Code

Author: Kiro A, 2026-04-25. Status: reference spec — sources for every
legal claim, template, or educational content we publish. Updated when
new form releases drop.

## Purpose

Every MesaHomes page that cites a rule, references a contract, or walks
a buyer/seller through a form must trace back to a primary source. This
spec catalogs the sources, their current versions, and where to fetch
them. Agents and AI prompts pull from this — not from web scrapes or
stale notes.

## The owner's existing contracts (parent's house sale)

Located at `/home/nflos/workplace/Msahms/Real estate contracts/` —
kept OUTSIDE the git repo (gitignored per `cee3dad`). Never committed.

### Blank AAR forms we have (reference templates)

| File | AAR revision date | Current 2026 status |
|------|-------------------|---------------------|
| `Exclusive Right to Sell_Rent Listing Contract Legal Language.pdf` | Unknown | Likely superseded — AAR revised form 11/25 |
| `Residential Buyers Inspection Notice and Sellers Response BINSR - AAR.pdf` | Unknown | Check against Feb 2026 AAR release |
| `Residential Seller's Property Disclosure Statement (SPDS) (10_2017).pdf` | **October 2017** | **Outdated — do NOT use as template.** Post-NAR-settlement (Aug 2024) requires updated disclosure language. Get Feb 2026 version. |
| `HOA Condominium Planned Community Addendum (HOA) (06_2020).pdf` | June 2020 | Likely still valid but verify in current AAR list |
| `Market Conditions Advisory (08_2009).pdf` | August 2009 | **Very outdated** — 17 years old, market context entirely different. Do NOT reference. |
| `Real Estate Agency Disclosure and Election Seller (01_2009).pdf` | January 2009 | **Outdated** — pre-NAR-settlement. Agency disclosure rules changed Aug 17, 2024. Get current version. |
| `Wire Fraud Advisory (06_2019).pdf` | June 2019 | Check for update; wire fraud schemes evolve, advisory may have been updated |

### Executed Flournoy transaction documents (owner's PII — reference only)

`Flournoy Disclosures.pdf`, `Flournoy Disclosures V2.pdf`, `SPDS excecuted.pdf`,
`DCA - 2521 S Sabrina*.pdf`, `Commission_Instructions_MHG 2521 S sabrina.pdf`,
`Flournoy Cooling System Service.pdf`, `insurance history.pdf`, `Tax info.pdf`,
`er deposit.pdf`.

**Use only to understand WORKFLOW and STRUCTURE, never to extract text
for display or republication.** These contain family PII.

Useful insights from structure alone:
- How an executed SPDS looks when fully filled out (buyer-facing example)
- How My Home Group handled commission instructions on a real transaction
- How additional disclosure docs (HVAC service record, CLUE insurance
  history, tax info) get attached to the SPDS packet
- How the DCA (Disclosure of Compensation Agreement) interacts with the
  listing — this is the document most affected by NAR settlement changes

### Flexmls / MLS-entry reference docs

| File | What it shows us |
|------|------------------|
| `Add Listing _ flexmls Web.pdf` | Exact fields a listing broker enters into Flexmls (ARMLS interface). Critical for designing our "what we submit on your behalf" transparency page. |
| `MLS input documnet.pdf` | MLS input template |
| `listings.pdf` | Listing output format |
| `Client refuses to sign because they do not want to be solicited.docx` | Edge-case agent note template |

## Where to get CURRENT forms (2026) and statutes

### Primary: AAR (Arizona Association of REALTORS) — official forms

**Canonical index:** `https://www.aaronline.com/manage-risk/sample-forms/`

**Release cadence:** New and revised forms released on February 1,
July 1, and November 1 annually (confirmed from aaronline.com).
November 2025 revision is the latest wave of several forms.

**Form categories:**
- Residential Resale Transaction Forms:
  `https://www.aaronline.com/manage-risk/sample-forms/residential-resale-transaction-forms/`
- Commercial Transaction Forms:
  `https://www.aaronline.com/manage-risk/sample-forms/commercial-transaction-forms/`

**Access:** Members-only download (we'll need this via the partner
broker once the partnership is active). Public page shows form names
and revision dates but PDFs require login.

**Key forms to pull on Day 1 of broker partnership:**
1. Residential Resale Real Estate Purchase Contract (Rev 11/25 likely)
2. SPDS (Seller Property Disclosure Statement) — newest version
3. BINSR (Buyer's Inspection Notice Seller's Response) — newest version
4. Buyer-Broker Exclusive Employment Agreement (post-NAR-settlement)
5. Counter Offer form
6. Additional Clause Addendum (Rev 11/25)
7. HOA/Condominium Planned Community Addendum
8. Agency Disclosure and Election — CURRENT version
9. Market Conditions Advisory — CURRENT version
10. Wire Fraud Advisory — CURRENT version
11. Compensation Disclosure Addendum (new post-NAR-settlement)
12. Limited Service Listing Agreement (LSL) — for flat-fee tier
13. Exclusive Right to Sell Listing — for full-service tier

### Secondary: ADRE (Arizona Department of Real Estate) — law + policy

**Main site:** `https://azre.gov/`

**What ADRE publishes (all free, public):**

| Resource | URL | What it covers |
|----------|-----|----------------|
| Substantive Policy Statements | `https://azre.gov/about/laws-rules-policy-statements-and-advisories/substantive-policy-statements-sps` | ADRE interpretations of statutes — binding guidance. Includes: Teams (2025.03), Advertising, Broker Supervision. |
| Statutes, Rules & Policy Statements main hub | `https://azre.gov/about/laws-rules-policy-statements-and-advisories` | Top-level index |
| Commissioner's Rules (AAC Title 4 Chapter 28) | Via `https://apps.azsos.gov/public_services/CodeTOC.htm` | Arizona Administrative Code — the rules enforced by ADRE |
| ADRE Bulletins (quarterly PDF) | `https://azre.gov/news-events/bulletins` | Latest rule changes, disciplinary trends, enforcement priorities |

**2025 critical item**: ADRE Administrative Code rule revisions went
into effect **December 13, 2025** — shorter reporting deadlines,
expanded disclosure duties, increased broker accountability. Already
flagged in `content-sources.md`. We must verify current forms comply
with the December 2025 revisions.

### Tertiary: Arizona Revised Statutes (the actual state law)

**Canonical source:** `https://www.azleg.gov/arstitle/`

**Titles relevant to real estate:**

| Title | Subject | Why we care |
|-------|---------|-------------|
| Title 32 Chapter 20 | Real Estate, Cemetery and Membership Camping | The foundational broker/salesperson licensing law. Salesperson vs broker distinction (ARS § 32-2155) lives here. |
| Title 33 | Property | Real property law — liens, deeds, easements, recording, HOA (planned community law), eviction |
| Title 41 | State Government | Includes Notary Public law (ARS § 41-270+) |
| Title 44 | Trade and Commerce | Consumer fraud, RESPA-adjacent state law, deceptive acts |
| Title 45 | Waters | Arizona water rights — matters for rural property |

**License status**: Arizona statutes are public domain (Copyright
Clause — US government works). We can quote, paraphrase, reference
freely. Our pages should link to the azleg.gov canonical URL rather
than hosting local copies — the official version stays authoritative.

**Specific sections to cite in our content:**
- ARS § 32-2101 — Definitions (what counts as real estate activity)
- ARS § 32-2155 — Salesperson compensation (the "no direct pay" rule)
- ARS § 32-2171 — Trust accounts (broker-held funds)
- ARS § 32-2181 — Disclosures (seller's duty to disclose)
- ARS § 33-404 — Statutory short-form deeds
- ARS § 33-405 — Beneficiary deeds (estate planning crossover)
- ARS § 33-420 — False claim of interest in real property
- ARS § 33-1801+ — Planned community statutes (HOA rules)
- ARS § 33-1901+ — Condominium statutes
- ARS § 44-1521+ — Consumer Fraud Act

### ADRE Law Book (the classical "all in one" reference)

**Status:** ADRE officially distributes the Real Estate Law Book as a
compendium of excerpts from the Arizona State Constitution, Arizona
Revised Statutes, and Arizona Administrative Code that apply to the
real estate profession. Per ARS § 32-2101, unrestricted online access
on ADRE's site satisfies the statutory requirement — so ADRE no longer
mails physical copies, they publish it online.

**Location (as of 2026):** The most recent PDF copy I can locate is
hosted at `https://www.asreb.com/reg/bklst.php` (Arizona School of Real
Estate & Business bookstore). ADRE's own site indexes the underlying
statutes and rules rather than a single PDF.

**Recommended approach for MesaHomes:**
- DON'T cache/host the Law Book locally (changes frequently; stale
  version is a legal liability)
- DO link to `https://azleg.gov/arstitle/` for statutes and
  `https://apps.azsos.gov/public_services/CodeTOC.htm` Title 4 Ch 28
  for the Commissioner's Rules
- DO monitor ADRE Substantive Policy Statements quarterly for changes
  (already in `content-sources.md` content pipeline)

### Arizona Administrative Code — the "rules" side

The AAC is the regulation side of state authority — what agencies like
ADRE, AZ Dept of Insurance, AZ Dept of Housing, etc. actually enforce.

**Primary:** `https://azsos.gov/rules/arizona-administrative-code`
**Chapter index:** `https://apps.azsos.gov/public_services/CodeTOC.htm`
**RSS for new rulemaking:** `https://azsos.gov/rules/arizona-administrative-register`

Chapters that matter for MesaHomes content:

| Chapter | Subject | Use |
|---------|---------|-----|
| Title 4 Ch 28 | ADRE (real estate licensing) | Licensee conduct rules |
| Title 4 Ch 46 | Real Estate Appraisal Division | Appraiser regulation — reference for home-value tool content |
| Title 9 | AZ Dept of Health Services | Radon, mold disclosure requirements |
| Title 18 | AZ Dept of Environmental Quality | Environmental hazards disclosure |

## Federal + national sources (for cross-state buyers and general content)

| Source | URL | Relevance |
|--------|-----|-----------|
| HUD Fair Housing | `https://www.hud.gov/fairhousing` | Protected classes, discrimination enforcement |
| CFPB TRID / Loan Estimate | `https://www.consumerfinance.gov/owning-a-home/` | Lender cost transparency content |
| FinCEN Residential Real Estate Reporting | `https://www.fincen.gov/news-room` | All-cash purchase reporting rule |
| NAR Settlement Reference | `https://www.nar.realtor/the-facts/nar-settlement` | Aug 17, 2024 commission rule changes |
| IRS Pub 523 (Sale of Home) | `https://www.irs.gov/forms-pubs/about-publication-523` | Tax on home sale content |
| IRS Pub 527 (Residential Rental) | `https://www.irs.gov/forms-pubs/about-publication-527` | Landlord tax content |
| FHFA Loan Limits | `https://www.fhfa.gov/news/news-release/fhfa-announces-conforming-loan-limit-values-for-2026` | Conforming loan limit (2026: $832,750 baseline) |

## What we do NOT need to buy or license

Arizona statutes, AAC rules, ADRE policy statements, federal agency
publications, and court opinions are all public domain or otherwise
free to reference.

Commercial legal treatises like "Arizona Practice V.11 Law of Real
Estate" (Thomson Reuters) or "Arizona Real Estate: A Professional's
Guide to Law and Practice" (AAR's textbook, 3rd ed 2018) are useful for
the owner's own education but NOT needed for content generation —
anything they cite should be cross-checkable against the primary
sources above.

## What content we build from this reference library

### Education pages (public-facing, plain English)

Each page cites primary source URL in footer. Plain-language explainer
up top; direct quote from statute below for credibility.

- `/buy/offer-guidance/purchase-contract` — AAR Residential Resale
  Purchase Contract walkthrough
- `/buy/offer-guidance/spds` — SPDS: what sellers must disclose under
  ARS § 32-2181 and how to read a completed one
- `/buy/offer-guidance/binsr` — inspection → BINSR → response workflow
- `/buy/offer-guidance/buyer-broker-agreement` — post-NAR-settlement
  requirements, effective Aug 17, 2024
- `/buy/offer-guidance/counter-offer` — counter-offer mechanics under
  AAR standard form
- `/buy/offer-guidance/hoa-addendum` — HOA review period, right to
  cancel
- `/buy/offer-guidance/wire-fraud` — verbatim Wire Fraud Advisory +
  recent AZ fraud pattern examples
- `/sell/listing-prep/disclosure-checklist` — what sellers MUST
  disclose per ARS and ADRE SPS

### Offer-writer AI prompt context (for `lib/ai-prompts/offer-draft.ts`)

The prompt template already references AAR form sections (BINSR, SPDS,
Section 3a earnest money, etc.). When we get current forms via the
partner broker, we update the prompt with the exact section numbers
from the current revision.

### FSBO tier contract template library

Pro package ($899) includes "contract template library" per
`three-tier-product.md`. This is a set of blank AAR forms OR equivalent
templates the FSBO seller can adapt.

**Legal note:** We cannot legally supply AAR forms to non-agents (AAR
copyright + licensee-only distribution). For the FSBO tier, we provide:

1. **Blank state-maintained forms** that ARE public domain (statutory
   deed forms per ARS § 33-404)
2. **Generic contract templates** (possibly from a third-party like
   eForms, LawDepot, or our own counsel-drafted) labeled as
   "educational, not AAR-standard"
3. **Walkthroughs of what the AAR form looks like** without distributing
   the form itself — describe the structure, not the text
4. **Strong CTAs to upgrade to flat-fee or full-service** when the user
   needs the actual AAR form

This keeps us on the right side of AAR's copyright and also gives users
a genuine reason to upgrade tiers.

## Compliance monitoring plan

Built into the content-automation Lambda (Phase 1B, already spec'd):

- Daily: AAR forms page — detect changes in revision dates
- Daily: ADRE Substantive Policy Statements page — detect new SPS
- Weekly: ADRE Bulletins
- Monthly: AAC Title 4 Ch 28 version number
- Event-driven: NAR settlement litigation updates, post-settlement
  practice bulletins

When a change is detected, the content-drafter Lambda generates an
internal compliance alert (Team_Admin email) + a draft blog post
queued for review.

## Immediate action items

### Owner (in order)

1. [ ] Confirm current ADRE license status. Reactivate if needed.
2. [ ] Access AAR member portal (once broker partnership active) to pull
       current (2026) versions of the 13 key forms listed above
3. [ ] Download ADRE Substantive Policy Statement 2025.03 (Teams
       guidance) to understand current ADRE enforcement priorities
4. [ ] Review ADRE December 13, 2025 Administrative Code revisions —
       this is the biggest recent change and affects all broker
       operations

### Kiro B (when content pages are built)

1. [ ] Use the URLs in this spec as the "cite source" footer line for
       any page touching rules, contracts, or forms
2. [ ] Every offer-guidance page links to the exact AZ statute URL
       (azleg.gov), not a paraphrased summary elsewhere
3. [ ] Wire the Phase 1B content pipeline to poll AAR forms page daily
       once Phase 1B ships (already in content-sources.md)

### Kiro A (future)

1. [ ] When partner broker delivers current AAR forms, extract section
       numbers and update `lib/ai-prompts/offer-draft.ts` prompt
       template
2. [ ] Build a `lib/legal-refs.ts` constant file exporting the canonical
       URLs from this spec so pages reference them symbolically rather
       than hardcoded
3. [ ] Write the 8 offer-guidance pages listed above once we have the
       current forms

## Cross-references

- `.kiro/specs/flat-fee-legal-model.md` — ARS § 32-2155 salesperson
  rules
- `.kiro/specs/content-sources.md` — daily regulatory polling plan
- `.kiro/specs/ai-prompts-library.md` — offer-draft prompt uses AAR
  form section references
- `.kiro/specs/three-tier-product.md` — FSBO contract template strategy
- `.kiro/specs/mls-syndication-messaging.md` — broker-of-record
  requirements
- `lib/brokerage.ts` — env-sourced broker credentials needed to access
  AAR member portal

## References

- AAR sample forms index: `https://www.aaronline.com/manage-risk/sample-forms/`
- AAR residential resale forms: `https://www.aaronline.com/manage-risk/sample-forms/residential-resale-transaction-forms/`
- AAR form releases: `https://www.aaronline.com/category/manage-risk/new-forms`
- ADRE: `https://azre.gov/`
- ADRE Substantive Policy Statements: `https://azre.gov/about/laws-rules-policy-statements-and-advisories/substantive-policy-statements-sps`
- Arizona Revised Statutes: `https://www.azleg.gov/arstitle/`
- Arizona Administrative Code: `https://azsos.gov/rules/arizona-administrative-code`
- AAC chapter index: `https://apps.azsos.gov/public_services/CodeTOC.htm`
- ASREB bookstore (law books, printed): `https://www.asreb.com/reg/bklst.php`
- NAR settlement: `https://www.nar.realtor/the-facts/nar-settlement`
