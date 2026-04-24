/**
 * Tests for the listing-service Lambda handler.
 *
 * Covers listing creation, payment processing, validation,
 * and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler, FLAT_FEE_AMOUNT, BROKER_FEE_AMOUNT } from './index.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/dynamodb.js', () => ({
  putItem: vi.fn(),
  getItem: vi.fn(),
  updateItem: vi.fn(),
}));

import { putItem, getItem, updateItem } from '../../lib/dynamodb.js';

const mockPutItem = vi.mocked(putItem);
const mockGetItem = vi.mocked(getItem);
const mockUpdateItem = vi.mocked(updateItem);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  path: string,
  body: Record<string, unknown> | null = null,
  method = 'POST',
) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    requestContext: { requestId: 'test-corr' },
  };
}

function parseBody(body: string) {
  return JSON.parse(body) as Record<string, unknown>;
}

const validListingInput = {
  propertyAddress: '1234 E Main St, Mesa, AZ 85201',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  lotSize: 6500,
  yearBuilt: 2005,
  upgrades: ['new roof', 'granite counters'],
  neighborhood: 'Eastmark',
};

// ---------------------------------------------------------------------------
// POST /api/v1/listing/start tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/listing/start', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create a draft listing with valid input', async () => {
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(makeEvent('/api/v1/listing/start', validListingInput));
    expect(result.statusCode).toBe(201);

    const body = parseBody(result.body);
    expect(body.listingId).toBeDefined();
    expect(body.status).toBe('draft');
    expect(body.nextStep).toBe('payment');

    const pricing = body.pricing as Record<string, number>;
    expect(pricing.flatFee).toBe(FLAT_FEE_AMOUNT);
    expect(pricing.brokerFee).toBe(BROKER_FEE_AMOUNT);
    expect(pricing.total).toBe(FLAT_FEE_AMOUNT + BROKER_FEE_AMOUNT);
  });

  it('should return 400 when propertyAddress is missing', async () => {
    const input = { ...validListingInput, propertyAddress: '' };
    const result = await handler(makeEvent('/api/v1/listing/start', input));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when bedrooms is missing', async () => {
    const { bedrooms, ...input } = validListingInput;
    const result = await handler(makeEvent('/api/v1/listing/start', input));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when sqft is zero', async () => {
    const input = { ...validListingInput, sqft: 0 };
    const result = await handler(makeEvent('/api/v1/listing/start', input));
    expect(result.statusCode).toBe(400);
  });

  it('should accept listing without optional fields', async () => {
    mockPutItem.mockResolvedValue(undefined);

    const input = {
      propertyAddress: '5678 W Broadway, Mesa, AZ 85210',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 1200,
    };

    const result = await handler(makeEvent('/api/v1/listing/start', input));
    expect(result.statusCode).toBe(201);
  });

  it('should store listing in DynamoDB', async () => {
    mockPutItem.mockResolvedValue(undefined);

    await handler(makeEvent('/api/v1/listing/start', validListingInput));

    expect(mockPutItem).toHaveBeenCalledTimes(1);
    const storedItem = mockPutItem.mock.calls[0][0];
    expect(storedItem.PK).toMatch(/^LISTING#/);
    expect(storedItem.SK).toMatch(/^LISTING#/);
    expect(storedItem.entityType).toBe('LISTING');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/listing/payment tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/listing/payment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should process payment for a draft listing', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l1',
      SK: 'LISTING#l1',
      data: { listingId: 'l1', status: 'draft' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'l1', paymentToken: 'tok_test' }),
    );

    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.status).toBe('paid');
    expect(body.stripePaymentId).toBe('tok_test');
    expect(body.message).toContain('MLS');
  });

  it('should process payment for a payment-pending listing', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l2',
      SK: 'LISTING#l2',
      data: { listingId: 'l2', status: 'payment-pending' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'l2' }),
    );

    expect(result.statusCode).toBe(200);
  });

  it('should return 400 when listingId is missing', async () => {
    const result = await handler(makeEvent('/api/v1/listing/payment', {}));
    expect(result.statusCode).toBe(400);
  });

  it('should return 404 for non-existent listing', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'nope' }),
    );
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for already-paid listing', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l3',
      SK: 'LISTING#l3',
      data: { listingId: 'l3', status: 'paid' },
    });

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'l3' }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for active listing', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l4',
      SK: 'LISTING#l4',
      data: { listingId: 'l4', status: 'active' },
    });

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'l4' }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should update listing status to paid in DynamoDB', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l5',
      SK: 'LISTING#l5',
      data: { listingId: 'l5', status: 'draft' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'l5', paymentToken: 'tok_abc' }),
    );

    expect(mockUpdateItem).toHaveBeenCalledWith(
      'LISTING#l5',
      'LISTING#l5',
      expect.objectContaining({
        'data.status': 'paid',
        'data.stripePaymentId': 'tok_abc',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// General handler tests
// ---------------------------------------------------------------------------

describe('handler general', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 200 for OPTIONS preflight', async () => {
    const result = await handler(makeEvent('/api/v1/listing/start', null, 'OPTIONS'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 400 for non-POST methods', async () => {
    const result = await handler(makeEvent('/api/v1/listing/start', null, 'GET'));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for missing body', async () => {
    const result = await handler({
      httpMethod: 'POST',
      path: '/api/v1/listing/start',
      body: null,
      headers: {},
      requestContext: { requestId: 'test' },
    });
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for invalid JSON', async () => {
    const result = await handler({
      httpMethod: 'POST',
      path: '/api/v1/listing/start',
      body: 'not-json',
      headers: {},
      requestContext: { requestId: 'test' },
    });
    expect(result.statusCode).toBe(400);
  });

  it('should return 404 for unknown path', async () => {
    const result = await handler(makeEvent('/api/v1/listing/unknown', { foo: 'bar' }));
    expect(result.statusCode).toBe(404);
  });

  it('pricing constants are correct', () => {
    expect(FLAT_FEE_AMOUNT).toBe(999);
    expect(BROKER_FEE_AMOUNT).toBe(400);
  });
});
