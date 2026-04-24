# MesaHomes Frontend Design Reference

## Design Principles (Stolen from What Works)

Based on analysis of high-traffic real estate sites: Houzeo (flat-fee leader, 11K+ reviews),
Clever Real Estate (agent matching, $150M+ saved), HomeLight (agent + tools platform),
Redfin, and Zillow.

### What the winners do:
1. **Intent-first homepage** — not a search bar, but "What do you need?" with 3-5 clear paths
2. **Savings calculator above the fold** — Clever shows "$X saved" instantly on homepage
3. **Social proof everywhere** — review counts, star ratings, savings totals, customer photos
4. **Step-by-step flows** — Houzeo: "1. List → 2. Get offers → 3. Close" numbered steps
5. **Sticky CTAs** — phone number + "Get Started" button always visible
6. **Comparison tables** — flat-fee vs traditional side-by-side (Houzeo does this on every page)
7. **Trust signals** — "As seen in" logos, BBB rating, review platform badges
8. **Mobile-first** — 60%+ of real estate traffic is mobile

### What MesaHomes should NOT copy:
- Zillow's search-first homepage (we don't have IDX yet)
- Generic "Contact Us" forms (use tool-specific progressive disclosure instead)
- Stock photos of happy families (use real Mesa/East Valley imagery)
- Walls of text (use calculators and interactive tools instead)

---

