import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockGetItem = vi.fn();
const mockPutItem = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  putItem: (...args: unknown[]) => mockPutItem(...args),
}));

const mockQueryPropertyByAddress = vi.fn();
const mockQueryCompsBySubdivision = vi.fn();
const mockQueryCompsByZip = vi.fn();

vi.mock('./gis-client.js', () => ({
  queryPropertyByAddress: (...args: unknown[]) => mockQueryPropertyByAddress(...args),
  queryCompsBySubdivision: (...args: unknown[]) => mockQueryCompsBySubdivision(...args),
  queryCompsByZip: (...args: unknown[]) => mockQueryCompsByZip(...args),
}));

const mockGetPropertyPhoto = vi.fn();

vi.mock('./street-view.js', () => ({
  getPropertyPhoto: (...args: unknown[]) => mockGetPropertyPhoto(...args),
}));

// Mock circuit breakers to pass through directly
vi.mock('../../lib/retry.js', () => ({
  countyGisCircuit: {
    execute: (fn: () => Promise<unknown>) => fn(),
  },
  streetViewCircuit: {
    execute: (fn: () => Promise<unknown>) => fn(),
  },
}));

// Import after mocks
const { handler, parseAddress } = await import('./index.js');

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

const PINAL_PROPERTY_RECORD = {
  SITEADDRESS: '39669 N LUKE LN SAN TAN VALLEY, AZ 85140',
  SALEPRICE: 449999,
  SALEDATE: '2026-04-06',
  RESFLRAREA: 2071,
  RESYRBLT: 2004,
  CNTASSDVAL: 291424,
  CNVYNAME: 'PECAN CREEK NORTH PARCEL 1',
  OWNERNME1: 'FLOURNOY NICHOLAS',
  STATEDAREA: 0.12,
  PSTLZIP5: '85140',
  FLOORCOUNT: 2,
  LNDVALUE: 75670,
  CNTTXBLVAL: 174996,
};

const PINAL_COMP_RECORD = {
  SITEADDRESS: '396 E MADDISON ST',
  SALEPRICE: 447500,
  SALEDATE: '2026-04-06',
  RESFLRAREA: 2049,
  RESYRBLT: 2004,
  CNTASSDVAL: 280000,
  STATEDAREA: 0.11,
  PSTLZIP5: '85140',
};

const ZIP_MARKET_DATA = {
  zip: '85140',
  city: 'San Tan Valley',
  zhvi: 432201,
  zhviPrevMonth: 433401,
  zhviChange6Mo: -1200,
  trendDirection: 'declining',
  month: '2026-03',
  updatedAt: '2026-03-17T00:00:00Z',
};

// ---------------------------------------------------------------------------
// parseAddress
// ---------------------------------------------------------------------------

describe('parseAddress', () => {
  it('should parse a standard address with directional prefix', () => {
    const result = parseAddress('39669 N Luke Ln, San Tan Valley, AZ 85140');
    expect(result.streetNum).toBe('39669');
    expect(result.streetName).toBe('LUKE');
  });

  it('should parse an address without directional prefix', () => {
    const result = parseAddress('850 Drew St');
    expect(result.streetNum).toBe('850');
    expect(result.streetName).toBe('DREW');
  });

  it('should skip S directional prefix', () => {
    const result = parseAddress('850 S Drew St');
    expect(result.streetNum).toBe('850');
    expect(result.streetName).toBe('DREW');
  });

  it('should handle address with no number', () => {
    const result = parseAddress('Main St');
    expect(result.streetNum).toBe('');
    expect(result.streetName).toBe('MAIN');
  });

  it('should handle extra whitespace', () => {
    const result = parseAddress('  123   N   Oak   Ave  ');
    expect(result.streetNum).toBe('123');
    expect(result.streetName).toBe('OAK');
  });
});

// ---------------------------------------------------------------------------
// handler — POST /api/v1/property/lookup
// ---------------------------------------------------------------------------

