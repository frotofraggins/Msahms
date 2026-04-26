/**
 * Agent response-time SLA metrics.
 *
 * Pure functions — no I/O. Takes a Lead record (or array of them) and computes
 * the time from lead creation to first agent-initiated contact, plus roll-up
 * stats for a team.
 *
 * Metric definition (industry standard — matches Redfin Partner Program
 * performance standards and the "speed to lead" benchmark used across real
 * estate lead-response research):
 *
 *   responseTimeSec = firstOutboundContactAt - createdAt
 *
 * An "outbound contact" is recorded via a statusHistory entry with
 * eventType in OUTBOUND_EVENT_TYPES (call, email, sms, meeting). This matches
 * the NAR 5-minute rule research: leads contacted within 5 minutes are 21x
 * more likely to qualify than those contacted after 30 minutes.
 *
 * Industry reference points (for UI copy):
 *   - Industry average: ~917 minutes (~15 hours)
 *   - "Fast" brokerages: ~5 hours
 *   - 5-minute rule: 21x qualification lift vs 30 minutes
 *
 * Sources:
 *   https://partneragents.redfin.com/hc/en-us/articles/10644751126541
 *   https://hyperleap.ai/blog/real-estate-lead-response-statistics-2026
 *   https://www.rexsoftware.com/articles/speed-to-lead-in-estate-agency-success
 */

import type { Lead, StatusHistoryEntry } from './types/lead.js';
import { LeadStatus } from './types/lead.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * LeadStatus values that indicate the agent has made outbound contact.
 * The SLA clock stops when the lead's status moves out of 'New' into any of
 * these. `New` is the only status before agent action.
 */
export const OUTBOUND_STATUSES: ReadonlySet<string> = new Set<string>([
  LeadStatus.Contacted,
  LeadStatus.Showing,
  LeadStatus.Under_Contract,
  LeadStatus.Closed,
  LeadStatus.Lost,
]);

/**
 * SLA tier thresholds in seconds. Match UI labels commonly used by consumer
 * real estate sites so users recognize the scale.
 */
export const SLA_TIERS = {
  /** Target: first contact within 5 minutes (industry-leading). */
  EXCELLENT_SEC: 5 * 60,
  /** Reasonable: within 30 minutes. */
  GOOD_SEC: 30 * 60,
  /** Acceptable: within 1 hour. */
  ACCEPTABLE_SEC: 60 * 60,
  /** Beyond 1 hour falls below SLA. */
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Single-lead response-time result. */
export interface LeadResponseTime {
  /** Lead identifier. */
  leadId: string;
  /** Response time in seconds. null if the lead has not been contacted yet. */
  responseTimeSec: number | null;
  /** ISO timestamp of first outbound contact, or null. */
  firstOutboundAt: string | null;
  /** Lead creation timestamp. */
  createdAt: string;
  /** Tier label based on thresholds. */
  tier: 'excellent' | 'good' | 'acceptable' | 'slow' | 'uncontacted';
}

/** Aggregated SLA statistics across a set of leads. */
export interface SLASummary {
  /** Number of leads included in the calculation. */
  totalLeads: number;
  /** Number of contacted leads (has first outbound). */
  contactedLeads: number;
  /** Number of uncontacted leads. */
  uncontactedLeads: number;
  /** Mean response time in seconds (contacted only). null if none contacted. */
  meanSec: number | null;
  /** Median response time in seconds. null if none contacted. */
  medianSec: number | null;
  /** P90 (90th percentile) response time. null if <10 contacted. */
  p90Sec: number | null;
  /** Fastest response time. null if none contacted. */
  fastestSec: number | null;
  /** Slowest response time. null if none contacted. */
  slowestSec: number | null;
  /** Distribution by tier. */
  tierCounts: Record<LeadResponseTime['tier'], number>;
}

// ---------------------------------------------------------------------------
// Per-lead computation
// ---------------------------------------------------------------------------

/**
 * Find the earliest status-history entry that counts as an outbound contact.
 * "Outbound" means any status change OUT of 'New' — an agent touched the lead.
 * Returns null if no such entry exists.
 */
export function firstOutboundEntry(
  history: StatusHistoryEntry[] | undefined,
): StatusHistoryEntry | null {
  if (!history || history.length === 0) return null;
  const outbound = history.filter((e) => OUTBOUND_STATUSES.has(e.status));
  if (outbound.length === 0) return null;
  return outbound.reduce((earliest, e) =>
    e.timestamp < earliest.timestamp ? e : earliest,
  );
}

/**
 * Classify a response-time result into an SLA tier.
 */
export function classifyTier(responseTimeSec: number | null): LeadResponseTime['tier'] {
  if (responseTimeSec === null) return 'uncontacted';
  if (responseTimeSec <= SLA_TIERS.EXCELLENT_SEC) return 'excellent';
  if (responseTimeSec <= SLA_TIERS.GOOD_SEC) return 'good';
  if (responseTimeSec <= SLA_TIERS.ACCEPTABLE_SEC) return 'acceptable';
  return 'slow';
}

/**
 * Compute the response time for a single lead.
 */
export function computeLeadResponseTime(lead: Lead): LeadResponseTime {
  const createdAt = lead.createdAt;
  const firstOut = firstOutboundEntry(lead.statusHistory);
  const responseTimeSec = firstOut
    ? Math.max(0, Math.floor((Date.parse(firstOut.timestamp) - Date.parse(createdAt)) / 1000))
    : null;
  return {
    leadId: lead.leadId,
    responseTimeSec,
    firstOutboundAt: firstOut ? firstOut.timestamp : null,
    createdAt,
    tier: classifyTier(responseTimeSec),
  };
}

// ---------------------------------------------------------------------------
// Aggregate computation
// ---------------------------------------------------------------------------

/**
 * Compute SLA summary across a set of leads.
 */
export function computeSLASummary(leads: Lead[]): SLASummary {
  const perLead = leads.map(computeLeadResponseTime);
  const contacted = perLead.filter((r) => r.responseTimeSec !== null);
  const times = contacted.map((r) => r.responseTimeSec as number).sort((a, b) => a - b);

  const tierCounts: SLASummary['tierCounts'] = {
    excellent: 0,
    good: 0,
    acceptable: 0,
    slow: 0,
    uncontacted: 0,
  };
  for (const r of perLead) tierCounts[r.tier]++;

  return {
    totalLeads: leads.length,
    contactedLeads: contacted.length,
    uncontactedLeads: perLead.length - contacted.length,
    meanSec: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    medianSec: times.length > 0 ? times[Math.floor(times.length / 2)] ?? null : null,
    p90Sec: times.length >= 10 ? times[Math.floor(times.length * 0.9)] ?? null : null,
    fastestSec: times.length > 0 ? times[0] ?? null : null,
    slowestSec: times.length > 0 ? times[times.length - 1] ?? null : null,
    tierCounts,
  };
}

// ---------------------------------------------------------------------------
// Presentation helpers (for dashboard + public site)
// ---------------------------------------------------------------------------

/** Human-readable "12m 34s" / "3h 5m" / "< 1m" formatter. */
export function formatDuration(sec: number | null): string {
  if (sec === null) return 'not contacted';
  if (sec < 60) return '< 1m';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
}
