/**
 * Socrata Open Data API parser — used by Mesa Police Incidents and other
 * Mesa city open datasets.
 *
 * For safety data: Fair Housing compliance requires aggregate-only
 * reporting. See .kiro/specs/mesahomes-lead-generation/content-sources.md
 * §15 ("IMPORTANT: Fair Housing Compliance").
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

/**
 * Fetch + aggregate police incidents for the past 7 days, returning
 * city-wide counts by crime type. We explicitly do NOT return
 * individual incident records — per spec, only aggregate data goes into
 * the pipeline to stay Fair-Housing-safe.
 */
export async function fetchSocrata(source: ContentSource): Promise<ParsedItem[]> {
  const config = (source.config ?? {}) as {
    limit?: number;
    aggregateOnly?: boolean;
    lookbackDays?: number;
  };
  const limit = config.limit ?? 1000;
  const aggregateOnly = config.aggregateOnly !== false; // default true for crime data

  // Non-aggregated path: each record becomes an item (e.g. historic
  // properties registry). Use for stable, finite datasets — don't
  // use for volatile/large-volume streams or you'll blow the limit.
  if (!aggregateOnly) {
    const url = `${source.url}?$limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MesaHomesBot/1.0 (+https://mesahomes.com)',
      },
    });
    if (!res.ok) {
      throw new Error(`Socrata fetch failed: HTTP ${res.status} ${res.statusText}`);
    }
    const records = (await res.json()) as Array<Record<string, unknown>>;
    return records.map((r, idx) => {
      // Find a meaningful identifier — datasets vary wildly in their
      // PK field. Try common names then fall back to index.
      const id =
        (r.id as string | undefined) ??
        (r.objectid as string | undefined) ??
        (r.number as string | undefined) ??
        (r.fid as string | undefined) ??
        `row-${idx}`;
      // Find a title-ish field
      const title =
        (r.title as string | undefined) ??
        (r.name as string | undefined) ??
        (r.address as string | undefined) ??
        String(id);
      return {
        id: `socrata-${id}`.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 80),
        title,
        data: r,
      };
    });
  }

  // Aggregate path (crime data) — unchanged from original implementation.
  // 7-day lookback window
  const since = new Date(Date.now() - (config.lookbackDays ?? 7) * 86400000)
    .toISOString()
    .slice(0, 10);
  const where = `occurred_date > '${since}'`;
  const url = `${source.url}?$limit=${limit}&$where=${encodeURIComponent(where)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MesaHomes-ContentIngest/1.0 (+https://mesahomes.com)',
    },
  });

  if (!res.ok) {
    throw new Error(`Socrata fetch failed: HTTP ${res.status} ${res.statusText}`);
  }

  const records = (await res.json()) as Array<{
    crime_type?: string;
    nibrs_description?: string;
    crime_against?: string;
    occurred_date?: string;
  }>;

  // Aggregate by crime category — Fair Housing safe
  const byCrimeType = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const r of records) {
    const type = r.crime_type ?? r.nibrs_description ?? 'UNKNOWN';
    byCrimeType.set(type, (byCrimeType.get(type) ?? 0) + 1);
    const cat = r.crime_against ?? 'UNKNOWN';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }

  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      id: `mesa-pd-weekly-${today}`,
      title: `Mesa Police Weekly Summary (7 days ending ${today})`,
      data: {
        windowStart: since,
        windowEnd: today,
        totalIncidents: records.length,
        byCrimeType: Object.fromEntries(byCrimeType),
        byCategory: Object.fromEntries(byCategory),
        note:
          'Aggregate counts only. Individual incident records intentionally not persisted per Fair Housing policy.',
      },
    },
  ];
}
