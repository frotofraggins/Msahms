# Free Public Data Sources — Research & Recommendations

Author: Kiro A, 2026-04-26. Status: research memo. Est. 1-2 hours per
source to integrate when prioritized.

## What we're using today

| Source | Dataset | Use |
|---|---|---|
| Zillow Research | 13 CSVs (ZHVI, ZORI, ZHVF, inventory, sale price, sales count, sale-to-list, days pending, price cuts, market heat, new construction, affordability, median sale price) | Metro + ZIP market data, /market/metro endpoint, MarketSnapshot component |
| Maricopa County Assessor | ArcGIS REST | Property lookup, comps, APN, sale history, sqft, year built |
| Pinal County Assessor | ArcGIS REST | Same as above, for SE Mesa / San Tan Valley |
| Google Maps Street View Static API | Property photos | Placeholder replaced with real SV images after Luke Ln fix |

## High-value gaps — free public data we could add

### 🟢 Tier 1 — High value, fully free, easy to integrate

#### 1. FRED (Federal Reserve Economic Data) — mortgage rates + economic indicators
- **URL**: https://fred.stlouisfed.org/docs/api/fred/
- **API key**: Free, instant signup at fredaccount.stlouisfed.org
- **Rate limits**: None practical (thousands of requests/min)
- **Data of interest**:
  - `MORTGAGE30US` — Freddie Mac 30-year fixed weekly rate
  - `MORTGAGE15US` — 15-year fixed
  - `PHOE004UR` — Phoenix-Mesa-Scottsdale MSA unemployment rate
  - `CPIAUCSL` — national CPI
  - `MSACSR` — monthly supply of homes ratio
- **Why it matters**: The `mortgage-cost-transparency.md` spec called for FRED
  rates on the affordability tool. Currently the tool asks users to manually
  input `interestRate` — a FRED call could auto-default to the current week's
  rate and show "as of YYYY-MM-DD." Builds trust and reduces friction.
- **Estimated cost**: $0
- **Integration effort**: 1-2 hours (new Lambda or extend market-data)

#### 2. FEMA NFHL (National Flood Hazard Layer) — flood zone designation
- **URL**: https://hazards.fema.gov/femaportal/wps/portal/NFHLWMSkmzdownload
- **API**: ArcGIS REST service at
  https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer
- **API key**: None required
- **Data of interest**: Flood zone designation for any lat/long (X, AE, AH, VE, etc.)
  A = 1% annual flood risk; X = lowest risk
- **Why it matters**: Every buyer in Arizona cares. Mesa areas near Salt River
  and Queen Creek Wash have flood-zone parcels. Returning "Flood zone: X
  (lowest risk)" or "Flood zone: AE — flood insurance required" on the
  property lookup response is a genuine trust builder.
- **Estimated cost**: $0
- **Integration effort**: 2-3 hours (add to property-lookup Lambda, enrich
  response, cache in DynamoDB)

#### 3. Census ACS (American Community Survey) — demographics by ZIP
- **URL**: https://api.census.gov/data/2023/acs/acs5
- **API key**: Free, instant at https://api.census.gov/data/key_signup.html
- **Rate limits**: 500 queries/day/IP without key; unlimited with key
- **Data of interest** (by ZIP Code Tabulation Area):
  - Median household income
  - Population
  - Age distribution
  - Owner vs renter breakdown
  - Commute time to work
  - Education attainment
  - Racial/ethnic composition
- **Why it matters**: City pages (`/areas/mesa/`, etc.) currently have
  shallow demographics. Census ACS gives us real "Median household income:
  $78K, 62% homeowner, avg commute 28 min" — concrete numbers that outrank
  generic competitor pages for "what's it like to live in Mesa AZ."
- **Estimated cost**: $0
- **Integration effort**: 3-4 hours (one-time batch per ZIP, store in
  DynamoDB, served via new endpoint or extension of content-api)

#### 4. BLS (Bureau of Labor Statistics) — Phoenix MSA employment
- **URL**: https://api.bls.gov/publicAPI/v2/timeseries/data/
- **API key**: Optional, but doubles rate limit to 500/day
- **Data of interest**:
  - Phoenix MSA unemployment rate (monthly)
  - Industry employment growth
  - Wage trends
- **Why it matters**: Buyer confidence tracks employment stability. "Phoenix
  MSA unemployment 3.4% vs national 4.1%" is a compelling data point to show
  on buyer-focused landing pages. Lower priority than Census because BLS
  data is published less granularly (MSA only, not ZIP).
- **Estimated cost**: $0
- **Integration effort**: 2 hours

#### 5. USGS Earthquake Catalog — seismic activity
- **URL**: https://earthquake.usgs.gov/fdsnws/event/1/
- **API key**: None required
- **Data of interest**: Recent quakes within radius of a lat/long
- **Why it matters**: Arizona had a 4.9 mag near Superstition Mountains in
  2024 and buyers in Apache Junction / Gold Canyon ask about this. "No
  seismic activity recorded within 10 miles in last 5 years" = trust point.
- **Estimated cost**: $0
- **Integration effort**: 1 hour

### 🟡 Tier 2 — Medium value, free with friction

#### 6. HUD Fair Market Rents API
- **URL**: https://www.huduser.gov/hudapi/public/
- **API key**: Free, email registration required (~24h approval)
- **Data of interest**: HUD's fair market rent by ZIP for each bedroom count
- **Why it matters**: Our Sell-Now-or-Wait calculator uses this directly —
  lets users compare "If I rent this out vs sell" with HUD benchmarks.
  Investors buying for rental would love this.
- **Estimated cost**: $0
- **Integration effort**: 2-3 hours

