# Content, Traffic, and Analytics Audit — What's Missing

**Date**: 2026-04-26
**Status**: Active roadmap — pick items by priority
**Context**: Owner asked "what else are we missing for content generation and making it drive traffic and get leads. We need to integrate some type of analytics right?"

## Current state snapshot

What already works for traffic/leads:

- ✅ **SEO foundation**: sitemap.xml, robots.txt, canonical URLs, structured data on listings/tools, `<title>` + meta descriptions across all pages
- ✅ **Lead capture**: 5 tool forms (home value, seller net sheet, rent-vs-buy, affordability, sell-now-or-wait), contact form, FSBO intake, booking. All land in DynamoDB, trigger owner SES notification + user confirmation email.
- ✅ **6 blog posts** seeded in DynamoDB at `/blog/*` (though the current frontend reads from a hardcoded content dict, not DDB — fix below).
- ✅ **Hyperlocal city pages** at `/areas/[slug]` for 6 cities.
- ✅ **Sticky mobile contact bar** + Header CTAs.
- ✅ **AI tools**: offer-draft, listing-description, tool-summary, city-intro (all live at `/api/v1/ai/*`).
- ✅ **Three-tier pricing transparency** with the Full-Service upgrade banner.

What is **not** wired yet:

| Gap | Impact | Effort |
|-----|--------|--------|
| **No web analytics** (GA4 or Plausible) | Can't see what pages rank, which tools convert, where users drop off | 30 min |
| **No lead attribution** (utm_source capture) | Can't A/B test, can't track ad spend → lead quality | 2 hours |
| **No conversion events wired** to analytics | Lead submits don't fire analytics events | 1 hour |
| **Google Search Console not verified** | Can't see keyword data, indexing issues, Core Web Vitals from Google | 15 min |
| **Google Business Profile (Mesa)** | Local-SEO gold; shows up in Maps, "near me" queries, knowledge panel | 30 min |
| **Blog `[slug]` reads hardcoded content**, not DynamoDB | Owner can't publish posts via the dashboard or API; seed-content.ts output invisible | 2 hours |
| **No content pipeline running** | 6 static blog posts, no cadence | Phase 1B spec |
| **No email capture on content pages** | Blog post reader leaves → no lead. Missing inline CTA or exit-intent | 1 hour |
| **No retargeting pixel** | Visitors who don't convert can't be re-engaged | 30 min (Meta or Google pixel) |
| **No form funnel analytics** (Hotjar-style) | Can't see which field makes users bounce | ~1 hour (Microsoft Clarity is free) |
| **No Core Web Vitals monitoring in prod** | Don't know if real users see slow loads | 30 min (Vercel Speed Insights, or RUM in GA4) |
| **RSS/email subscriptions for blog** | Readers leave and never come back | 1 hour |
| **No social preview images** (per-post `og:image`) | Shares look ugly on Facebook, LinkedIn, iMessage | 2 hours (auto-generate via Satori) |
| **No heatmap / session recording** | Don't know if users see the CTAs | 30 min (Microsoft Clarity, free) |
| **Schema.org markup is minimal** | Missing `LocalBusiness`, `RealEstateAgent`, `FAQPage`, `BreadcrumbList`, `Article` | 2 hours |
| **No internal linking strategy** | Tool pages don't cross-promote the blog; blog doesn't drive tool use | 1 hour of audit + edits |
| **No review/testimonial collection** | Social proof is the #1 trust signal for real estate | 2 hours (simple Typeform-style form → DynamoDB) |

## Phase A — Analytics stack (ship this first, it unblocks everything)

### Why analytics-first
Every other decision (what content to write, what CTAs work, what ads to run) depends on knowing what users actually do. Ship analytics Week 1 or we're flying blind.

### Stack recommendation: **GA4 + Microsoft Clarity + Google Search Console**

All three are free, complementary, and cover every dimension owner needs:

| Tool | What it tells you | Cost |
|------|-------------------|------|
| **Google Analytics 4 (GA4)** | Page views, users, sources, goal completions (form submits), revenue once Stripe wires up, audience demographics | Free |
| **Microsoft Clarity** | Session recordings (watch real users navigate), heatmaps, rage-clicks, dead-clicks, scroll depth | Free, no traffic cap |
| **Google Search Console (GSC)** | Keywords users actually search to find us, CTR per query, indexing health, Core Web Vitals for real users, sitemap status | Free |

