import { describe, it, expect, vi } from 'vitest';
import {
  ZILLOW_CSV_URLS,
  SERVICE_AREA_ZIPS,
  downloadCsv,
  parseZhviZipCsv,
  parseMetroCsv,
  generateDynamoDBItems,
  getTrendDirection,
} from './zillow-csv.js';
import { PINAL_COUNTY_ZIPS } from '../../lib/county-router.js';

// ---------------------------------------------------------------------------
// Sample CSV data for testing
// ---------------------------------------------------------------------------

const ZHVI_ZIP_CSV_HEADER =
  'RegionID,SizeRank,RegionName,RegionType,StateName,State,City,Metro,CountyName,2025-09-30,2025-10-31,2025-11-30,2025-12-31,2026-01-31,2026-02-28,2026-03-31';

const ZHVI_ZIP_CSV_ROWS = [
  '12345,100,85140,zip,Arizona,AZ,San Tan Valley,"Phoenix, AZ",Pinal,430000,431000,432000,433000,433500,433401,432201',
  '12346,200,85201,zip,Arizona,AZ,Mesa,"Phoenix, AZ",Maricopa,355000,356000,357000,358000,359000,360000,360214',
  '99999,500,90210,zip,California,CA,Beverly Hills,"Los Angeles-Long Beach-Anaheim, CA",Los Angeles,5000000,5100000,5200000,5300000,5400000,5500000,5600000',
];

const SAMPLE_ZHVI_ZIP_CSV = [ZHVI_ZIP_CSV_HEADER, ...ZHVI_ZIP_CSV_ROWS].join('\n');

const METRO_CSV_HEADER =
  'RegionID,SizeRank,RegionName,RegionType,StateName,State,2025-09-30,2025-10-31,2025-11-30,2025-12-31,2026-01-31,2026-02-28,2026-03-31';

const METRO_CSV_ROWS = [
  '100,1,"Phoenix, AZ",msa,Arizona,AZ,440000,442000,444000,446000,448000,452000,454000',
  '200,2,"Los Angeles-Long Beach-Anaheim, CA",msa,California,CA,800000,810000,820000,830000,840000,850000,860000',
];

const SAMPLE_METRO_CSV = [METRO_CSV_HEADER, ...METRO_CSV_ROWS].join('\n');

// ---------------------------------------------------------------------------
// SERVICE_AREA_ZIPS
// ---------------------------------------------------------------------------