#### 7. NOAA Weather — climate data
- **URL**: https://www.ncdc.noaa.gov/cdo-web/api/v2/
- **API key**: Free, email registration, ~15 min approval
- **Data of interest**: 30-year temperature/precipitation normals by ZIP
- **Why it matters**: Out-of-state buyers ask "how hot does it get?" Showing
  "Mesa averages 107°F July high, 3.5 days over 115°F/year" on city pages is
  genuinely useful. Quiet luxury appeal.
- **Estimated cost**: $0
- **Integration effort**: 2 hours

#### 8. NCES (National Center for Education Statistics) — school data
- **URL**: https://educationdata.urban.org/documentation/schools.html
  (Urban Institute wraps NCES CommonCore)
- **API key**: None required
- **Data of interest**: Schools by ZIP with enrollment, student-teacher ratio,
  grade levels, Title I status
- **Why it matters**: GreatSchools API charges $97/month for ratings.
  NCES gives us objective data (enrollment, ratio, grade span) for free
  — "Mesa High School, 2,800 students, 20:1 student-teacher ratio, grades 9-12"
  is less marketing-y than a rating but arguably more useful.
- **Estimated cost**: $0
- **Integration effort**: 3-4 hours (one-time batch by ZIP, cache)

### 🔴 Tier 3 — Don't bother

#### 9. OpenStreetMap + Overpass API — nearby amenities
- Free, but building a competitive walkscore alternative is months of work
- Better to defer until we have signal that it matters

#### 10. GreatSchools API — rated school quality
- $97/month for basic tier, scales up from there
- Custom scrapers on Apify are $10/1000 calls and brittle
- Not worth the cost or legal risk; NCES data (above) is 80% of the value

#### 11. Walk Score API
- $200+/month commercial tier for website embedding
- Not clearly worth the spend at pre-revenue stage
- Revisit at Phase 2 (like chatbot)

## Recommended rollout

Grouped by ROI and user impact:

### Week 1 (post-launch stabilization)
- **FRED mortgage rates** (1-2 hrs): directly fills the mortgage-cost-transparency
  gap identified in the audit. Affordability tool becomes genuinely useful
  when rate auto-populates at Freddie Mac weekly average.
- **FEMA flood zones** (2-3 hrs): enriches property-lookup response with
  flood-zone designation. Differentiator no competitor has for free.

### Week 2-4
- **Census ACS** (3-4 hrs): makes city pages actually informative about
  demographics. Real SEO moat — competitors pay for this data via vendors.
- **HUD FMR** (2-3 hrs): extends sell-now-or-wait + investor tool calculators.

### Month 2+
- **BLS employment** (2 hrs): buyer-landing enrichment
- **NOAA weather** (2 hrs): city page climate data
- **USGS earthquakes** (1 hr): Apache Junction / east county concern
- **NCES school data** (3-4 hrs): objective school facts by ZIP

### Defer indefinitely
- GreatSchools ratings (cost)
- Walk Score (cost)
- OpenStreetMap amenities (effort)

## Total effort to implement Tier 1+2 (items 1-8)
~18-22 hours of dev work, $0 operating cost, significantly stronger
content and user trust vs. Zillow / Redfin / competitor sites.

## Implementation notes

### Caching strategy
All of these sources change slowly (FRED weekly, Census annually, FEMA
rarely, NOAA 30-year normals). **DynamoDB cache with a data-pipeline
Lambda** that refreshes on a schedule is the right pattern:

- FRED: weekly refresh
- Census: annual refresh
- FEMA: annual refresh (flood maps update every 1-5 years)
- BLS: monthly refresh
- HUD FMR: annual refresh
- NOAA: static (30-year normals don't change)
- USGS: weekly refresh

### Schema
Store under distinct PKs:
- `RATE#MORTGAGE30US`, SK: `WEEK#{YYYY-MM-DD}`
- `FLOOD#{lat-rounded}#{lng-rounded}`, SK: `ZONE`
- `DEMO#ZIP#{zip}`, SK: `ACS#{YYYY}`
- `EMPLOYMENT#MSA#phoenix`, SK: `MONTH#{YYYY-MM}`
- `RENT#ZIP#{zip}`, SK: `FMR#{YYYY}`

### Secrets
Only FRED, BLS, HUD, and NOAA require API keys. All go in Secrets Manager:
- `mesahomes/live/fred-api-key`
- `mesahomes/live/bls-api-key` (optional)
- `mesahomes/live/hud-api-key`
- `mesahomes/live/noaa-api-key`

### What user-facing gains look like

**Affordability tool (FRED)**:
> "Based on today's 30-year fixed rate: **6.58%** (Freddie Mac PMMS, week of Apr 24 2026)"

**Property lookup (FEMA)**:
> "**Flood zone X** — minimal flood hazard. Flood insurance not required by lenders for this parcel."

**City page (Census)**:
> Mesa key stats: median household income $78,400 • 62% homeowner rate • 3.2 people/household • avg commute 27 min • 28% college-educated

**Buyer landing (BLS)**:
> Phoenix metro unemployment: **3.4%** (Mar 2026) vs national 4.1%. Strong job market supports home values.

**City page (NOAA)**:
> Mesa climate: avg Jul high 107°F (41°C) • 3.5 days/yr above 115°F • 9" annual rainfall • 294 sunny days/yr

## Decision needed from owner

Which tier to prioritize?

- **A**: Tier 1 items 1-2 (FRED + FEMA) this week — highest per-hour ROI
- **B**: Tier 1 all 5 (FRED + FEMA + Census + BLS + USGS) this week — ~12 hrs
- **C**: Defer all until post-launch traffic validates which pages need enrichment
- **D**: Cherry-pick specific items

Recommend **A**: FRED + FEMA in one dev session. Both are immediately visible
on existing tool + property pages. Census and the others ride along once we
see real user behavior.
