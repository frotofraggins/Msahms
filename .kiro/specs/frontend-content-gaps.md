# Frontend Content Gaps — Research-Backed

Author: Kiro A, 2026-04-25. Status: write this content BEFORE production
launch. Est. 4-6 hours for Kiro B (or owner writes blog posts, Kiro B
wires up pages).

## Why this exists

Owner review of Kiro B's visual upgrade: "we might be missing some content
and things on the front end. we might need to do more research on what
people want."

Correct. The frontend **structure** is there (30 pages, bento layout,
serif typography, design system). The **content** is thin and
template-shaped — city pages have boilerplate text, blog has 3 starter
posts (from seed-content.ts), no FSBO educational landing, no
comparison decision tool, no FAQ, no floor-plan filtering, no school
district depth.

## Research — what Mesa/Gilbert/Chandler buyers and FSBO sellers actually look for

Sources (searches on 2026-04-25):

### Mesa/Gilbert/Chandler buyer intent (8 sources)
- askdoss.com AZ market report 2026: median $415K, 5.1 months inventory, **buyer-leaning market**, 48 days on market
- cactuslivingaz.com East Valley guide 2026: school district quality drives home values directly (Gilbert Public Schools + Chandler Unified top-rated)
- eastvalleytribune.com: **investors vs first-time buyers competing for entry-level Mesa homes** — this is a story angle
- denisehurd.com: 2026 buyer priorities = **floor plan flexibility**, cooling/energy efficiency, outdoor living, home offices
- cactuslivingaz.com comparison: Mesa median $495K (value play), Gilbert $500K+ (family/schools), Chandler premium tier

### FSBO seller pain points (5 sources)
- ibuyer.com 2026 FSBO guide: **#1 seller concern is pricing** (no CMA access), #2 is legal paperwork, #3 is marketing exposure
- listingspark.com: **36% of FSBO sellers report legal mistakes from paperwork errors** — huge opportunity for "done-for-you" document templates
- houzeo.com: 2024 NAR settlement changed buyer-agent compensation disclosures — many FSBO sellers don't know about this
- copyprogramming.com: key FSBO phases = pricing → prep → marketing → showing → negotiate → contract → close
- Top FSBO questions on forums (recurring): "how do I price?", "what forms do I need?", "what happens at closing?", "do I need a lawyer?", "how do I handle buyer agent commission?"

### What converts sellers on marketing pages (liftoffagent.com analysis)
- Immediate cost/value math ("your home at $500K saves you $12,000 vs 6% agent")
- Social proof specific to their ZIP code
- A clear next step — not "contact us," but "get your free CMA in 60 seconds"
- Objection handling inline ("I don't have time" / "I'm not a marketer" / "what about legal?")

## Content gaps in priority order

### 🛑 BLOCKER — FSBO educational landing page doesn't exist

**What exists**: `/listing/fsbo` → 4-step wizard that collects form data and
redirects to VHZ. No educational content.

**What's missing**: A proper `/fsbo` or `/sell/by-owner` landing page that
educates, overcomes objections, and converts. This is the highest-value
missing page — it's the #1 intent query ("sell my house by owner mesa")
and we have nothing for it.

**Page structure**:

```
/fsbo  (or /sell/fsbo depending on URL scheme)
├── Hero: "Sell your Mesa home yourself. Keep $12,000+ in your pocket."
│   With live savings calculator (enter home price → shows agent-commission savings)
├── The 7 phases of a FSBO sale (bento grid)
│   Price | Prep | Market | Show | Negotiate | Contract | Close
│   Each is an anchor link to a section below
├── Phase 1: Price your home right (accordion or section)
│   - "Use our free Home Value Estimator" [CTA to /tools/home-value]
│   - "Compare to 3-5 recent Mesa-area sales" [CTA to /tools/comparison]
│   - Cite 2026 AZ market data: median $415K, 48 days on market, 1.8% YoY
├── Phase 2: Prep for photos
│   [CTA: "Book professional photos from Virtual Home Zone for $299"]
│   This is the revenue wedge — don't bury it
├── Phase 3: Market the listing
│   - AI listing description generator [CTA to /tools/listing-generator]
│   - "We'll syndicate to Zillow, Realtor.com, Redfin..." (use brokerage.ts portalsSentence helper)
├── Phase 4: Showings
│   - Advice on scheduling, safety, handling lockbox
├── Phase 5: Negotiate offers
│   - AI offer-response generator [CTA to /tools/offer-writer]
│   - Explain 2024 NAR settlement buyer-agent compensation disclosure
├── Phase 6: Contract
│   - Link to legal-reference-library.md content (public-domain AZ statutory forms)
│   - Strong disclaimer: "We describe the forms. We don't provide them. Use a licensed AZ real estate attorney."
├── Phase 7: Close
│   - Walk through escrow, title, funding
├── FSBO vs flat-fee vs agent (comparison table)
│   Headings: DIY FSBO ($299) | Mesa Listing Service ($999) | Full Service (3%)
│   Body: time commitment, MLS access, support level, total cost on $500K home
├── Common objections answered
│   "I don't have time" → We have tools that do 80% of the work in 4 hours
│   "I'm not a marketer" → AI writes the listing; we syndicate to portals
│   "What if I make a legal mistake?" → Cite the 36% stat, then recommend AZ attorney
│   "My neighbor used an agent" → Show the math: 6% of $500K = $30K
├── "Ready to start?" CTA → routes to existing /listing/fsbo intake wizard
└── FAQ (10-12 questions, accordion)
```

