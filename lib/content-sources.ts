/**
 * Registry of content sources the ingest Lambda polls.
 *
 * Each source has a canonical id, URL(s), parser type, cadence, and topic
 * bucket. The ingest Lambda dispatches per-source fetchers via the `type`
 * field. Adding a new source is a 1-line entry here + a parser in
 * `lambdas/content-ingest/parsers/`.
 *
 * See .kiro/specs/content-ingest-pipeline.md for architecture rationale.
 */

export type SourceType = 'legistar' | 'legistar-matters' | 'socrata' | 'rss' | 'zillow-csv' | 'gis' | 'big-sales' | 'html';

export type Topic =
  | 'zoning' // City council, planning & zoning cases, development
  | 'market' // Market data, price trends, inventory
  | 'hoa' // HOAs, subdivisions, community sentiment
  | 'housing-law' // Fed/state/local regulatory changes
  | 'news' // Local news roundup
  | 'relocation' // Out-of-state move content
  | 'safety' // Crime stats (aggregate only, FH-safe)
  | 'schools' // Education data
  | 'civic'; // Elections, ballot measures, bond issues

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'event-driven';

export interface ContentSource {
  /** Stable canonical id, used as DDB key prefix */
  id: string;
  /** Human-facing name, shown in admin */
  name: string;
  /** Source type — determines which parser runs */
  type: SourceType;
  /** Primary URL or endpoint */
  url: string;
  /** Topic bucket this source feeds into */
  topic: Topic;
  /** How often to poll */
  cadence: Cadence;
  /** Category of compliance concern (Fair Housing etc.) */
  compliance?: 'fair-housing' | 'upl' | 'standard';
  /** Optional filter keywords (for RSS/news) */
  keywords?: string[];
  /** Extra parser-specific config */
  config?: Record<string, unknown>;
}

