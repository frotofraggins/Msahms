/**
 * Lead JSON serializer/deserializer with round-trip guarantee.
 *
 * Provides `serializeLead()` and `deserializeLead()` for converting Lead
 * records to/from JSON strings. Handles all field types including nested
 * objects (toolData, notes, statusHistory, pathHistory).
 */

import type { Lead } from '../types/lead.js';
import { LeadType, LeadStatus } from '../types/lead.js';
import type { Timeframe, ToolSource } from '../types/lead.js';

// ---------------------------------------------------------------------------
// Valid value sets for deserialization validation
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

const VALID_LEAD_STATUSES: ReadonlySet<string> = new Set<string>(
  Object.values(LeadStatus),
);

const VALID_TOOL_SOURCES: ReadonlySet<string> = new Set<ToolSource>([
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
// Required fields
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: readonly (keyof Lead)[] = [
  'leadId',
  'name',
  'email',
  'phone',
  'city',
  'zip',
  'timeframe',
  'leadType',
  'leadStatus',
  'toolSource',
  'createdAt',
];

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialize a Lead record to a JSON string.
 *
 * Uses `JSON.stringify` which handles all field types including nested
 * objects (toolData, notes, statusHistory, pathHistory) and arrays.
 */
export function serializeLead(lead: Lead): string {
  return JSON.stringify(lead);
}

// ---------------------------------------------------------------------------
// Deserialization
// ---------------------------------------------------------------------------

/**
 * Deserialize a JSON string into a Lead record.
 *
 * Validates that all required fields are present and have the correct types.
 * Throws an error if the JSON is malformed or missing required fields.
 */
export function deserializeLead(json: string): Lead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON string');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON must represent an object');
  }

  const obj = parsed as Record<string, unknown>;

  // Validate all required string fields are present
  for (const field of REQUIRED_FIELDS) {
    if (obj[field] === undefined || obj[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate required string fields are strings
  const stringFields: (keyof Lead)[] = [
    'leadId',
    'name',
    'email',
    'phone',
    'city',
    'zip',
    'timeframe',
    'leadType',
    'leadStatus',
    'toolSource',
    'createdAt',
  ];
  for (const field of stringFields) {
    if (typeof obj[field] !== 'string') {
      throw new Error(`Field ${field} must be a string`);
    }
  }

  // Validate enum values
  if (!VALID_TIMEFRAMES.has(obj.timeframe as string)) {
    throw new Error(`Invalid timeframe: ${obj.timeframe}`);
  }
  if (!VALID_LEAD_TYPES.has(obj.leadType as string)) {
    throw new Error(`Invalid leadType: ${obj.leadType}`);
  }
  if (!VALID_LEAD_STATUSES.has(obj.leadStatus as string)) {
    throw new Error(`Invalid leadStatus: ${obj.leadStatus}`);
  }
  if (!VALID_TOOL_SOURCES.has(obj.toolSource as string)) {
    throw new Error(`Invalid toolSource: ${obj.toolSource}`);
  }

  // Build the Lead object with required fields
  const lead: Lead = {
    leadId: obj.leadId as string,
    name: obj.name as string,
    email: obj.email as string,
    phone: obj.phone as string,
    city: obj.city as string,
    zip: obj.zip as string,
    timeframe: obj.timeframe as Timeframe,
    leadType: obj.leadType as LeadType,
    leadStatus: obj.leadStatus as LeadStatus,
    toolSource: obj.toolSource as ToolSource,
    createdAt: obj.createdAt as string,
  };

  // Attach optional fields only when present in the parsed object
  if (Array.isArray(obj.tags)) {
    lead.tags = obj.tags as string[];
  }
  if (typeof obj.assignedAgentId === 'string') {
    lead.assignedAgentId = obj.assignedAgentId;
  }
  if (typeof obj.financingStatus === 'string') {
    lead.financingStatus = obj.financingStatus;
  }
  if (typeof obj.priceRange === 'string') {
    lead.priceRange = obj.priceRange;
  }
  if (obj.toolData !== undefined && obj.toolData !== null && typeof obj.toolData === 'object') {
    lead.toolData = obj.toolData as Record<string, unknown>;
  }
  if (Array.isArray(obj.pathHistory)) {
    lead.pathHistory = obj.pathHistory as string[];
  }
  if (typeof obj.readinessScore === 'number') {
    lead.readinessScore = obj.readinessScore;
  }
  if (typeof obj.utmSource === 'string') {
    lead.utmSource = obj.utmSource;
  }
  if (typeof obj.utmMedium === 'string') {
    lead.utmMedium = obj.utmMedium;
  }
  if (typeof obj.utmCampaign === 'string') {
    lead.utmCampaign = obj.utmCampaign;
  }
  if (Array.isArray(obj.notes)) {
    lead.notes = obj.notes as Lead['notes'];
  }
  if (Array.isArray(obj.statusHistory)) {
    lead.statusHistory = obj.statusHistory as Lead['statusHistory'];
  }

  return lead;
}
