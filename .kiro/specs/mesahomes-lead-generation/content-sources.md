# MesaHomes Local Content Sources — Verified APIs & Data Feeds

## Overview

These are verified, working data sources for making MesaHomes the go-to local
information hub for Mesa and the East Valley. Your local AI scraper processes
these sources daily/weekly, generates summaries, and queues content for human
review before publishing.

---

## 1. MESA LEGISTAR API (Government Meetings, Zoning, Ordinances)

**VERIFIED WORKING** — Free, no auth, JSON REST API

**Base URL:** `https://webapi.legistar.com/v1/mesa`

This is the single best source for local government intelligence. It covers
every public meeting, zoning case, ordinance, and resolution in Mesa.

### Available Endpoints

| Endpoint | Description |
|---|---|
| `/events` | All meetings (City Council, Planning & Zoning, committees) |
| `/events/{id}/eventitems` | Agenda items for a specific meeting |
| `/bodies` | All boards/committees (29 total) |
| `/matters` | Legislative matters (zoning cases, ordinances, resolutions) |
| `/matters/{id}` | Detail on a specific matter |
| `/matters/{id}/histories` | Voting history on a matter |
| `/matters/{id}/attachments` | Attached documents (agendas, staff reports) |
| `/persons` | Council members and board members |

### Key Boards for Real Estate Content

| Body ID | Name | Why It Matters |
|---|---|---|
| 138 | City Council | Final approval on rezonings, ordinances, budgets |
| 153 | Planning & Zoning Board - Public Hearing | Zoning cases, development approvals |
| 215 | Planning Hearing Officer | Variances, special use permits |
| 251 | Board of Adjustment Public Hearing | Zoning variances |
| 279 | Design Review Board | Building design standards |
| 268 | Historic Preservation Board | Historic district changes |
| 242 | Eastmark CFD Board | Eastmark development district |
| 252 | Cadence CFD Board | Cadence development district |
| 169 | Audit and Finance Committee | City budget, financial decisions |
| 171 | General and Economic Development Committee | Business development |

### Example: Get Recent Zoning Cases
```bash
curl "https://webapi.legistar.com/v1/mesa/events?\$filter=EventBodyId eq 153&\$top=5&\$orderby=EventDate desc" \
  -H "Accept: application/json"
```

### Example: Get Agenda Items for a Meeting
```bash
curl "https://webapi.legistar.com/v1/mesa/events/4662/eventitems" \
  -H "Accept: application/json"
```

### Verified Data (April 22, 2026 Planning & Zoning Meeting)
Real zoning cases pulled from the API:
- **ZON25-00635 "Ascension"** — 40 acres at Brown & 32nd St, rezone AG to RS-15-PAD, 47-lot subdivision (District 1). Staff: Approval with Conditions.
- **ZON25-00626 "NTT Mesa PH10"** — 173 acres at Pecos & Crismon, 2.2M sqft Data Center (District 6). Continued to May 13.
- **ZON25-00578 "New Life Fellowship"** — 0.6 acres near Broadway & Dobson, 6,421 sqft church (District 3). Staff: Approval with Conditions.

### Content Generation Pipeline
```
Daily: Query /events for meetings in next 7 days
  → Local AI summarizes agenda items
  → Generate "Upcoming Mesa Meetings" post
  → Queue for human review

After each meeting: Query /events/{id}/eventitems
  → Local AI summarizes decisions, zoning approvals, votes
  → Generate "What Happened at Mesa City Council" post
  → Tag with affected neighborhoods/ZIPs
  → Queue for human review

Weekly: Query /matters for new zoning cases
  → Local AI explains what each rezoning means for nearby homeowners
  → Generate "New Development Coming to [Neighborhood]" posts
  → Include map, affected area, timeline
  → Queue for human review
```

---

## 2. MESA CITY DATA PORTAL

**URL:** https://www.mesaaz.gov (various pages)
**GovDelivery newsletters:** https://content.govdelivery.com/accounts/AZMESA/

### Available Data
- Building permits (residential + commercial)
- Code compliance cases
- Crime statistics
- Development services updates
- Parks & recreation programs
- Road closures and construction
- Utility rate changes
- Election information

### Scraping Approach
Your local LLM scraper should monitor:
- `mesaaz.gov/Government/Public-Records-Requests` — new public records
- `mesaaz.gov/Business-Development/Development-Services` — new permits, projects
- `mesaaz.gov/Government/Public-Information-Communication` — press releases
- GovDelivery newsletters (subscribe to all Mesa categories)

---

## 3. HOA DATA SOURCES

### Maricopa County Assessor — Subdivision Data
The Maricopa County GIS API returns `SUBNAME` (subdivision name) for every parcel.
Query all unique subdivisions in a ZIP to build an HOA directory.

```bash
# Get all subdivisions in Mesa 85201
curl -sk "https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query\
?where=PHYSICAL_CITY='MESA' AND PHYSICAL_ZIP LIKE '85201%'\
&f=json&outFields=SUBNAME&returnGeometry=false&returnDistinctValues=true&resultRecordCount=500"
```

### Pinal County — Subdivision Data
```bash
curl -sk "https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query" \
  -d "where=PSTLZIP5='85140'" \
  -d "f=json" \
  -d "outFields=CNVYNAME" \
  -d "returnGeometry=false" \
  -d "returnDistinctValues=true" \
  -d "resultRecordCount=500"
```

