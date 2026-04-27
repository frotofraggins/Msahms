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
  };
  const limit = config.limit ?? 1000;

  // 7-day lookback window
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
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