describe('handler — /api/v1/property/lookup', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockPutItem.mockReset();
    mockQueryPropertyByAddress.mockReset();
    mockQueryCompsBySubdivision.mockReset();
    mockQueryCompsByZip.mockReset();
    mockGetPropertyPhoto.mockReset();
  });

  it('should return cached response when DynamoDB cache is valid', async () => {
    const cachedResponse = {
      property: { address: '39669 N LUKE LN' },
      photo: { url: 'https://example.com/photo.jpg', source: 'streetview' },
      comps: { subdivision: [], zip: [] },
      market: { zip: null, metro: {} },
    };

    mockGetItem.mockResolvedValue({
      data: cachedResponse,
      ttl: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });

    const event = makeEvent('/api/v1/property/lookup', {
      address: '39669 N Luke Ln',
      zip: '85140',
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.property.address).toBe('39669 N LUKE LN');

    // Should not call GIS or Street View
    expect(mockQueryPropertyByAddress).not.toHaveBeenCalled();
    expect(mockGetPropertyPhoto).not.toHaveBeenCalled();
  });

  it('should perform full lookup when cache is expired', async () => {
    // Expired cache
    mockGetItem
      .mockResolvedValueOnce({
        data: {},
        ttl: Math.floor(Date.now() / 1000) - 100, // expired
      })
      // ZIP market data
      .mockResolvedValueOnce({ data: ZIP_MARKET_DATA })
      // Metro market data (12 metrics)
      .mockResolvedValue(null);

    mockQueryPropertyByAddress.mockResolvedValue([PINAL_PROPERTY_RECORD]);
    mockQueryCompsBySubdivision.mockResolvedValue([PINAL_COMP_RECORD]);
    mockQueryCompsByZip.mockResolvedValue([PINAL_COMP_RECORD]);
    mockGetPropertyPhoto.mockResolvedValue({
      url: 'https://s3.example.com/photo.jpg',
      source: 'streetview',
    });
    mockPutItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/property/lookup', {
      address: '39669 N Luke Ln',
      zip: '85140',
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.property.address).toBe('39669 N LUKE LN SAN TAN VALLEY, AZ 85140');
    expect(body.property.salePrice).toBe(449999);
    expect(body.property.subdivision).toBe('PECAN CREEK NORTH PARCEL 1');
    expect(body.photo.source).toBe('streetview');
    expect(body.comps.subdivision).toHaveLength(1);
    expect(body.comps.zip).toHaveLength(1);

    // Verify cache write
    expect(mockPutItem).toHaveBeenCalledTimes(1);
    const cacheItem = mockPutItem.mock.calls[0][0];
    expect(cacheItem.PK).toContain('PROPERTY#');
    expect(cacheItem.SK).toBe('LOOKUP');
    expect(cacheItem.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should perform full lookup when cache is missing', async () => {
    mockGetItem
      .mockResolvedValueOnce(undefined) // no cache
      .mockResolvedValueOnce({ data: ZIP_MARKET_DATA }) // ZIP market
      .mockResolvedValue(null); // metro metrics

    mockQueryPropertyByAddress.mockResolvedValue([PINAL_PROPERTY_RECORD]);
    mockQueryCompsBySubdivision.mockResolvedValue([]);
    mockQueryCompsByZip.mockResolvedValue([]);
    mockGetPropertyPhoto.mockResolvedValue({
      url: 'https://mesahomes.com/images/property-placeholder.jpg',
      source: 'placeholder',
    });
    mockPutItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/property/lookup', {
      address: '39669 N Luke Ln',
      zip: '85140',
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.property.address).toBe('39669 N LUKE LN SAN TAN VALLEY, AZ 85140');
    expect(body.photo.source).toBe('placeholder');
  });

  it('should return 404 when no property is found', async () => {
    mockGetItem.mockResolvedValue(undefined);
    mockQueryPropertyByAddress.mockResolvedValue([]);

    const event = makeEvent('/api/v1/property/lookup', {
      address: '99999 Nonexistent St',
      zip: '85140',
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 when address is missing', async () => {
    const event = makeEvent('/api/v1/property/lookup', { zip: '85140' });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('MISSING_FIELD');
    expect(body.error.message).toContain('address');
  });

  it('should return 400 when zip is missing', async () => {
    const event = makeEvent('/api/v1/property/lookup', { address: '123 Main St' });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('MISSING_FIELD');
    expect(body.error.message).toContain('zip');
  });

  it('should return 400 when body is missing', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/api/v1/property/lookup',
      body: null,
      headers: {},
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });

  it('should use placeholder when Street View fails', async () => {
    mockGetItem
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(null);

    mockQueryPropertyByAddress.mockResolvedValue([PINAL_PROPERTY_RECORD]);
    mockQueryCompsBySubdivision.mockResolvedValue([]);
    mockQueryCompsByZip.mockResolvedValue([]);
    mockGetPropertyPhoto.mockRejectedValue(new Error('Street View API down'));
    mockPutItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/property/lookup', {
      address: '39669 N Luke Ln',
      zip: '85140',
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.photo.source).toBe('placeholder');
  });
});

// ---------------------------------------------------------------------------
// handler — POST /api/v1/property/comps
// ---------------------------------------------------------------------------

describe('handler — /api/v1/property/comps', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockPutItem.mockReset();
    mockQueryPropertyByAddress.mockReset();
    mockQueryCompsBySubdivision.mockReset();
    mockQueryCompsByZip.mockReset();
  });

  it('should return comps by ZIP', async () => {
    mockQueryCompsByZip.mockResolvedValue([PINAL_COMP_RECORD]);

    const event = makeEvent('/api/v1/property/comps', { zip: '85140' });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.comps).toHaveLength(1);
    expect(body.comps[0].address).toBe('396 E MADDISON ST');
  });

  it('should return comps by subdivision', async () => {
    mockQueryCompsBySubdivision.mockResolvedValue([PINAL_COMP_RECORD]);

    const event = makeEvent('/api/v1/property/comps', {
      subdivision: 'PECAN CREEK NORTH PARCEL 1',
      zip: '85140',
    });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.comps).toHaveLength(1);
  });

  it('should return comps by subdivision with county override', async () => {
    mockQueryCompsBySubdivision.mockResolvedValue([]);

    const event = makeEvent('/api/v1/property/comps', {
      subdivision: 'HAWES CROSSING',
      county: 'maricopa',
    });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.comps).toEqual([]);
  });

  it('should return 400 when neither zip nor subdivision is provided', async () => {
    const event = makeEvent('/api/v1/property/comps', {});
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// handler — OPTIONS and unknown paths
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/api/v1/property/lookup',
      body: null,
      headers: {},
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('should return 404 for unknown paths', async () => {
    const event = makeEvent('/api/v1/property/unknown', { test: true });
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
  });
});
