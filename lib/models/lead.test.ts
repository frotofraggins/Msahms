import { describe, it, expect } from 'vitest';
import {
  validateLeadInput,
  createLeadRecord,
  generateLeadKeys,
  EMAIL_REGEX,
  PHONE_REGEX,
  type LeadInput,
} from './lead.js';
import { LeadStatus } from '../types/lead.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A valid lead input that passes all validation. */
function validInput(overrides?: Partial<LeadInput>): LeadInput {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '4805551234',
    city: 'Mesa',
    zip: '85201',
    timeframe: 'now',
    leadType: 'Buyer',
    toolSource: 'net-sheet',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateLeadInput
// ---------------------------------------------------------------------------

describe('validateLeadInput', () => {
  it('should return no errors for valid input', () => {
    const errors = validateLeadInput(validInput());
    expect(errors).toEqual([]);
  });

  // Required field checks ---------------------------------------------------

  it('should return error when name is missing', () => {
    const errors = validateLeadInput(validInput({ name: undefined }));
    expect(errors).toContainEqual({ field: 'name', message: 'name is required' });
  });

  it('should return error when name is empty string', () => {
    const errors = validateLeadInput(validInput({ name: '   ' }));
    expect(errors).toContainEqual({ field: 'name', message: 'name is required' });
  });

  it('should return error when email is missing', () => {
    const errors = validateLeadInput(validInput({ email: undefined }));
    expect(errors).toContainEqual({ field: 'email', message: 'email is required' });
  });

  it('should return error when phone is missing', () => {
    const errors = validateLeadInput(validInput({ phone: undefined }));
    expect(errors).toContainEqual({ field: 'phone', message: 'phone is required' });
  });

  it('should return error when city is missing', () => {
    const errors = validateLeadInput(validInput({ city: undefined }));
    expect(errors).toContainEqual({ field: 'city', message: 'city is required' });
  });

  it('should return error when zip is missing', () => {
    const errors = validateLeadInput(validInput({ zip: undefined }));
    expect(errors).toContainEqual({ field: 'zip', message: 'zip is required' });
  });

  it('should return error when timeframe is missing', () => {
    const errors = validateLeadInput(validInput({ timeframe: undefined }));
    expect(errors).toContainEqual({ field: 'timeframe', message: 'timeframe is required' });
  });

  it('should return error when leadType is missing', () => {
    const errors = validateLeadInput(validInput({ leadType: undefined }));
    expect(errors).toContainEqual({ field: 'leadType', message: 'leadType is required' });
  });

  // Format checks -----------------------------------------------------------

  it('should return error for invalid email format', () => {
    const errors = validateLeadInput(validInput({ email: 'not-an-email' }));
    expect(errors).toContainEqual({
      field: 'email',
      message: 'email must be a valid email address',
    });
  });

  it('should return error for invalid phone format', () => {
    const errors = validateLeadInput(validInput({ phone: '123' }));
    expect(errors).toContainEqual({
      field: 'phone',
      message: 'phone must be a valid US phone number',
    });
  });

  it('should return error for invalid zip format', () => {
    const errors = validateLeadInput(validInput({ zip: '1234' }));
    expect(errors).toContainEqual({
      field: 'zip',
      message: 'zip must be a 5-digit string',
    });
  });

  it('should return error for invalid timeframe value', () => {
    const errors = validateLeadInput(validInput({ timeframe: 'tomorrow' }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'timeframe' }),
    );
  });

  it('should return error for invalid leadType value', () => {
    const errors = validateLeadInput(validInput({ leadType: 'Flipper' }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'leadType' }),
    );
  });

  // Multiple errors at once --------------------------------------------------

  it('should return multiple errors when several fields are invalid', () => {
    const errors = validateLeadInput({
      name: '',
      email: 'bad',
      phone: '123',
      city: '',
      zip: 'abc',
      timeframe: 'never',
      leadType: 'Unknown',
    });

    const fields = errors.map((e) => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('phone');
    expect(fields).toContain('city');
    expect(fields).toContain('zip');
    expect(fields).toContain('timeframe');
    expect(fields).toContain('leadType');
    expect(errors.length).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// createLeadRecord
// ---------------------------------------------------------------------------

describe('createLeadRecord', () => {
  it('should generate a UUID leadId', () => {
    const lead = createLeadRecord(validInput());
    // UUID v4 pattern
    expect(lead.leadId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should set leadStatus to New', () => {
    const lead = createLeadRecord(validInput());
    expect(lead.leadStatus).toBe(LeadStatus.New);
  });

  it('should set createdAt to an ISO 8601 timestamp', () => {
    const before = new Date().toISOString();
    const lead = createLeadRecord(validInput());
    const after = new Date().toISOString();

    expect(lead.createdAt >= before).toBe(true);
    expect(lead.createdAt <= after).toBe(true);
  });

  it('should copy all required fields from input', () => {
    const lead = createLeadRecord(validInput());
    expect(lead.name).toBe('Jane Doe');
    expect(lead.email).toBe('jane@example.com');
    expect(lead.phone).toBe('4805551234');
    expect(lead.city).toBe('Mesa');
    expect(lead.zip).toBe('85201');
    expect(lead.timeframe).toBe('now');
    expect(lead.leadType).toBe('Buyer');
    expect(lead.toolSource).toBe('net-sheet');
  });

  it('should attach optional fields when provided', () => {
    const lead = createLeadRecord(
      validInput({
        tags: ['first-time-buyer'],
        assignedAgentId: 'agent-1',
        utmSource: 'google',
        readinessScore: 75,
      }),
    );

    expect(lead.tags).toEqual(['first-time-buyer']);
    expect(lead.assignedAgentId).toBe('agent-1');
    expect(lead.utmSource).toBe('google');
    expect(lead.readinessScore).toBe(75);
  });

  it('should default toolSource to direct-consult when not provided', () => {
    const lead = createLeadRecord(validInput({ toolSource: undefined }));
    expect(lead.toolSource).toBe('direct-consult');
  });

  it('should trim whitespace from string fields', () => {
    const lead = createLeadRecord(
      validInput({ name: '  Jane Doe  ', email: ' jane@example.com ', city: ' Mesa ' }),
    );
    expect(lead.name).toBe('Jane Doe');
    expect(lead.email).toBe('jane@example.com');
    expect(lead.city).toBe('Mesa');
  });
});

// ---------------------------------------------------------------------------
// generateLeadKeys
// ---------------------------------------------------------------------------

describe('generateLeadKeys', () => {
  it('should produce correct PK and SK patterns', () => {
    const keys = generateLeadKeys('abc-123');
    expect(keys.PK).toBe('LEAD#abc-123');
    expect(keys.SK).toBe('LEAD#abc-123');
  });

  it('should produce GSI1PK with agent ID when provided', () => {
    const keys = generateLeadKeys('abc-123', 'agent-1');
    expect(keys.GSI1PK).toBe('AGENT#agent-1');
  });

  it('should default GSI1PK to AGENT#UNASSIGNED when no agent ID', () => {
    const keys = generateLeadKeys('abc-123');
    expect(keys.GSI1PK).toBe('AGENT#UNASSIGNED');
  });

  it('should produce GSI1SK with createdAt when provided', () => {
    const ts = '2026-04-01T12:00:00.000Z';
    const keys = generateLeadKeys('abc-123', 'agent-1', ts);
    expect(keys.GSI1SK).toBe(`LEAD#${ts}`);
  });

  it('should default GSI1SK to current timestamp when createdAt not provided', () => {
    const before = new Date().toISOString();
    const keys = generateLeadKeys('abc-123');
    const after = new Date().toISOString();

    const ts = keys.GSI1SK.replace('LEAD#', '');
    expect(ts >= before).toBe(true);
    expect(ts <= after).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Regex exports
// ---------------------------------------------------------------------------

describe('EMAIL_REGEX', () => {
  it('should match valid emails', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('first.last@domain.co')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(EMAIL_REGEX.test('no-at-sign')).toBe(false);
    expect(EMAIL_REGEX.test('@missing-local.com')).toBe(false);
    expect(EMAIL_REGEX.test('missing-domain@')).toBe(false);
  });
});

describe('PHONE_REGEX', () => {
  it('should match valid US phone numbers', () => {
    expect(PHONE_REGEX.test('4805551234')).toBe(true);
    expect(PHONE_REGEX.test('(480) 555-1234')).toBe(true);
    expect(PHONE_REGEX.test('+1-480-555-1234')).toBe(true);
    expect(PHONE_REGEX.test('480.555.1234')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(PHONE_REGEX.test('123')).toBe(false);
    expect(PHONE_REGEX.test('0005551234')).toBe(false);
    expect(PHONE_REGEX.test('abcdefghij')).toBe(false);
  });
});
