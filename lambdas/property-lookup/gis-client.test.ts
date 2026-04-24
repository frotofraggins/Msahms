import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks
const {
  queryPropertyByAddress,
  queryCompsBySubdivision,
  queryCompsByZip,
} = await import('./gis-client.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock ArcGIS response with the given feature attributes. */
function arcGISResponse(records: Record<string, unknown>[]) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      features: records.map((attributes) => ({ attributes })),
    }),
  };
}

/** Build a mock ArcGIS error response. */
function arcGISErrorResponse(code: number, message: string) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      error: { code, message },
    }),
  };
}

/** Build a mock HTTP error response. */
function httpErrorResponse(status: number, statusText: string) {
  return {
    ok: false,
    status,
    statusText,
  };
}

// ---------------------------------------------------------------------------
// queryPropertyByAddress
// ---------------------------------------------------------------------------

describe('queryPropertyByAddress', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query Pinal County with correct LIKE pattern', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { SITEADDRESS: '39669 N LUKE LN', SALEPRICE: 449999 },
    ]));

    const result = await queryPropertyByAddress('39669', 'LUKE', 'pinal');

    expect(result).toHaveLength(1);
    expect(result[0]['SITEADDRESS']).toBe('39669 N LUKE LN');

    // Verify the fetch was called with the correct URL and body
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query');
    expect(options.method).toBe('POST');

    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("SITEADDRESS LIKE '%39669%LUKE%'");
    expect(body.get('f')).toBe('json');
    expect(body.get('outFields')).toBe('*');
    expect(body.get('returnGeometry')).toBe('false');
  });

  it('should query Maricopa County with correct LIKE pattern', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { PHYSICAL_ADDRESS: '850 S DREW ST MESA 85210' },
    ]));

    const result = await queryPropertyByAddress('850', 'DREW', 'maricopa');

    expect(result).toHaveLength(1);
    expect(result[0]['PHYSICAL_ADDRESS']).toBe('850 S DREW ST MESA 85210');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query');

    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("PHYSICAL_ADDRESS LIKE '%850%DREW%'");
  });

  it('should return empty array when no features are found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ features: [] }),
    });

    const result = await queryPropertyByAddress('99999', 'NONEXISTENT', 'pinal');
    expect(result).toEqual([]);
  });

  it('should return empty array when features key is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const result = await queryPropertyByAddress('99999', 'NONEXISTENT', 'pinal');
    expect(result).toEqual([]);
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValue(httpErrorResponse(500, 'Internal Server Error'));

    await expect(
      queryPropertyByAddress('39669', 'LUKE', 'pinal'),
    ).rejects.toThrow('GIS query failed: HTTP 500 Internal Server Error');
  });

  it('should throw on ArcGIS error response', async () => {
    mockFetch.mockResolvedValue(arcGISErrorResponse(400, 'Invalid query'));

    await expect(
      queryPropertyByAddress('39669', 'LUKE', 'pinal'),
    ).rejects.toThrow('GIS query error: 400 — Invalid query');
  });
});

// ---------------------------------------------------------------------------
// queryCompsBySubdivision
// ---------------------------------------------------------------------------

describe('queryCompsBySubdivision', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query Pinal subdivision comps with correct parameters', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { SITEADDRESS: '396 E MADDISON ST', SALEPRICE: 447500, SALEDATE: '2026-04-06' },
      { SITEADDRESS: '504 E ANASTASIA ST', SALEPRICE: 425000, SALEDATE: '2026-02-01' },
    ]));

    const result = await queryCompsBySubdivision('PECAN CREEK NORTH PARCEL 1', 'pinal');

    expect(result).toHaveLength(2);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("CNVYNAME='PECAN CREEK NORTH PARCEL 1' AND SALEPRICE>100000");
    expect(body.get('orderByFields')).toBe('SALEDATE DESC');
    expect(body.get('resultRecordCount')).toBe('20');
  });

  it('should query Maricopa subdivision comps with correct field names', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { PHYSICAL_ADDRESS: '100 E MAIN ST', SALE_PRICE: 350000 },
    ]));

    const result = await queryCompsBySubdivision('HAWES CROSSING', 'maricopa');

    expect(result).toHaveLength(1);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("SUBNAME='HAWES CROSSING' AND SALE_PRICE>100000");
    expect(body.get('orderByFields')).toBe('SALE_DATE DESC');
  });

  it('should respect custom limit parameter', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([]));

    await queryCompsBySubdivision('TEST SUB', 'pinal', 10);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('resultRecordCount')).toBe('10');
  });
});

// ---------------------------------------------------------------------------
// queryCompsByZip
// ---------------------------------------------------------------------------

describe('queryCompsByZip', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query Pinal ZIP comps with correct parameters', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { SITEADDRESS: '123 MAIN ST', SALEPRICE: 350000 },
    ]));

    const result = await queryCompsByZip('85140', 'pinal');

    expect(result).toHaveLength(1);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("PSTLZIP5='85140' AND SALEPRICE>200000");
    expect(body.get('orderByFields')).toBe('SALEDATE DESC');
    expect(body.get('resultRecordCount')).toBe('50');
  });

  it('should query Maricopa ZIP comps with correct field names', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([
      { PHYSICAL_ADDRESS: '850 S DREW ST', SALE_PRICE: 250000 },
    ]));

    const result = await queryCompsByZip('85210', 'maricopa');

    expect(result).toHaveLength(1);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('where')).toBe("PHYSICAL_ZIP='85210' AND SALE_PRICE>200000");
    expect(body.get('orderByFields')).toBe('SALE_DATE DESC');
  });

  it('should respect custom limit parameter', async () => {
    mockFetch.mockResolvedValue(arcGISResponse([]));

    await queryCompsByZip('85140', 'pinal', 25);

    const [, options] = mockFetch.mock.calls[0];
    const body = new URLSearchParams(options.body);
    expect(body.get('resultRecordCount')).toBe('25');
  });

  it('should return multiple records', async () => {
    const records = Array.from({ length: 5 }, (_, i) => ({
      SITEADDRESS: `${100 + i} TEST ST`,
      SALEPRICE: 300000 + i * 10000,
    }));
    mockFetch.mockResolvedValue(arcGISResponse(records));

    const result = await queryCompsByZip('85140', 'pinal');
    expect(result).toHaveLength(5);
  });
});
