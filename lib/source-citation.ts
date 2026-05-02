/**
 * Shared source-citation helpers.
 *
 * Every ingested item needs a stable primary-source URL so the
 * drafter Lambda can cite it in generated content. Without a
 * primary URL, drafts can't pass the compliance filter that
 * requires source attribution.
 */

import type { ContentSource } from './content-sources.js';

export interface SourceCitation {
  /** Stable URL to the primary source — click-through for humans. */
  url: string;
  /** Human-readable attribution string for article footers. */
  attribution: string;
  /** License / copyright status if known. */
  license?: 'public-record' | 'cc-by-sa' | 'cc-by' | 'fair-use-excerpt' | 'proprietary';
  /** When we fetched this item. */
  fetchedAt: string;
}

/**
 * Build a primary-source URL + attribution string for a given
 * source + item-id. Extends as new source types are added.
 *
 * Returns null if we can't derive a URL — caller should skip the
 * item rather than publish an unattributable claim.
 */
export function buildCitation(
  source: ContentSource,
  itemId: string,
  itemData: Record<string, unknown>,
): SourceCitation | null {
  const fetchedAt = new Date().toISOString();

  switch (source.type) {
    case 'legistar': {
      // itemId format: "event-{EventId}"
      const eventId = itemId.replace(/^event-/, '');
      return {
        url: `https://mesa.legistar.com/MeetingDetail.aspx?ID=${eventId}`,
        attribution: `Mesa City Legistar — meeting record ${eventId}`,
        license: 'public-record',
        fetchedAt,
      };
    }
    case 'legistar-matters': {
      // itemId format: "matter-{MatterId}"
      const matterId = itemId.replace(/^matter-/, '');
      const file = itemData.MatterFile as string | undefined;
      return {
        url: `https://mesa.legistar.com/LegislationDetail.aspx?ID=${matterId}`,
        attribution: `Mesa City Legistar — ${file ?? `matter ${matterId}`}`,
        license: 'public-record',
        fetchedAt,
      };
    }
    case 'socrata': {
      // Historic properties, addresses etc. get per-dataset attribution.
      // Crime aggregate is dataset-level; don't try to link to a per-
      // record permalink.
      return {
        url: source.url.replace('.json', '') + '?utm_source=mesahomes',
        attribution: `Mesa Open Data — ${source.name.replace(/^Mesa City — /, '').replace(/^Mesa Police /, '')}`,
        license: 'public-record',
        fetchedAt,
      };
    }
    case 'rss': {
      const link = (itemData.link as string | undefined) ?? undefined;
      if (!link) return null;
      return {
        url: link,
        attribution: source.name,
        license: source.id.startsWith('reddit-') ? 'fair-use-excerpt' : 'proprietary',
        fetchedAt,
      };
    }
    case 'gis': {
      // Subdivision record — link to a Maricopa assessor search URL
      const subName = itemData.subdivisionName as string | undefined;
      if (!subName) return null;
      const encoded = encodeURIComponent(subName);
      return {
        url: `https://mcassessor.maricopa.gov/?q=${encoded}`,
        attribution: 'Maricopa County Assessor parcel records',
        license: 'public-record',
        fetchedAt,
      };
    }
    case 'big-sales': {
      const addr = itemData.address as string | undefined;
      if (!addr) return null;
      const encoded = encodeURIComponent(addr);
      return {
        url: `https://mcassessor.maricopa.gov/?q=${encoded}`,
        attribution: `Maricopa County Assessor — sale record for ${addr}`,
        license: 'public-record',
        fetchedAt,
      };
    }
    case 'zillow-csv': {
      return {
        url: source.url,
        attribution: 'Zillow Research — public CSVs',
        license: 'cc-by',
        fetchedAt,
      };
    }
    case 'html':
    default:
      return null;
  }
}
