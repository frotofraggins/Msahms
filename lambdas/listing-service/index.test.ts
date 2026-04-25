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

vi.mock('../../lib/brokerage.js', () => ({
  listingsPaymentEnabled: vi.fn(() => false),
  PRE_LAUNCH_LISTING_MESSAGE:
    "MesaHomes flat-fee listings are coming soon. Leave your info and we'll notify you when we're live on the MLS.",
}));

import { putItem, getItem, updateItem } from '../../lib/dynamodb.js';
import { listingsPaymentEnabled } from '../../lib/brokerage.js';

const mockPutItem = vi.mocked(putItem);
const mockGetItem = vi.mocked(getItem);
const mockUpdateItem = vi.mocked(updateItem);
const mockListingsPaymentEnabled = vi.mocked(listingsPaymentEnabled);

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
  beforeEach(() => {
    vi.clearAllMocks();
    // Existing payment tests assume payment is enabled
    mockListingsPaymentEnabled.mockReturnValue(true);
  });

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

// ---------------------------------------------------------------------------
// Package type tests (Task 15)
// ---------------------------------------------------------------------------

describe('packageType field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should store packageType in listing data', async () => {
    mockPutItem.mockResolvedValue(undefined);

    await handler(
      makeEvent('/api/v1/listing/start', {
        ...validListingInput,
        packageType: 'fsbo-starter',
      }),
    );

    expect(mockPutItem).toHaveBeenCalledTimes(1);
    const storedItem = mockPutItem.mock.calls[0][0];
    const data = storedItem.data as Record<string, unknown>;
    expect(data.packageType).toBe('fsbo-starter');
  });

  it('should default packageType to flat-fee when not provided', async () => {
    mockPutItem.mockResolvedValue(undefined);

    await handler(makeEvent('/api/v1/listing/start', validListingInput));

    const storedItem = mockPutItem.mock.calls[0][0];
    const data = storedItem.data as Record<string, unknown>;
    expect(data.packageType).toBe('flat-fee');
  });

  it('should reject invalid packageType', async () => {
    const result = await handler(
      makeEvent('/api/v1/listing/start', {
        ...validListingInput,
        packageType: 'invalid-type',
      }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should accept all valid FSBO package types', async () => {
    for (const pkgType of ['fsbo-starter', 'fsbo-standard', 'fsbo-pro']) {
      mockPutItem.mockResolvedValue(undefined);
      const result = await handler(
        makeEvent('/api/v1/listing/start', {
          ...validListingInput,
          packageType: pkgType,
        }),
      );
      expect(result.statusCode).toBe(201);
    }
  });

  it('should accept flat-fee and full-service package types', async () => {
    for (const pkgType of ['flat-fee', 'full-service']) {
      mockPutItem.mockResolvedValue(undefined);
      const result = await handler(
        makeEvent('/api/v1/listing/start', {
          ...validListingInput,
          packageType: pkgType,
        }),
      );
      expect(result.statusCode).toBe(201);
    }
  });
});

// ---------------------------------------------------------------------------
// LISTINGS_PAYMENT_ENABLED gating (Task 15)
// ---------------------------------------------------------------------------

describe('LISTINGS_PAYMENT_ENABLED gating', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should allow FSBO payment regardless of LISTINGS_PAYMENT_ENABLED=false', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#fsbo1',
      SK: 'LISTING#fsbo1',
      data: { listingId: 'fsbo1', status: 'draft', packageType: 'fsbo-starter' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'fsbo1' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should allow FSBO-standard payment when LISTINGS_PAYMENT_ENABLED=false', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#fsbo2',
      SK: 'LISTING#fsbo2',
      data: { listingId: 'fsbo2', status: 'draft', packageType: 'fsbo-standard' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'fsbo2' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should allow FSBO-pro payment when LISTINGS_PAYMENT_ENABLED=false', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#fsbo3',
      SK: 'LISTING#fsbo3',
      data: { listingId: 'fsbo3', status: 'draft', packageType: 'fsbo-pro' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'fsbo3' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should block flat-fee payment when LISTINGS_PAYMENT_ENABLED=false', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#ff1',
      SK: 'LISTING#ff1',
      data: { listingId: 'ff1', status: 'draft', packageType: 'flat-fee' },
    });

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'ff1' }),
    );
    expect(result.statusCode).toBe(400);
    const body = parseBody(result.body);
    expect((body.error as Record<string, unknown>).message).toContain('coming soon');
  });

  it('should block full-service payment when LISTINGS_PAYMENT_ENABLED=false', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#fs1',
      SK: 'LISTING#fs1',
      data: { listingId: 'fs1', status: 'draft', packageType: 'full-service' },
    });

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'fs1' }),
    );
    expect(result.statusCode).toBe(400);
    const body = parseBody(result.body);
    expect((body.error as Record<string, unknown>).message).toContain('coming soon');
  });

  it('should allow flat-fee payment when LISTINGS_PAYMENT_ENABLED=true', async () => {
    mockListingsPaymentEnabled.mockReturnValue(true);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#ff2',
      SK: 'LISTING#ff2',
      data: { listingId: 'ff2', status: 'draft', packageType: 'flat-fee' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'ff2' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should allow full-service payment when LISTINGS_PAYMENT_ENABLED=true', async () => {
    mockListingsPaymentEnabled.mockReturnValue(true);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#fs2',
      SK: 'LISTING#fs2',
      data: { listingId: 'fs2', status: 'draft', packageType: 'full-service' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'fs2' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should default to flat-fee gating when packageType is missing from stored data', async () => {
    mockListingsPaymentEnabled.mockReturnValue(false);
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#old1',
      SK: 'LISTING#old1',
      data: { listingId: 'old1', status: 'draft' },
    });

    const result = await handler(
      makeEvent('/api/v1/listing/payment', { listingId: 'old1' }),
    );
    expect(result.statusCode).toBe(400);
  });
});
