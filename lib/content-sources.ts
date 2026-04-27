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

export type SourceType = 'legistar' | 'socrata' | 'rss' | 'zillow-csv' | 'gis' | 'html';

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
];

// Phase 2 — to enable after Phase 1 proves the pattern
const PHASE_2_SOURCES: ContentSource[] = [
  {
    id: 'legistar-matters',
    name: 'Mesa Legistar — Legislative Matters (Zoning Cases)',
    type: 'legistar',
    url: 'https://webapi.legistar.com/v1/mesa/matters',
    topic: 'zoning',
    cadence: 'daily',
  },
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
    id: 'maricopa-subdivisions',
    name: 'Maricopa County — New Subdivisions',
    type: 'gis',
    url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    topic: 'hoa',
    cadence: 'monthly',
    config: {
      distinct: 'SUBNAME',
      cities: ['MESA', 'GILBERT', 'CHANDLER', 'QUEEN CREEK', 'APACHE JUNCTION'],
    },
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
