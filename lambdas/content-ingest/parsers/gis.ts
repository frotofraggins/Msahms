/**
 * GIS parser — builds subdivision directory records from county
 * parcel data.
 *
 * For each city in config, queries the county GIS for distinct
 * subdivision names, then does an aggregate query per subdivision
 * (parcel count, avg assessed value, year-built range). Emits one
 * record per subdivision.
 *
 * Used for HOA hyperlocal pages — see
 * .kiro/specs/hoa-hyperlocal-strategy.md
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

interface GisSubdivisionRecord {
  SUBNAME?: string | null;
}

/** Slugify subdivision name for URLs. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function gisFetch(url: string, body: Record<string, string>): Promise<unknown> {
  const params = new URLSearchParams(body);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Same UA workaround as property-lookup — Maricopa blocks
      // default Node fetch UA
      'User-Agent':
        'Mozilla/5.0 (MesaHomesBot/1.0; +https://mesahomes.com)',
      Accept: 'application/json',
    },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`GIS HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGis(source: ContentSource): Promise<ParsedItem[]> {
  const config = (source.config ?? {}) as {
    distinct?: string;
    cities?: string[];
    maxSubdivisions?: number;
  };
  const cities = config.cities ?? ['MESA'];
  const maxSubs = config.maxSubdivisions ?? 1000;
  const subdivisionField = config.distinct ?? 'SUBNAME';

  const items: ParsedItem[] = [];

  for (const city of cities) {
    // Step 1: Get distinct subdivisions for this city
    const distinctResp = (await gisFetch(source.url, {
      where: `PHYSICAL_CITY='${city.replace(/'/g, "''")}'`,
      f: 'json',
      outFields: subdivisionField,
      returnDistinctValues: 'true',
      returnGeometry: 'false',
      resultRecordCount: String(maxSubs),
    })) as { features?: Array<{ attributes: GisSubdivisionRecord }> };

    const subNames = Array.from(
      new Set(
        (distinctResp.features ?? [])
          .map((f) => f.attributes.SUBNAME?.trim())
          .filter((s): s is string => !!s && s.length > 2),
      ),
    );

    console.log(`[gis-parser] ${city}: ${subNames.length} distinct subdivisions`);

    // Step 2: For each subdivision, run aggregate query. Limit to avoid
    // cost + per-Lambda timeout — city-wide enumeration is a
    // first-pass; Tier 2 per-MPC scrapers enrich the big ones.
    // With 3-second GIS round-trip and 500+ subdivisions, we'd blow
    // the 5-min Lambda timeout. Instead, just emit the subdivision
    // names now; a separate Lambda or batch job enriches later.
    for (const sub of subNames) {
      const slug = slugify(`${sub}-${city}`.toLowerCase());
      items.push({
        id: slug,
        title: `${sub}, ${city} AZ`,
        data: {
          subdivisionName: sub,
          city,
          slug,
          source: 'maricopa-gis',
          // Aggregate fields populated by enrichment Lambda (Task 1b)
          parcelCount: null,
          avgAssessedValue: null,
          avgSqft: null,
          yearBuiltMin: null,
          yearBuiltMax: null,
          enrichedAt: null,
        },
      });
    }
  }

  return items;
}
