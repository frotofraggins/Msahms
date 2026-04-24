import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  OUTBOUND_STATUSES,
  SLA_TIERS,
  firstOutboundEntry,
  classifyTier,
  computeLeadResponseTime,
  computeSLASummary,
  formatDuration,
} from './agent-sla.js';
import { LeadStatus } from './types/lead.js';
import type { Lead, StatusHistoryEntry } from './types/lead.js';

function leadWith(history: StatusHistoryEntry[], createdAt = '2026-04-24T12:00:00Z'): Lead {
  return {
    leadId: 'lead-' + Math.random().toString(36).slice(2, 9),
    name: 'Test',
    email: 't@t.com',
    phone: '+15555550100',
    city: 'Mesa',
    zip: '85210',
    timeframe: '3mo',
    leadType: 'Buyer',
    leadStatus: history.length > 0 ? history[history.length - 1]!.status : LeadStatus.New,
    toolSource: 'direct-consult',
    createdAt,
    updatedAt: createdAt,
    statusHistory: history,
  } as Lead;
}

describe('classifyTier', () => {
  it('returns excellent below 5 minutes', () => {
    expect(classifyTier(60)).toBe('excellent');
    expect(classifyTier(SLA_TIERS.EXCELLENT_SEC)).toBe('excellent');
  });
  it('returns good between 5 and 30 minutes', () => {
    expect(classifyTier(SLA_TIERS.EXCELLENT_SEC + 1)).toBe('good');
    expect(classifyTier(SLA_TIERS.GOOD_SEC)).toBe('good');
  });
  it('returns acceptable between 30 and 60 minutes', () => {
    expect(classifyTier(SLA_TIERS.GOOD_SEC + 1)).toBe('acceptable');
    expect(classifyTier(SLA_TIERS.ACCEPTABLE_SEC)).toBe('acceptable');
  });
  it('returns slow beyond 1 hour', () => {
    expect(classifyTier(SLA_TIERS.ACCEPTABLE_SEC + 1)).toBe('slow');
    expect(classifyTier(86400)).toBe('slow');
  });
  it('returns uncontacted for null', () => {
    expect(classifyTier(null)).toBe('uncontacted');
  });
});

describe('firstOutboundEntry', () => {
  it('returns null for empty history', () => {
    expect(firstOutboundEntry([])).toBeNull();
    expect(firstOutboundEntry(undefined)).toBeNull();
  });
  it('returns null when all entries are New', () => {
    expect(
      firstOutboundEntry([
        { status: LeadStatus.New, timestamp: '2026-04-24T12:00:00Z', agentId: 'a1' },
      ]),
    ).toBeNull();
  });
  it('returns the earliest outbound entry', () => {
    const e = firstOutboundEntry([
      { status: LeadStatus.New, timestamp: '2026-04-24T12:00:00Z', agentId: 'a1' },
      { status: LeadStatus.Showing, timestamp: '2026-04-24T14:00:00Z', agentId: 'a1' },
      { status: LeadStatus.Contacted, timestamp: '2026-04-24T12:03:00Z', agentId: 'a1' },
    ]);
    expect(e?.status).toBe(LeadStatus.Contacted);
    expect(e?.timestamp).toBe('2026-04-24T12:03:00Z');
  });
});

describe('computeLeadResponseTime', () => {
  it('returns null responseTimeSec for uncontacted lead', () => {
    const r = computeLeadResponseTime(leadWith([]));
    expect(r.responseTimeSec).toBeNull();
    expect(r.tier).toBe('uncontacted');
  });
  it('computes seconds correctly for contacted lead', () => {
    const r = computeLeadResponseTime(
      leadWith(
        [{ status: LeadStatus.Contacted, timestamp: '2026-04-24T12:04:00Z', agentId: 'a1' }],
        '2026-04-24T12:00:00Z',
      ),
    );
    expect(r.responseTimeSec).toBe(240);
    expect(r.tier).toBe('excellent');
  });
  it('clamps negative deltas to zero (defensive)', () => {
    const r = computeLeadResponseTime(
      leadWith(
        [{ status: LeadStatus.Contacted, timestamp: '2026-04-24T11:00:00Z', agentId: 'a1' }],
        '2026-04-24T12:00:00Z',
      ),
    );
    expect(r.responseTimeSec).toBe(0);
  });
});