// Phase 1 — first 3 sources to prove the pipeline
const PHASE_1_SOURCES: ContentSource[] = [
  {
    id: 'mesa-legistar-events',
    name: 'Mesa Legistar — Public Meetings',
    type: 'legistar',
    url: 'https://webapi.legistar.com/v1/mesa/events',
    topic: 'zoning',
    cadence: 'daily',
    config: {
      // Bodies that matter for real estate: City Council (138),
      // Planning & Zoning (153), Planning Hearing Officer (215),
      // Board of Adjustment (251), Design Review (279), Historic
      // Preservation (268), Eastmark CFD (242), Cadence CFD (252)
      bodyIds: [138, 153, 215, 251, 279, 268, 242, 252],
      lookbackDays: 14,
      lookaheadDays: 30,
    },
  },
  {
    id: 'mesa-pd-incidents',
    name: 'Mesa Police Incidents (Socrata)',
    type: 'socrata',
    url: 'https://data.mesaaz.gov/resource/hpbg-2wph.json',
    topic: 'safety',
    compliance: 'fair-housing',
    cadence: 'weekly',
    config: {
      // Query last 7 days, aggregate only — Fair Housing requires
      // no neighborhood-level safety ratings per content-sources.md §15
      limit: 1000,
      aggregateOnly: true,
    },
  },
  {
    id: 'reddit-mesaaz',
    name: 'Reddit r/mesaaz — Community Sentiment',
    type: 'rss',
    url: 'https://www.reddit.com/r/mesaaz/.rss',
    topic: 'news',
    cadence: 'daily',
    // No keyword filter — we want ALL community posts to feed sentiment
    // analysis. The bundler will cluster by topic.
  },
  {
    id: 'maricopa-subdivisions',
    name: 'Maricopa County — Subdivision Directory (HOA hyperlocal)',
    type: 'gis',
    url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    topic: 'hoa',
    cadence: 'monthly',
    config: {
      distinct: 'SUBNAME',
      cities: ['MESA', 'GILBERT', 'CHANDLER', 'QUEEN CREEK', 'APACHE JUNCTION'],
      maxSubdivisions: 2000,
    },
  },
  {
    id: 'legistar-matters',
    name: 'Mesa Legistar — Legislative Matters (Zoning, Rezoning, Ordinances)',
    type: 'legistar-matters',
    url: 'https://webapi.legistar.com/v1/mesa/matters',
    topic: 'zoning',
    cadence: 'daily',
    config: {
      lookbackDays: 60,
      matterTypes: ['Zoning', 'Rezoning', 'Ordinance', 'Resolution'],
    },
  },
  {
    id: 'maricopa-big-sales',
    name: 'Maricopa County — High-Value Residential Sales',
    type: 'big-sales',
    url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    topic: 'market',
    cadence: 'weekly',
    config: {
      cities: ['MESA', 'GILBERT', 'CHANDLER', 'QUEEN CREEK', 'APACHE JUNCTION'],
      minPrice: 1500000,
      limit: 25,
    },
  },
  {
    id: 'mesa-historic-properties',
    name: 'Mesa City — Historic Properties Registry',
    type: 'socrata',
    url: 'https://data.mesaaz.gov/resource/x94t-w43j.json',
    topic: 'zoning',
    cadence: 'monthly',
    config: {
      aggregateOnly: false,
      limit: 500,
    },
  },
  {
    id: 'noaa-maricopa-alerts',
    name: 'NOAA Weather Alerts — Maricopa County',
    type: 'rss',
    url: 'https://api.weather.gov/alerts/active.atom?zone=AZZ550',
    topic: 'news',
    cadence: 'daily',
  },
  {
    id: 'reddit-phoenix',
    name: 'Reddit r/phoenix — Metro Sentiment',
    type: 'rss',
    url: 'https://www.reddit.com/r/phoenix/.rss',
    topic: 'news',
    cadence: 'daily',
    keywords: [
      'mesa', 'gilbert', 'chandler', 'queen creek', 'apache junction',
      'san tan valley', 'east valley', 'housing', 'rent', 'home',
      'apartment', 'hoa', 'landlord', 'property tax', 'real estate',
    ],
  },
  {
    id: 'reddit-arizona',
    name: 'Reddit r/arizona — State Sentiment (filtered)',
    type: 'rss',
    url: 'https://www.reddit.com/r/arizona/.rss',
    topic: 'news',
    cadence: 'daily',
    keywords: [
      'mesa', 'gilbert', 'chandler', 'phoenix', 'east valley',
      'housing', 'hoa', 'property tax', 'rent', 'zoning', 'adu',
      'starter home', 'development',
    ],
  },
  {
    id: 'mesa-now-news',
    name: 'Mesa City Official News (mesanow.org)',
    type: 'rss',
    url: 'https://www.mesanow.org/news/feeds/rss?cat=all',
    topic: 'news',
    cadence: 'daily',
  },
  // --- STATE + NATIONAL CONTEXT ---
  // These filter on keywords to avoid flooding the pipeline with
  // non-housing content. The bundler can still surface high-priority
  // items that match multiple sources.
  {
    id: 'az-governor-news',
    name: 'Office of the Arizona Governor — Press Releases',
    type: 'rss',
    url: 'https://azgovernor.gov/newsroom/feed',
    topic: 'housing-law',
    cadence: 'daily',
    keywords: [
      'housing', 'home', 'mortgage', 'rent', 'eviction', 'hoa',
      'zoning', 'development', 'builder', 'affordable', 'property',
      'real estate', 'mesa', 'gilbert', 'chandler', 'phoenix',
      'east valley', 'tax', 'land', 'water', 'utility',
    ],
  },
  {
    id: 'realtor-com-news',
    name: 'Realtor.com News',
    type: 'rss',
    url: 'https://www.realtor.com/news/feed/',
    topic: 'market',
    cadence: 'daily',
    keywords: [
      'arizona', 'phoenix', 'mesa', 'mortgage rate', 'home price',
      'housing market', 'inventory', 'affordability', 'first-time buyer',
      'rent', 'hoa', 'property tax', 'migrating', 'sunbelt',
    ],
  },
  {
    id: 'housingwire-news',
    name: 'HousingWire — Industry News',
    type: 'rss',
    url: 'https://www.housingwire.com/feed/',
    topic: 'housing-law',
    cadence: 'daily',
    keywords: [
      'nar', 'settlement', 'commission', 'arizona', 'phoenix',
      'mortgage', 'fha', 'fannie mae', 'freddie mac', 'cfpb',
      'hud', 'fhfa', 'compliance', 'regulation', 'broker',
    ],
  },
  {
    id: 'mortgage-reports',
    name: 'The Mortgage Reports',
    type: 'rss',
    url: 'https://themortgagereports.com/feed',
    topic: 'market',
    cadence: 'daily',
    keywords: [
      'first-time', 'buyer', 'interest rate', 'mortgage rate',
      'down payment', 'fha', 'va loan', 'credit score',
      'pre-approval', 'closing cost', 'arizona', 'home equity',
    ],
  },
  {
    id: 'redfin-blog',
    name: 'Redfin Blog — Home Buying/Selling Tips',
    type: 'rss',
    url: 'https://www.redfin.com/blog/feed/',
    topic: 'market',
    cadence: 'daily',
    keywords: [
      'arizona', 'phoenix', 'mesa', 'home buyer', 'home seller',
      'open house', 'closing cost', 'staging', 'inspection',
      'appraisal', 'escrow', 'offer', 'contingency', 'first-time',
    ],
  },
];

