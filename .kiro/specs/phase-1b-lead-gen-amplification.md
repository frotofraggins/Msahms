# Phase 1B — Lead Generation Amplification

**Status**: in progress (kickoff 2026-04-27)
**Parent**: `.kiro/specs/mesahomes-lead-generation/` MVP (Phase 1A complete 2026-04-26)

## Overview

Phase 1A shipped a working lead-generation site. Phase 1B amplifies it by:

1. Surfacing the data we already ingest but don't display
2. Expanding content sources to establish SEO moat
3. Building high-intent content funnels (relocation, housing law, safety)
4. Turning the agent dashboard from view-only to a daily working tool

Each task has a value estimate and an effort estimate. Pick by ratio.

---

## Tasks

### 🟢 SHIPPED (since MVP completion, 2026-04-26 to 2026-04-27)

- [x] Post-launch bug sweep — lead capture 502, dashboard idToken auth, Cognito flow, GSI case mismatch, dashboard lead detail fields, 404 page
- [x] Email system — SES domain verification, 6 transactional templates, fire-and-forget wiring into 3 lead creation paths
- [x] Analytics stack — GA4 `G-4447H4DSLJ`, Microsoft Clarity `whvce3nreo`, Google Search Console DNS-verified
- [x] Rebrand — middle tier renamed to "Mesa Listing Service" across frontend UI (SEO slugs and legal docs keep category term)
- [x] Brand assets — 9 AI-generated logos + 5 hero photos, stripped AI metadata, embedded MesaHomes EXIF, converted to WebP, transparent backgrounds, content-bbox-cropped
- [x] Analytics integration hardened — isolated Clarity/GA failures from form submits
- [x] Maricopa GIS fixed — 3 compounding bugs (wildcard outFields, default UA blocked, numeric compare on string field) + sqft normalizer comma handling
- [x] Home Value tool — real ZIP-level Zillow data, real comps display, metro market context strip with 6 of 12 Zillow datasets, data-sources explanation
- [x] Google Places autocomplete — 4 address inputs, Places API (New), ZIP resolution via Place Details on selection
- [x] Schedule button — opens Google Calendar with lead info pre-filled
- [x] Delete lead functionality with confirmation
- [x] CloudFront SPA rewrite function — deployed for dashboard dynamic routes

### 🟢 IMMEDIATE (ship this week — high value, ≤4 hr each)

- [ ] **1. Agent email actions on lead detail** (3 hr)
  - "Send follow-up email" button on `/dashboard/leads/[id]/` with 3 templates (check-in, doc request, meeting request)
  - Edit before send modal
  - POST `/api/v1/dashboard/emails/send` Lambda endpoint (Team_Admin + Agent only)
  - Log every send to DDB `LEAD#{id}` / `EMAIL#{timestamp}` for history
  - "Recent emails sent" section on lead detail
  - _Value: owner's daily workflow tool_

- [ ] **2. UTM + attribution capture on leads** (2 hr)
  - Already have UTM in session storage (`lib/tracking.ts`); ensure it flows into `createLead` payload
  - Display "Came from" row on `/dashboard/leads/[id]/` lead detail
  - Filter dropdown on `/dashboard/leads/` by UTM source
  - _Value: ROI math for paid ads, content attribution_

- [ ] **3. Blog `/blog/[slug]` reads DynamoDB, not hardcoded dict** (2 hr)
  - Already have seeded posts in DDB; frontend just needs to read from `/content/blog/{slug}` instead of hardcoded content dictionary
  - Keep hardcoded fallback if API 404s
  - Owner can now publish new posts via API or dashboard (future) without code deploy
  - _Value: unblocks content publishing cadence_

- [ ] **4. Google Business Profile complete** (30 min, owner drives)
  - Description paragraph (drafted in previous session)
  - 6-city service area
  - Business hours
  - 5+ photos (logos + Mesa hero photos)
  - Services list
  - _Value: local SEO immediately_

### 🟡 SHORT-TERM (week 2-3)

- [ ] **5. Render more Zillow datasets throughout the site** (2 hr)
  - Add `/tools/affordability` context with ZORI rent data
  - Homepage hero stats block with affordability index ("$X income needed")
  - `/areas/[slug]` city pages show sale-to-list, days pending, price cuts trends
  - _Value: trust signal, SEO body copy_

- [ ] **6. `/moving-to-mesa` relocation hub** (1-2 days)
  - Main hub page with cost-of-living calculator + state-comparison teaser
  - `/moving-to-mesa/from-{state}` pages for top 5 migrant-source states (CA, WA, IL, NY, OR)
  - `/moving-to-mesa/cost-of-living` calculator page
  - `/compare/mesa-vs-{gilbert,chandler,queen-creek}` city comparison pages
  - Per `.kiro/specs/mesahomes-lead-generation/content-sources.md` §14
  - _Value: 15,300 migrants/yr, highest-intent buyers, BLS + state tax data all free_

