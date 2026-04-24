/**
 * Property-based test for lead creation metadata correctness.
 *
 * **Property 6: Lead Creation Metadata Correctness**
 * **Validates: Requirements 2.5, 3.3, 5.5, 6.3, 7.4, 11.3**
 *
 * For any valid lead from any tool source, the created Lead SHALL have
 * correct leadType, toolSource, status=New, valid timestamp, and tool
 * data preserved.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createLeadRecord, validateLeadInput, type LeadInput } from '../../lib/models/lead.js';
import { LeadStatus } from '../../lib/types/lead.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Tool source → expected lead type mapping. */
const TOOL_SOURCE_TO_LEAD_TYPE: Record<string, string> = {
  'net-sheet': 'Seller',
  'home-value': 'Seller',
  'listing-generator': 'Seller',
  'flat-fee-listing': 'Seller',
  'sell-now-or-wait': 'Seller',
  'comparison': 'Seller',
  'full-service-request': 'Buyer',
  'affordability': 'Buyer',
  'offer-writer': 'Buyer',
  'first-time-buyer-guide': 'Buyer',
  'direct-consult': 'Buyer',
  'ai-chat': 'Buyer',
  'relocation-guide': 'Buyer',
};

const ALL_TOOL_SOURCES = Object.keys(TOOL_SOURCE_TO_LEAD_TYPE);

const toolSourceArb = fc.constantFrom(...ALL_TOOL_SOURCES);

const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,5}$/),
    fc.constantFrom('com', 'org', 'net', 'io'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

const phoneArb = fc
  .tuple(
    fc.integer({ min: 200, max: 999 }),
    fc.integer({ min: 100, max: 999 }),
    fc.integer({ min: 1000, max: 9999 }),
  )
  .map(([area, mid, last]) => `${area}${mid}${last}`);

const SERVICE_AREA_ZIPS = [
  '85120', '85140', '85142', '85143',
  '85201', '85202', '85203', '85204', '85205', '85206',
  '85233', '85234', '85224', '85225',
];

const zipArb = fc.constantFrom(...SERVICE_AREA_ZIPS);

const cityArb = fc.constantFrom('Mesa', 'Gilbert', 'Chandler', 'Queen Creek', 'San Tan Valley');

const timeframeArb = fc.constantFrom('now', '30d', '3mo', '6mo+');

/** Arbitrary tool data payload. */
const toolDataArb = fc.oneof(
  fc.constant(undefined),
  fc.dictionary(
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    { minKeys: 1, maxKeys: 5 },
  ),
);

/** Build a valid LeadInput from arbitrary components. */
const validLeadInputArb = fc
  .tuple(nameArb, emailArb, phoneArb, cityArb, zipArb, timeframeArb, toolSourceArb, toolDataArb)
  .map(([name, email, phone, city, zip, timeframe, toolSource, toolData]): LeadInput => ({
    name,
    email,
    phone,
    city,
    zip,
    timeframe,
    leadType: TOOL_SOURCE_TO_LEAD_TYPE[toolSource],
    toolSource,
    toolData: toolData as Record<string, unknown> | undefined,
  }));

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('Property 6: Lead Creation Metadata Correctness', () => {
  it('should create leads with correct metadata for any valid tool source', () => {
    fc.assert(
      fc.property(validLeadInputArb, (input) => {
        // Validate input passes validation
        const errors = validateLeadInput(input);
        expect(errors).toHaveLength(0);

        // Create the lead record
        const lead = createLeadRecord(input);

        // (a) Correct leadType matching the tool's intent
        expect(lead.leadType).toBe(input.leadType);

        // (b) Correct toolSource matching the originating tool name
        expect(lead.toolSource).toBe(input.toolSource);

        // (c) leadStatus = "New"
        expect(lead.leadStatus).toBe(LeadStatus.New);

        // (d) Valid ISO 8601 createdAt timestamp
        expect(lead.createdAt).toBeDefined();
        const parsed = Date.parse(lead.createdAt);
        expect(Number.isNaN(parsed)).toBe(false);

        // (e) Tool-specific input data preserved in toolData field
        if (input.toolData !== undefined) {
          expect(lead.toolData).toEqual(input.toolData);
        }

        // UUID format for leadId
        expect(lead.leadId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      }),
      { numRuns: 200 },
    );
  });
});
