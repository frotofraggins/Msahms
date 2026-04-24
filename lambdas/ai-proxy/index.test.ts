import { describe, it, expect } from 'vitest';

const { handler } = await import('./index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(path: string, body: Record<string, unknown> | null, method = 'POST') {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: { 'Content-Type': 'application/json' },
    requestContext: { requestId: 'test-correlation-id' },
  };
}

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

describe('handler — OPTIONS', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = makeEvent('/api/v1/ai/listing-description', null, 'OPTIONS');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/ai/listing-description
// ---------------------------------------------------------------------------

describe('handler — POST /api/v1/ai/listing-description', () => {
  it('should return 200 with valid listing input', async () => {
    const event = makeEvent('/api/v1/ai/listing-description', {
      bedrooms: 4,
      bathrooms: 2.5,
      sqft: 2200,
      yearBuilt: 2015,
      neighborhood: 'Eastmark',
      upgrades: ['granite countertops', 'new HVAC'],
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.description).toBeDefined();
    expect(body.description.length).toBeGreaterThan(100);
    expect(body.description).toContain('4');
    expect(body.description).toContain('2.5');
    expect(body.compliance).toBeDefined();
    expect(body.compliance.isCompliant).toBe(true);
  });

  it('should return 400 for missing bedrooms', async () => {
    const event = makeEvent('/api/v1/ai/listing-description', {
      bathrooms: 2,
      sqft: 1800,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('bedrooms');
  });

  it('should return 400 for missing body', async () => {
    const event = makeEvent('/api/v1/ai/listing-description', null);
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/ai/offer-draft
// ---------------------------------------------------------------------------

describe('handler — POST /api/v1/ai/offer-draft', () => {
  it('should return 200 with valid offer input', async () => {
    const event = makeEvent('/api/v1/ai/offer-draft', {
      propertyAddress: '123 Main St, Mesa, AZ 85201',
      offeredPrice: 450000,
      earnestMoney: 10000,
      financingType: 'Conventional',
      contingencies: ['inspection', 'appraisal'],
      closingDate: '2026-06-15',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.draft).toBeDefined();
    expect(body.draft).toContain('450,000');
    expect(body.draft).toContain('2026-06-15');
    expect(body.disclaimer).toBeDefined();
    expect(body.disclaimer).toContain('DISCLAIMER');
  });

  it('should return 400 for missing propertyAddress', async () => {
    const event = makeEvent('/api/v1/ai/offer-draft', {
      offeredPrice: 450000,
      earnestMoney: 10000,
      financingType: 'Conventional',
      closingDate: '2026-06-15',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('propertyAddress');
  });

  it('should include legal disclaimer in every response', async () => {
    const event = makeEvent('/api/v1/ai/offer-draft', {
      propertyAddress: '456 Oak Ave, Gilbert, AZ 85233',
      offeredPrice: 380000,
      earnestMoney: 8000,
      financingType: 'FHA',
      contingencies: [],
      closingDate: '2026-07-01',
    });

    const result = await handler(event);
    const body = JSON.parse(result.body);
    expect(body.draft).toContain('DISCLAIMER');
    expect(body.disclaimer).toContain('informational purposes only');
  });
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should return 404 for unknown path', async () => {
    const event = makeEvent('/api/v1/ai/unknown', { test: true });
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for invalid JSON body', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/api/v1/ai/listing-description',
      body: 'not json',
      headers: {},
      requestContext: { requestId: 'test-id' },
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});