describe('computeSLASummary', () => {
  it('handles empty input', () => {
    const s = computeSLASummary([]);
    expect(s.totalLeads).toBe(0);
    expect(s.meanSec).toBeNull();
    expect(s.medianSec).toBeNull();
  });
  it('computes mean/median/fastest/slowest correctly', () => {
    const leads = [60, 300, 1800, 3600, 7200].map((delayMin) =>
      leadWith(
        [
          {
            status: LeadStatus.Contacted,
            timestamp: new Date(Date.parse('2026-04-24T12:00:00Z') + delayMin * 1000).toISOString(),
            agentId: 'a1',
          },
        ],
        '2026-04-24T12:00:00Z',
      ),
    );
    const s = computeSLASummary(leads);
    expect(s.totalLeads).toBe(5);
    expect(s.contactedLeads).toBe(5);
    expect(s.fastestSec).toBe(60);
    expect(s.slowestSec).toBe(7200);
    expect(s.meanSec).toBe(Math.round((60 + 300 + 1800 + 3600 + 7200) / 5));
  });
  it('only reports p90 when 10+ contacted leads', () => {
    const few = computeSLASummary([leadWith([], '2026-04-24T12:00:00Z')]);
    expect(few.p90Sec).toBeNull();
  });
  it('splits tier counts correctly', () => {
    const leads = [
      leadWith([]), // uncontacted
      leadWith(
        [{ status: LeadStatus.Contacted, timestamp: '2026-04-24T12:01:00Z', agentId: 'a1' }],
        '2026-04-24T12:00:00Z',
      ), // excellent
      leadWith(
        [{ status: LeadStatus.Contacted, timestamp: '2026-04-24T12:45:00Z', agentId: 'a1' }],
        '2026-04-24T12:00:00Z',
      ), // acceptable
    ];
    const s = computeSLASummary(leads);
    expect(s.tierCounts.uncontacted).toBe(1);
    expect(s.tierCounts.excellent).toBe(1);
    expect(s.tierCounts.acceptable).toBe(1);
  });
});

describe('formatDuration', () => {
  it.each([
    [null, 'not contacted'],
    [30, '< 1m'],
    [90, '1m 30s'],
    [3600, '1h 0m'],
    [90000, '1d 1h'],
  ])('formats %s as %s', (sec, expected) => {
    expect(formatDuration(sec)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('property: agent SLA invariants', () => {
  it('tier thresholds are strictly increasing', () => {
    expect(SLA_TIERS.EXCELLENT_SEC).toBeLessThan(SLA_TIERS.GOOD_SEC);
    expect(SLA_TIERS.GOOD_SEC).toBeLessThan(SLA_TIERS.ACCEPTABLE_SEC);
  });

  it('OUTBOUND_STATUSES excludes New and includes all others', () => {
    expect(OUTBOUND_STATUSES.has(LeadStatus.New)).toBe(false);
    expect(OUTBOUND_STATUSES.has(LeadStatus.Contacted)).toBe(true);
    expect(OUTBOUND_STATUSES.has(LeadStatus.Showing)).toBe(true);
    expect(OUTBOUND_STATUSES.has(LeadStatus.Under_Contract)).toBe(true);
    expect(OUTBOUND_STATUSES.has(LeadStatus.Closed)).toBe(true);
    expect(OUTBOUND_STATUSES.has(LeadStatus.Lost)).toBe(true);
  });

  it('responseTimeSec is always >= 0 (never negative)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: -1000000, max: 1000000 }),
        (baseMs, deltaMs) => {
          const created = new Date(baseMs).toISOString();
          const contact = new Date(baseMs + deltaMs).toISOString();
          const r = computeLeadResponseTime(
            leadWith([{ status: LeadStatus.Contacted, timestamp: contact, agentId: 'a' }], created),
          );
          expect(r.responseTimeSec).not.toBeNull();
          expect(r.responseTimeSec).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('summary tier counts always sum to totalLeads', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            delay: fc.integer({ min: 0, max: 86400 }),
            contacted: fc.boolean(),
          }),
          { minLength: 0, maxLength: 50 },
        ),
        (specs) => {
          const leads = specs.map((s) => {
            const created = '2026-04-24T12:00:00Z';
            const history: StatusHistoryEntry[] = s.contacted
              ? [
                  {
                    status: LeadStatus.Contacted,
                    timestamp: new Date(Date.parse(created) + s.delay * 1000).toISOString(),
                    agentId: 'a',
                  },
                ]
              : [];
            return leadWith(history, created);
          });
          const sum = computeSLASummary(leads);
          const total = Object.values(sum.tierCounts).reduce((a, b) => a + b, 0);
          expect(total).toBe(sum.totalLeads);
        },
      ),
      { numRuns: 100 },
    );
  });
});
