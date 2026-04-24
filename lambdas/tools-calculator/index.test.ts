import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock DynamoDB (needed by sell-now-or-wait)
// ---------------------------------------------------------------------------

const mockGetItem = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
}));

// Import after mocks
const { handler } = await import('./index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(path: string, body: Record<string, unknown>) {
  return {
    httpMethod: 'POST',
    path,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    requestContext: { requestId: 'test-request-id' },
  };
}

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

describe('handler — OPTIONS', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/api/v1/tools/net-sheet',
      body: null,
      headers: {},
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/tools/net-sheet
// ---------------------------------------------------------------------------

describe('handler — /api/v1/tools/net-sheet', () => {
  it('should return 200 with valid net sheet input', async () => {
    const event = makeEvent('/api/v1/tools/net-sheet', {
      salePrice: 400000,
      outstandingMortgage: 200000,
      serviceType: 'flat-fee',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.primary.serviceType).toBe('flat-fee');
    expect(body.primary.netProceeds).toBeDefined();
    expect(body.comparison.flatFee).toBeDefined();
    expect(body.comparison.traditional).toBeDefined();
    expect(body.comparison.savings).toBeGreaterThan(0);
  });

  it('should return 400 for missing salePrice', async () => {
    const event = makeEvent('/api/v1/tools/net-sheet', {
      outstandingMortgage: 200000,
      serviceType: 'flat-fee',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('salePrice');
  });

  it('should return 400 for invalid serviceType', async () => {
    const event = makeEvent('/api/v1/tools/net-sheet', {
      salePrice: 400000,
      outstandingMortgage: 200000,
      serviceType: 'invalid',
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('serviceType');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/tools/affordability
// ---------------------------------------------------------------------------

describe('handler — /api/v1/tools/affordability', () => {
  it('should return 200 with valid affordability input', async () => {
    const event = makeEvent('/api/v1/tools/affordability', {
      annualIncome: 100000,
      monthlyDebts: 500,
      downPayment: 50000,
      interestRate: 6.5,
      loanTerm: 30,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.maxPurchasePrice).toBeGreaterThan(0);
    expect(body.monthlyPayment).toBeGreaterThan(0);
    expect(body.scenarios).toHaveLength(3);
    expect(body.dpaPrograms.length).toBeGreaterThan(0);
  });

  it('should return 400 for missing annualIncome', async () => {
    const event = makeEvent('/api/v1/tools/affordability', {
      monthlyDebts: 500,
      downPayment: 50000,
      interestRate: 6.5,
      loanTerm: 30,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for invalid loanTerm', async () => {
    const event = makeEvent('/api/v1/tools/affordability', {
      annualIncome: 100000,
      monthlyDebts: 500,
      downPayment: 50000,
      interestRate: 6.5,
      loanTerm: 20,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toContain('loanTerm');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/tools/comparison
// ---------------------------------------------------------------------------

describe('handler — /api/v1/tools/comparison', () => {
  it('should return 200 with valid comparison input', async () => {
    const event = makeEvent('/api/v1/tools/comparison', {
      estimatedSalePrice: 400000,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.flatFee).toBeDefined();
    expect(body.traditional).toBeDefined();
    expect(body.savings).toBeGreaterThan(0);
  });

  it('should return 400 for missing estimatedSalePrice', async () => {
    const event = makeEvent('/api/v1/tools/comparison', {});

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/tools/sell-now-or-wait
// ---------------------------------------------------------------------------

describe('handler — /api/v1/tools/sell-now-or-wait', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return 200 with valid sell-now-or-wait input', async () => {
    mockGetItem.mockImplementation((pk: string, sk: string) => {
      if (pk === 'MARKET#ZIP#85140' && sk === 'ZHVI#LATEST') {
        return Promise.resolve({
          data: {
            zip: '85140',
            city: 'San Tan Valley',
            zhvi: 432201,
            zhviPrevMonth: 433401,
            zhviChange6Mo: -1200,
            trendDirection: 'declining',
            month: '2026-03',
            updatedAt: '2026-03-17T00:00:00Z',
          },
        });
      }
      return Promise.resolve(null);
    });

    const event = makeEvent('/api/v1/tools/sell-now-or-wait', {
      zip: '85140',
      estimatedHomeValue: 450000,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.zip).toBe('85140');
    expect(body.indicators.length).toBeGreaterThan(0);
    expect(body.recommendation).toBeDefined();
    expect(body.summary.length).toBeGreaterThan(0);
  });

  it('should return 400 for missing zip', async () => {
    const event = makeEvent('/api/v1/tools/sell-now-or-wait', {
      estimatedHomeValue: 450000,
    });

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Unknown path and missing body
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should return 404 for unknown path', async () => {
    const event = makeEvent('/api/v1/tools/unknown', { test: true });
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for missing body', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/api/v1/tools/net-sheet',
      body: null,
      headers: {},
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});
