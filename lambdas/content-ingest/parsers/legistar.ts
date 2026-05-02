/**
 * Legistar parser — fetches public meetings and agenda items from Mesa's
 * Legistar REST API. No auth required, JSON format.
 *
 * Docs: https://webapi.legistar.com/Help
 * Spec: .kiro/specs/mesahomes-lead-generation/content-sources.md §1
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface LegistarEvent {
  EventId: number;
  EventBodyId: number;
  EventBodyName: string;
  EventDate: string;
  EventTime: string;
  EventLocation: string;
  EventAgendaFile?: string;
  EventMinutesFile?: string;
  EventComment?: string;
}

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

/**
 * Fetch meetings from the Legistar `/events` endpoint, filtered to the
 * bodies we care about, within a window of recent + upcoming meetings.
 */
export async function fetchLegistarEvents(source: ContentSource): Promise<ParsedItem[]> {
  const config = (source.config ?? {}) as {
    bodyIds?: number[];
    lookbackDays?: number;
    lookaheadDays?: number;
  };
  const bodyIds = config.bodyIds ?? [];
  const lookbackDays = config.lookbackDays ?? 14;
  const lookaheadDays = config.lookaheadDays ?? 30;

  const now = new Date();
  const fromDate = new Date(now.getTime() - lookbackDays * 86400000).toISOString();
  const toDate = new Date(now.getTime() + lookaheadDays * 86400000).toISOString();

  // Legistar OData filter: EventBodyId in bodyIds AND EventDate between window
  const bodyFilter = bodyIds.length
    ? bodyIds.map((id) => `EventBodyId eq ${id}`).join(' or ')
    : '';
  const dateFilter = `EventDate ge datetime'${fromDate}' and EventDate le datetime'${toDate}'`;
  const filter = bodyFilter ? `(${bodyFilter}) and ${dateFilter}` : dateFilter;

  const url = `${source.url}?$filter=${encodeURIComponent(filter)}&$orderby=EventDate desc&$top=100`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MesaHomes-ContentIngest/1.0 (+https://mesahomes.com)',
    },
  });

  if (!res.ok) {
    throw new Error(`Legistar fetch failed: HTTP ${res.status} ${res.statusText}`);
  }

  const events = (await res.json()) as LegistarEvent[];

  return events.map((e) => ({
    id: `event-${e.EventId}`,
    title: `${e.EventBodyName} — ${new Date(e.EventDate).toLocaleDateString('en-US')}`,
    data: e as unknown as Record<string, unknown>,
  }));
}