// Phase 2 — to enable after Phase 1 proves the pattern
const PHASE_2_SOURCES: ContentSource[] = [
  {
    id: 'az-legislature-bills',
    name: 'Arizona Legislature — Real Estate Bills',
    type: 'rss',
    url: 'https://www.azleg.gov/rss/bills.rss',
    topic: 'housing-law',
    cadence: 'daily',
    keywords: ['housing', 'real estate', 'HOA', 'zoning', 'property tax'],
  },
  {
    id: 'federal-register-hud',
    name: 'Federal Register — HUD',
    type: 'rss',
    url: 'https://www.federalregister.gov/agencies/housing-and-urban-development-department/rss.xml',
    topic: 'housing-law',
    cadence: 'daily',
  },
  {
    id: 'federal-register-cfpb',
    name: 'Federal Register — CFPB',
    type: 'rss',
    url: 'https://www.federalregister.gov/agencies/consumer-financial-protection-bureau/rss.xml',
    topic: 'housing-law',
    cadence: 'daily',
  },
  {
    id: 'federal-register-fhfa',
    name: 'Federal Register — FHFA',
    type: 'rss',
    url: 'https://www.federalregister.gov/agencies/federal-housing-finance-agency/rss.xml',
    topic: 'housing-law',
    cadence: 'daily',
  },
  {
    id: 'adre-bulletins',
    name: 'Arizona Department of Real Estate — Bulletins',
    type: 'html',
    url: 'https://azre.gov/news-events/bulletins',
    topic: 'housing-law',
    cadence: 'weekly',
  },
  {
    id: 'aar-legal-hotline',
    name: 'AAR Legal Hotline',
    type: 'rss',
    url: 'https://www.aaronline.com/feed/',
    topic: 'housing-law',
    cadence: 'weekly',
    keywords: ['contract', 'disclosure', 'form', 'compliance'],
  },
  {
    id: 'zillow-zhvi-zip',
    name: 'Zillow Home Value Index — ZIP',
    type: 'zillow-csv',
    url: 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv',
    topic: 'market',
    cadence: 'monthly',
  },
];

export const ALL_SOURCES: ContentSource[] = [...PHASE_1_SOURCES, ...PHASE_2_SOURCES];

/** Sources enabled in current deployment. Gate Phase 2+ behind env flag until proven. */
export function getEnabledSources(): ContentSource[] {
  if (process.env.CONTENT_SOURCES_PHASE === '2') return ALL_SOURCES;
  return PHASE_1_SOURCES;
}

/** Get source by id — throws if not found. */
export function getSourceById(id: string): ContentSource {
  const src = ALL_SOURCES.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown content source: ${id}`);
  return src;
}

/** Get all sources for a given cadence. Used by schedule Lambda. */
export function getSourcesByCadence(cadence: Cadence): ContentSource[] {
  return getEnabledSources().filter((s) => s.cadence === cadence);
}