describe('SERVICE_AREA_ZIPS', () => {
  it('should contain all Pinal County ZIPs', () => {
    for (const zip of PINAL_COUNTY_ZIPS) {
      expect(SERVICE_AREA_ZIPS.has(zip)).toBe(true);
    }
  });

  it('should contain Mesa core ZIPs (85201–85216)', () => {
    const mesaZips = [
      '85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208',
      '85209', '85210', '85211', '85212', '85213', '85214', '85215', '85216',
    ];
    for (const zip of mesaZips) {
      expect(SERVICE_AREA_ZIPS.has(zip)).toBe(true);
    }
  });

  it('should contain Gilbert/Chandler ZIPs', () => {
    const surroundingZips = ['85233', '85234', '85224', '85225', '85226', '85249'];
    for (const zip of surroundingZips) {
      expect(SERVICE_AREA_ZIPS.has(zip)).toBe(true);
    }
  });

  it('should not contain ZIPs outside the service area', () => {
    expect(SERVICE_AREA_ZIPS.has('90210')).toBe(false);
    expect(SERVICE_AREA_ZIPS.has('10001')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ZILLOW_CSV_URLS
// ---------------------------------------------------------------------------

describe('ZILLOW_CSV_URLS', () => {
  it('should contain all 13 dataset URLs', () => {
    expect(Object.keys(ZILLOW_CSV_URLS)).toHaveLength(13);
  });

  it('should have URLs pointing to files.zillowstatic.com', () => {
    for (const url of Object.values(ZILLOW_CSV_URLS)) {
      expect(url).toContain('files.zillowstatic.com/research/public_csvs');
    }
  });
});

// ---------------------------------------------------------------------------
// parseZhviZipCsv
// ---------------------------------------------------------------------------

describe('parseZhviZipCsv', () => {
  it('should parse a sample CSV with known values', () => {
    const results = parseZhviZipCsv(SAMPLE_ZHVI_ZIP_CSV);

    expect(results.length).toBe(2);

    const sanTanValley = results.find((r) => r.zip === '85140');
    expect(sanTanValley).toBeDefined();
    expect(sanTanValley!.city).toBe('San Tan Valley');
    expect(sanTanValley!.zhvi).toBe(432201);
    expect(sanTanValley!.month).toBe('2026-03');
  });

  it('should filter to only service area ZIPs', () => {
    const results = parseZhviZipCsv(SAMPLE_ZHVI_ZIP_CSV);

    const zips = results.map((r) => r.zip);
    expect(zips).toContain('85140');
    expect(zips).toContain('85201');
    expect(zips).not.toContain('90210');
  });

  it('should extract previous month value', () => {
    const results = parseZhviZipCsv(SAMPLE_ZHVI_ZIP_CSV);
    const sanTanValley = results.find((r) => r.zip === '85140')!;

    // Previous month column is 2026-02-28 → 433401
    expect(sanTanValley.zhviPrevMonth).toBe(433401);
  });

  it('should calculate trend direction correctly for declining values', () => {
    const results = parseZhviZipCsv(SAMPLE_ZHVI_ZIP_CSV);
    const sanTanValley = results.find((r) => r.zip === '85140')!;

    // 6 months ago (2025-09-30) = 430000, latest (2026-03-31) = 432201
    // Change = 432201 - 430000 = 2201 → rising
    expect(sanTanValley.zhviChange6Mo).toBe(2201);
    expect(sanTanValley.trendDirection).toBe('rising');
  });

  it('should calculate trend direction correctly for rising values', () => {
    const results = parseZhviZipCsv(SAMPLE_ZHVI_ZIP_CSV);
    const mesa = results.find((r) => r.zip === '85201')!;

    // 6 months ago (2025-09-30) = 355000, latest (2026-03-31) = 360214
    // Change = 360214 - 355000 = 5214 → rising
    expect(mesa.zhviChange6Mo).toBe(5214);
    expect(mesa.trendDirection).toBe('rising');
  });

  it('should return empty array for empty CSV', () => {
    expect(parseZhviZipCsv('')).toEqual([]);
  });

  it('should return empty array for header-only CSV', () => {
    expect(parseZhviZipCsv(ZHVI_ZIP_CSV_HEADER)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTrendDirection
// ---------------------------------------------------------------------------

describe('getTrendDirection', () => {
  it('should return rising for positive change', () => {
    expect(getTrendDirection(5000)).toBe('rising');
  });

  it('should return declining for negative change', () => {
    expect(getTrendDirection(-1200)).toBe('declining');
  });

  it('should return stable for zero change', () => {
    expect(getTrendDirection(0)).toBe('stable');
  });
});

// ---------------------------------------------------------------------------
// parseMetroCsv
// ---------------------------------------------------------------------------

describe('parseMetroCsv', () => {
  it('should extract the correct metro row and latest value', () => {
    const result = parseMetroCsv(SAMPLE_METRO_CSV, 'medianSalePrice');

    expect(result).not.toBeNull();
    expect(result!.metro).toBe('Phoenix, AZ');
    expect(result!.metric).toBe('medianSalePrice');
    expect(result!.value).toBe(454000);
    expect(result!.month).toBe('2026-03');
  });

  it('should return null when metro row is not found', () => {
    const csvWithoutPhoenix = [
      METRO_CSV_HEADER,
      '200,2,"Los Angeles-Long Beach-Anaheim, CA",msa,California,CA,800000,810000,820000,830000,840000,850000,860000',
    ].join('\n');

    const result = parseMetroCsv(csvWithoutPhoenix, 'medianSalePrice');
    expect(result).toBeNull();
  });

  it('should return null for empty CSV', () => {
    expect(parseMetroCsv('', 'medianSalePrice')).toBeNull();
  });

  it('should use the provided metric name', () => {
    const result = parseMetroCsv(SAMPLE_METRO_CSV, 'inventory');
    expect(result!.metric).toBe('inventory');
  });
});

// ---------------------------------------------------------------------------
// generateDynamoDBItems
// ---------------------------------------------------------------------------

describe('generateDynamoDBItems', () => {
  it('should produce correct PK/SK patterns for ZIP records', () => {
    const zipData = [
      {
        zip: '85140',
        city: 'San Tan Valley',
        zhvi: 432201,
        zhviPrevMonth: 433401,
        zhviChange6Mo: -1200,
        trendDirection: 'declining' as const,
        month: '2026-03',
        updatedAt: '2026-03-17T00:00:00Z',
      },
    ];

    const items = generateDynamoDBItems(zipData, []);

    // Should produce 2 items per ZIP: dated + LATEST
    expect(items).toHaveLength(2);

    const dated = items.find((i) => i.SK === 'ZHVI#2026-03');
    expect(dated).toBeDefined();
    expect(dated!.PK).toBe('MARKET#ZIP#85140');
    expect(dated!.SK).toBe('ZHVI#2026-03');

    const latest = items.find((i) => i.SK === 'ZHVI#LATEST');
    expect(latest).toBeDefined();
    expect(latest!.PK).toBe('MARKET#ZIP#85140');
    expect(latest!.SK).toBe('ZHVI#LATEST');
  });

  it('should produce correct PK/SK patterns for metro records', () => {
    const metroData = [
      {
        metro: 'Phoenix, AZ',
        metric: 'medianSalePrice',
        value: 454000,
        month: '2026-03',
        updatedAt: '2026-03-17T00:00:00Z',
      },
    ];

    const items = generateDynamoDBItems([], metroData);

    // Should produce 2 items per metric: dated + LATEST
    expect(items).toHaveLength(2);

    const dated = items.find((i) => i.SK === 'medianSalePrice#2026-03');
    expect(dated).toBeDefined();
    expect(dated!.PK).toBe('MARKET#METRO#phoenix-mesa');

    const latest = items.find((i) => i.SK === 'medianSalePrice#LATEST');
    expect(latest).toBeDefined();
    expect(latest!.PK).toBe('MARKET#METRO#phoenix-mesa');
  });

  it('should include entityType MARKET on all items', () => {
    const zipData = [
      {
        zip: '85201',
        city: 'Mesa',
        zhvi: 360214,
        zhviPrevMonth: 360000,
        zhviChange6Mo: 5214,
        trendDirection: 'rising' as const,
        month: '2026-03',
        updatedAt: '2026-03-17T00:00:00Z',
      },
    ];

    const metroData = [
      {
        metro: 'Phoenix, AZ',
        metric: 'inventory',
        value: 25524,
        month: '2026-03',
        updatedAt: '2026-03-17T00:00:00Z',
      },
    ];

    const items = generateDynamoDBItems(zipData, metroData);

    for (const item of items) {
      expect(item.entityType).toBe('MARKET');
    }
  });

  it('should store market data in the data field', () => {
    const zipData = [
      {
        zip: '85140',
        city: 'San Tan Valley',
        zhvi: 432201,
        zhviPrevMonth: 433401,
        zhviChange6Mo: -1200,
        trendDirection: 'declining' as const,
        month: '2026-03',
        updatedAt: '2026-03-17T00:00:00Z',
      },
    ];

    const items = generateDynamoDBItems(zipData, []);
    const dated = items.find((i) => i.SK === 'ZHVI#2026-03')!;

    expect(dated.data).toEqual({
      zip: '85140',
      city: 'San Tan Valley',
      zhvi: 432201,
      zhviPrevMonth: 433401,
      zhviChange6Mo: -1200,
      trendDirection: 'declining',
      month: '2026-03',
      updatedAt: '2026-03-17T00:00:00Z',
    });
  });

  it('should return empty array when no data is provided', () => {
    expect(generateDynamoDBItems([], [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// downloadCsv
// ---------------------------------------------------------------------------

describe('downloadCsv', () => {
  it('should handle network errors gracefully', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(downloadCsv('https://example.com/test.csv')).rejects.toThrow('Network error');

    globalThis.fetch = originalFetch;
  });

  it('should throw on non-OK HTTP responses', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(downloadCsv('https://example.com/missing.csv')).rejects.toThrow(
      'Failed to download CSV',
    );

    globalThis.fetch = originalFetch;
  });

  it('should return CSV content on success', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('header1,header2\nval1,val2'),
    });

    const result = await downloadCsv('https://example.com/test.csv');
    expect(result).toBe('header1,header2\nval1,val2');

    globalThis.fetch = originalFetch;
  });
});
