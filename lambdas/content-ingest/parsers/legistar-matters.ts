/**
 * Legistar matters parser — fetches legislative matters (zoning cases,
 * ordinances, resolutions) from Mesa's Legistar API.
 *
 * Unlike /events which covers meetings, /matters covers the legislative
 * items themselves — the rezoning for "Ascension 40 acres at Brown &
 * 32nd" is a single matter that appears on multiple meeting agendas.
 *
 * Priority flag: we emit the matter, and the bundler decides if the
 * title mentions priority keywords (rezone, subdivision, apartment,
 * data center, commercial).
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface LegistarMatter {
  MatterId: number;
  MatterFile?: string;
  MatterName?: string;
  MatterTitle?: string;
  MatterTypeName?: string;
  MatterStatusName?: string;
  MatterBodyName?: string;
  MatterIntroDate?: string;
  MatterAgendaDate?: string;
}

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

const PRIORITY_KEYWORDS = [
  'rezone',
  'rezoning',
  'zoning',
  'subdivision',
  'apartment',
  'apartments',
  'data center',
  'development',
  'approval',
  'site plan',
  'PAD',
  'mixed use',
  'commercial',
];

/**
 * Score a matter's priority based on title keywords.
 * 0 = no match, higher = more matches.
 */
function scorePriority(matter: LegistarMatter): number {
  const haystack = `${matter.MatterTitle ?? ''} ${matter.MatterName ?? ''}`.toLowerCase();
  return PRIORITY_KEYWORDS.filter((kw) => haystack.includes(kw.toLowerCase())).length;
}

export async function fetchLegistarMatters(source: ContentSource): Promise<ParsedItem[]> {
  const config = (source.config ?? {}) as {
    lookbackDays?: number;
    matterTypes?: string[];
  };
  const lookbackDays = config.lookbackDays ?? 60;
  const matterTypes = config.matterTypes ?? ['Zoning', 'Rezoning', 'Ordinance', 'Resolution'];

  const fromDate = new Date(Date.now() - lookbackDays * 86400000).toISOString();

  // Filter: recently introduced matters. MatterTypeName filter is
  // unreliable on the Mesa Legistar instance (types like 'Zoning'
  // aren't always populated), so we pull all recent matters and
  // score priority via keyword match on the title.
  const filter = `MatterIntroDate ge datetime'${fromDate}'`;
  // Unused: matterTypes kept in config for future discriminator
  void matterTypes;
  const url = `${source.url}?$filter=${encodeURIComponent(filter)}&$orderby=MatterIntroDate desc&$top=100`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MesaHomesBot/1.0 (+https://mesahomes.com)',
    },
  });
  if (!res.ok) {
    throw new Error(`Legistar matters fetch failed: HTTP ${res.status}`);
  }

  const matters = (await res.json()) as LegistarMatter[];

  return matters.map((m) => ({
    id: `matter-${m.MatterId}`,
    title: `${m.MatterFile ?? m.MatterId} — ${(m.MatterTitle ?? m.MatterName ?? '').slice(0, 120)}`,
    data: {
      ...(m as unknown as Record<string, unknown>),
      priorityScore: scorePriority(m),
    },
  }));
}
