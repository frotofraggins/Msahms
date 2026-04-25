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

vi.mock('../../lib/listing-webhooks.js', () => ({
  signHandoff: vi.fn(() => 'mock-sig-abc123'),
  verifyVhzWebhook: vi.fn(() => true),
}));

import { putItem, getItem, updateItem } from '../../lib/dynamodb.js';
import { listingsPaymentEnabled } from '../../lib/brokerage.js';
import { signHandoff, verifyVhzWebhook } from '../../lib/listing-webhooks.js';

const mockPutItem = vi.mocked(putItem);
const mockGetItem = vi.mocked(getItem);
const mockUpdateItem = vi.mocked(updateItem);
const mockListingsPaymentEnabled = vi.mocked(listingsPaymentEnabled);
const mockSignHandoff = vi.mocked(signHandoff);
const mockVerifyVhzWebhook = vi.mocked(verifyVhzWebhook);

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

function makeWebhookEvent(
  body: Record<string, unknown>,
  signature = 'sha256=valid',
) {
  const rawBody = JSON.stringify(body);
  return {
    httpMethod: 'POST',
    path: '/api/v1/listing/fsbo/vhz-webhook',
    body: rawBody,
    headers: { 'X-VHZ-Signature': signature },
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


// ---------------------------------------------------------------------------
// POST /api/v1/listing/fsbo/intake tests (Blocker 1)
// ---------------------------------------------------------------------------

const validFsboIntake = {
  propertyAddress: '1234 E Main St, Mesa, AZ 85201',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  packageType: 'fsbo-standard',
  email: 'seller@example.com',
  name: 'Jane Doe',
  phone: '480-555-1234',
};

describe('POST /api/v1/listing/fsbo/intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['VHZ_CHECKOUT_BASE_URL'] = 'https://virtualhomezone.com/checkout';
  });

  it('should create an FSBO listing and return handoffUrl', async () => {
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/listing/fsbo/intake', validFsboIntake),
    );
    expect(result.statusCode).toBe(201);

    const body = parseBody(result.body);
    expect(body.listingId).toBeDefined();
    expect(body.leadId).toBeDefined();
    expect(body.handoffUrl).toBeDefined();
    expect(typeof body.handoffUrl).toBe('string');
    expect((body.handoffUrl as string)).toContain('https://virtualhomezone.com/checkout');
    expect((body.handoffUrl as string)).toContain('sig=mock-sig-abc123');
    expect((body.handoffUrl as string)).toContain('source=mesahomes-fsbo');
  });

  it('should store listing with status awaiting-payment', async () => {
    mockPutItem.mockResolvedValue(undefined);

    await handler(makeEvent('/api/v1/listing/fsbo/intake', validFsboIntake));

    expect(mockPutItem).toHaveBeenCalledTimes(1);
    const storedItem = mockPutItem.mock.calls[0][0];
    const data = storedItem.data as Record<string, unknown>;
    expect(data.status).toBe('awaiting-payment');
    expect(data.packageType).toBe('fsbo-standard');
    expect(data.email).toBe('seller@example.com');
  });

  it('should call signHandoff with correct params', async () => {
    mockPutItem.mockResolvedValue(undefined);

    await handler(makeEvent('/api/v1/listing/fsbo/intake', validFsboIntake));

    expect(mockSignHandoff).toHaveBeenCalledTimes(1);
    const signedParams = mockSignHandoff.mock.calls[0][0];
    expect(signedParams.package).toBe('fsbo-standard');
    expect(signedParams.email).toBe('seller@example.com');
    expect(signedParams.source).toBe('mesahomes-fsbo');
    expect(signedParams.ts).toBeDefined();
    expect(signedParams.listing_id).toBeDefined();
    expect(signedParams.lead_id).toBeDefined();
  });

  it('should return 400 when propertyAddress is missing', async () => {
    const input = { ...validFsboIntake, propertyAddress: '' };
    const result = await handler(makeEvent('/api/v1/listing/fsbo/intake', input));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when email is missing', async () => {
    const { email, ...input } = validFsboIntake;
    const result = await handler(makeEvent('/api/v1/listing/fsbo/intake', input));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when packageType is invalid', async () => {
    const input = { ...validFsboIntake, packageType: 'flat-fee' };
    const result = await handler(makeEvent('/api/v1/listing/fsbo/intake', input));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when sqft is zero', async () => {
    const input = { ...validFsboIntake, sqft: 0 };
    const result = await handler(makeEvent('/api/v1/listing/fsbo/intake', input));
    expect(result.statusCode).toBe(400);
  });

  it('should accept all valid FSBO package types', async () => {
    for (const pkgType of ['fsbo-starter', 'fsbo-standard', 'fsbo-pro']) {
      mockPutItem.mockResolvedValue(undefined);
      const result = await handler(
        makeEvent('/api/v1/listing/fsbo/intake', {
          ...validFsboIntake,
          packageType: pkgType,
        }),
      );
      expect(result.statusCode).toBe(201);
    }
  });

  it('should default name and phone to empty string when not provided', async () => {
    mockPutItem.mockResolvedValue(undefined);
    const { name, phone, ...input } = validFsboIntake;

    await handler(makeEvent('/api/v1/listing/fsbo/intake', input));

    const storedItem = mockPutItem.mock.calls[0][0];
    const data = storedItem.data as Record<string, unknown>;
    expect(data.name).toBe('');
    expect(data.phone).toBe('');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/listing/fsbo/vhz-webhook tests (Blocker 1)
// ---------------------------------------------------------------------------

describe('POST /api/v1/listing/fsbo/vhz-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyVhzWebhook.mockReturnValue(true);
  });

  it('should return 401 when signature is invalid', async () => {
    mockVerifyVhzWebhook.mockReturnValue(false);

    const result = await handler(
      makeWebhookEvent({ event: 'payment.succeeded', listing_id: 'lst-1' }),
    );
    expect(result.statusCode).toBe(401);
  });

  it('should update listing to paid on payment.succeeded', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#lst-1',
      SK: 'LISTING#lst-1',
      data: {
        listingId: 'lst-1',
        status: 'awaiting-payment',
        stripePaymentId: null,
      },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeWebhookEvent({
        event: 'payment.succeeded',
        listing_id: 'lst-1',
        stripe_session_id: 'cs_test_123',
        amount_paid_cents: 54900,
        email: 'seller@example.com',
        paid_at: '2024-01-15T10:00:00Z',
      }),
    );

    expect(result.statusCode).toBe(200);
    expect(mockUpdateItem).toHaveBeenCalledWith(
      'LISTING#lst-1',
      'LISTING#lst-1',
      expect.objectContaining({
        'data.status': 'paid',
        'data.stripePaymentId': 'cs_test_123',
        'data.paidAt': '2024-01-15T10:00:00Z',
        'data.amountPaidCents': 54900,
      }),
    );
  });

  it('should skip duplicate payment (idempotency)', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#lst-2',
      SK: 'LISTING#lst-2',
      data: {
        listingId: 'lst-2',
        status: 'paid',
        stripePaymentId: 'cs_test_dup',
      },
    });

    const result = await handler(
      makeWebhookEvent({
        event: 'payment.succeeded',
        listing_id: 'lst-2',
        stripe_session_id: 'cs_test_dup',
      }),
    );

    expect(result.statusCode).toBe(200);
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it('should return 200 for unknown listing (graceful)', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await handler(
      makeWebhookEvent({
        event: 'payment.succeeded',
        listing_id: 'lst-unknown',
        stripe_session_id: 'cs_test_x',
      }),
    );

    expect(result.statusCode).toBe(200);
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it('should return 400 when listing_id is missing for payment.succeeded', async () => {
    const result = await handler(
      makeWebhookEvent({
        event: 'payment.succeeded',
        stripe_session_id: 'cs_test_x',
      }),
    );

    expect(result.statusCode).toBe(400);
  });

  it('should return 200 for unhandled event types (future-proofing)', async () => {
    const result = await handler(
      makeWebhookEvent({
        event: 'checkout.session.expired',
        listing_id: 'lst-1',
      }),
    );

    expect(result.statusCode).toBe(200);
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it('should pass raw body and signature header to verifyVhzWebhook', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#lst-3',
      SK: 'LISTING#lst-3',
      data: { listingId: 'lst-3', status: 'awaiting-payment', stripePaymentId: null },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const payload = { event: 'payment.succeeded', listing_id: 'lst-3', stripe_session_id: 'cs_3' };
    const sig = 'sha256=test-sig';
    await handler(makeWebhookEvent(payload, sig));

    expect(mockVerifyVhzWebhook).toHaveBeenCalledWith(
      JSON.stringify(payload),
      sig,
    );
  });
});