### HOA Cost & Sentiment Sources
- **Arizona Department of Real Estate** — HOA registration lookup
- **Google Reviews** — scrape HOA management company reviews
- **Reddit r/mesaaz, r/phoenix** — HOA complaint threads
- **BBB** — HOA management company ratings
- **Nextdoor** (manual) — neighborhood sentiment (can't scrape, but can reference)

### Content Generation
```
Monthly: Query all subdivisions per ZIP
  → Cross-reference with HOA registration data
  → Local AI generates "HOA Guide for [Subdivision]" pages
  → Include: estimated HOA fees (from listing data when available),
    management company, amenities, common complaints
  → Queue for human review
```

---

## 4. NEWS & LOCAL MEDIA SOURCES

### RSS Feeds to Monitor
| Source | Feed URL | Content Type |
|---|---|---|
| Mesa Republic / AZ Central | `azcentral.com/arcio/rss/` (Mesa section) | Local news |
| East Valley Tribune | `eastvalleytribune.com/feed/` | East Valley news |
| Mesa City Press Releases | GovDelivery subscription | Official city news |
| AZ Big Media | `azbigmedia.com/feed/` | Business/development news |
| Phoenix Business Journal | `bizjournals.com/phoenix/` | Commercial real estate |

### Content Generation
```
Daily: Fetch RSS feeds
  → Filter for Mesa/East Valley real estate keywords:
    "zoning", "development", "housing", "construction",
    "permit", "rezoning", "subdivision", "apartment",
    "commercial", "retail", "office", "warehouse",
    "HOA", "property tax", "assessment"
  → Local AI summarizes relevant articles
  → Generate "Mesa Real Estate News Roundup" posts
  → Link to original sources (don't republish)
  → Queue for human review
```

---

## 5. SCHOOL DISTRICT DATA

### Arizona Department of Education
- School ratings and report cards
- Attendance boundaries
- Enrollment data

### Mesa Public Schools
- `mpsaz.org` — district info, school boundaries
- Bond elections, budget decisions

### Content Generation
```
Annually: Update school ratings for each ZIP
  → Generate "Schools in [ZIP/Neighborhood]" pages
  → Include: school names, grades served, ratings, distance
  → Cross-reference with property values by school zone
```

---

## 6. AUTOMATION ARCHITECTURE

### Daily Content Pipeline (runs on your local RTX 4090)

```
6:00 AM — Legistar API check
  → New meetings scheduled? → Generate preview posts
  → Meetings completed? → Generate summary posts
  → New zoning cases? → Generate impact analysis posts

7:00 AM — News RSS check
  → Filter for real estate keywords
  → Summarize relevant articles
  → Generate news roundup

8:00 AM — Queue review
  → All generated content goes to DynamoDB with status="pending-review"
  → Email notification to you with daily content summary
  → You approve/edit/reject via dashboard

On approval → Publish to mesahomes.com
  → Update sitemap.xml
  → Share to social media (manual or scheduled)
```

### Weekly Content Pipeline

```
Monday — Market update
  → Pull latest Zillow Research data
  → Compare to previous week/month
  → Generate "Mesa Market Update" post

Wednesday — Zoning/development roundup
  → Summarize all zoning cases from past week
  → Map affected areas
  → Generate "What's Being Built in Mesa" post

Friday — Neighborhood spotlight
  → Rotate through Mesa ZIPs/subdivisions
  → Pull property data, market stats, school info
  → Generate "Neighborhood Guide: [Area]" post
```

### Monthly Content Pipeline

```
17th — Zillow data refresh
  → Download new CSVs
  → Generate "Monthly Market Report" post
  → Update all city page stats

End of month — HOA directory refresh
  → Query subdivision data
  → Update HOA pages
  → Generate "HOA Cost Comparison" content
```

---

## 7. CONTENT TYPES FOR SOCIAL MEDIA

Each content type should have a shareable format:

| Content Type | Frequency | Social Format |
|---|---|---|
| Zoning case summary | Per meeting | Instagram carousel, Facebook post |
| Market update | Weekly | Infographic, short video |
| Neighborhood guide | Weekly | Blog post + social teaser |
| News roundup | Daily | Twitter/X thread, Facebook post |
| HOA spotlight | Monthly | Blog post |
| School zone update | Annually | Blog post + social |
| New development alert | As they happen | All platforms |
| City council recap | Per meeting | Blog post + social summary |

### Embeddable Tools for Social
Each tool page should have a "Share" button that generates:
- Open Graph preview (title, description, image)
- Direct link to the tool with pre-filled parameters
- Example: "I just found out my Mesa home is worth $X — check yours at mesahomes.com/tools/home-value"


---

## 8. REDDIT & COMMUNITY SENTIMENT DATA

### Subreddits to Monitor
| Subreddit | Content | Scrape Method |
|---|---|---|
| r/mesaaz | Mesa-specific discussions, complaints, recommendations | Reddit JSON API (append .json to any URL) |
| r/phoenix | Phoenix metro discussions (filter for Mesa/East Valley) | Reddit JSON API |
| r/arizona | State-level issues affecting Mesa | Reddit JSON API |
| r/realestate | National RE discussions mentioning Mesa/AZ | Reddit search API |
| r/firsttimehomebuyer | Buyer questions about Mesa area | Reddit search API |
| r/landlord | Landlord discussions about Mesa/AZ | Reddit search API |
| r/HOA | HOA complaints and advice (filter AZ/Mesa) | Reddit search API |

### Reddit JSON API (Free, No Auth for Read)
```bash
# Get recent posts from r/mesaaz
curl "https://www.reddit.com/r/mesaaz/new.json?limit=25" -H "User-Agent: MesaHomesBot/1.0"

# Search Reddit for Mesa real estate discussions
curl "https://www.reddit.com/search.json?q=mesa+arizona+real+estate&sort=new&limit=25" -H "User-Agent: MesaHomesBot/1.0"

# Search for specific subdivision/HOA discussions
curl "https://www.reddit.com/search.json?q=%22pecan+creek%22+mesa&sort=relevance&limit=10" -H "User-Agent: MesaHomesBot/1.0"
```

### Sentiment Analysis Pipeline
```
Daily: Scrape r/mesaaz and r/phoenix (Mesa-filtered)
  → Local AI categorizes posts: housing, safety, schools, traffic, development, HOA, utilities
  → Extract neighborhood mentions and sentiment (positive/neutral/negative)
  → Store in DynamoDB: SENTIMENT#{zip}#{date}
  → Feed into neighborhood guide pages as "What Residents Say"

Weekly: Search Reddit for each Mesa subdivision name
  → Aggregate sentiment per subdivision
  → Update HOA/neighborhood pages with community sentiment summary
  → Flag negative trends for content opportunities
```

---

## 9. HOA DEEP DATA

### Sources for HOA Information
| Data Point | Source | Method |
|---|---|---|
| HOA name & management company | Arizona Dept of Real Estate HOA registry | Web scrape |
| HOA fees (estimated) | Listing data when available, Zillow/Redfin public pages | Scrape with caution |
| HOA rules summary | CC&Rs filed with county recorder | Phase 2 (recorder scraping) |
| HOA management company reviews | Google Maps API (Places) | API call |
| Resident sentiment | Reddit, Google Reviews, Yelp | Scrape + API |
| Amenities | HOA websites, listing descriptions | Scrape |
| Board meeting schedules | HOA websites | Scrape |

### Arizona HOA Registry
```
URL: https://services.azre.gov/publicdatabase/SearchHOA.aspx
Method: Web scrape (form submission)
Data: HOA name, management company, contact info, registration status
```

### Google Places API for HOA Reviews
```bash
# Search for HOA management company reviews
# Uses Google Places API (free tier available)
# Step 1: Find the place
GET https://maps.googleapis.com/maps/api/place/findplacefromtext/json
  ?input=Pecan+Creek+HOA+San+Tan+Valley
  &inputtype=textquery
  &fields=place_id,name,rating,user_ratings_total
  &key={GOOGLE_API_KEY}

# Step 2: Get reviews
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id={place_id}
  &fields=reviews,rating,user_ratings_total
  &key={GOOGLE_API_KEY}
```

### Content Generation for HOAs
```
For each subdivision in service area:
  1. Query county GIS for all parcels in subdivision → get parcel count, avg assessed value
  2. Search AZ HOA registry for management company
  3. Search Google Places for management company reviews
  4. Search Reddit for subdivision name mentions
  5. Local AI generates "Living in [Subdivision]" page:
     - Location and nearby amenities
     - Estimated HOA fees (if available)
     - Management company + rating
     - What residents say (Reddit/Google sentiment)
     - Nearby schools
     - Market data (avg home value, recent sales)
     - Pros and cons (AI-synthesized from reviews)
  6. Queue for human review
```

---

## 10. MEETING REFERENCE LINK EXPANSION

When the Legistar API returns agenda items that reference external documents,
ordinances, or other matters, the AI should follow those references.

### Reference Expansion Pipeline
```
For each agenda item from Legistar:
  1. Extract references: ordinance numbers, zoning case IDs, parcel numbers, addresses
  2. For zoning case IDs → query /matters/{id} for full details + attachments
  3. For parcel numbers → query county GIS for property data
  4. For addresses → run property lookup (same as user-facing tool)
  5. For ordinance references → query /matters with filter
  6. For external links in agenda PDFs → fetch and summarize with local AI
  7. Compile into plain-English summary:
     "The city is considering rezoning 40 acres at Brown & 32nd Street
      from agricultural to residential. This would allow 47 new homes
      to be built. The land is currently assessed at $X. Nearby homes
      in [subdivision] sell for $X-$Y. Staff recommends approval."
```

---

## 11. ELECTION & CIVIC DATA

### Mesa Election Information
- **Source:** `mesaaz.gov/Government/City-Clerk` → Election Information
- **Maricopa County Elections:** `recorder.maricopa.gov` → election results
- **Arizona Secretary of State:** `azsos.gov` → statewide elections, ballot measures

### Content Types
| Content | Frequency | Source |
|---|---|---|
| City Council election candidates | Election cycle | Mesa City Clerk |
| Bond elections (schools, infrastructure) | As scheduled | Mesa/MPS websites |
| Property tax ballot measures | Election cycle | County/State |
| Voter registration deadlines | Quarterly | AZ Secretary of State |
| Election results + impact analysis | Post-election | County recorder |

### Why This Matters for Real Estate
- Bond elections affect property taxes
- Zoning ballot measures affect development
- Council member changes affect development policy
- School bond elections affect school quality → home values

---

## 12. ADDITIONAL LOCAL DATA SOURCES

| Source | Data | URL/Method |
|---|---|---|
| Mesa Police crime stats | Crime data by area | `mesaaz.gov` data portal |
| Mesa Parks & Recreation | Park locations, programs | `mesaaz.gov` parks pages |
| Mesa Public Library | Library locations | `mesaaz.gov` library pages |
| Valley Metro | Transit routes, light rail | `valleymetro.org` GTFS feed |
| ADOT | Road construction, highway projects | `azdot.gov` project pages |
| Mesa Water | Utility rates, water restrictions | `mesaaz.gov` utilities |
| SRP/APS | Electric rates by area | `srpnet.com` / `aps.com` |
| Maricopa Air Quality | Air quality index | `maricopa.gov` air quality |
| USPS | New construction delivery points (proxy for new homes) | USPS data |

### Content Ideas from These Sources
- "Cost of Living in Mesa: Utilities, Taxes, and HOA Breakdown"
- "Mesa's Best Parks by Neighborhood"
- "Light Rail Impact on Home Values Along the Route"
- "Mesa Water Rates vs Gilbert vs Chandler"
- "Crime Stats by Mesa ZIP Code — What the Numbers Actually Mean"
- "New Road Construction That Will Affect Your Commute"

---

## 13. FULL CONTENT CALENDAR SUMMARY

| Day | Content | Source | AI Task |
|---|---|---|---|
| Mon | Weekly market update | Zillow Research | Summarize trends |
| Tue | Government meeting preview | Legistar API | Summarize upcoming agendas |
| Wed | Development/zoning roundup | Legistar matters | Explain zoning cases |
| Thu | Neighborhood spotlight | County GIS + Reddit + Google | Profile a subdivision |
| Fri | News roundup | RSS feeds + Reddit | Curate Mesa real estate news |
| Sat | Tool of the week | MesaHomes tools | Highlight a tool with example |
| Sun | Community Q&A | Reddit threads | Answer common Mesa RE questions |

All content generated by local AI → queued for human review → published after approval.


---

## 14. RELOCATION CONTENT (High-Intent Lead Capture)

Phoenix-Mesa metro gets 15,300+ net migrants per year. Top source states: California,
Washington, Illinois, New York, Oregon. These people search months before moving and
are high-intent buyer leads.

### Target Search Terms (SEO pages to build)
```
"moving to Mesa AZ"                    → /moving-to-mesa
"moving to Mesa from California"       → /moving-to-mesa/from-california
"moving to Mesa from [state]"          → /moving-to-mesa/from-{state}
"Mesa vs Gilbert"                      → /compare/mesa-vs-gilbert
"Mesa vs Chandler"                     → /compare/mesa-vs-chandler
"Mesa vs Queen Creek"                  → /compare/mesa-vs-queen-creek
"cost of living Mesa AZ"               → /moving-to-mesa/cost-of-living
"best neighborhoods in Mesa"           → /moving-to-mesa/neighborhoods
"Mesa AZ pros and cons"                → /moving-to-mesa/pros-and-cons
"is Mesa AZ a good place to live"      → /moving-to-mesa/is-it-good
"Mesa AZ schools"                      → /moving-to-mesa/schools
"Mesa AZ weather"                      → /moving-to-mesa/weather
"jobs in Mesa AZ"                      → /moving-to-mesa/jobs
"Mesa AZ property taxes"               → /moving-to-mesa/taxes
"Mesa AZ HOA fees"                     → /moving-to-mesa/hoa
"Mesa AZ vs [other AZ city]"           → /compare/mesa-vs-{city}
"relocating to Phoenix area"           → /moving-to-mesa (capture Phoenix searches too)
```

### What Relocators Want to See (page structure)
```
/moving-to-mesa
├── Cost of Living Calculator
│   Compare your current city vs Mesa:
│   - Housing cost (median home price, rent)
│   - Property taxes (0.68% vs their state)
│   - Income tax (AZ flat 2.5% vs CA 13.3%, etc.)
│   - Utilities (SRP/APS rates, water)
│   - Groceries, gas, insurance
│   → Lead capture: "Get a personalized cost comparison"
│
├── Neighborhood Matcher
│   "Tell us what matters to you" quiz:
│   - Budget range
│   - Commute location (employer/area)
│   - School quality priority
│   - Lot size preference
│   - New construction vs established
│   - HOA tolerance
│   → Recommends top 3 Mesa neighborhoods
│   → Lead capture: "Get a detailed neighborhood report"
│
├── State-Specific Pages (/from-california, /from-washington, etc.)
│   Each page covers:
│   - Tax savings (state income tax comparison)
│   - Housing cost comparison (median home price there vs here)
│   - What $X buys you there vs here (side-by-side)
│   - Climate comparison
│   - Job market comparison
│   - "People who moved from [state] say..." (Reddit sentiment)
│   - Common surprises (HOAs, summer heat, no basements, etc.)
│   → Lead capture: "Talk to an agent who helps [state] relocators"
│
├── City Comparison Pages (/mesa-vs-gilbert, etc.)
│   Side-by-side comparison:
│   - Median home price
│   - Property tax rate
│   - School ratings
│   - Commute times to major employers
│   - HOA prevalence and avg cost
│   - New construction availability
│   - Walkability / amenities
│   - Crime stats
│   → Lead capture: "Not sure which city? Get a free consult"
│
├── Schools Guide
│   - District overview (Mesa Public Schools, Gilbert Unified, etc.)
│   - School ratings by ZIP
│   - Charter school options
│   - Private school options
│   → Links to neighborhood guides by school zone
│
├── Jobs & Employers
│   - Major employers in Mesa/East Valley
│   - Commute times from each neighborhood
│   - Remote work friendly areas
│   - Tech corridor / innovation district info
│
└── First 90 Days Checklist
    - Driver's license transfer
    - Vehicle registration
    - Voter registration
    - Utility setup (SRP, APS, Mesa water)
    - HOA registration
    - School enrollment
    - Local services (doctors, dentists, vets)
    → Lead capture: "Download the complete relocation guide PDF"
```

### Data Sources for Relocation Content
| Data Point | Source |
|---|---|
| Cost of living comparison | BLS CPI data, Zillow Research, Census ACS |
| State tax comparison | State tax authority websites (public) |
| Median home prices by city | Zillow Research CSVs (already have) |
| School ratings | AZ Dept of Education, GreatSchools API |
| Crime stats | Mesa PD data portal, FBI UCR |
| Commute times | Google Maps Distance Matrix API (free tier) |
| Major employers | Mesa Economic Development, AZ Commerce Authority |
| Reddit sentiment by state | Reddit JSON API (search "moved to Mesa from California") |
| Weather data | NOAA / weather.gov (free API) |

### Lead Capture Strategy for Relocators
These are the highest-intent leads you can get — someone actively planning a move.

Every relocation page should have:
1. **Cost comparison calculator** (interactive, partial results free)
2. **Neighborhood matcher quiz** (results require email)
3. **Downloadable relocation guide PDF** (requires name + email + phone + timeline + current state)
4. **"Talk to a relocation specialist"** CTA (direct consult booking)
5. **Property alert signup** ("Get notified when homes in your budget hit the market in Mesa")

Tag all relocation leads with:
- `leadType: Buyer`
- `toolSource: relocation-{state}` or `relocation-guide`
- `tag: relocator`
- `tag: from-{state}`

This lets you route relocator leads to agents who specialize in helping out-of-state buyers.


---

## 15. COMMUNITY SAFETY DATA

### IMPORTANT: Fair Housing Compliance

Crime and safety data on a real estate site must be handled carefully:
- ✅ DO: Create standalone safety resource pages linking to official sources
- ✅ DO: Show city-wide and ZIP-level aggregate statistics from official sources
- ✅ DO: Link directly to official registries (AZ DPS, NSOPW) for individual lookups
- ❌ DON'T: Overlay crime/offender maps directly on property listings
- ❌ DON'T: Use terms like "safe neighborhood" or "dangerous area"
- ❌ DON'T: Use safety data in neighborhood recommendations or property tools
- ❌ DON'T: Integrate offender data into property search results

The safest approach: a standalone "Community Safety Resources" section that
provides factual data and links to official lookup tools.

### Mesa Police Open Data API — VERIFIED WORKING

**Base URL:** `https://data.mesaaz.gov/resource/`
**Auth:** None (Socrata Open Data API)
**Format:** JSON

**Police Incidents (2020-present):**
```bash
# Recent incidents
curl "https://data.mesaaz.gov/resource/hpbg-2wph.json?\$limit=50&\$order=occurred_date DESC"

# Incidents by crime type
curl "https://data.mesaaz.gov/resource/hpbg-2wph.json?\$where=crime_type='ROBBERY'&\$limit=50"

# Incidents near a location (within ~1 mile)
curl "https://data.mesaaz.gov/resource/hpbg-2wph.json?\$where=within_circle(location,33.415,-111.838,1609)"
```

**Response fields:**
| Field | Description | Example |
|---|---|---|
| crime_id | Unique ID | 2020200700418 |
| crime_type | Crime category | ROBBERY, ARSON, ASSAULT, BURGLARY |
| report_date | Date reported | 2020-03-10T00:00:00.000 |
| occurred_date | Date occurred | 2020-03-10T00:00:00.000 |
| address | Approximate address | 200 W MAIN ST |
| city | City | MESA |
| nibrs_code | NIBRS crime code | 120 |
| nibrs_description | NIBRS description | ROBBERY |
| location | GeoJSON point | { type: "Point", coordinates: [-111.838, 33.415] } |
| crime_against | Category | Property, Person, Society |
| offense_type | Group | Group A, Group B |

**Available crime datasets (70+ datasets):**
| Dataset ID | Name |
|---|---|
| hpbg-2wph | Police Incidents 2020-present |
| tq8y-k6mu | Police Incidents 2016-2019 |
| fj4p-dtpi | Priority 1 Calls by Patrol District |
| gwsk-z58i | Police Incidents by Census Tract |
| fds3-6363 | Police Incidents by Council District |
| 97zq-z8by | Calls for Service by Month/Division/Type |
| dfwi-s37g | Injury/Fatal Crashes |
| bfen-qa5d | Crime Reporting Statistics (UCR) |
| w2in-a2xc | Part I Crimes Per 1,000 Residents |

### Arizona Sex Offender Registry

**Official source:** Arizona Department of Public Safety via OffenderWatch
**URL:** https://www.azdps.gov/services/public/offender/
**Public lookup:** https://az.gov/directory/service/search-sex-offender

**National registry:** https://www.nsopw.gov/ (Dru Sjodin National Sex Offender Public Website)

**API option:** offenders.io offers a commercial API (900K+ records, GIS search)
- Not free, but could be Phase 2 if demand warrants it

**For MVP:** Link directly to the official AZ DPS and NSOPW lookup tools.
Do NOT scrape or republish offender data on MesaHomes.

### Arizona Crime Statistics Portal

**URL:** https://azcrimestatistics.azdps.gov/
**Mesa PD data:** https://azcrimestatistics.azdps.gov/tops/report/crime-overview/mesa-pd/2024

Provides:
- Violent crime trends (assault, robbery, homicide, rape)
- Property crime trends (burglary, theft, motor vehicle theft)
- Year-over-year comparisons
- Per-capita rates

### Content Structure for Safety Pages

```
/community/safety
├── Mesa Crime Statistics (aggregate, city-wide)
│   - Overall crime rate and trend (Mesa is one of safest large cities)
│   - Year-over-year comparison
│   - Crime by type (property vs violent)
│   - Source: Mesa PD open data + AZ DPS statistics
│   - Updated: Monthly
│
├── Safety Resources
│   - Mesa Police non-emergency: (480) 644-2211
│   - Emergency: 911
│   - Crime Stoppers: (480) 948-6377
│   - [Link: Mesa PD Crime Map] → official Mesa PD map
│   - [Link: AZ Sex Offender Registry] → azdps.gov
│   - [Link: National Sex Offender Search] → nsopw.gov
│   - [Link: Mesa Code Compliance] → report issues
│
├── Safety by Area (aggregate stats only)
│   - Crime stats by council district (from open data)
│   - Crime stats by census tract (from open data)
│   - NO neighborhood-level "safety ratings" (Fair Housing risk)
│
└── Recent Public Safety News
    - Mesa PD press releases
    - High-profile court cases (from Legistar + news RSS)
    - Community safety alerts
```

### Maricopa County Superior Court — Public Case Search

**URL:** https://www.superiorcourt.maricopa.gov/docket/
**Data:** Public court case records, hearing schedules
**Method:** Web search (session-based, not a REST API)
**Use:** High-profile local cases, sentencing, hearings

For MVP: Link to the official court search. Phase 2: scrape hearing schedules
for cases involving Mesa addresses/residents.

### Content Generation for Safety

```
Monthly: Pull Mesa PD open data
  → Aggregate by crime type, council district, month
  → Local AI generates "Mesa Crime Statistics Update" post
  → Compare to previous month/year
  → Highlight positive trends (Mesa's violent crime dropped 14% in 2025)
  → Queue for human review

Weekly: Check Mesa PD press releases + news RSS
  → Filter for high-profile cases, community alerts
  → Summarize in plain English
  → Queue for human review

Static: Safety resources page
  → Links to all official lookup tools
  → Updated quarterly
```


---

## APPENDIX — HOUSING LAW & REGULATORY CHANGE TRACKING

_Added 2026-04-24 by Kiro A. Research sources verified during write-up._

This appendix defines every **federal, state, and local regulatory source** the
daily AI content pipeline polls to catch law changes that affect Arizona
housing. When a change is detected, the pipeline generates a draft explainer
post (plain English, with citation + link to primary source) and queues it for
human review before publishing.

### Why this matters for MesaHomes

Buyers and sellers search for "<new rule> Arizona" the day it hits the news.
Ranking for those queries same-day is how the blog compounds SEO authority.
Every major 2024-2026 rule change (NAR settlement, ADRE rule revisions,
FinCEN reporting, HUD fair housing reset, FHFA loan limits) was a traffic
opportunity for sites that moved fast.

### Categorization

Each source maps to one of five bucket tags. The content pipeline routes by
bucket:

| Bucket | Who cares | Example queries |
|--------|-----------|-----------------|
| `consumer-transaction` | Every buyer and seller | "buyer broker agreement Arizona", "seller net sheet 2026" |
| `agent-practice` | Licensed agents (agent dashboard feed) | "ADRE rule revision December 2025" |
| `finance-mortgage` | Buyers with financing | "FHA loan limit 2026 Arizona" |
| `hoa-community` | Condo + planned community owners | "AZ HOA bill 2026" |
| `local-zoning` | Mesa metro homeowners + investors | "Mesa ADU rezoning", "Gilbert starter homes" |

---

### 1. Federal sources

#### 1.1 HUD (Housing and Urban Development)
- **HUD RSS Hub:** `https://www.hud.gov/rss` — multiple feeds (Press Releases,
  HUDclips Notices, Fair Housing, FHA).
- **FHA Connection Mortgagee Letters:** `https://www.hud.gov/program_offices/administration/hudclips/letters/mortgagee`
- **Fair Housing Enforcement:** `https://www.hud.gov/fairhousing`
- **Primary source:** Federal Register HUD postings —
  `https://www.federalregister.gov/agencies/housing-and-urban-development-department` (has RSS + JSON API).
- **What to watch in 2026:** HUD's fair-housing guidance withdrawal
  (see April 2026 Federal News Network coverage — reshapes landlord compliance
  even when the underlying law is unchanged). AFFH rule status. LIHTC and
  HOTMA rollout.
- **Bucket:** `consumer-transaction`, `agent-practice`

#### 1.2 CFPB (Consumer Financial Protection Bureau)
- **Activity Log (authoritative):** `https://www.consumerfinance.gov/activity-log/`
  (has RSS filter by topic, e.g. `?topic=mortgages`).
- **Rulemaking RSS:** `https://www.consumerfinance.gov/rules-policy/rules-under-development/`
- **2026 watch:** Townstone settlement vacatur, disparate-impact enforcement
  scope, RESPA/TRID updates, servicing rules.
- **Bucket:** `finance-mortgage`, `consumer-transaction`

#### 1.3 FHFA (Federal Housing Finance Agency)
- **News release RSS:** `https://www.fhfa.gov/news/news-releases`
- **Federal Register postings:** `https://www.fhfa.gov/regulation/federal-register`
- **Conforming Loan Limits (annual, critical):** 2026 baseline $832,750 for
  one-unit properties. Maricopa County conforming limit sits at baseline.
- **2026 watch:** 2026-2028 Enterprise Housing Goals (published Dec 2025),
  GSE Special Purpose Credit Program rules, crypto-backed mortgage pilots
  (Fannie + Better + Coinbase, Mar 2026).
- **Bucket:** `finance-mortgage`

#### 1.4 IRS (tax rules that affect homeowners)
- **IRS Newsroom RSS:** `https://www.irs.gov/newsroom/news-releases-for-current-month`
- **Pub 523 (sale of home):** changes rarely but worth monitoring.
- **SALT cap status, mortgage interest deduction, home-office deduction, 1031
  exchange eligibility:** tracked via IRS news releases + Federal Register.
- **Bucket:** `consumer-transaction`, `finance-mortgage`

#### 1.5 Fannie Mae + Freddie Mac
- **Fannie Mae Selling Guide updates:** `https://singlefamily.fanniemae.com/media/news-announcements`
- **Freddie Mac Single-Family Seller/Servicer Guide bulletins:**
  `https://sf.freddiemac.com/news-events`
- **Why:** GSEs define what "conforming" means. Any selling-guide change ripples
  through which homes qualify for conventional financing.
- **Bucket:** `finance-mortgage`

#### 1.6 FinCEN (financial crime / real estate reporting)
- **Geographic Targeting Orders + beneficial ownership rules:**
  `https://www.fincen.gov/news-room`
- **2024-2026 Residential Real Estate Reporting Rule:** active, affects
  all-cash purchases by legal entities. AAR published guidance. Impacts cash
  buyer transactions in AZ.
- **Bucket:** `agent-practice`, `consumer-transaction`

#### 1.7 NAR (National Association of Realtors — industry changes)
- **NAR.realtor news:** `https://www.nar.realtor/newsroom`
- **NAR settlement / commission rules tracker:** Core practice changes were
  effective Aug 17, 2024. Continues to generate sub-rule changes at local MLS
  levels. Watch every quarter for ongoing clarification.
- **Bucket:** `agent-practice`, `consumer-transaction`

---

### 2. Arizona state-level sources

#### 2.1 Arizona Department of Real Estate (ADRE)
- **Main site:** `https://azre.gov/`
- **Substantive Policy Statements:** `https://azre.gov/document-category/substantive-policy-statements`
- **Recorded Documents (disclosures to public):** `https://azre.gov/all-adre-resources/recorded-documents`
- **ADRE Bulletin (PDF quarterly):** `https://azre.gov/news-events/bulletins`
- **2025-2026 watch:** ADRE Administrative Code rule revisions effective
  December 13, 2025 — shorter reporting deadlines, expanded disclosure duties,
  increased broker accountability. This is the biggest AZ agent-side change
  in years.
- **Bucket:** `agent-practice`

#### 2.2 Arizona Association of Realtors (AAR)
- **Forms release announcements:** `https://www.aaronline.com/manage-risk/sample-forms/`
- **Legislative updates:** `https://www.aaronline.com/legislative/`
- **Legal Hotline contracts posts:** `https://www.aaronline.com/category/manage-risk/legal-hotline/contracts-hotline/general/`
- **Form release cadence:** February annual, with mid-year revisions possible.
  February 2026 release already published (see aaronline.com/2026/01/23).
- **2026 watch:** Compensation Agreement Between Brokers (CABB) form updates,
  post-NAR-settlement form evolution.
- **Bucket:** `agent-practice`, `consumer-transaction`

#### 2.3 Arizona Legislature
- **Bill search (primary):** `https://www.azleg.gov/billsearch/` — filter by
  session and committee. Current is "57th Legislature – 2nd Regular Session
  (2026)".
- **Real-time tracking:** `https://trackbill.com/arizona/` (has RSS per bill).
- **Industry-filtered trackers:**
  - AAED (Arizona Association for Economic Development): `https://aaed.com/legistion-tracking/`
  - AZ Multihousing Association: `https://www.azmultihousing.org/news/2026-legislative-focus`
  - NAIOP Arizona (commercial): `https://www.naiopaz.org/advocacy`
  - Mulcahy Law Firm HOA/Community summary: `https://www.mulcahylawfirm.com/2026-pending-legislation-summary/`
- **2026 key bills to watch:** Starter Homes Act, ADU expansion, commercial-to-
  residential conversions, HB2486 (real estate license definitions),
  newspaper notice reform.
- **Bucket:** `local-zoning`, `consumer-transaction`, `hoa-community`

#### 2.4 Arizona Department of Housing
- **Programs + news:** `https://housing.az.gov/`
- **Down payment assistance program (DPA) updates:** critical for buyer
  affordability content.
- **Bucket:** `finance-mortgage`, `consumer-transaction`

#### 2.5 Arizona Department of Revenue (property tax)
- **Forms + valuation notices:** `https://azdor.gov/business/property-tax`
- **Annual property valuation cycle:** Notices of Value mailed in February;
  appeal deadlines matter for content.
- **Bucket:** `consumer-transaction`

#### 2.6 Arizona Corporation Commission (community association oversight)
- **HOA + condo complaint filings:** `https://www.azcc.gov/`
- **Bucket:** `hoa-community`

---

### 3. Mesa + Maricopa + Pinal local sources

#### 3.1 Mesa Legistar (already covered above in §1)
Check weekly for:
- City Council (body 138) zoning cases
- Planning & Zoning Board (body 153) public hearings
- Design Review Board outcomes
- Planning Hearing Officer (body 215) variances

#### 3.2 Mesa Development Services announcements
- **GovDelivery newsletter archive:** `https://content.govdelivery.com/accounts/AZMESA/bulletins`
- **Code adoption tracking:** 2024 International Building and Fire Code
  adopted in Mesa (2026). ADU expansions. Adaptive reuse ordinances.
- **Bucket:** `local-zoning`

#### 3.3 Maricopa County Recorder
- **Office:** `https://recorder.maricopa.gov/`
- **Document Search (last 2 years full text):** `https://recorder.maricopa.gov/recording/document-search.aspx`
- **Why:** Deed recordings confirm sales our GIS pipeline might miss; notices
  of lis pendens and trustee deeds flag foreclosure/short-sale activity
  relevant to content.
- **Bucket:** `consumer-transaction`

#### 3.4 Pinal County Recorder
- **Office:** `https://www.pinalcountyaz.gov/recorder`
- Same functional role as Maricopa for the Pinal service-area ZIPs.

#### 3.5 Maricopa County Assessor (policy + appeals)
- **News:** `https://mcassessor.maricopa.gov/news`
- **Annual valuation change dates and appeal windows** are publishable content.

#### 3.6 Gilbert / Chandler / Queen Creek / San Tan Valley / Apache Junction
Each has its own council and planning cycles. Minimum daily check:
- Gilbert: `https://www.gilbertaz.gov/agenda-center`
- Chandler: `https://www.chandleraz.gov/government/city-clerk/agendas-minutes`
- Queen Creek: `https://www.queencreekaz.gov/government/agendas-minutes-live-streams`
- Apache Junction: `https://www.ajcity.net/AgendaCenter`
- San Tan Valley is unincorporated — Pinal County BOS governs: `https://www.pinalcountyaz.gov/bos`

---

### 4. Courts + case-law sources

#### 4.1 Arizona Supreme Court + Court of Appeals
- **Recent opinions RSS:** `https://www.azcourts.gov/rss`
- Real estate case law — restrictive covenants, easements, broker duties,
  HOA disputes — gets posted here. Typically high-value SEO when paired with
  plain-English summaries.
- **Bucket:** All

#### 4.2 Ninth Circuit (federal appeals covering Arizona)
- **Opinions:** `https://www.ca9.uscourts.gov/opinions/`
- Fair housing and lending cases that set AZ precedent.
- **Bucket:** `consumer-transaction`, `finance-mortgage`

#### 4.3 NAR antitrust + commission litigation trackers
- **Real Estate News tracker:** `https://www.realestatenews.com/`
- **HousingWire:** `https://www.housingwire.com/` (has topic RSS)
- **Inman (paid, premium):** monitor headlines only via search alerts.
- **Bucket:** `agent-practice`, `consumer-transaction`

---

### 5. Daily polling strategy

| Frequency | Sources | Why that cadence |
|-----------|---------|------------------|
| **Daily (07:00 MST)** | Federal Register (HUD/FHFA/CFPB), AZ Legislature bill search, Mesa Legistar, NAR news RSS, AAR forms feed | Fast-moving; missing a day loses SEO race |
| **Weekly** | ADRE bulletin, AZ Courts opinions, county recorder delta, East Valley city councils (Gilbert/Chandler/QC/AJ), HousingWire topic RSS | Slower moving; daily would produce noise |
| **Monthly** | IRS, FHFA loan-limit announcements, Fannie/Freddie selling guide bulletins, AZ DOR valuation cycle, Maricopa Assessor | Predictable cycles |
| **Event-driven** | Emergency rules, governor executive orders, state-of-emergency housing orders | Triggered when AZ Legislature bill tracker hits "enrolled" or governor's office RSS posts |

All polling runs from the **local RTX 4090 via MCP** — no per-request cloud
cost. Results written to `s3://mesahomes-data/content-ingest/{source}/{YYYY-MM-DD}/`
for auditability.

### 6. Content generation pipeline

```
Daily 07:00 MST:
  1. Poll every "daily" source → diff vs yesterday's snapshot
  2. For each new item → local AI classifies into bucket
  3. For buckets of interest → draft 300-600 word plain-English explainer
     - First paragraph: what changed in one sentence
     - Middle: what it means for MesaHomes readers, by bucket
     - End: "What to do next" with CTA to relevant tool or consultation
     - Footer: primary-source citation + link
  4. Run compliance filter (Fair Housing terms, no UPL)
  5. Queue in DynamoDB with status=pending-review
  6. Notify human via SES: "N new drafts pending review"

Human review (via dashboard):
  - Approve + publish → content-api
  - Edit + publish
  - Reject (low-value or duplicate)

Post-publish:
  - Add to sitemap.xml
  - Cross-link from relevant city page and tool page
  - Schedule social post
```

### 7. Compliance guardrails for auto-generated content

Every generated post MUST:

1. **Cite a primary source URL.** No secondary aggregators.
2. **Include a disclaimer:** "educational only, not legal advice."
3. **Pass the Fair Housing compliance filter** (see
   `lambdas/ai-proxy/compliance-filter.ts`). Hard-block on prohibited terms.
4. **Avoid unauthorized practice of law (UPL).** No specific legal advice, no
   "you should do X in your case." Route complex questions to a licensed
   agent/attorney CTA.
5. **Include a published date AND a "last verified" date.** Laws change;
   published date alone misleads. Re-verification triggers at 90 days.
6. **Never auto-publish.** Human review is mandatory until content-signoff
   metrics show <5% edit-rate over a trailing 30-day window.

### 8. Implementation notes (for Kiro B when this moves from spec to code)

Proposed Lambda additions (not yet scoped as a task — file under "Phase 1B
content automation"):

- `lambdas/content-ingest/` — orchestrates daily polling. EventBridge cron
  `0 14 * * ? *` (07:00 MST = 14:00 UTC).
- `lambdas/content-diff/` — compares current snapshot to previous; emits
  change events.
- `lambdas/content-drafter/` — calls AI MCP endpoint to generate explainer,
  runs compliance filter, writes draft to DynamoDB.
- `lib/content-sources.ts` — registry of sources (name, URL, bucket, cadence,
  parser type). Single source of truth, matches this appendix.
- Dashboard UI addition: draft review queue with approve/edit/reject.

DynamoDB keys for this Phase 1B work:
- `CONTENT#DRAFT#{id}` / `DRAFT#{createdAt}` — pending review
- `CONTENT#SOURCE#{sourceId}` / `SNAPSHOT#{date}` — ingest audit trail
- `CONTENT#BLOG#{slug}` — already defined for published posts

Risks to flag up front:

- **Robots.txt respect.** Some sources (IRS, some AZ agencies) prohibit
  automated scraping or require delay. Use RSS + official APIs whenever
  possible. Fall back to HTML only when nothing else exists, and honor
  robots.txt + conservative rate limiting.
- **Primary source drift.** Government sites restructure URLs every few
  years. The source registry in `lib/content-sources.ts` should have a
  `lastVerified` timestamp, and the ingest Lambda should alert on 404s.
- **Hallucination in explainer generation.** Every claim in the AI-generated
  draft must be traceable to the source document. Enforce with a "citation
  density" check — at least one quoted phrase or section reference per
  paragraph.
- **Competitive copying.** Zillow, Redfin, and Orchard also crawl these
  sources. Our moat is Mesa-specific local framing + flat-fee business
  context, not being first to report national changes. Lean into that in
  every post.
