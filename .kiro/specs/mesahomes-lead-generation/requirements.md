# Requirements Document

## Introduction

MesaHomes is a **flat-fee, DIY-first real estate platform** serving the Mesa, AZ metro area (Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction). The platform is built on three product layers:

- **Layer 1 — Consumer Lead Tools (Phase 1):** Public-facing buyer and seller tools that drive organic traffic, capture leads, and convert visitors into clients. Homeowners can post to MLS for a flat fee, buyers get AI-assisted offer writing, and anyone can upgrade to full-service agent help at any time.
- **Layer 2 — B2B Property Management Tools (Phase 2):** A recurring-subscription SaaS product for property managers and landlords, covering maintenance triage, owner reporting, lease renewal scoring, and vendor dispatch.
- **Layer 3 — AI Research and Content Engine (Phase 3):** An automated pipeline that crawls local data sources, extracts facts, generates content briefs, and publishes human-reviewed city/neighborhood pages to keep the site fresh and ranking.

The business model centers on a flat-fee listing service (with a broker's $400 per-transaction fee built into pricing), a clear upgrade path to full-service vetted agents, and B2B SaaS subscriptions for property management. Every consumer-facing page includes a "Switch to Full Service Realtor" option and multiple lead capture touchpoints.

The system is built on a serverless AWS architecture (Lambda, API Gateway, DynamoDB, Cognito, SES, S3, CloudFront) reusing the existing mesahomes.com infrastructure (Route 53, CloudFront distribution E3TBTUT3LJLAAT, ACM SSL certificate, S3 bucket). Payments are processed via Stripe. The frontend uses React/Next.js with server-side rendering. The backend uses Node.js (Express or NestJS).

### Data Sources (see #[[file:data-sources.md]] for full API reference)

Property-level data comes from free, public county assessor ArcGIS APIs (no API key required):
- **Pinal County** (San Tan Valley, Queen Creek): `gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query`
- **Maricopa County** (Mesa, Gilbert, Chandler): `gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query`

Market-level data comes from free Zillow Research CSV downloads (updated monthly on the 16th):
- Home values by ZIP (ZHVI), rent index (ZORI), inventory, days on market, price cuts, market heat, affordability, forecasts

Backup property estimates from RentCast API (50 free calls/month).

### Market Context (Mesa, AZ — April 2026)

- Median home prices: $430K–$470K, shifting to a balanced market
- Days on market: 55–62, sale-to-list ratio: 97.82%
- Strong population growth: +15,300 net migrants per year
- Active new construction in Hawes Crossing (85212)
- Property tax rate: 0.68%
- Short-term rental market: 757 Airbnb listings, $242 average daily rate, 58% occupancy

### Compliance Context

- **NAR Policy Changes (August 17, 2024):** Written buyer agreements required before touring; broker compensation is negotiable and must be disclosed.
- **Fair Housing Act:** No discriminatory advertising, steering language, or biased content in any generated or published material.
- **Meta Special Ad Category:** All paid housing ads on Meta/Instagram must comply with Special Ad Category restrictions.

### Build Phases

**MVP (Phase 1A — Launch First):**
- Requirement 1: Core Funnel Structure and Navigation
- Requirement 2: Seller Net Sheet Calculator
- Requirement 3: Home Value Request Tool
- Requirement 4: Flat-Fee vs Traditional Commission Comparison Tool
- Requirement 5: AI Listing Description Generator
- Requirement 6: AI Offer Writer for Buyers
- Requirement 7: Buyer Affordability Calculator
- Requirement 8: Seller Decision Tools
- Requirement 9: First-Time Buyer Guidance
- Requirement 11: Lead Capture System
- Requirement 12: Lead Capture UX on Every Page
- Requirement 15: Market Data, City Pages, and Neighborhood Guides
- Requirement 16: Blog, SEO Content, and Organic Search Strategy
- Requirement 17: Flat-Fee Listing Service
- Requirement 18: Agent Authentication and Authorization
- Requirement 19: Lead Management Dashboard
- Requirement 20: Notifications
- Requirement 45: Data Validation and Error Handling
- Requirement 46: Lead Data Serialization
- Requirement 48: Guided Decision Engine
- Requirement 49: Offer Guidance and Contract Education System

**Phase 1B (Add after MVP launch validation):**
- Requirement 13: AI Chat Assistant
- Requirement 14: CRM Integration and Lead Routing
- Requirement 21: Team Management
- Requirement 22: Agent Performance Tracking
- Requirement 24: Bedrock Knowledge Base Legal/Regulatory Chat (basic version — SPDS, BINSR, buyer agreement FAQ only)
- Requirement 25: Transaction Tracker
- Requirement 27: Saved Progress and Return Engagement
- Requirement 40: Lead Generation Strategy Integration
- Requirement 41: Referral and Partner Channel Support
- Requirement 43: Personalization Engine
- Requirement 44: Public Website Performance and Infrastructure

**Phase 2 (After traction):**
- Requirement 10: Public Property Search (requires IDX/MLS feed access)
- Requirement 23: Lead Marketplace
- Requirement 26: Listing Health Score
- Requirement 42: Paid Advertising Compliance
- Requirement 28-35: All Property Management Portal requirements
- Requirement 47: Content Brief Serialization

**Phase 3 (Scale):**
- Requirement 36-39: All AI Research and Content Engine requirements

## Glossary

- **Platform**: The MesaHomes system as a whole, encompassing the Public_Website, Agent_Dashboard, Lead_Marketplace, PM_Portal, AI_Content_Engine, and CRM_System
- **Public_Website**: The public-facing mesahomes.com website served via CloudFront and S3/Next.js, responsible for property search, consumer tools, content display, and lead capture
- **Agent_Dashboard**: The authenticated backend interface where agents and team administrators manage leads, team members, and performance metrics
- **Lead_Marketplace**: The subsystem that enables listing, purchasing, and transferring leads between agents outside the team
- **PM_Portal**: The Property Management Portal — a B2B SaaS product for property managers and landlords to manage properties, maintenance, leases, vendors, and owner communications
- **AI_Content_Engine**: The automated research and content pipeline that crawls local data sources, extracts facts, generates content briefs, and queues them for human review and publishing
- **CRM_System**: The customer relationship management subsystem that stores lead profiles, routes leads to agents, triggers automated email and SMS nurture sequences, and tracks the full lead lifecycle
- **Lead_Capture_Service**: The backend service (API Gateway + Lambda) responsible for receiving, validating, enriching, and storing lead submissions from all tools and forms
- **Lead**: A record representing a prospective buyer, seller, renter, landlord, or investor who has submitted contact information through the Public_Website, containing at minimum: name, contact method, inquiry type, city, timeframe, and lead source
- **Lead_Status**: The lifecycle state of a Lead, one of: New, Contacted, Showing, Under_Contract, Closed, or Lost
- **Lead_Type**: The classification of a Lead by intent: Buyer, Seller, Renter, Landlord, or Investor
- **Lead_Routing_Engine**: The subsystem that automatically assigns incoming Leads to agents based on configured routing rules and lead metadata (type, city/ZIP, price range, timeframe)
- **Routing_Rule**: A configuration that determines how the Lead_Routing_Engine assigns Leads to agents; types include round-robin, zip-code-based, specialty-based, and timeframe-based
- **Team_Admin**: An authenticated user with permissions to invite agents, configure Routing_Rules, and view all team data
- **Agent**: An authenticated user who is a member of a team and can view and manage Leads assigned to them; vetted based on real production data and service offerings
- **Visitor**: An unauthenticated user browsing the Public_Website
- **Notification_Service**: The subsystem (SES + optional SNS) responsible for sending email and SMS alerts to agents, Team_Admins, property owners, and tenants
- **Property_Search**: The Public_Website feature that allows Visitors to search and browse home listings across Mesa metro area cities
- **Valuation_Request**: A type of Lead where a Visitor requests an estimated home value for a specific property address
- **Net_Sheet_Calculator**: The seller tool that estimates net proceeds from a home sale after commissions, closing costs, and outstanding mortgage
- **Affordability_Calculator**: The buyer tool that estimates maximum purchase price based on income, debts, down payment, and interest rate
- **AI_Offer_Writer**: The tool that generates purchase offer drafts for buyers based on property details, comparable sales, and buyer preferences
- **AI_Listing_Generator**: The tool that generates MLS listing descriptions for sellers based on property features, neighborhood data, and market conditions
- **Flat_Fee_Service**: The service offering where homeowners list on MLS for a flat fee instead of a traditional percentage-based commission
- **Full_Service_Upgrade**: The option available on every page for a user to switch from DIY tools to full-service agent representation
- **Property_Alert_Subscription**: A Visitor-submitted request to receive email notifications when new listings match specified criteria
- **Content_Management_Service**: The subsystem responsible for storing and serving blog posts, neighborhood guides, city pages, and market reports
- **Content_Brief**: A structured document generated by the AI_Content_Engine containing target city, target intent, source facts, FAQ set, competitor gaps, title options, H1/H2 outline, CTA recommendation, compliance flags, schema recommendation, and internal link suggestions
- **Compliance_Filter**: The subsystem that scans all AI-generated and scraped content for Fair Housing Act violations, discriminatory language, and regulatory non-compliance before publishing
- **Auth_Service**: The authentication and authorization subsystem (Cognito) managing Agent, Team_Admin, Property_Owner, and Tenant sessions and permissions
- **DynamoDB_Store**: The primary data store (AWS DynamoDB) for Leads, Agent profiles, team configurations, marketplace listings, PM data, content records, and Visitor preference profiles
- **Nurture_Sequence**: An automated series of email and SMS messages triggered by CRM_System based on Lead_Type, timeframe, and engagement history
- **Bedrock_Knowledge_Base**: An Amazon Bedrock Knowledge Base containing Arizona real estate law, ADRE rules, standard contract forms, NAR settlement terms, Fair Housing guidelines, and related regulatory documents, used for RAG-powered AI chat responses
- **AI_Legal_Chat**: The AI chat assistant powered by Amazon Bedrock with RAG (Retrieval Augmented Generation) that answers Visitor questions grounded in the Bedrock_Knowledge_Base with source citations
- **Transaction_Tracker**: The real-time transaction status tracking system that displays home purchase or sale progress in a timeline view, accessible to buyers/sellers via shared token-based links
- **Listing_Health_Score**: A seller-facing dashboard view showing listing performance metrics (views, saves, showings, days on market, price position) with an overall health rating and automated recommendations
- **Personalization_Engine**: The subsystem that tracks Visitor interactions, stores preference profiles, and adapts the Public_Website experience for returning Visitors with relevant content and recommendations
- **Readiness_Score**: A numeric score calculated by the Personalization_Engine based on Visitor engagement (tools used, pages viewed, return visits, scenario completeness) used by the CRM_System for lead prioritization
- **Property_Owner**: An authenticated PM_Portal user who owns rental properties and receives reports, maintenance updates, and financial summaries
- **Tenant**: An authenticated or semi-authenticated PM_Portal user who submits maintenance requests and communicates with property management

## Requirements

---

### LAYER 1: CONSUMER LEAD TOOLS (Phase 1)

---

### Requirement 1: Core Funnel Structure and Navigation

**User Story:** As a Visitor, I want the homepage to ask "What do you need?" with clear intent-based decision paths, so that I am immediately routed into the right workflow instead of navigating menus.

#### Acceptance Criteria

1. THE Public_Website homepage SHALL present a prominent "What do you need?" section with clear intent paths: "Sell your home" (routes to /sell), "Find out what you can afford" (routes to /tools/affordability), "Write an offer draft" (routes to /tools/offer-writer), "Compare flat fee vs traditional" (routes to /compare/flat-fee-vs-traditional-agent), "Get home value" (routes to /tools/home-value), and "Talk to an agent now" (routes to a direct consultation booking form)
2. THE Public_Website SHALL provide distinct landing pages for each intent path: /sell (flat-fee listing, full-service option, cash offer path, home value), /buy (affordability, first-time buyer path, schedule consult), /rent (for owners and renters), and /invest (for landlords and investors)
3. THE Public_Website SHALL provide city-specific area pages at /areas/mesa, /areas/gilbert, /areas/chandler, /areas/queen-creek, /areas/san-tan-valley, and /areas/apache-junction with localized market data and listings
4. THE Public_Website SHALL provide tool-specific pages at /tools/home-value, /tools/net-sheet, /tools/offer-writer, /tools/affordability, and /tools/listing-generator
5. THE Public_Website SHALL provide a /compare/flat-fee-vs-traditional-agent page comparing the Flat_Fee_Service to traditional commission-based listing
6. THE Public_Website SHALL provide a /reviews page displaying verified client testimonials and ratings
7. THE Public_Website SHALL display a persistent "Switch to Full Service Realtor" button or link on every page of the site
8. WHEN a Visitor clicks the Full_Service_Upgrade button, THE Public_Website SHALL present a form to capture the Visitor name, contact method, and current intent (buying, selling, renting, investing) and route the Lead to the CRM_System with a "full-service-request" tag
9. WHEN a Visitor selects "Talk to an agent now" from the homepage, THE Public_Website SHALL present a direct consultation booking form capturing name, phone, email, and intent, and THE Lead_Capture_Service SHALL create a Lead with a "hot-direct-consult" tag and trigger immediate Agent notification via the Notification_Service

### Requirement 2: Seller Net Sheet Calculator

**User Story:** As a homeowner considering selling, I want to estimate my net proceeds from a sale, so that I can understand how much I would walk away with after all costs.

#### Acceptance Criteria

1. WHEN a Visitor enters a property address, estimated sale price, outstanding mortgage balance, and selects a service type (flat-fee or traditional commission), THE Net_Sheet_Calculator SHALL compute and display estimated net proceeds within 2 seconds
2. THE Net_Sheet_Calculator SHALL itemize deductions including: agent commission (flat fee or percentage-based), broker transaction fee ($400), title and escrow fees, transfer taxes, prorated property taxes, outstanding mortgage payoff, and estimated repair credits
3. THE Net_Sheet_Calculator SHALL display a side-by-side comparison of net proceeds under the Flat_Fee_Service versus a traditional 5-6% commission model
4. THE Net_Sheet_Calculator SHALL display partial results (itemized cost breakdown) before requiring contact information, and WHEN the Visitor submits name, email, and phone, THE Net_Sheet_Calculator SHALL unlock the full net proceeds estimate and downloadable PDF
5. WHEN a Visitor completes the Net_Sheet_Calculator form, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Seller, the tool source set to "net-sheet", and all entered property and financial data attached

### Requirement 3: Home Value Request Tool

**User Story:** As a homeowner, I want to request an estimated value for my home, so that I can decide whether to sell and at what price.

#### Acceptance Criteria

1. WHEN a Visitor enters a property address within the Mesa metro area (Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction), THE Public_Website SHALL accept the Valuation_Request and display a confirmation with estimated delivery timeframe
2. THE Public_Website SHALL require the Visitor name, email, phone number, and property address to submit a Valuation_Request
3. WHEN a Valuation_Request is submitted, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Seller, the tool source set to "home-value", and the property address stored
4. WHEN a Valuation_Request is submitted, THE Notification_Service SHALL send a confirmation email to the Visitor within 60 seconds acknowledging receipt
5. THE Public_Website SHALL display a teaser range (e.g., "Homes in your ZIP typically sell for $X–$Y") before requiring contact information to receive a personalized estimate

### Requirement 4: Flat-Fee vs Traditional Commission Comparison Tool

**User Story:** As a homeowner, I want to compare the cost of listing with a flat fee versus a traditional agent commission, so that I can choose the most cost-effective option.

#### Acceptance Criteria

1. WHEN a Visitor enters an estimated sale price, THE Public_Website SHALL calculate and display total costs under the Flat_Fee_Service (flat fee + broker $400 transaction fee + buyer agent commission) versus a traditional listing (5-6% total commission split)
2. THE Public_Website SHALL display the dollar savings of the Flat_Fee_Service compared to the traditional model for the entered sale price
3. THE Public_Website SHALL include a clear explanation of what is included in each service tier: Flat_Fee_Service (MLS posting, photos guidance, showing coordination, contract review) versus Full_Service_Upgrade (full agent representation, pricing strategy, staging advice, negotiation, closing coordination)
4. WHEN a Visitor interacts with the comparison tool, THE Public_Website SHALL display a CTA to either start a flat-fee listing or request a full-service consultation, both of which capture contact information via the Lead_Capture_Service

### Requirement 5: AI Listing Description Generator

**User Story:** As a seller using the Flat_Fee_Service, I want an AI-generated MLS listing description, so that my property listing is compelling and professional without hiring a copywriter.

#### Acceptance Criteria

1. WHEN a Visitor provides property details (bedrooms, bathrooms, square footage, lot size, year built, upgrades, and neighborhood), THE AI_Listing_Generator SHALL produce a draft MLS listing description within 10 seconds
2. THE AI_Listing_Generator SHALL generate descriptions that comply with Fair Housing Act guidelines, containing no discriminatory language or steering references
3. THE Compliance_Filter SHALL scan each generated listing description and flag any terms that violate Fair Housing Act guidelines before displaying to the Visitor
4. THE AI_Listing_Generator SHALL allow the Visitor to regenerate or edit the description before finalizing
5. WHEN a Visitor generates a listing description, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Seller and tool source set to "listing-generator" if the Visitor has not already been captured in the current session

### Requirement 6: AI Offer Writer for Buyers

**User Story:** As a buyer, I want AI-assisted help drafting a purchase offer, so that I can submit competitive offers without needing an agent for initial drafting.

#### Acceptance Criteria

1. WHEN a Visitor provides a property address, offered price, earnest money amount, financing type, contingencies, and desired closing date, THE AI_Offer_Writer SHALL generate a draft purchase offer summary within 10 seconds
2. THE AI_Offer_Writer SHALL display a preview of the offer structure (key terms and conditions) before requiring contact information to access the full draft
3. WHEN a Visitor submits contact information to unlock the full offer draft, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Buyer and tool source set to "offer-writer"
4. THE AI_Offer_Writer SHALL include a disclaimer that the generated offer is a draft for informational purposes and recommend review by a licensed agent or attorney before submission
5. THE AI_Offer_Writer SHALL include a prominent Full_Service_Upgrade CTA offering agent representation for offer negotiation and submission

### Requirement 7: Buyer Affordability Calculator

**User Story:** As a prospective buyer, I want to calculate how much home I can afford, so that I can set realistic expectations and begin my search with confidence.

#### Acceptance Criteria

1. WHEN a Visitor enters annual income, monthly debts, down payment amount, estimated interest rate, and desired loan term, THE Affordability_Calculator SHALL compute and display a maximum purchase price, estimated monthly payment, and debt-to-income ratio within 2 seconds
2. THE Affordability_Calculator SHALL display partial results (estimated price range) before requiring contact information, and WHEN the Visitor submits name, email, and phone, THE Affordability_Calculator SHALL unlock a detailed affordability report with mortgage scenario comparisons
3. THE Affordability_Calculator SHALL support side-by-side comparison of at least three mortgage scenarios (varying down payment, interest rate, or loan term)
4. WHEN a Visitor completes the Affordability_Calculator form, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Buyer, tool source set to "affordability", and financing details attached
5. THE Affordability_Calculator SHALL display links to down payment assistance programs available in Arizona

### Requirement 8: Seller Decision Tools

**User Story:** As a homeowner, I want tools to help me decide whether to sell now or wait and to prepare my home for listing, so that I can make informed timing and preparation decisions.

#### Acceptance Criteria

1. WHEN a Visitor provides a property ZIP code and estimated home value, THE Public_Website SHALL display a "Should I Sell Now or Wait?" analysis incorporating current median prices, days on market, inventory trends, and seasonal patterns for that ZIP code area
2. THE Public_Website SHALL provide a listing prep checklist tool that generates a customized checklist based on property type (single-family, condo, townhome) and price range, covering staging, repairs, photography, and documentation
3. WHEN a Visitor completes the sell-now-or-wait analysis, THE Public_Website SHALL display a CTA to request a personalized consultation, capturing contact information via the Lead_Capture_Service with Lead_Type set to Seller
4. THE Public_Website SHALL provide a showing feedback dashboard concept page that describes how sellers using the Flat_Fee_Service receive organized feedback from buyer showings, with a CTA to start a flat-fee listing
5. THE Public_Website SHALL provide an offer comparison tool concept page that describes how sellers can compare multiple offers side-by-side on price, contingencies, financing, and closing timeline, with a CTA to start a flat-fee listing

### Requirement 9: First-Time Buyer Guidance

**User Story:** As a first-time homebuyer, I want step-by-step guidance through the buying process, so that I can navigate purchasing a home with confidence.

#### Acceptance Criteria

1. THE Public_Website SHALL provide a first-time buyer guide page at /buy/first-time-buyer with a step-by-step walkthrough of the Arizona home buying process, from pre-approval through closing
2. THE Public_Website SHALL explain NAR policy changes (effective August 17, 2024) including the requirement for written buyer agreements before touring and that broker compensation is negotiable
3. THE Public_Website SHALL include information about Arizona-specific down payment assistance programs, first-time buyer incentives, and tax benefits
4. WHEN a Visitor views the first-time buyer guide, THE Public_Website SHALL display contextual CTAs for the Affordability_Calculator, scheduling a buyer consultation, and the AI_Offer_Writer
5. WHEN a Visitor requests a buyer consultation from the first-time buyer guide, THE Lead_Capture_Service SHALL create a Lead record with Lead_Type set to Buyer, tool source set to "first-time-buyer-guide", and a tag of "first-time-buyer"

### Requirement 10: Public Property Search (Phase 2 — Requires IDX/MLS Feed Access)

> **Phase 2 Note:** This requirement depends on obtaining IDX/MLS feed access, which is not available at launch. The MVP launches without live property search, providing full value through tools, content, city/neighborhood pages, and lead capture. When IDX access is obtained, property search will be layered in as an enhancement.

**User Story:** As a Visitor, I want to search and browse homes for sale across the Mesa metro area, so that I can find properties that match my criteria and be encouraged to submit my contact information.

#### Acceptance Criteria

1. THE Public_Website SHALL launch without IDX/MLS feed integration and SHALL provide full value to Visitors through consumer tools (Net_Sheet_Calculator, Affordability_Calculator, AI_Offer_Writer, AI_Listing_Generator, home value request), content (city pages, neighborhood guides, blog posts, market data), and lead capture on every major page
2. WHEN IDX/MLS feed access is obtained, THE Property_Search SHALL be layered into the existing Public_Website as an enhancement without requiring restructuring of existing pages, tools, navigation, or lead capture flows
3. WHEN a Visitor enters search criteria (any combination of city, zip code, price range, bedrooms, bathrooms, property type, or square footage), THE Property_Search SHALL return matching listings within 2 seconds
4. WHEN a Visitor views search results, THE Public_Website SHALL display each listing with address, city, price, bedrooms, bathrooms, square footage, and at least one photo
5. WHEN a Visitor selects a listing from search results, THE Public_Website SHALL display a detail page with full property information, a lead capture prompt, and links to the AI_Offer_Writer and Affordability_Calculator
6. WHEN no listings match the search criteria, THE Public_Website SHALL display a message indicating no results and suggest broadening the search or signing up for Property_Alert_Subscriptions
7. THE Public_Website SHALL display a neighborhood browse view organized by city (Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction) and by Mesa zip codes (85201-85216, 85233, 85205-85215) with summary statistics for each area
8. WHEN a Visitor views a listing detail page, THE Public_Website SHALL display a "Schedule a Showing" CTA that captures contact information via the Lead_Capture_Service with Lead_Type set to Buyer

### Requirement 11: Lead Capture System

**User Story:** As a Visitor, I want to submit my contact information through various tools and forms, so that I can receive personalized real estate assistance.

#### Acceptance Criteria

1. THE Lead_Capture_Service SHALL accept lead submissions from all consumer tools (Net_Sheet_Calculator, Valuation_Request, Affordability_Calculator, AI_Offer_Writer, AI_Listing_Generator, comparison tool, first-time buyer guide) and general contact forms
2. WHEN a Visitor submits any lead capture form, THE Lead_Capture_Service SHALL require at minimum: name, email, phone, city, timeframe (now, 30 days, 3 months, 6+ months), and Lead_Type (Buyer, Seller, Renter, Landlord, Investor)
3. WHEN a Visitor submits a lead capture form with valid data, THE Lead_Capture_Service SHALL create a Lead record in the DynamoDB_Store with Lead_Status set to New, a timestamp, the tool source, and all captured metadata within 1 second of submission
4. WHEN a Visitor submits a form with invalid or missing required fields, THE Lead_Capture_Service SHALL return field-level validation errors without creating a Lead record
5. IF the Lead_Capture_Service fails to store a Lead due to a DynamoDB_Store error, THEN THE Lead_Capture_Service SHALL retry the write up to 3 times with exponential backoff and return an error message to the Visitor if all retries fail
6. THE Lead_Capture_Service SHALL implement progressive disclosure: each tool displays partial value first (teaser results), then requires contact information to unlock the full result
7. WHEN a Lead is created, THE Lead_Capture_Service SHALL push the Lead record to the CRM_System for routing and nurture sequence assignment within 5 seconds

### Requirement 12: Lead Capture UX on Every Page

**User Story:** As a business owner, I want every major page to have multiple lead capture touchpoints, so that I maximize conversion opportunities from site traffic.

#### Acceptance Criteria

1. THE Public_Website SHALL display on every major page: a primary CTA relevant to the page context, a secondary low-friction CTA (e.g., "Get a free guide"), a sticky contact option (floating button or bar), a click-to-call phone link, and a calendar booking link
2. THE Public_Website SHALL display a short lead capture form above the fold on every landing page (/sell, /buy, /rent, /invest, /areas/*, /tools/*)
3. THE Public_Website SHALL implement event tracking on every form submission, call click, chat initiation, and valuation request for analytics purposes
4. WHEN a Visitor clicks a click-to-call link, THE Public_Website SHALL log the click event with page source, timestamp, and Visitor session ID to the analytics system
5. THE Public_Website SHALL provide a calendar booking integration that allows Visitors to schedule consultations directly, capturing name, email, phone, and consultation type as a Lead

### Requirement 13: AI Chat Assistant

**User Story:** As a Visitor, I want to interact with an AI assistant that guides me to the right tools and captures my information naturally, so that I get help quickly without navigating complex menus.

#### Acceptance Criteria

1. THE Public_Website SHALL display an AI chat assistant widget accessible from every page
2. WHEN a Visitor initiates a chat, THE AI chat assistant SHALL ask qualifying questions: buying, selling, renting, or investing; what city; what timeframe; what price range; financing status; and whether the Visitor wants DIY tools or agent help
3. WHEN the AI chat assistant has collected sufficient qualifying information, THE AI chat assistant SHALL recommend the appropriate workflow or tool (Net_Sheet_Calculator for sellers, Affordability_Calculator for buyers, PM_Portal information for landlords, investment analysis for investors)
4. WHEN the AI chat assistant collects contact information during conversation, THE Lead_Capture_Service SHALL create a Lead record with all gathered qualifying data and tool source set to "ai-chat"
5. WHEN the AI chat assistant identifies a hot lead (timeframe of "now" or "30 days" with financing in place), THE AI chat assistant SHALL trigger an immediate notification to the Lead_Routing_Engine for fast human handoff
6. THE AI chat assistant SHALL push all collected lead data to the CRM_System and trigger the appropriate Nurture_Sequence based on Lead_Type and timeframe

### Requirement 14: CRM Integration and Lead Routing

**User Story:** As a Team_Admin, I want every lead automatically routed to the right agent with full context, so that my team can respond quickly and appropriately.

#### Acceptance Criteria

1. WHEN a new Lead is created from any source, THE CRM_System SHALL auto-route the Lead with the following metadata: Lead_Type, city/ZIP, price range, timeframe (now/30d/3mo/6+mo), financing status, tool source, and assigned agent
2. WHEN a new Lead is created and a Routing_Rule is configured, THE Lead_Routing_Engine SHALL assign the Lead to an Agent within 5 seconds of creation
3. THE Lead_Routing_Engine SHALL support four Routing_Rule types: round-robin (equal distribution), zip-code-based (assign by Lead city/ZIP match), specialty-based (assign by Lead_Type), and timeframe-based (prioritize "now" leads to top-performing agents)
4. WHEN no Routing_Rule matches an incoming Lead, THE Lead_Routing_Engine SHALL assign the Lead to the Team_Admin as a fallback
5. WHEN a Lead is assigned, THE CRM_System SHALL trigger the appropriate Nurture_Sequence: automated email and SMS drip campaigns tailored to Lead_Type, timeframe, and engagement history
6. THE CRM_System SHALL track the full lead lifecycle from capture through nurture, contact, showing, contract, and close with timestamps at each stage transition

### Requirement 15: Market Data, City Pages, and Neighborhood Guides

**User Story:** As a Visitor, I want to view localized market data and neighborhood information for cities across the Mesa metro area, so that I can make informed decisions about where to buy, sell, or invest.

#### Acceptance Criteria

1. THE Public_Website SHALL display city-specific pages for Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction, each with: median home price, average days on market, sale-to-list ratio, inventory count, population growth data, and property tax rate
2. THE Public_Website SHALL provide neighborhood guide pages for each major zip code area within covered cities, including median price, school ratings, walkability information, notable amenities, and new construction activity
3. WHEN a Visitor views a city or neighborhood page, THE Public_Website SHALL display contextual lead capture prompts: Valuation_Request for homeowners, Property_Alert_Subscription for buyers, and investment analysis CTA for investors
4. THE Content_Management_Service SHALL support storing and retrieving market data entries with a publish date, title, body content, associated city, and associated zip codes
5. THE Public_Website SHALL display FAQ sections on each city and neighborhood page targeting common local search queries (e.g., "Is Mesa AZ a good place to live?", "What are property taxes in Gilbert AZ?")

### Requirement 16: Blog, SEO Content, and Organic Search Strategy

**User Story:** As a Team_Admin, I want to publish optimized content that ranks for local real estate searches, so that the Public_Website attracts organic traffic from buyers, sellers, and investors in the Mesa metro area.

#### Acceptance Criteria

1. THE Content_Management_Service SHALL support creating, updating, and deleting blog posts with a title, body (Markdown or HTML), author name, publish date, category, associated city, and associated zip codes
2. THE Public_Website SHALL render blog posts with SEO metadata including title tag, meta description, Open Graph tags, canonical URL, and JSON-LD structured data for articles
3. THE Public_Website SHALL generate a sitemap.xml that includes all published blog posts, city pages, neighborhood guides, tool pages, and market data pages
4. WHEN a Visitor views a blog post, THE Public_Website SHALL display related lead capture prompts contextual to the post topic (Valuation_Request for seller-focused posts, Property_Alert_Subscription for buyer-focused posts, investment CTA for investor-focused posts)
5. THE Public_Website SHALL render all pages with server-side rendering or static generation to ensure search engine crawlability
6. THE Public_Website SHALL support Google Business Profile integration with consistent NAP (Name, Address, Phone) data across all city pages and the main site

### Requirement 17: Flat-Fee Listing Service

**User Story:** As a homeowner, I want to list my property on the MLS for a flat fee, so that I can sell my home while saving thousands compared to a traditional agent commission.

#### Acceptance Criteria

1. THE Public_Website SHALL display the Flat_Fee_Service offering with clear pricing: flat listing fee + broker $400 transaction fee, with a breakdown of what is included (MLS posting, syndication to Zillow/Realtor.com/Redfin, photos guidance, showing coordination, contract review)
2. WHEN a Visitor selects the Flat_Fee_Service, THE Public_Website SHALL present a step-by-step onboarding flow: property details entry, AI_Listing_Generator for description, photo upload guidance, pricing recommendation, and payment via Stripe
3. WHEN a Visitor completes Flat_Fee_Service payment, THE Platform SHALL create a listing record and notify the Team_Admin to initiate MLS submission within 1 business day
4. THE Public_Website SHALL display a clear comparison between the Flat_Fee_Service tier and the Full_Service_Upgrade tier, with a prominent option to upgrade at any point during the listing process
5. WHEN a Flat_Fee_Service customer requests a Full_Service_Upgrade, THE Platform SHALL route the request to a vetted agent (selected based on real production data and service offerings) and notify the customer of the agent assignment within 4 hours

### Requirement 18: Agent Authentication and Authorization

**User Story:** As an Agent or Team_Admin, I want to securely log in to the Agent_Dashboard, so that I can access lead management features appropriate to my role.

#### Acceptance Criteria

1. THE Auth_Service SHALL support email-and-password authentication for Agent and Team_Admin accounts using AWS Cognito
2. WHEN an Agent or Team_Admin provides valid credentials, THE Auth_Service SHALL issue a session token valid for 24 hours
3. WHEN an Agent or Team_Admin provides invalid credentials three consecutive times, THE Auth_Service SHALL lock the account for 15 minutes
4. THE Auth_Service SHALL enforce permission levels: Agent (view and manage own assigned Leads), Team_Admin (view all Leads, manage team, configure Routing_Rules, manage Flat_Fee_Service listings), and Property_Owner (access PM_Portal for owned properties)
5. WHEN an unauthenticated request is made to any Agent_Dashboard or PM_Portal endpoint, THE Auth_Service SHALL return a 401 status and redirect to the login page

### Requirement 19: Lead Management Dashboard

**User Story:** As an Agent, I want to view, filter, and manage my assigned leads with full context from the CRM, so that I can efficiently follow up and convert prospects.

#### Acceptance Criteria

1. WHEN an Agent accesses the Agent_Dashboard, THE Agent_Dashboard SHALL display a list of Leads assigned to that Agent, sorted by creation date (newest first) by default
2. THE Agent_Dashboard SHALL support filtering Leads by Lead_Status, Lead_Type, tool source, city/ZIP, timeframe, date range, and financing status
3. THE Agent_Dashboard SHALL support sorting Leads by creation date, last updated date, Lead_Status, and timeframe urgency
4. WHEN an Agent updates a Lead_Status, THE Agent_Dashboard SHALL persist the change to the DynamoDB_Store, update the CRM_System, and display the updated status within 1 second
5. WHEN a Team_Admin accesses the Agent_Dashboard, THE Agent_Dashboard SHALL display all Leads across all Agents with additional filters for assigned Agent and Nurture_Sequence status
6. THE Agent_Dashboard SHALL display a Lead detail view showing all captured information (tool source, qualifying data, property details, financial data), status history, assigned Agent, Nurture_Sequence status, and any notes added by Agents

### Requirement 20: Notifications

**User Story:** As an Agent, I want to receive immediate notifications when a new lead is assigned to me, so that I can respond quickly and improve conversion rates.

#### Acceptance Criteria

1. WHEN a Lead is assigned to an Agent, THE Notification_Service SHALL send an email notification to the Agent within 60 seconds of assignment
2. WHERE SMS notifications are enabled for an Agent, THE Notification_Service SHALL send an SMS notification in addition to email when a Lead is assigned
3. THE Notification_Service SHALL include the Lead_Type, Visitor name, contact method, city, timeframe, tool source, and inquiry summary in each notification
4. WHEN the Notification_Service fails to deliver an email, THE Notification_Service SHALL retry delivery up to 3 times with exponential backoff
5. THE Agent_Dashboard SHALL allow each Agent to configure notification preferences (email only, email and SMS, or none) for each notification type
6. WHEN a Lead_Status changes to Contacted, Showing, Under_Contract, or Closed, THE Notification_Service SHALL send a status update notification to the Team_Admin

### Requirement 21: Team Management

**User Story:** As a Team_Admin, I want to invite vetted agents to my team and manage their profiles, so that I can build and organize my real estate team with agents selected based on real production and service quality.

#### Acceptance Criteria

1. WHEN a Team_Admin submits an invitation with a valid email address, THE Agent_Dashboard SHALL send an invitation email via the Notification_Service and create a pending Agent record
2. WHEN an invited Agent completes registration through the invitation link, THE Auth_Service SHALL create an Agent account and associate the Agent with the inviting Team_Admin team
3. THE Agent_Dashboard SHALL display a team roster showing each Agent name, email, status (active, pending, deactivated), assigned Lead count, and specialties
4. THE Agent_Dashboard SHALL allow a Team_Admin to deactivate an Agent, which reassigns all of the deactivated Agent open Leads to the Team_Admin
5. THE Agent_Dashboard SHALL support Agent profiles containing name, email, phone, photo URL, bio, specialties (buyer, seller, new construction, investment, property management), assigned cities/zip codes, production data (transactions closed, volume), and service offerings

### Requirement 22: Agent Performance Tracking

**User Story:** As a Team_Admin, I want to track agent performance metrics, so that I can identify top performers and coach underperformers.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL calculate and display per-Agent metrics: average response time (time from Lead assignment to first status change from New), conversion rate (Leads reaching Closed divided by total assigned Leads), active Lead count, and leads by source tool
2. THE Agent_Dashboard SHALL display a team performance summary with total Leads by status, total Leads by Lead_Type, team-wide conversion rate, average response time, and leads by tool source
3. WHEN a Team_Admin views performance metrics, THE Agent_Dashboard SHALL allow filtering by date range (default: last 30 days), city, and Lead_Type
4. THE Agent_Dashboard SHALL display a revenue tracking view showing estimated commission per Closed Lead (based on property price and configurable commission rate), flat-fee listing revenue, and total revenue per Agent

### Requirement 23: Lead Marketplace

**User Story:** As a Team_Admin, I want to list excess leads for sale to other agents, so that I can monetize leads my team cannot handle.

#### Acceptance Criteria

1. WHEN a Team_Admin lists a Lead for sale, THE Lead_Marketplace SHALL create a marketplace listing with Lead_Type, city/ZIP, timeframe, inquiry summary (without Visitor contact details), and asking price
2. THE Lead_Marketplace SHALL display available listings to authenticated agents who are not on the selling Team_Admin team
3. WHEN a buying Agent purchases a Lead, THE Lead_Marketplace SHALL transfer the full Lead record (including Visitor contact details) to the buying Agent, update the Lead assignment in the CRM_System, and process payment via Stripe
4. WHEN a buying Agent purchases a Lead, THE Lead_Marketplace SHALL record the transaction with seller, buyer, price, and timestamp in the DynamoDB_Store
5. THE Lead_Marketplace SHALL allow a Team_Admin to set a price for each listed Lead and remove a listing at any time before purchase
6. IF a Lead listed on the Lead_Marketplace has its Lead_Status changed to Contacted or beyond by the original team, THEN THE Lead_Marketplace SHALL automatically remove the listing

### Requirement 24: Bedrock Knowledge Base Legal/Regulatory Chat

**User Story:** As a Visitor, I want to ask real estate questions and get answers grounded in actual Arizona law and regulations, so that I can make informed decisions with confidence.

#### Acceptance Criteria

1. THE Platform SHALL maintain a Bedrock_Knowledge_Base containing: Arizona Revised Statutes Title 32 (real estate), ADRE commissioner's rules, Arizona Association of REALTORS standard contract forms and explanations, NAR settlement terms and buyer agreement requirements, Fair Housing Act guidelines, Arizona landlord-tenant act (ARS 33-1301 through 33-1381), HOA law (ARS 33-1801 through 33-1807), Seller Property Disclosure Statement (SPDS) requirements, Buyer's Inspection Notice and Seller's Response (BINSR) process, and Arizona down payment assistance program details
2. WHEN a Visitor asks a legal or regulatory question through the AI_Legal_Chat, THE AI_Legal_Chat SHALL retrieve relevant passages from the Bedrock_Knowledge_Base and generate a response grounded in those passages with source citations
3. THE AI_Legal_Chat SHALL include a disclaimer on every response that responses are informational only and do not constitute legal advice, and SHALL recommend consulting a licensed attorney for legal decisions
4. THE AI_Legal_Chat SHALL use Amazon Bedrock with Claude or Nova models for response generation, with the Bedrock_Knowledge_Base documents stored in S3 and indexed using Bedrock managed RAG pipeline
5. THE Platform SHALL update the Bedrock_Knowledge_Base documents at least quarterly to reflect regulatory changes
6. WHEN the AI_Legal_Chat cannot find relevant information in the Bedrock_Knowledge_Base for a question, THE AI_Legal_Chat SHALL acknowledge the limitation and offer to connect the Visitor with a licensed agent or attorney via the Lead_Capture_Service
7. THE Compliance_Filter SHALL scan all AI_Legal_Chat responses for accuracy against source documents and flag responses where the generated text diverges from retrieved passages

### Requirement 25: Transaction Tracker

**User Story:** As a buyer or seller in an active transaction, I want to see real-time status of my home purchase or sale in a clear timeline view, so that I know exactly where I am in the process and what happens next.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL provide a Transaction_Tracker view for each active transaction showing status stages: Offer Submitted, Offer Accepted, Inspection Period, Appraisal Ordered, Appraisal Complete, Loan Underwriting, Clear to Close, Closing Scheduled, and Closed
2. WHEN an Agent updates a transaction stage, THE Transaction_Tracker SHALL display the updated status to the buyer or seller within 60 seconds via a shared link or authenticated portal view
3. THE Transaction_Tracker SHALL display for each stage: stage name, status (completed, current, or upcoming), date completed or estimated date, and any action items required from the buyer or seller
4. WHEN a transaction stage transitions, THE Notification_Service SHALL send push notifications (email and optional SMS) to the buyer or seller
5. THE Transaction_Tracker SHALL display a document checklist per stage showing required documents, their upload status, and deadlines
6. THE Transaction_Tracker SHALL be accessible to buyers and sellers via a unique shareable link without requiring full platform authentication, using read-only access with token-based security
7. WHEN a transaction reaches the Closed stage, THE Transaction_Tracker SHALL prompt the buyer or seller to leave a review and offer a referral incentive

### Requirement 26: Listing Health Score (Seller Dashboard)

**User Story:** As a seller with an active listing, I want to see how my listing is performing compared to the market, so that I can make data-driven decisions about pricing and strategy.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL provide a Listing_Health_Score view for each active Flat_Fee_Service or Full_Service_Upgrade listing showing: total views, saves and favorites count, showing requests, days on market, and price position relative to comparable active listings in the same ZIP code
2. THE Listing_Health_Score SHALL calculate an overall health rating (Strong, Average, or Needs Attention) based on showing request rate versus market average, days on market versus ZIP average, and price-to-comparable ratio
3. WHEN a Listing_Health_Score drops to "Needs Attention," THE Platform SHALL generate automated recommendations: price adjustment suggestion, listing description refresh, photo quality improvement, or staging tips
4. THE Listing_Health_Score SHALL be accessible to sellers via a shared link using the same token-based access pattern as the Transaction_Tracker
5. THE Listing_Health_Score SHALL update daily with fresh market comparison data

### Requirement 27: Saved Progress and Return Engagement

**User Story:** As a Visitor who is not ready to act today, I want to save my progress and come back later, so that I can continue my research without starting over.

#### Acceptance Criteria

1. THE Public_Website SHALL allow Visitors to save tool results (net sheet calculations, affordability scenarios, offer drafts) by providing an email address, which generates a unique return link sent via the Notification_Service
2. THE Platform SHALL send periodic update emails to Visitors with saved scenarios when market conditions change (interest rate shifts, new listings in their price range, or price reductions in their target ZIP)
3. THE Platform SHALL track a Readiness_Score based on Visitor engagement (tools used, pages viewed, return visits, scenario completeness) and surface this score to the CRM_System for lead prioritization
4. WHEN a Visitor Readiness_Score crosses a configurable threshold, THE CRM_System SHALL escalate the Lead priority and trigger a personalized outreach from the assigned Agent
5. THE Platform SHALL retain saved Visitor scenarios for a minimum of 12 months, and WHEN a saved scenario is accessed via return link, THE Public_Website SHALL display the original inputs alongside updated market data for comparison

### Requirement 48: Guided Decision Engine

**User Story:** As a Visitor, I want the platform to guide me through a logical sequence of tools and decisions based on my intent, so that I always know what to do next instead of navigating disconnected tools.

#### Acceptance Criteria

1. THE Platform SHALL define guided decision paths that chain tools together in a logical sequence:
   - **Seller path:** Home Value Request → Seller Net Sheet → "Sell Now or Wait" Analysis → Listing Prep Checklist → Flat-Fee Listing or Full-Service Upgrade
   - **Buyer path:** Affordability Calculator → First-Time Buyer Guide (if applicable) → Offer Guidance and Contract Education → AI Offer Writer Preview → Agent Consultation or Full-Service Upgrade
   - **Landlord path:** Rent Estimate → Property Management Pain Points Assessment → PM Tools Overview → PM Subscription or Agent Consultation
   - **Investor path:** Cash-Flow Quick Check → Market Area Comparison → Investment Consultation Request
2. WHEN a Visitor completes a tool in a guided path, THE Public_Website SHALL display a "What's Next" recommendation showing the next logical step in the path, with a clear explanation of why that step matters
3. THE Guided Decision Engine SHALL save the Visitor's progress through the path (tools completed, results generated, data entered) and allow the Visitor to resume from where they left off via email return link
4. THE Guided Decision Engine SHALL explain each tool's results in plain English with a "What This Means For You" summary section that translates numbers into actionable guidance
5. WHEN the Guided Decision Engine detects high complexity or risk in a Visitor's situation (e.g., short sale, estate sale, investment property with tenants, first-time buyer with low down payment), THE Guided Decision Engine SHALL trigger a Full_Service_Upgrade prompt with an explanation of why professional help is recommended for their specific situation
6. THE Guided Decision Engine SHALL pass the complete path history (tools used, results, progress stage, risk flags) to the CRM_System when a Lead is created, so that the assigned Agent has full context on the Visitor's decision journey
7. THE Guided Decision Engine SHALL display a progress indicator showing the Visitor where they are in the guided path and what steps remain

### Requirement 49: Offer Guidance and Contract Education System

**User Story:** As a buyer or seller, I want to understand how real estate contracts and offers are structured before I sign anything, so that I can make informed decisions and ask the right questions.

#### Acceptance Criteria

1. THE Public_Website SHALL provide an Offer Guidance and Contract Education section that explains how common Arizona real estate documents are structured, including: Arizona Association of REALTORS Residential Resale Real Estate Purchase Contract, Seller Property Disclosure Statement (SPDS), Buyer's Inspection Notice and Seller's Response (BINSR), buyer-broker agreement, and listing agreement
2. THE Offer Guidance and Contract Education section SHALL present each document as a section-by-section educational guide explaining: what each section covers, what decisions the buyer or seller needs to make in that section, common mistakes to avoid, and questions to ask an agent or attorney about that section
3. THE Offer Guidance and Contract Education section SHALL help users prepare their inputs by providing worksheets or interactive forms that collect the information they will need when working with an agent to complete actual documents (desired closing date, earnest money amount, contingency preferences, inspection timeline preferences, financing details)
4. THE Offer Guidance and Contract Education section SHALL NOT generate, produce, or present any content as a legal document, contract, or binding agreement, and SHALL include a prominent disclaimer on every page stating that the content is educational only and does not constitute legal advice or a legal document
5. THE Offer Guidance and Contract Education section SHALL include a prominent CTA on every page to connect with a licensed agent or attorney for actual document preparation, review, and execution
6. WHEN a Visitor completes the input preparation worksheets, THE Lead_Capture_Service SHALL create a Lead record with the prepared inputs attached, so that the assigned Agent can use the Visitor's pre-work to accelerate the actual document preparation process

---

### LAYER 2: B2B PROPERTY MANAGEMENT TOOLS (Phase 2)

---

### Requirement 28: Owner Portal Lite

**User Story:** As a Property_Owner, I want a portal to view my rental property performance, financials, and communications in one place, so that I can stay informed without constant back-and-forth with my property manager.

#### Acceptance Criteria

1. WHEN a Property_Owner logs into the PM_Portal, THE PM_Portal SHALL display a dashboard with: property list, occupancy status per property, current lease end dates, outstanding maintenance requests, and month-to-date financial summary
2. THE PM_Portal SHALL display per-property detail pages showing: lease terms, tenant contact information, rent payment history, maintenance request history, and inspection records
3. THE PM_Portal SHALL allow Property_Owners to view and download monthly owner reports (see Requirement 33) for each property
4. THE PM_Portal SHALL provide a communication timeline showing all messages between the property manager, Property_Owner, and Tenant for each property, ordered chronologically
5. WHEN a Property_Owner accesses the PM_Portal, THE Auth_Service SHALL verify the Property_Owner role and restrict access to only properties associated with that owner account

### Requirement 29: Maintenance Request Triage with AI Categorization

**User Story:** As a property manager, I want maintenance requests automatically categorized and prioritized by AI, so that I can respond to urgent issues faster and route routine requests efficiently.

#### Acceptance Criteria

1. WHEN a Tenant submits a maintenance request with a description and optional photos, THE PM_Portal SHALL use AI categorization to assign a category (plumbing, electrical, HVAC, appliance, structural, pest, cosmetic, other) and a priority level (emergency, urgent, routine)
2. WHEN a maintenance request is categorized as emergency (e.g., water leak, gas smell, no heat in winter, no AC when temperature exceeds 100°F), THE PM_Portal SHALL trigger an immediate notification to the property manager and the assigned vendor within 5 minutes
3. THE PM_Portal SHALL allow the property manager to override the AI-assigned category and priority level
4. THE PM_Portal SHALL display a maintenance request queue for the property manager, filterable by property, category, priority, and status (open, in-progress, scheduled, completed)
5. WHEN a maintenance request status changes, THE PM_Portal SHALL notify the Tenant and Property_Owner of the update via email within 60 seconds

### Requirement 30: Lease Renewal Risk Scoring

**User Story:** As a property manager, I want to see which leases are at risk of non-renewal, so that I can proactively engage tenants and reduce vacancy.

#### Acceptance Criteria

1. THE PM_Portal SHALL calculate a renewal risk score for each active lease based on: lease end date proximity, maintenance request frequency, rent payment history (late payments), tenant communication sentiment, and local market vacancy rates
2. THE PM_Portal SHALL display a lease renewal dashboard showing all leases sorted by risk score (highest risk first), with lease end date, tenant name, property address, and recommended action
3. WHEN a lease renewal risk score exceeds a configurable threshold (default: 70 out of 100), THE PM_Portal SHALL trigger an automated alert to the property manager recommending proactive tenant outreach
4. THE PM_Portal SHALL allow the property manager to initiate a lease renewal workflow from the dashboard: generate renewal offer, send to tenant, track acceptance or counter-offer

### Requirement 31: Review and Reputation Dashboard

**User Story:** As a property manager, I want to monitor and manage online reviews across platforms, so that I can maintain a strong reputation and address negative feedback quickly.

#### Acceptance Criteria

1. THE PM_Portal SHALL aggregate review data from Google Business Profile and display average rating, total review count, and recent reviews on a reputation dashboard
2. WHEN a new review with a rating of 3 stars or below is detected, THE PM_Portal SHALL trigger an alert to the property manager within 24 hours
3. THE PM_Portal SHALL display review trends over time (monthly average rating) and highlight properties with declining ratings
4. THE PM_Portal SHALL provide response templates for common review scenarios (positive acknowledgment, maintenance complaint response, general concern response) that the property manager can customize and post

### Requirement 32: Vendor Dispatch Workflow

**User Story:** As a property manager, I want to dispatch vendors for maintenance work with a structured workflow, so that I can track work orders from request through completion and payment.

#### Acceptance Criteria

1. THE PM_Portal SHALL maintain a vendor directory with: vendor name, contact information, service categories (plumbing, electrical, HVAC, general handyman, etc.), service area (cities/zip codes), hourly rate or flat-rate pricing, and average rating from past work orders
2. WHEN a property manager approves a maintenance request for vendor dispatch, THE PM_Portal SHALL suggest matching vendors based on service category, property location, availability, and past performance rating
3. WHEN a property manager dispatches a vendor, THE PM_Portal SHALL create a work order with: property address, maintenance description, photos, vendor assignment, estimated cost, and scheduled date, and notify the vendor via email within 5 minutes
4. THE PM_Portal SHALL track work order status through stages: dispatched, scheduled, in-progress, completed, and invoiced
5. WHEN a work order is marked as completed, THE PM_Portal SHALL notify the Property_Owner and Tenant and prompt the property manager to rate the vendor

### Requirement 33: Owner Monthly Report Generator

**User Story:** As a Property_Owner, I want to receive a monthly report summarizing my property performance, so that I can track income, expenses, and property condition without manual effort.

#### Acceptance Criteria

1. THE PM_Portal SHALL generate a monthly owner report for each property containing: rental income collected, expenses incurred (maintenance, management fees, utilities if applicable), net operating income, occupancy status, maintenance requests summary, and lease status
2. THE PM_Portal SHALL automatically generate and email monthly reports to Property_Owners by the 5th of each month for the preceding month
3. THE PM_Portal SHALL allow Property_Owners to download monthly reports as PDF from the Owner Portal
4. THE PM_Portal SHALL allow property managers to add custom notes or commentary to each monthly report before it is sent to the Property_Owner

### Requirement 34: Leasing Follow-Up Automation

**User Story:** As a property manager, I want automated follow-up with prospective tenants who inquire about available rentals, so that I can fill vacancies faster without manual tracking.

#### Acceptance Criteria

1. WHEN a prospective tenant submits an inquiry about an available rental property, THE PM_Portal SHALL create a leasing lead record and trigger an automated email response within 5 minutes with property details, showing availability, and application instructions
2. THE PM_Portal SHALL send automated follow-up emails at configurable intervals (default: 1 day, 3 days, 7 days) to prospective tenants who have not scheduled a showing or submitted an application
3. THE PM_Portal SHALL display a leasing pipeline dashboard showing all prospective tenants by stage: inquiry, showing scheduled, showing completed, application submitted, approved, lease signed
4. WHEN a prospective tenant schedules a showing, THE PM_Portal SHALL send a confirmation email with property address, date, time, and showing instructions within 5 minutes

### Requirement 35: Rent-Ready and Turn Checklist System

**User Story:** As a property manager, I want a structured checklist for preparing units between tenants, so that I can ensure consistent quality and track turn progress across properties.

#### Acceptance Criteria

1. THE PM_Portal SHALL provide configurable rent-ready checklists with default items organized by category: cleaning (deep clean, carpet cleaning, window cleaning), repairs (paint touch-up, fixture replacement, appliance check), inspection (smoke detectors, locks, plumbing, electrical), and documentation (photos, inventory update, listing preparation)
2. THE PM_Portal SHALL allow property managers to create a turn project for a specific property with a target completion date, assign checklist items to vendors or staff, and track completion percentage
3. WHEN all checklist items for a turn project are marked complete, THE PM_Portal SHALL notify the property manager and update the property status to "rent-ready"
4. THE PM_Portal SHALL display a turn project dashboard showing all active turns with property address, target date, completion percentage, and days until target

---

### LAYER 3: AI RESEARCH AND CONTENT ENGINE (Phase 3)

---

### Requirement 36: Local Data Crawling and Fact Extraction

**User Story:** As a content manager, I want an automated system that researches local real estate data from public sources, so that I can keep city and neighborhood pages current without manual research.

#### Acceptance Criteria

1. THE AI_Content_Engine SHALL crawl configured public data sources (city government sites, school rating sites, public MLS data feeds, census data) to extract structured facts about cities and neighborhoods in the Mesa metro area
2. THE AI_Content_Engine SHALL respect robots.txt directives for every crawled domain and rate-limit requests to a maximum of 1 request per 2 seconds per domain
3. THE AI_Content_Engine SHALL cache crawled responses to avoid redundant requests within a configurable time window (default: 24 hours)
4. THE AI_Content_Engine SHALL extract and store structured facts (median price, school ratings, population, crime statistics, amenities, new construction activity) with source URL, extraction date, and confidence score
5. THE AI_Content_Engine SHALL deduplicate extracted facts by matching on fact type, geographic area, and time period, retaining the most recent or highest-confidence source

### Requirement 37: Content Brief Generation

**User Story:** As a content manager, I want AI-generated content briefs based on researched facts, so that I can efficiently produce high-quality, locally relevant content at scale.

#### Acceptance Criteria

1. THE AI_Content_Engine SHALL generate Content_Briefs containing: target city, target search intent, source facts with citations, FAQ set (at least 5 questions), competitor content gaps, title options (at least 3), H1/H2 outline, CTA recommendation, compliance flags, schema markup recommendation (JSON-LD type), and internal link suggestions
2. THE AI_Content_Engine SHALL cluster extracted facts by topic and city to identify content opportunities and gaps in existing site coverage
3. THE AI_Content_Engine SHALL queue generated Content_Briefs for human review with a status of "pending-review" and SHALL NOT publish any content without human approval
4. WHEN a content manager approves a Content_Brief, THE AI_Content_Engine SHALL generate a full draft article based on the brief and queue it for a second human review before publishing
5. THE AI_Content_Engine SHALL flag Content_Briefs that cover topics with existing published content on the site, recommending whether to create new content or update the existing page

### Requirement 38: Content Compliance Filter

**User Story:** As a content manager, I want all AI-generated content automatically scanned for compliance violations, so that I can publish confidently without risk of Fair Housing Act violations or discriminatory language.

#### Acceptance Criteria

1. THE Compliance_Filter SHALL scan all AI-generated content (listing descriptions, content briefs, draft articles, chat responses) for Fair Housing Act violations including discriminatory language related to race, color, religion, sex, national origin, familial status, or disability
2. THE Compliance_Filter SHALL scan for steering language that directs or discourages buyers toward or away from specific neighborhoods based on protected characteristics
3. WHEN the Compliance_Filter detects a potential violation, THE Compliance_Filter SHALL flag the specific text, identify the violation type, and block the content from publishing until a human reviewer approves or edits the flagged section
4. THE Compliance_Filter SHALL maintain an audit log of all scanned content with scan date, content ID, flags raised, reviewer action, and final disposition
5. THE Compliance_Filter SHALL scan paid advertising copy for Meta Special Ad Category compliance before the copy is used in any housing-related ad campaign

### Requirement 39: Content Publishing Workflow

**User Story:** As a content manager, I want a structured workflow from content brief through review to publication, so that I can maintain quality control while publishing at scale.

#### Acceptance Criteria

1. THE AI_Content_Engine SHALL support a content lifecycle with stages: research, brief-generated, pending-review, approved, draft-generated, draft-review, compliance-cleared, published, and archived
2. WHEN a content manager transitions content to the "published" stage, THE Content_Management_Service SHALL deploy the content to the Public_Website, update the sitemap.xml, and submit the URL to Google Search Console for indexing
3. THE AI_Content_Engine SHALL provide a content calendar dashboard showing all content in pipeline by stage, target publish date, assigned reviewer, and target city/topic
4. THE AI_Content_Engine SHALL track content performance metrics (organic traffic, time on page, lead conversions) for each published piece and surface underperforming content for refresh

---

### CROSS-CUTTING REQUIREMENTS

---

### Requirement 40: Lead Generation Strategy Integration

**User Story:** As a business owner, I want the platform to support a multi-channel lead generation strategy, so that I can attract leads from organic search, social media, paid advertising, referrals, and portal sources.

#### Acceptance Criteria

1. THE Lead_Capture_Service SHALL support source attribution tags for every Lead, tracking the originating channel: organic-search, social-media, paid-search, paid-social, referral, portal (Zillow/Realtor.com), direct, ai-chat, and specific tool name
2. THE Agent_Dashboard SHALL display lead source analytics showing Lead volume, conversion rate, and cost-per-lead by source channel
3. THE Public_Website SHALL support UTM parameter tracking on all inbound URLs and persist UTM data (source, medium, campaign, content, term) in the Lead record
4. THE Platform SHALL support landing page creation for social media campaigns, with each landing page containing a focused CTA and lead capture form optimized for the campaign topic
5. THE CRM_System SHALL support configuring different Nurture_Sequences based on lead source channel, allowing tailored follow-up for organic leads versus paid leads versus referral leads

### Requirement 41: Referral and Partner Channel Support

**User Story:** As a business owner, I want to track and manage referral leads from partners (lenders, title companies, inspectors, contractors, past clients), so that I can nurture these high-quality lead sources.

#### Acceptance Criteria

1. THE CRM_System SHALL support partner profiles for referral sources: lenders, title/escrow companies, home inspectors, contractors, property managers, investors, relocation partners, and local employers
2. THE CRM_System SHALL track referral attribution: when a Lead is tagged with a referral source, THE CRM_System SHALL record the referring partner and maintain a referral count per partner
3. THE Agent_Dashboard SHALL display a referral dashboard showing leads received per partner, conversion rate per partner, and total revenue attributed to each referral source
4. WHEN a Lead is received with a referral partner tag, THE CRM_System SHALL trigger a thank-you notification to the referring partner within 24 hours

### Requirement 42: Paid Advertising Compliance

**User Story:** As a marketing manager, I want the platform to support compliant paid advertising for real estate, so that I can run Google and Meta ads without violating housing advertising regulations.

#### Acceptance Criteria

1. THE Platform SHALL support creating landing pages for Google Search ads targeting bottom-funnel real estate terms (e.g., "sell my house Mesa AZ", "homes for sale Gilbert AZ") with lead capture forms
2. THE Platform SHALL flag any paid advertising copy or targeting configuration that may violate Meta Special Ad Category restrictions for housing before the campaign is launched
3. THE Platform SHALL support retargeting pixel integration (Google Ads, Meta Pixel) on all Public_Website pages with appropriate consent mechanisms
4. WHEN creating Meta/Instagram ad campaigns for housing, THE Platform SHALL enforce Special Ad Category selection and restrict targeting options to comply with fair housing advertising rules

### Requirement 43: Personalization Engine

**User Story:** As a returning Visitor, I want the website to remember my preferences and show me relevant content and listings, so that I do not have to start from scratch every time I visit.

#### Acceptance Criteria

1. THE Personalization_Engine SHALL track Visitor interactions (tools used, search criteria entered, pages viewed, city and ZIP preferences, price range, Lead_Type) and store a preference profile in the DynamoDB_Store, associated with the Visitor session or authenticated account
2. WHEN a returning Visitor accesses the Public_Website, THE Public_Website SHALL adapt the homepage to display content, tools, and (when available) listings relevant to the Visitor stored preferences
3. THE Personalization_Engine SHALL use preference data to power recommendations: "Buyers who looked at homes in [neighborhood] also explored [related neighborhood]" and "Based on your budget, here are neighborhoods that match"
4. THE Platform SHALL allow Visitors to save their affordability scenarios, net sheet calculations, and search criteria for future reference, accessible via email link or authenticated account
5. WHEN a Visitor saved scenario inputs change due to market conditions (interest rates shift or market data updates), THE Platform SHALL notify the Visitor via email with updated results

### Requirement 44: Public Website Performance and Infrastructure

**User Story:** As a Visitor, I want the website to load quickly and work on any device, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. THE Public_Website SHALL achieve a Lighthouse performance score of 90 or above on mobile devices
2. THE Public_Website SHALL render responsively on viewport widths from 320px to 2560px
3. THE Public_Website SHALL be served via the existing CloudFront distribution (E3TBTUT3LJLAAT) with HTTPS enforced via the existing ACM certificate
4. THE Platform SHALL use serverless AWS services (Lambda, API Gateway, DynamoDB, Cognito, SES) to maintain near-zero cost at low traffic volumes (under 1000 monthly visitors)
5. THE Public_Website SHALL implement structured data markup (JSON-LD) for real estate listings, local business, FAQ pages, and articles to enhance search engine visibility
6. THE Platform SHALL process all payments (Flat_Fee_Service, Lead_Marketplace transactions, PM_Portal subscriptions) via Stripe with PCI-compliant integration

### Requirement 45: Data Validation and Error Handling

**User Story:** As a Visitor or Agent, I want clear feedback when something goes wrong, so that I can correct errors or understand system issues.

#### Acceptance Criteria

1. WHEN the Lead_Capture_Service receives a form submission, THE Lead_Capture_Service SHALL validate all input fields against defined rules (email format, phone format, required fields, field length limits) before processing
2. IF the Lead_Capture_Service receives a submission with an invalid email format, THEN THE Lead_Capture_Service SHALL return a specific error message identifying the invalid email field
3. IF the Lead_Capture_Service receives a submission with an invalid phone format, THEN THE Lead_Capture_Service SHALL return a specific error message identifying the invalid phone field
4. WHEN any API endpoint encounters an unhandled error, THE Platform SHALL return a structured error response with an error code, human-readable message, and correlation ID for debugging
5. THE Platform SHALL log all errors with correlation ID, timestamp, error type, and request context to CloudWatch Logs

### Requirement 46: Lead Data Serialization

**User Story:** As a developer, I want Lead data to be reliably serialized and deserialized, so that data integrity is maintained across all system components.

#### Acceptance Criteria

1. THE Lead_Capture_Service SHALL serialize Lead records to JSON format for storage in DynamoDB_Store and transmission via API responses
2. THE Lead_Capture_Service SHALL deserialize Lead records from JSON format when reading from DynamoDB_Store
3. FOR ALL valid Lead records, serializing to JSON then deserializing back SHALL produce a Lead record equivalent to the original (round-trip property)
4. THE Lead_Capture_Service SHALL use an explicit schema definition for Lead records that enumerates all required and optional fields with their types
5. THE PM_Portal SHALL serialize and deserialize maintenance request, work order, and owner report records using the same JSON round-trip property as Lead records

### Requirement 47: Content Brief Serialization

**User Story:** As a developer, I want Content_Brief data to be reliably serialized and deserialized, so that the AI content pipeline maintains data integrity from generation through review to publishing.

#### Acceptance Criteria

1. THE AI_Content_Engine SHALL serialize Content_Brief records to JSON format for storage and API transmission
2. THE AI_Content_Engine SHALL deserialize Content_Brief records from JSON format when reading from storage
3. FOR ALL valid Content_Brief records, serializing to JSON then deserializing back SHALL produce a Content_Brief record equivalent to the original (round-trip property)
4. THE AI_Content_Engine SHALL use an explicit schema definition for Content_Brief records that enumerates all required and optional fields with their types
