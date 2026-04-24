import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPutItem = vi.fn().mockResolvedValue(undefined);
const mockGetItem = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  putItem: (...args: unknown[]) => mockPutItem(...args),
  getItem: (...args: unknown[]) => mockGetItem(...args),
}));

vi.mock('../../lib/retry.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/retry.js')>();
  return {
    ...actual,
    withRetry: async <T>(fn: () => Promise<T>) => fn(),
  };
});

// Import after mocks
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

function validLeadBody(): Record<string, unknown> {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '4805551234',
    city: 'Mesa',
    zip: '85201',
    timeframe: 'now',
    leadType: 'Buyer',
    toolSource: 'affordability',
  };
}

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

describe('handler — OPTIONS', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = makeEvent('/api/v1/leads', null, 'OPTIONS');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/leads
// ---------------------------------------------------------------------------

describe('handler — POST /api/v1/leads', () => {
  beforeEach(() => {
    mockPutItem.mockReset().mockResolvedValue(undefined);
  });

  it('should return 201 with valid lead input', async () => {
    const event = makeEvent('/api/v1/leads', validLeadBody());
    const result = await handler(event);
    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);
    expect(body.leadId).toBeDefined();
    expect(body.status).toBe('New');
    expect(mockPutItem).toHaveBeenCalledOnce();
  });

  it('should return 400 for missing required fields', async () => {
    const event = makeEvent('/api/v1/leads', { name: 'Jane' });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it('should return 400 for invalid email format', async () => {
    const event = makeEvent('/api/v1/leads', {
      ...validLeadBody(),
      email: 'not-an-email',
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.error.details.some((d: { field: string }) => d.field === 'email')).toBe(true);
  });

  it('should return 400 for missing body', async () => {
    const event = makeEvent('/api/v1/leads', null);
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should store lead with correct entity type', async () => {
    const event = makeEvent('/api/v1/leads', validLeadBody());
    await handler(event);

    expect(mockPutItem).toHaveBeenCalledOnce();
    const item = mockPutItem.mock.calls[0][0];
    expect(item.entityType).toBe('LEAD');
    expect(item.PK).toMatch(/^LEAD#/);
    expect(item.SK).toMatch(/^LEAD#/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/valuation-request
// ---------------------------------------------------------------------------

describe('handler — POST /api/v1/valuation-request', () => {
  beforeEach(() => {
    mockPutItem.mockReset().mockResolvedValue(undefined);
    mockGetItem.mockReset();
  });

  it('should return 201 with valid valuation request', async () => {
    mockGetItem.mockResolvedValue({
      data: { zhvi: 430000 },
    });

    const event = makeEvent('/api/v1/valuation-request', {
      name: 'John Seller',
      email: 'john@example.com',
      phone: '4805559876',
      propertyAddress: '123 Main St, Mesa, AZ',
      zip: '85201',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);
    expect(body.leadId).toBeDefined();
    expect(body.teaserRange).toContain('$');
  });

  it('should return 400 for missing required fields', async () => {
    const event = makeEvent('/api/v1/valuation-request', {
      name: 'John',
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for out-of-service-area ZIP', async () => {
    const event = makeEvent('/api/v1/valuation-request', {
      name: 'John Seller',
      email: 'john@example.com',
      phone: '4805559876',
      propertyAddress: '123 Main St, Beverly Hills, CA',
      zip: '90210',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('service area');
  });

  it('should return 201 with null teaserRange when no market data', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/valuation-request', {
      name: 'John Seller',
      email: 'john@example.com',
      phone: '4805559876',
      propertyAddress: '123 Main St, Mesa, AZ',
      zip: '85201',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.teaserRange).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/booking
// ---------------------------------------------------------------------------

describe('handler — POST /api/v1/booking', () => {
  beforeEach(() => {
    mockPutItem.mockReset().mockResolvedValue(undefined);
  });

  it('should return 201 with valid booking', async () => {
    const event = makeEvent('/api/v1/booking', {
      name: 'Alice Buyer',
      email: 'alice@example.com',
      phone: '4805551111',
      intent: 'buying',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);
    expect(body.leadId).toBeDefined();
    expect(body.status).toBe('New');

    // Verify the lead was stored with correct tags
    const item = mockPutItem.mock.calls[0][0];
    const data = item.data;
    expect(data.toolSource).toBe('direct-consult');
    expect(data.tags).toContain('hot-direct-consult');
  });

  it('should return 400 for missing name', async () => {
    const event = makeEvent('/api/v1/booking', {
      email: 'alice@example.com',
      phone: '4805551111',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should map intent to correct leadType', async () => {
    const event = makeEvent('/api/v1/booking', {
      name: 'Bob Seller',
      email: 'bob@example.com',
      phone: '4805552222',
      intent: 'selling',
    });

    await handler(event);
    const item = mockPutItem.mock.calls[0][0];
    expect(item.data.leadType).toBe('Seller');
  });
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should return 404 for unknown path', async () => {
    const event = makeEvent('/api/v1/unknown', { test: true });
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for invalid JSON body', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/api/v1/leads',
      body: '{invalid json',
      headers: {},
      requestContext: { requestId: 'test-id' },
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});