### Why NOT Plausible / Fathom (the privacy-first alternatives)
- They cost $9-19/month — for a pre-revenue site, keep costs at zero.
- They have narrower data than GA4. GA4 has acquired Universal Analytics' maturity.
- Search Console only integrates with GA4, not with Plausible.
- The privacy argument is real but for a real estate lead-gen site, the users ARE expecting to be contacted. Less applicable.

If owner is privacy-concerned: add a cookie banner (3rd-party lib: `react-cookie-consent`). GA4 supports consent mode v2.

### Implementation plan — 1-2 hours

1. **Create GA4 property** (`admin.google.com` → Analytics → Create property → "MesaHomes web" → web stream → `https://mesahomes.com`). Get Measurement ID (looks like `G-XXXXXXXXXX`).
2. **Create Search Console property** (`search.google.com/search-console` → Add property → URL prefix → verify via DNS TXT in Route 53).
3. **Enable Clarity** (`clarity.microsoft.com` → add project → get tracking ID).
4. **Add env var** `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `NEXT_PUBLIC_CLARITY_ID` in `.env.production`.
5. **Build** `frontend/src/components/Analytics.tsx` — uses Next.js `Script` with `strategy="afterInteractive"` to load gtag + clarity only after hydration. Mount once in `app/layout.tsx`.
6. **Fire custom events** on:
   - `lead_submit` (with `tool_source`, `lead_type`)
   - `tool_use` (which tool)
   - `cta_click` (which CTA)
   - `nav_to` (which path)
7. **Wire to existing analytics helper**: there's already `lib/events.ts` or `utils/track.ts` — extend it to call `gtag('event', ...)`.
8. **Set up goal conversions in GA4**: `lead_submit` → Key Event → Conversion. Owner sees conversion count in dashboards.
9. **Request indexing in GSC** for homepage + all major pages.

Code sketch:
```tsx
// frontend/src/components/Analytics.tsx
'use client';
import Script from 'next/script';

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!gaId) return null;
  return (
    <>
      <Script async strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:true});`}
      </Script>
      {clarityId && <Script id="clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`}</Script>}
    </>
  );
}
```

## Phase B — UTM capture + lead attribution (ship after A)

Right now when someone clicks a paid ad or a blog backlink, we have NO record of where they came from. Fix:

1. Add `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `landing_page` to all lead records.
2. Capture on first page load into localStorage (persists across nav + form submit).
3. Send along with every `POST /leads` body.
4. Display in dashboard lead detail ("Came from: Facebook / fall-sellers-2026 / $450k-listing")
5. **Why it matters**: unlocks ad-spend ROI math. Owner can bid $30 to acquire a lead from a campaign that converts at 5% because each $1,500 listing fee has $75 of headroom.

## Phase C — Content-driven traffic (longer horizon, bigger payoff)

### The thesis
MesaHomes' differentiator is hyper-local. Nobody else has a site that ranks for "Mesa AZ 85201 house prices," "Apache Junction HOA meeting notes," "Mesa new construction 2026." Most national flat-fee MLS sites will never rank for those — it's beneath them.

Three content streams:

1. **Neighborhood guides** — 1 long-form article per ZIP (6 cities × 3-4 ZIPs each = 20-ish articles). Schools, HOA, walkability, new construction, market data, photos.
2. **Market data pages** — monthly snapshot per city. "Mesa AZ housing market — April 2026: prices down 2.1%." Auto-generated from the Zillow metro data we already ingest.
3. **HOA / city meeting content** — scrape city council agendas, HOA newsletters; summarize via Bedrock Haiku; publish. This is the "government transparency" angle that builds authority and keyword breadth simultaneously.

The `.kiro/specs/hyperlocal-content-pipeline.md` spec describes streams 2 and 3. Needs implementation.

### Other content work
- FAQ page answers need longer-form sub-pages: "Can I sell my house in Arizona without a realtor?" — a 2,500-word pillar that ranks for that query and links to the FSBO tier CTA.
- Comparison content: "FSBO vs Mesa Listing Service vs Full Service" — detailed table + calculator embedded.
- Local landing pages targeting buyer intent: `/buy/mesa/`, `/buy/gilbert/`, `/buy/chandler/`.

### Programmatic SEO opportunity
Every ZIP page can have a "Homes for sale in {ZIP}" section auto-generated from MLS feed once ARMLS integration lands. That's ~90 programmatic pages per ZIP × 20 ZIPs = 1,800 pages with unique content and genuine user value. This is the path to real Google traffic.

## Phase D — Lead gen optimization (cross-cutting)

