import { describe, it, expect } from 'vitest';
import { serializeLead, deserializeLead } from './lead-serializer.js';
import { LeadType, LeadStatus } from '../types/lead.js';
import type { Lead } from '../types/lead.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid Lead record for testing. */
function minimalLead(overrides?: Partial<Lead>): Lead {
  return {
    leadId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '4805551234',
    city: 'Mesa',
    zip: '85201',
    timeframe: 'now',
    leadType: LeadType.Buyer,
    leadStatus: LeadStatus.New,
    toolSource: 'net-sheet',
    createdAt: '2026-04-01T12:00:00.000Z',
    ...overrides,
  };
}

/** A Lead with all optional fields populated. */
function fullLead(): Lead {
  return {
    ...minimalLead(),
    tags: ['first-time-buyer', 'hot'],
    assignedAgentId: 'agent-001',
    financingStatus: 'pre-approved',
    priceRange: '$300K-$450K',
    toolData: { salePrice: 400000, mortgage: 200000 },
    pathHistory: ['home-value', 'net-sheet', 'comparison'],
    readinessScore: 85,
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'spring-2026',
    notes: [
      { agentId: 'agent-001', text: 'Called, left voicemail', timestamp: '2026-04-02T10:00:00Z' },
    ],
    statusHistory: [
      { status: LeadStatus.New, timestamp: '2026-04-01T12:00:00Z', agentId: 'system' },
      { status: LeadStatus.Contacted, timestamp: '2026-04-02T10:00:00Z', agentId: 'agent-001' },
    ],
  };
}

// ---------------------------------------------------------------------------
// serializeLead
// ---------------------------------------------------------------------------

describe('serializeLead', () => {
  it('should produce a valid JSON string for a minimal lead', () => {
    const json = serializeLead(minimalLead());
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should include all required fields in the JSON output', () => {
    const json = serializeLead(minimalLead());
    const parsed = JSON.parse(json);
    expect(parsed.leadId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(parsed.name).toBe('Jane Doe');
    expect(parsed.email).toBe('jane@example.com');
    expect(parsed.phone).toBe('4805551234');
    expect(parsed.city).toBe('Mesa');
    expect(parsed.zip).toBe('85201');
    expect(parsed.timeframe).toBe('now');
    expect(parsed.leadType).toBe('Buyer');
    expect(parsed.leadStatus).toBe('New');
    expect(parsed.toolSource).toBe('net-sheet');
    expect(parsed.createdAt).toBe('2026-04-01T12:00:00.000Z');
  });

  it('should include nested objects in the JSON output', () => {
    const json = serializeLead(fullLead());
    const parsed = JSON.parse(json);
    expect(parsed.toolData).toEqual({ salePrice: 400000, mortgage: 200000 });
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.statusHistory).toHaveLength(2);
    expect(parsed.pathHistory).toEqual(['home-value', 'net-sheet', 'comparison']);
  });
});

// ---------------------------------------------------------------------------
// deserializeLead
// ---------------------------------------------------------------------------

describe('deserializeLead', () => {
  it('should reconstruct a minimal lead from JSON', () => {
    const original = minimalLead();
    const json = JSON.stringify(original);
    const result = deserializeLead(json);
    expect(result).toEqual(original);
  });

  it('should reconstruct a full lead with all optional fields', () => {
    const original = fullLead();
    const json = JSON.stringify(original);
    const result = deserializeLead(json);
    expect(result).toEqual(original);
  });

  it('should throw on invalid JSON', () => {
    expect(() => deserializeLead('not json')).toThrow('Invalid JSON string');
  });

  it('should throw when JSON is not an object', () => {
    expect(() => deserializeLead('"just a string"')).toThrow('JSON must represent an object');
    expect(() => deserializeLead('[1,2,3]')).toThrow('JSON must represent an object');
  });

  it('should throw when a required field is missing', () => {
    const json = JSON.stringify({ name: 'Jane' });
    expect(() => deserializeLead(json)).toThrow('Missing required field');
  });

  it('should throw for invalid enum values', () => {
    const lead = minimalLead();
    const bad = { ...lead, timeframe: 'invalid' };
    expect(() => deserializeLead(JSON.stringify(bad))).toThrow('Invalid timeframe');
  });

  it('should throw for invalid leadType', () => {
    const bad = { ...minimalLead(), leadType: 'Flipper' };
    expect(() => deserializeLead(JSON.stringify(bad))).toThrow('Invalid leadType');
  });

  it('should throw for invalid leadStatus', () => {
    const bad = { ...minimalLead(), leadStatus: 'Unknown' };
    expect(() => deserializeLead(JSON.stringify(bad))).toThrow('Invalid leadStatus');
  });

  it('should throw for invalid toolSource', () => {
    const bad = { ...minimalLead(), toolSource: 'invalid-tool' };
    expect(() => deserializeLead(JSON.stringify(bad))).toThrow('Invalid toolSource');
  });

  it('should not include optional fields that are absent in the JSON', () => {
    const result = deserializeLead(JSON.stringify(minimalLead()));
    expect(result.tags).toBeUndefined();
    expect(result.assignedAgentId).toBeUndefined();
    expect(result.toolData).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.statusHistory).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Round-trip (basic unit test)
// ---------------------------------------------------------------------------

describe('serializeLead / deserializeLead round-trip', () => {
  it('should round-trip a minimal lead', () => {
    const original = minimalLead();
    const result = deserializeLead(serializeLead(original));
    expect(result).toEqual(original);
  });

  it('should round-trip a full lead with all optional fields', () => {
    const original = fullLead();
    const result = deserializeLead(serializeLead(original));
    expect(result).toEqual(original);
  });
});
