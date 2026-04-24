/**
 * Lead model — validation, record creation, and DynamoDB key generation.
 *
 * Provides the core business logic for lead capture: input validation,
 * full record assembly with generated IDs and timestamps, and key
 * patterns for the mesahomes-main single-table design.
 */

import { randomUUID } from 'node:crypto';
import type { FieldError } from '../errors.js';
import {
  LeadType,
  LeadStatus,
  type Lead,
  type Timeframe,
  type ToolSource,
} from '../types/lead.js';

// ---------------------------------------------------------------------------
// Regex patterns (exported for reuse in other modules)
// ---------------------------------------------------------------------------

/**
 * Email validation regex.
 *
 * Matches standard email addresses: local@domain.tld
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * US phone validation regex.
 *
 * Accepts 10-digit numbers with optional +1 prefix and common formatting
 * characters (spaces, dashes, dots, parentheses).
 * Examples: 4805551234, (480) 555-1234, +1-480-555-1234, 480.555.1234
 */
export const PHONE_REGEX = /^(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

// ---------------------------------------------------------------------------
// Valid value sets
// ---------------------------------------------------------------------------

const VALID_TIMEFRAMES: ReadonlySet<string> = new Set<Timeframe>([
  'now',
  '30d',
  '3mo',
  '6mo+',
]);

const VALID_LEAD_TYPES: ReadonlySet<string> = new Set<string>(
  Object.values(LeadType),
);

/** Valid tool source values (exported for reuse in other modules). */
export const VALID_TOOL_SOURCES: ReadonlySet<string> = new Set<ToolSource>([
  'net-sheet',
  'home-value',
  'affordability',
  'offer-writer',
  'listing-generator',
  'comparison',
  'first-time-buyer-guide',
  'sell-now-or-wait',
  'ai-chat',
  'direct-consult',
  'full-service-request',
  'flat-fee-listing',
  'relocation-guide',
]);

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

/** Shape of the raw input accepted by the lead capture endpoint. */
export interface LeadInput {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  zip?: string;
  timeframe?: string;
  leadType?: string;
  toolSource?: string;
  tags?: string[];
  assignedAgentId?: string;
  financingStatus?: string;
  priceRange?: string;
  toolData?: Record<string, unknown>;
  pathHistory?: string[];
  readinessScore?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate raw lead input and return an array of field-level errors.
 *
 * Returns an empty array when all required fields are present and valid.
 */
export function validateLeadInput(input: LeadInput): FieldError[] {
  const errors: FieldError[] = [];

  // Required string fields
  if (!input.name || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'name is required' });
  }

  if (!input.email || input.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'email is required' });
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' });
  }

  if (!input.phone || input.phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'phone is required' });
  } else if (!PHONE_REGEX.test(input.phone)) {
    errors.push({ field: 'phone', message: 'phone must be a valid US phone number' });
  }

  if (!input.city || input.city.trim().length === 0) {
    errors.push({ field: 'city', message: 'city is required' });
  }

  if (!input.zip || input.zip.trim().length === 0) {
    errors.push({ field: 'zip', message: 'zip is required' });
  } else if (!/^\d{5}$/.test(input.zip)) {
    errors.push({ field: 'zip', message: 'zip must be a 5-digit string' });
  }

  // Enum / literal fields
  if (!input.timeframe) {
    errors.push({ field: 'timeframe', message: 'timeframe is required' });
  } else if (!VALID_TIMEFRAMES.has(input.timeframe)) {
    errors.push({
      field: 'timeframe',
      message: `timeframe must be one of: ${[...VALID_TIMEFRAMES].join(', ')}`,
    });
  }

  if (!input.leadType) {
    errors.push({ field: 'leadType', message: 'leadType is required' });
  } else if (!VALID_LEAD_TYPES.has(input.leadType)) {
    errors.push({
      field: 'leadType',
      message: `leadType must be one of: ${[...VALID_LEAD_TYPES].join(', ')}`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Record creation
// ---------------------------------------------------------------------------

/**
 * Create a full Lead record from validated input.
 *
 * Generates a UUID v4 leadId, sets status to New, and stamps createdAt.
 * Callers should run {@link validateLeadInput} first.
 */
export function createLeadRecord(input: LeadInput): Lead {
  const now = new Date().toISOString();

  const lead: Lead = {
    leadId: randomUUID(),
    name: input.name!.trim(),
    email: input.email!.trim(),
    phone: input.phone!.trim(),
    city: input.city!.trim(),
    zip: input.zip!.trim(),
    timeframe: input.timeframe as Timeframe,
    leadType: input.leadType as LeadType,
    leadStatus: LeadStatus.New,
    toolSource: (input.toolSource as ToolSource) ?? 'direct-consult',
    createdAt: now,
  };

  // Attach optional fields only when provided
  if (input.tags) lead.tags = input.tags;
  if (input.assignedAgentId) lead.assignedAgentId = input.assignedAgentId;
  if (input.financingStatus) lead.financingStatus = input.financingStatus;
  if (input.priceRange) lead.priceRange = input.priceRange;
  if (input.toolData) lead.toolData = input.toolData;
  if (input.pathHistory) lead.pathHistory = input.pathHistory;
  if (input.readinessScore !== undefined) lead.readinessScore = input.readinessScore;
  if (input.utmSource) lead.utmSource = input.utmSource;
  if (input.utmMedium) lead.utmMedium = input.utmMedium;
  if (input.utmCampaign) lead.utmCampaign = input.utmCampaign;

  return lead;
}

// ---------------------------------------------------------------------------
// DynamoDB key generation
// ---------------------------------------------------------------------------

/** DynamoDB key set for a lead record. */
export interface LeadKeys {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

/**
 * Generate DynamoDB PK, SK, and GSI1 keys for a lead.
 *
 * Key patterns (from design doc):
 * - PK:     `LEAD#{leadId}`
 * - SK:     `LEAD#{leadId}`
 * - GSI1PK: `AGENT#{agentId}` (defaults to "UNASSIGNED")
 * - GSI1SK: `LEAD#{createdAt}` (defaults to current ISO timestamp)
 */
export function generateLeadKeys(
  leadId: string,
  agentId?: string,
  createdAt?: string,
): LeadKeys {
  return {
    PK: `LEAD#${leadId}`,
    SK: `LEAD#${leadId}`,
    GSI1PK: `AGENT#${agentId ?? 'UNASSIGNED'}`,
    GSI1SK: `LEAD#${createdAt ?? new Date().toISOString()}`,
  };
}
