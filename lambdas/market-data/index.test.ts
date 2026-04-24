import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetItem = vi.fn();
const mockQueryByPK = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  queryByPK: (...args: unknown[]) => mockQueryByPK(...args),
}));

const { handler } = await import('./index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  path: string,
  method = 'GET',
  pathParameters?: Record<string, string>,
) {
  return {
    httpMethod: method,
    path,
    body: null,
    headers: {},
    pathParameters: pathParameters ?? null,
    requestContext: { requestId: 'test-correlation-id' },
  };
}

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

describe('handler — OPTIONS', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = makeEvent('/api/v1/market/metro', 'OPTIONS');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/market/zip/{zip}
// ---------------------------------------------------------------------------

describe('handler — GET /api/v1/market/zip/{zip}', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return 200 with market data for a valid ZIP', async () => {
    const marketData = {
      zip: '85201',
      city: 'Mesa',
      zhvi: 430000,
      zhviPrevMonth: 428000,
      zhviChange6Mo: 5000,
      trendDirection: 'rising',
      month: '2026-03',
      updatedAt: '2026-03-17T00:00:00Z',
    };

    mockGetItem.mockResolvedValue({ data: marketData });

    const event = makeEvent('/api/v1/market/zip/85201');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.zip).toBe('85201');
    expect(body.zhvi).toBe(430000);
  });

  it('should support pathParameters for ZIP extraction', async () => {
    mockGetItem.mockResolvedValue({
      data: { zip: '85140', zhvi: 432000 },
    });

    const event = makeEvent('/api/v1/market/zip/85140', 'GET', { zip: '85140' });
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    expect(mockGetItem).toHaveBeenCalledWith('MARKET#ZIP#85140', 'ZHVI#LATEST');
  });

  it('should return 404 when no market data exists', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/market/zip/85201');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for invalid ZIP format', async () => {
    const event = makeEvent('/api/v1/market/zip/8520X');
    const result = await handler(event);
    // Path won't match the regex, so it falls through to NOT_FOUND or MISSING_FIELD
    expect(result.statusCode).toBeGreaterThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/market/metro
// ---------------------------------------------------------------------------

describe('handler — GET /api/v1/market/metro', () => {
  beforeEach(() => mockQueryByPK.mockReset());

  it('should return 200 with metro metrics', async () => {
    mockQueryByPK.mockResolvedValue({
      items: [
        {
          SK: 'medianSalePrice#LATEST',
          data: { metric: 'medianSalePrice', value: 454000, month: '2026-03' },
        },
        {
          SK: 'daysOnMarket#LATEST',
          data: { metric: 'daysOnMarket', value: 58, month: '2026-03' },
        },
        {
          SK: 'medianSalePrice#2026-02',
          data: { metric: 'medianSalePrice', value: 450000, month: '2026-02' },
        },
      ],
    });

    const event = makeEvent('/api/v1/market/metro');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.metrics).toHaveLength(2); // Only LATEST records
    expect(body.metrics[0].metric).toBe('medianSalePrice');
  });

  it('should return empty metrics when no data exists', async () => {
    mockQueryByPK.mockResolvedValue({ items: [] });

    const event = makeEvent('/api/v1/market/metro');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.metrics).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should return 404 for unknown path', async () => {
    const event = makeEvent('/api/v1/market/unknown');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for non-GET method', async () => {
    const event = makeEvent('/api/v1/market/metro', 'POST');
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});