## Homepage Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│ Logo | Sell | Buy | Rent | Invest | Areas | Reviews     │
│                              [Call: (480) XXX-XXXX]     │
│                              [Talk to Agent] button      │
├─────────────────────────────────────────────────────────┤
│ HERO SECTION                                             │
│                                                          │
│ "What do you need help with?"                           │
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 🏠 Sell  │ │ 🔑 Buy   │ │ 📋 Rent  │ │ 💰 Invest│   │
│ │ Your Home│ │ A Home   │ │          │ │          │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ Quick tools:                                             │
│ [What's My Home Worth?] [How Much Can I Afford?]        │
│ [Compare Flat Fee vs Agent] [Talk to Agent Now]         │
├─────────────────────────────────────────────────────────┤
│ SAVINGS CALCULATOR (inline, no click needed)             │
│                                                          │
│ "See how much you'd save with flat-fee listing"         │
│ Enter sale price: [________]                             │
│                                                          │
│ Traditional Agent: $XX,XXX    MesaHomes Flat Fee: $X,XXX│
│ >>>  YOU SAVE: $XX,XXX  <<<                             │
│                                                          │
│ [Start Your Flat-Fee Listing]  [Learn More]             │
├─────────────────────────────────────────────────────────┤
│ HOW IT WORKS (3 steps, numbered, with icons)             │
│                                                          │
│ ① Use Our Free Tools    ② Get Expert Guidance           │
│ Net sheet, home value,  AI-powered listing help,        │
│ affordability calc      offer writing, market data      │
│                                                          │
│ ③ Save Thousands                                        │
│ Flat-fee MLS listing or upgrade to full-service         │
│ agent at any time                                        │
├─────────────────────────────────────────────────────────┤
│ TOOL CARDS (interactive, not just links)                  │
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ Seller      │ │ Buyer       │ │ Market      │       │
│ │ Net Sheet   │ │ Affordability│ │ Data        │       │
│ │ "How much   │ │ "How much   │ │ "Mesa home  │       │
│ │  will I     │ │  can I      │ │  values are │       │
│ │  walk away  │ │  afford?"   │ │  $432K"     │       │
│ │  with?"     │ │             │ │             │       │
│ │ [Calculate] │ │ [Calculate] │ │ [View Data] │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────┤
│ LOCAL MARKET SNAPSHOT                                     │
│                                                          │
│ Mesa, AZ — April 2026                                   │
│ Median Home Value: $448K | Days on Market: 60           │
│ Sale-to-List: 97.7% | Inventory: 25,524                │
│                                                          │
│ [Mesa] [Gilbert] [Chandler] [Queen Creek] [San Tan]    │
├─────────────────────────────────────────────────────────┤
│ SOCIAL PROOF                                             │
│                                                          │
│ ★★★★★ "MesaHomes saved us $12,000..."                  │
│ [Review 1] [Review 2] [Review 3] → [See All Reviews]   │
├─────────────────────────────────────────────────────────┤
│ FULL SERVICE UPGRADE BANNER                              │
│                                                          │
│ "Want a licensed agent to handle everything?"            │
│ [Switch to Full Service] — vetted local agents          │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                   │
│ About | Contact | Privacy | Terms | Sitemap             │
│ Areas: Mesa | Gilbert | Chandler | Queen Creek          │
│ Tools: Net Sheet | Affordability | Home Value           │
│ © MesaHomes | Licensed in Arizona | ADRE #XXXXX        │
└─────────────────────────────────────────────────────────┘
```

---

## Tool Page Layout (applies to all tools)

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (same as homepage)                                │
├─────────────────────────────────────────────────────────┤
│ BREADCRUMB: Home > Tools > Seller Net Sheet              │
├─────────────────────────────────────────────────────────┤
│ TOOL HERO                                                │
│                                                          │
│ "How Much Will You Walk Away With?"                     │
│ Calculate your net proceeds from selling your home       │
│                                                          │
│ ┌─────────────────────────────────────────────────┐     │
│ │ CALCULATOR FORM (above the fold)                 │     │
│ │                                                   │     │
│ │ Property Address: [_________________________]    │     │
│ │ Estimated Sale Price: [$___________]             │     │
│ │ Outstanding Mortgage: [$___________]             │     │
│ │                                                   │     │
│ │ Service Type:                                     │     │
│ │ (●) Flat Fee  ( ) Traditional Agent              │     │
│ │                                                   │     │
│ │ [Calculate My Net Proceeds →]                    │     │
│ └─────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│ TEASER RESULTS (shown immediately, no contact needed)    │
│                                                          │
│ ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ FLAT FEE             │ │ TRADITIONAL          │        │
│ │ Commission: $X,XXX   │ │ Commission: $XX,XXX  │        │
│ │ Broker Fee: $400     │ │ Broker Fee: $0       │        │
│ │ Title/Escrow: $X,XXX │ │ Title/Escrow: $X,XXX │        │
│ │ ...                  │ │ ...                  │        │
│ │ ─────────────────    │ │ ─────────────────    │        │
│ │ YOU SAVE: $XX,XXX    │ │                      │        │
│ └─────────────────────┘ └─────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│ PROGRESSIVE DISCLOSURE GATE                              │
│                                                          │
│ 🔒 "Get your full net sheet with downloadable PDF"      │
│                                                          │
│ Name: [____________]                                     │
│ Email: [____________]                                    │
│ Phone: [____________]                                    │
│ Timeframe: [Now ▼] [30 days ▼] [3 months ▼] [6+ ▼]   │
│                                                          │
│ [Unlock Full Report →]                                  │
├─────────────────────────────────────────────────────────┤
│ WHAT'S NEXT (Guided Decision Engine)                     │
│                                                          │
│ Progress: ● Home Value → ● Net Sheet → ○ Sell Now? →   │
│           ○ Listing Prep → ○ List or Upgrade            │
│                                                          │
│ "Based on your numbers, here's what to do next:"        │
│ [Should I Sell Now or Wait? →]                          │
│                                                          │
│ Or: [Switch to Full Service Agent]                      │
├─────────────────────────────────────────────────────────┤
│ STREET VIEW PHOTO + PROPERTY DATA (if address entered)   │
│                                                          │
│ ┌──────────────┐  39669 N Luke Ln, San Tan Valley      │
│ │              │  2,071 sqft | 2 floors | Built 2004   │
│ │  [Street     │  Lot: 0.12 acres                      │
│ │   View       │  Assessed: $291,424                   │
│ │   Photo]     │  Last Sale: $238,000 (Mar 2021)       │
│ │              │  Subdivision: Pecan Creek North        │
│ └──────────────┘  ZIP Typical Value: $432,201           │
├─────────────────────────────────────────────────────────┤
│ NEARBY COMPS (from county GIS)                           │
│                                                          │
│ Recent Sales in Pecan Creek North:                       │
│ 396 E Maddison St    $447,500  Apr 2026  2,049 sqft    │
│ 504 E Anastasia St   $425,000  Feb 2026  2,049 sqft    │
│ 315 E Christopher St $369,000  Jan 2026  2,342 sqft    │
│ [View More Comps →]                                     │
├─────────────────────────────────────────────────────────┤
│ FAQ SECTION (SEO + user education)                       │
│                                                          │
│ ▸ What is a seller net sheet?                           │
│ ▸ How much does it cost to sell a house in Arizona?     │
│ ▸ What's the difference between flat fee and traditional?│
│ ▸ How are closing costs calculated?                     │
├─────────────────────────────────────────────────────────┤
│ STICKY BOTTOM BAR (mobile)                               │
│ [📞 Call] [📅 Book Consult] [💬 Chat] [⬆ Full Service] │
└─────────────────────────────────────────────────────────┘
```

---

## City Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
├─────────────────────────────────────────────────────────┤
│ HERO: "Mesa, AZ Real Estate"                            │
│ Median Home Value: $448K | Typical Rent: $1,735/mo      │
│ [Get Home Value] [Find What You Can Afford]             │
├─────────────────────────────────────────────────────────┤
│ MARKET STATS DASHBOARD (from Zillow Research data)       │
│                                                          │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ $448K  │ │ 60     │ │ 97.7%  │ │ 25,524 │           │
│ │ Median │ │ Days on│ │ Sale-to│ │ Active │           │
│ │ Value  │ │ Market │ │ List   │ │ Listings│           │
│ │ ↓2.4%  │ │ ↑ from │ │        │ │        │           │
│ └────────┘ │ 55     │ └────────┘ └────────┘           │
│            └────────┘                                   │
├─────────────────────────────────────────────────────────┤
│ ZIP CODE BREAKDOWN                                       │
│                                                          │
│ 85201 Central Mesa    $360K  ↓1.2%                      │
│ 85203 NE Mesa         $449K  ↓0.8%                      │
│ 85207 NE Mesa         $555K  ↑0.3%                      │
│ 85212 Hawes Crossing  $560K  ↑0.5%                      │
│ [View All Mesa ZIP Codes →]                             │
├─────────────────────────────────────────────────────────┤
│ NEIGHBORHOOD GUIDES                                      │
│ Quick links to each ZIP's detailed page                  │
├─────────────────────────────────────────────────────────┤
│ SELLER CTA: "Thinking of selling in Mesa?"              │
│ [Get Your Home Value] [See Your Net Sheet]              │
├─────────────────────────────────────────────────────────┤
│ BUYER CTA: "Looking to buy in Mesa?"                    │
│ [Check Affordability] [First-Time Buyer Guide]          │
├─────────────────────────────────────────────────────────┤
│ FAQ: "Is Mesa a good place to live?" etc.               │
│ (Schema.org FAQ markup for Google)                       │
├─────────────────────────────────────────────────────────┤
│ RECENT BLOG POSTS about Mesa                             │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD HEADER                                         │
│ MesaHomes | [Agent Name] | [Notifications 🔔3] | Logout│
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT                                  │
│          │                                               │
│ 📊 Leads │ LEAD OVERVIEW                                │
│ 👥 Team  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ 📈 Perf  │ │ 12 │ │ 5  │ │ 3  │ │ 2  │ │ 1  │        │
│ 🏠 List  │ │New │ │Cont│ │Show│ │Undr│ │Clsd│        │
│ ⚙ Settings│ └────┘ └────┘ └────┘ └────┘ └────┘        │
│          │                                               │
│          │ LEAD TABLE                                    │
│          │ [Filter: Status ▼] [Type ▼] [Source ▼]      │
│          │ [Sort: Newest ▼] [Search...]                 │
│          │                                               │
│          │ Name    | Type   | Source    | Time  | Status │
│          │ --------|--------|----------|-------|--------│
│          │ John D  | Seller | net-sheet| Now   | New    │
│          │ Jane S  | Buyer  | afford.  | 30d   | Contact│
│          │ Bob R   | Seller | home-val | 3mo   | New    │
│          │                                               │
│          │ [← Prev] Page 1 of 3 [Next →]               │
├──────────┴──────────────────────────────────────────────┤
│ LEAD DETAIL (when clicked)                               │
│                                                          │
│ John Doe — Seller                                        │
│ 📧 john@email.com | 📱 (480) 555-1234                  │
│ 📍 Mesa, 85201 | ⏰ Ready Now | 💰 $400K-$500K        │
│                                                          │
│ Source: Seller Net Sheet                                 │
│ Tool Data: Sale price $450K, Mortgage $200K              │
│ Net proceeds (flat fee): $XXX,XXX                       │
│                                                          │
│ Path History:                                            │
│ ✅ Home Value → ✅ Net Sheet → ⬜ Sell Now or Wait      │
│                                                          │
│ Status: [New ▼] → [Contacted ▼]                        │
│ Notes: [Add note...]                                    │
│ [📞 Call] [📧 Email] [📅 Schedule] [⬆ Reassign]       │
└─────────────────────────────────────────────────────────┘
```

---

## Design System

### Colors
```
Primary:     #1B4D3E (dark green — trust, real estate)
Secondary:   #F5A623 (warm gold — CTAs, savings highlights)
Background:  #FFFFFF (white)
Surface:     #F8F9FA (light gray — cards, sections)
Text:        #1A1A1A (near-black)
Text Light:  #6B7280 (gray — secondary text)
Success:     #10B981 (green — savings, positive trends)
Warning:     #F59E0B (amber — attention needed)
Error:       #EF4444 (red — errors, price drops)
```

### Typography
```
Headings:  Inter or DM Sans (clean, modern, professional)
Body:      Inter or system-ui (fast loading, readable)
Numbers:   Tabular figures (aligned in tables and calculators)
```

### Component Library
Use **shadcn/ui** (built on Radix UI + Tailwind CSS) for:
- Buttons, inputs, selects, modals
- Cards, tables, tabs
- Toast notifications
- Responsive sidebar/navigation

### Mobile Breakpoints
```
Mobile:  320px - 767px  (single column, sticky bottom bar)
Tablet:  768px - 1023px (two column where appropriate)
Desktop: 1024px+        (full layout with sidebar on dashboard)
```

### Key UX Patterns

**Progressive Disclosure:**
Every tool shows partial results → blurred/locked full results → contact form → unlock

**Sticky Elements:**
- Desktop: Header with phone + CTA button
- Mobile: Bottom bar with Call / Book / Chat / Full Service

**Full Service Upgrade:**
Green banner on every page: "Want a licensed agent? [Switch to Full Service]"
Appears more prominently when Guided Decision Engine detects complexity/risk

**Loading States:**
- Property lookup: Skeleton cards while GIS API responds (~1-2s)
- AI generation: "Generating your listing description..." with progress animation
- Tool calculations: Instant (client-side math, no API needed for basic calcs)