- [ ] **7. HOA directory auto-build** (1 day)
  - Cron to query Maricopa GIS for distinct `SUBNAME` per ZIP
  - Query Pinal GIS for distinct `CNVYNAME` per ZIP
  - Generate `/hoa/{slug}` page per subdivision with aggregate stats (count, avg assessed value, avg sqft, typical year built)
  - Per content-sources.md §3 + §9
  - _Value: unique long-tail SEO, thousands of pages at zero content cost_

- [ ] **8. Email log page `/dashboard/emails`** (2 hr)
  - Outbound email ledger, all sends across all leads
  - Filter by lead, template, date
  - Resend button
  - Depends on #1
  - _Value: agent workflow, compliance record_

### 🟡 MEDIUM (month 2)

- [ ] **9. Mesa Legistar daily ingest** (1 day)
  - Lambda + EventBridge cron `cron(0 14 ? * * *)` (7am MST)
  - Poll `https://webapi.legistar.com/v1/mesa/events` for new items
  - Bedrock Haiku summarizer → DDB `CONTENT#DRAFT#{id}` with status=pending-review
  - Owner approval UI on `/dashboard/content/`
  - Publish to `/blog/{slug}` on approval
  - Per `content-sources.md` §1
  - _Value: unique Mesa SEO content nobody else has_

- [ ] **10. Mesa PD Socrata safety page** (half day)
  - `/community/safety` standalone page (Fair Housing compliant — aggregate only, links to official registries)
  - Monthly crime statistics from `data.mesaaz.gov/resource/hpbg-2wph.json`
  - Links to AZ DPS sex offender registry, NSOPW national, Mesa Crime Stoppers
  - Per `content-sources.md` §15
  - _Value: trust signal, SEO for safety-related queries_

- [ ] **11. Housing law tracker** (2 days)
  - Poll HUD, CFPB, FHFA, ADRE, AAR daily
  - Federal Register JSON API for rule changes
  - AZ Legislature bill tracker for 2026 session bills
  - Generate plain-English explainer drafts via Bedrock Haiku
  - Per `content-sources.md` appendix
  - _Value: same-day SEO on rule changes, SEO authority builder_

- [ ] **12. News RSS ingest** (half day)
  - AZ Central Mesa, East Valley Tribune, Mesa city press releases, AZ Big Media, Phoenix Business Journal
  - Filter for real estate keywords, summarize, queue for review
  - Per `content-sources.md` §4
  - _Value: daily content without daily writing_

### 🔴 OWNER-BLOCKED (waiting on external)

- [ ] **A. Broker-of-record partnership signed** — unblocks Mesa Listing Service and Full-Service public launch
- [ ] **B. SES production access granted by AWS** — unblocks email delivery to unverified recipients (currently PENDING since 2026-04-26)
- [ ] **C. MesaHomes domain transfer to Route 53 Domains** — registrar still at GoDaddy, DNS already at Route 53
- [ ] **D. Legal memo for privacy/terms** — external research in flight

### 🔵 DEFERRED (Phase 2+)

- [ ] ARMLS IDX integration — buyer search, full MLS presence. Requires paid IDX data feed + MLS membership.
- [ ] Hydra AI backend — swap Bedrock Haiku for local RTX 4090 via Cloudflare Tunnel. Saves per-token cost at scale.
- [ ] Virtual Home Zone rebuild — VHZ as photography merchant-of-record for FSBO package (per VHZ-STANDUP-RUNBOOK.md).
- [ ] Reddit sentiment scraping — neighborhood sentiment for `/areas/{slug}` + `/hoa/{slug}` pages.
- [ ] Aerial View (3D drone) — nice-to-have premium listing visualization.
- [ ] Programmatic ZIP-level landing pages — depends on ARMLS.
- [ ] Exit-intent modal + sticky desktop CTA — conversion optimization.
- [ ] Testimonials collection form.
- [ ] Gated lead-magnet PDFs.

---

## How to use this file

- Check off tasks with `[x]` as they complete
- Reference this file at the start of each session for "what's next"
- New tasks can be added as they emerge
- Move `[x]` items to SHIPPED section with date if you want a clean in-progress view

## Current focus

Start with task #1 (Agent email actions) unless owner picks otherwise. It's the
feature that turns the dashboard from view-only into a daily operator tool,
and it closes the loop on the email system that's already shipped for the
public-facing side.