### Missing conversion surfaces

1. **Blog post CTA** — every post ends with a generic "Contact us" link. Replace with context-aware CTAs:
   - Selling-related post → `/tools/home-value`
   - Buying-related post → `/tools/affordability`
   - FSBO post → `/fsbo/`
   - Neighborhood post → lead capture with "Get listings in {city}"
2. **Exit-intent modal** — single one, appears once per session on scroll-up past viewport edge. Offer "free Mesa market report PDF" → email capture.
3. **Sticky CTA on scroll** — we have the mobile contact bar. Add a desktop one that appears after user scrolls 60% down.
4. **Inline lead magnets** — embedded Home Value widget in every blog post about selling.
5. **Gated content** — download a PDF after providing email. "Mesa Seller's Guide 2026" (AI-generated, 12 pages, real value).

### Missing trust signals
- **Testimonials** — none on the site currently. Even 3 genuine reviews kill 10% of friction.
- **"Why MesaHomes" page** — owner's story, Mesa roots, team.
- **Press or mentions** — even local blog mentions can be stacked into a "As seen on" strip.

## Phase E — Technical SEO depth

### Schema.org enrichment (2 hours)
Add these JSON-LD structured data blocks:

- `LocalBusiness` on homepage (with address, phone, hours, geo coords)
- `RealEstateAgent` on about page (owner license info + team)
- `FAQPage` on `/faq` (we already have the Q&A — just need the wrapper)
- `BreadcrumbList` on deep pages
- `Article` + `Person` (author) on blog posts
- `AggregateRating` once we have testimonials
- `Service` for each pricing tier (with price, description)

### Technical audit checklist
- [ ] Confirm robots.txt allows all public pages, blocks /dashboard and /auth (DONE per STEERING.md)
- [ ] Confirm sitemap.xml includes all dynamic routes and updates on deploy
- [ ] Confirm all images have descriptive alt text (audit needed)
- [ ] Confirm Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 on all pages
- [ ] Confirm mobile-first rendering
- [ ] Open Graph + Twitter cards on every page
- [ ] hreflang only if we launch Spanish (not yet — note for later)

## Priority-ranked action list (my recommendation)

### This week (4-5 hours total)
1. **GA4 + Clarity + Search Console** (90 min) — unblocks everything else
2. **UTM + attribution capture** (2 hr)
3. **Fix blog `[slug]` to read from DynamoDB** (2 hr) — unblocks content publishing

### Week 2 (6-8 hours)
4. **Content CTAs on blog posts** (1 hr)
5. **Schema.org enrichment** (2 hr)
6. **Google Business Profile setup** (30 min) + claim listing in Mesa
7. **3 new pillar blog posts** with inline lead magnets (~2 hr each via Bedrock + owner edit)

### Week 3
8. **Exit-intent modal + desktop sticky CTA** (2 hr)
9. **Hyperlocal content pipeline Phase 1** — monthly market data page per city (4-6 hr)
10. **First testimonial** collection form + display (2 hr)

### Month 2+
11. **ZIP-level landing pages** (programmatic SEO) — requires ARMLS integration
12. **Retargeting pixel** (Meta + Google) — only after we have traffic volume to retarget
13. **Gated lead magnet PDFs** (2-3 hr per PDF)

## What I want to know from owner

1. **Analytics choice**: GA4 + Clarity + GSC (my recommendation, free) or Plausible ($9/mo)? Default to GA4 unless you push back.
2. **Do you have a Google account ready** for analytics setup, or need me to guide through account creation? The property gets tied to whoever creates it.
3. **Google Business Profile**: already claimed? If not, start the verification flow today — it takes 5-7 days for Google to mail a postcard with a PIN.
4. **Cookie banner**: required? No EU traffic means GDPR isn't strictly in play, but Arizona may have state-level data rules. Safer to ship a simple banner.
5. **Priorities**: want me to start with GA4 + Clarity + GSC now, or pick a specific item from Phase D (lead gen optimization)?

## Cost summary

Everything in Phase A is **$0/month**. Everything in Phase B–E is **$0/month** except:
- Possible retargeting pixel ad spend (variable)
- Possible gated PDF lead magnets delivery (if we want email tool beyond SES, like ConvertKit — $15/mo starter)
- Content generation via Bedrock Haiku: ~$0.001 per blog post, budget $5/month covers thousands of drafts.

Total infrastructure cost for analytics + content + lead gen stack at current traffic: **~$0/month**.