**Conversion target**: 2-3% of visitors to this page start the FSBO
intake wizard. This replaces a current 0% conversion (page doesn't exist).

### 🛑 BLOCKER — /faq page doesn't exist

Every real-estate site has one. It's also an SEO workhorse (FAQ schema
gets rich results in Google).

**Scope**: Single page at `/faq` with 15-20 questions grouped by topic:

- General (what is MesaHomes, service area, licensing, contact)
- For sellers (FSBO vs flat-fee vs agent, pricing, photography, timeline)
- For buyers (home search, making offers, first-time buyer programs)
- Flat-fee service (what's included, MLS coverage, commission to buyer's
  agent, what's NOT included)
- Legal / compliance (our licensed broker of record, Arizona-specific
  disclosures, buyer-agent compensation post-NAR settlement)
- Costs (no hidden fees, refund policy, upgrade path)

**Markup**: Every Q&A uses schema.org FAQPage JSON-LD so Google can
surface them as featured snippets.

### 🛑 BLOCKER — Savings calculator component exists but not on FSBO landing

`SavingsCalculator.tsx` component was built (seen in homepage bento). Owner
types a home price → shows how much they save vs a 6% agent. Currently
only on homepage. Needs to be hero-section on `/fsbo` landing for
maximum conversion.

### ⚠️ HIGH — City pages are thin

Current `/areas/[slug]` pages have generic templates (from seed-content.ts).
Each city page should have:

- **Current 2026 median sale price + 6-month trend** (already have
  market-data API, just surface it)
- **Top-rated school districts with ratings** (cactuslivingaz.com shows
  GPS/CUSD dominate — cite these by name with links to niche.com or
  greatschools.org)
- **Typical floor plans** (per denisehurd research: buyers are
  layout-focused in 2026 — Mesa ranches vs Gilbert newer 2-story with
  home offices)
- **Neighborhoods with price bands** (e.g., Mesa: Red Mountain $400-500K,
  Eastmark $550-700K, Downtown Mesa $300-400K)
- **Investor activity** (Eastvalleytribune.com angle: first-time buyer
  vs investor competition)
- **Commute times** (to ASU, to downtown Phoenix, to Sky Harbor)

Each city page is currently ~300 words. Target 1,200-1,500 words each
for SEO. Use `lib/ai-prompts/city-intro.ts` to generate a first draft,
then human-edit for accuracy and voice.

### ⚠️ HIGH — No "sell my house fast" comparison page

Current `/compare/flat-fee-vs-traditional-agent` exists. Missing:
**`/compare/fsbo-vs-flat-fee-vs-agent`** — the key decision page.

Three-column comparison:

| | FSBO ($299) | Mesa Listing Service ($999) | Full Service (3%) |
|---|---|---|---|
| Time commitment | 15-25 hrs | 8-12 hrs | 2-4 hrs |
| MLS on Zillow/Realtor | ❌ | ✅ | ✅ |
| Professional photos | Add-on | ✅ | ✅ |
| Showing coordination | You | You | Agent |
| Negotiation help | AI tools | AI + phone support | Agent |
| Contract review | Attorney | Attorney or agent | Agent |
| Price on $500K home | $299 | $999 + $400 at close | $15,000 (3%) |
| Best for | Confident sellers | Most sellers | High-touch sellers |

Add a decision quiz (3-4 questions → recommends tier). This routes via
the existing guided-engine infrastructure from Task 16.

### ⚠️ MEDIUM — Blog posts need more volume and specificity

Current: 3 seed posts (generic topics). Target: 10-12 posts at MVP
launch, topic clusters that rank for real Mesa-area searches.

**Topic cluster 1: Mesa-area neighborhoods** (pulls search traffic)
- "Best Neighborhoods in Mesa for First-Time Buyers (2026)"
- "Eastmark vs Red Mountain vs Downtown Mesa: Which Neighborhood Fits You?"
- "Queen Creek's 2026 Boom: Why Buyers Are Moving East"

**Topic cluster 2: FSBO education** (SEO + converts to listing service)
- "How to Price Your Mesa Home Without an Agent (2026 Guide)"
- "Arizona FSBO Paperwork Checklist — What You Legally Need"
- "Handling Buyer-Agent Compensation After the 2024 NAR Settlement"
- "The 7-Phase FSBO Timeline for Arizona Sellers"

**Topic cluster 3: Decision aids** (converts undecided)
- "FSBO vs Flat-Fee MLS vs Traditional Agent: Cost Breakdown on a $500K Mesa Home"
- "Should You Sell Your Home Now or Wait? (East Valley 2026 Market Analysis)"
- "5 Signs Your Mesa Home is Priced Wrong"

**Topic cluster 4: Buyer guides** (symmetry with seller content)
- "First-Time Buyer Programs for Mesa, Gilbert, Chandler (2026)"
- "How Much Home Can You Afford in the East Valley?" [CTA to /tools/affordability]

Each post: 800-1,200 words, proper heading structure, FAQ at the bottom
with schema markup, internal links to tools pages.

### ⚠️ MEDIUM — No pricing page

People expect a `/pricing` page on any service business. Currently
pricing is scattered across homepage, FSBO wizard, and listing-start.
Consolidate.

**Scope**: Single `/pricing` page showing all 3 tiers side-by-side with
the same comparison table as above, plus FAQ about what's included,
refund policy, upgrade path.

### ⚠️ MEDIUM — Floor plan filter missing on listings / tools

Per denisehurd.com: 2026 buyers start by **filtering on floor plan
type** before price/location. We have no floor-plan vocabulary in our
property data model. Not fixable for MVP without schema change, but
flag as post-launch.

### ⚠️ LOW — About page thin

Current `/about` (if exists — let me check): probably boilerplate.
Should include:
- Who owns MesaHomes (you, licensed salesperson)
- Partner brokerage relationship (when finalized)
- Why the flat-fee model
- Photo/bio of owner
- Geography served with a map

## What ships when

**Pre-launch (BLOCKER items)**:
- `/fsbo` educational landing page
- `/faq` page with FAQ schema
- Ensure SavingsCalculator is on `/fsbo` hero

**Week 1 post-launch (HIGH items)**:
- Expand city pages to 1,200-1,500 words with real data
- `/compare/fsbo-vs-flat-fee-vs-agent` page

**Week 2-4 post-launch (MEDIUM items)**:
- Build blog catalog to 10-12 posts
- `/pricing` page

**Deferred**:
- Floor plan schema + filter (post-MVP; requires data model change)

## Who does what

**Kiro B** — Wire the pages (structure, navigation, data binding,
schema markup, CTAs). Uses existing components (`SavingsCalculator`,
`FadeInOnScroll`, bento grid utilities).

**Owner (you) or Kiro A with review** — Writes the actual content
(headlines, body copy, blog post drafts). AI-assisted first drafts are
fine but need human edit for:
- Accuracy (cite 2026 data; don't hallucinate stats)
- Local specificity (Mesa is not generic; use neighborhood names,
  school districts, actual comparisons)
- Voice (friendly + confident + zero jargon)
- Legal accuracy (any FSBO advice must not cross into "practicing real
  estate" — we educate, we don't advise on specific transactions)

## Cross-references

- `.kiro/specs/legal-reference-library.md` — what forms we can reference
- `.kiro/specs/three-tier-product.md` — the pricing tiers to display
- `.kiro/specs/frontend-visual-upgrade-2026.md` — apply the same
  typography / palette / bento system
- `.kiro/specs/ai-prompts-library.md` — for first-draft content generation
- `deploy/seed-content.ts` — current seed content to expand
- `lib/brokerage.ts` `portalsSentence()` — use for syndication language
