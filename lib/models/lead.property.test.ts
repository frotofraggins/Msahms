// Feature: mesahomes-lead-generation, Property 4: Lead Capture Validation — Required Fields
// Feature: mesahomes-lead-generation, Property 5: Lead Capture Validation — Field Formats

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateLeadInput,
  EMAIL_REGEX,
  PHONE_REGEX,
  type LeadInput,
} from './lead.js';
import { LeadType } from '../types/lead.js';
import type { Timeframe, ToolSource } from '../types/lead.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const VALID_TIMEFRAMES: Timeframe[] = ['now', '30d', '3mo', '6mo+'];
const VALID_LEAD_TYPES: LeadType[] = Object.values(LeadType);
const VALID_TOOL_SOURCES: ToolSource[] = [
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
];

/** Generates a non-empty name string. */
const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/** Generates a valid email address. */
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9.]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom('com', 'org', 'net', 'io', 'co'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Generates a valid US phone number (10 digits, area code starts with 2-9). */
const validPhoneArb = fc
  .tuple(
    fc.integer({ min: 200, max: 999 }),
    fc.integer({ min: 100, max: 999 }),
    fc.integer({ min: 1000, max: 9999 }),
  )
  .map(([area, mid, last]) => `${area}${mid}${last}`);

/** Generates a valid city name. */
const cityArb = fc.constantFrom('Mesa', 'Gilbert', 'Chandler', 'Queen Creek', 'San Tan Valley', 'Apache Junction');

/** Generates a valid 5-digit ZIP code. */
const zipArb = fc.integer({ min: 10000, max: 99999 }).map(String);

const timeframeArb = fc.constantFrom(...VALID_TIMEFRAMES);
const leadTypeArb = fc.constantFrom(...VALID_LEAD_TYPES);
const toolSourceArb = fc.constantFrom(...VALID_TOOL_SOURCES);

/** Generates a fully valid LeadInput. */
const validLeadInputArb: fc.Arbitrary<LeadInput> = fc
  .tuple(nameArb, validEmailArb, validPhoneArb, cityArb, zipArb, timeframeArb, leadTypeArb, toolSourceArb)
  .map(([name, email, phone, city, zip, timeframe, leadType, toolSource]) => ({
    name,
    email,
    phone,
    city,
    zip,
    timeframe,
    leadType,
    toolSource,
  }));

/** The required field keys that must be present for a valid lead. */
const REQUIRED_FIELDS = ['name', 'email', 'phone', 'city', 'timeframe', 'leadType'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

/**
 * Generates a non-empty subset of required fields to remove.
 * Returns at least 1 field and at most all required fields.
 */
const fieldsToRemoveArb: fc.Arbitrary<RequiredField[]> = fc
  .subarray([...REQUIRED_FIELDS], { minLength: 1 })
  .filter((arr) => arr.length >= 1);

// ---------------------------------------------------------------------------
// Property 4: Lead Capture Validation — Required Fields
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 11.2, 11.4, 45.1**
 *
 * For any lead capture submission missing any required field (name, email,
 * phone, city, timeframe, or leadType), the Lead Capture Service SHALL
 * reject the submission with field-level validation errors identifying
 * each missing field, and SHALL NOT create a Lead record.
 */
describe('Property 4: Lead Capture Validation — Required Fields', () => {
  it('returns a validation error for every missing required field', () => {
    fc.assert(
      fc.property(validLeadInputArb, fieldsToRemoveArb, (baseInput, fieldsToRemove) => {
        // Clone and remove selected fields
        const input: LeadInput = { ...baseInput };
        for (const field of fieldsToRemove) {
          delete (input as Record<string, unknown>)[field];
        }

        const errors = validateLeadInput(input);

        // (a) There must be at least one error
        expect(errors.length).toBeGreaterThanOrEqual(fieldsToRemove.length);

        // (b) Each removed field must appear in the error list
        const errorFields = new Set(errors.map((e) => e.field));
        for (const field of fieldsToRemove) {
          expect(errorFields.has(field)).toBe(true);
        }

        // (c) Each error for a removed field should mention "required"
        for (const field of fieldsToRemove) {
          const fieldError = errors.find((e) => e.field === field);
          expect(fieldError).toBeDefined();
          expect(fieldError!.message).toContain('is required');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('returns no errors when all required fields are present and valid', () => {
    fc.assert(
      fc.property(validLeadInputArb, (input) => {
        const errors = validateLeadInput(input);
        expect(errors).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Lead Capture Validation — Field Formats
// ---------------------------------------------------------------------------

/**
 * Generates a string that is NOT a valid email address.
 * Filters out anything that accidentally matches the email regex.
 */
const invalidEmailArb: fc.Arbitrary<string> = fc
  .oneof(
    // No @ sign
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@') && s.trim().length > 0),
    // Missing domain
    fc.string({ minLength: 1, maxLength: 20 }).map((s) => `${s.replace(/@/g, '')}@`),
    // Missing local part
    fc.string({ minLength: 1, maxLength: 20 }).map((s) => `@${s.replace(/@/g, '')}`),
    // Double @
    fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 10 })).map(
      ([a, b]) => `${a}@@${b}`,
    ),
    // Spaces in email
    fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 10 })).map(
      ([a, b]) => `${a} ${b}@example.com`,
    ),
  )
  .filter((s) => s.trim().length > 0 && !EMAIL_REGEX.test(s));

/**
 * Generates a string that is NOT a valid US phone number.
 * Filters out anything that accidentally matches the phone regex.
 */
const invalidPhoneArb: fc.Arbitrary<string> = fc
  .oneof(
    // Too short (1-6 digits)
    fc.stringMatching(/^[0-9]{1,6}$/),
    // Too long (15+ digits)
    fc.stringMatching(/^[0-9]{15,20}$/),
    // Starts with 0 or 1 in area code
    fc.tuple(fc.constantFrom('0', '1'), fc.stringMatching(/^[0-9]{9}$/)).map(([d, rest]) => `${d}${rest}`),
    // Letters mixed in
    fc.stringMatching(/^[a-z]{3,10}$/),
    // Empty-ish
    fc.constant(''),
  )
  .filter((s) => !PHONE_REGEX.test(s));

/**
 * **Validates: Requirements 45.2, 45.3**
 *
 * For any lead capture submission containing an invalid email format or
 * invalid phone format, the Lead Capture Service SHALL return a specific
 * error message identifying the invalid field by name, and SHALL NOT
 * create a Lead record.
 */
describe('Property 5: Lead Capture Validation — Field Formats', () => {
  it('returns an email format error for any invalid email', () => {
    fc.assert(
      fc.property(validLeadInputArb, invalidEmailArb, (baseInput, badEmail) => {
        const input: LeadInput = { ...baseInput, email: badEmail };
        const errors = validateLeadInput(input);

        // Must have at least one error mentioning email
        const emailErrors = errors.filter((e) => e.field === 'email');
        expect(emailErrors.length).toBeGreaterThanOrEqual(1);

        // The error message should identify the field
        const hasFormatError = emailErrors.some(
          (e) => e.message.includes('email') && (e.message.includes('valid') || e.message.includes('required')),
        );
        expect(hasFormatError).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('returns a phone format error for any invalid phone number', () => {
    fc.assert(
      fc.property(validLeadInputArb, invalidPhoneArb, (baseInput, badPhone) => {
        const input: LeadInput = { ...baseInput, phone: badPhone };
        const errors = validateLeadInput(input);

        // Must have at least one error mentioning phone
        const phoneErrors = errors.filter((e) => e.field === 'phone');
        expect(phoneErrors.length).toBeGreaterThanOrEqual(1);

        // The error message should identify the field
        const hasFormatError = phoneErrors.some(
          (e) => e.message.includes('phone') && (e.message.includes('valid') || e.message.includes('required')),
        );
        expect(hasFormatError).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});


// Feature: mesahomes-lead-generation, Property 7: Lead Data JSON Round-Trip

import { serializeLead, deserializeLead } from './lead-serializer.js';
import { LeadStatus } from '../types/lead.js';
import type { Lead, LeadNote, StatusHistoryEntry } from '../types/lead.js';

// ---------------------------------------------------------------------------
// Generators for Property 7
// ---------------------------------------------------------------------------

const leadStatusArb = fc.constantFrom(...Object.values(LeadStatus));

/** Generates a valid ISO 8601 timestamp string. */
const isoTimestampArb = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString());

/** Generates a UUID-like string. */
const uuidArb = fc.uuid();

/** Generates a LeadNote object. */
const leadNoteArb: fc.Arbitrary<LeadNote> = fc.record({
  agentId: uuidArb,
  text: fc.string({ minLength: 1, maxLength: 200 }),
  timestamp: isoTimestampArb,
});

/** Generates a StatusHistoryEntry object. */
const statusHistoryEntryArb: fc.Arbitrary<StatusHistoryEntry> = fc.record({
  status: leadStatusArb,
  timestamp: isoTimestampArb,
  agentId: uuidArb,
});

/** Generates a toolData record with JSON-safe values. */
const toolDataArb: fc.Arbitrary<Record<string, unknown>> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  fc.oneof(
    fc.string({ maxLength: 100 }),
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }).map((n) => (Object.is(n, -0) ? 0 : n)),
    fc.boolean(),
    fc.constant(null),
  ),
  { minKeys: 0, maxKeys: 5 },
);

/** Generates a complete Lead object with all required fields and random optional fields. */
const leadArb: fc.Arbitrary<Lead> = fc
  .record({
    // Required fields
    leadId: uuidArb,
    name: nameArb,
    email: validEmailArb,
    phone: validPhoneArb,
    city: cityArb,
    zip: zipArb,
    timeframe: timeframeArb,
    leadType: leadTypeArb,
    leadStatus: leadStatusArb,
    toolSource: toolSourceArb,
    createdAt: isoTimestampArb,
    // Optional fields — wrapped in fc.option to randomly include/exclude
    tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }), {
      nil: undefined,
    }),
    assignedAgentId: fc.option(uuidArb, { nil: undefined }),
    financingStatus: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    priceRange: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    toolData: fc.option(toolDataArb, { nil: undefined }),
    pathHistory: fc.option(
      fc.array(fc.constantFrom(...VALID_TOOL_SOURCES), { minLength: 0, maxLength: 5 }),
      { nil: undefined },
    ),
    readinessScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    utmSource: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    utmMedium: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    utmCampaign: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    notes: fc.option(fc.array(leadNoteArb, { minLength: 0, maxLength: 3 }), { nil: undefined }),
    statusHistory: fc.option(fc.array(statusHistoryEntryArb, { minLength: 0, maxLength: 5 }), {
      nil: undefined,
    }),
  })
  .map((record) => {
    // Remove undefined optional fields so deep equality works correctly
    const lead: Lead = {
      leadId: record.leadId,
      name: record.name,
      email: record.email,
      phone: record.phone,
      city: record.city,
      zip: record.zip,
      timeframe: record.timeframe,
      leadType: record.leadType,
      leadStatus: record.leadStatus,
      toolSource: record.toolSource,
      createdAt: record.createdAt,
    };
    if (record.tags !== undefined) lead.tags = record.tags;
    if (record.assignedAgentId !== undefined) lead.assignedAgentId = record.assignedAgentId;
    if (record.financingStatus !== undefined) lead.financingStatus = record.financingStatus;
    if (record.priceRange !== undefined) lead.priceRange = record.priceRange;
    if (record.toolData !== undefined) lead.toolData = record.toolData;
    if (record.pathHistory !== undefined) lead.pathHistory = record.pathHistory;
    if (record.readinessScore !== undefined) lead.readinessScore = record.readinessScore;
    if (record.utmSource !== undefined) lead.utmSource = record.utmSource;
    if (record.utmMedium !== undefined) lead.utmMedium = record.utmMedium;
    if (record.utmCampaign !== undefined) lead.utmCampaign = record.utmCampaign;
    if (record.notes !== undefined) lead.notes = record.notes;
    if (record.statusHistory !== undefined) lead.statusHistory = record.statusHistory;
    return lead;
  });

// ---------------------------------------------------------------------------
// Property 7: Lead Data JSON Round-Trip
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 46.1, 46.2, 46.3**
 *
 * For any valid Lead record (containing all required fields and any
 * combination of optional fields), serializing to JSON and then
 * deserializing back SHALL produce a Lead record deeply equal to the
 * original.
 */
describe('Property 7: Lead Data JSON Round-Trip', () => {
  it('serialize → deserialize produces a deeply equal Lead for any valid Lead', () => {
    fc.assert(
      fc.property(leadArb, (originalLead) => {
        const json = serializeLead(originalLead);
        const restored = deserializeLead(json);
        expect(restored).toEqual(originalLead);
      }),
      { numRuns: 100 },
    );
  });
});
