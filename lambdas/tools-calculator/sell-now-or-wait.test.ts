import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock DynamoDB
// ---------------------------------------------------------------------------

const mockGetItem = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
}));

// Import after mocks
const {
  analyzeSellNowOrWait,
  analyzeMarketIndicators,
  determineRecommendation,
  generateSummary,
  getZipMarketData,
  getMetroMarketData,
} = await import('./sell-now-or-wait.js');

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ZIP_DATA = {
  zip: '85140',
  city: 'San Tan Valley',
  zhvi: 432201,
  zhviPrevMonth: 433401,
  zhviChange6Mo: -1200,
  trendDirection: 'declining' as const,
  month: '2026-03',
  updatedAt: '2026-03-17T00:00:00Z',
};

const METRO_DATA: Record<string, number> = {
  medianSalePrice: 454000,
  daysPending: 58,
  inventory: 12500,
  priceCuts: 28,
  saleToList: 97.82,
};

// ---------------------------------------------------------------------------
// analyzeMarketIndicators
// ---------------------------------------------------------------------------

describe('analyzeMarketIndicators', () => {
  it('should produce indicators from ZIP and metro data', () => {
    const indicators = analyzeMarketIndicators(ZIP_DATA, METRO_DATA, 450000);

    expect(indicators.length).toBeGreaterThan(0);

    const names = indicators.map((i) => i.name);
    expect(names).toContain('Home Value Trend (6 months)');
    expect(names).toContain('Zillow Home Value Index (ZHVI)');
    expect(names).toContain('6-Month Value Change');
    expect(names).toContain('Metro Median Sale Price');
    expect(names).toContain('Days on Market');
    expect(names).toContain('Active Inventory');
    expect(names).toContain('Price Cuts Percentage');
    expect(names).toContain('Sale-to-List Ratio');
  });

  it('should signal sell-now for declining trend', () => {
    const indicators = analyzeMarketIndicators(ZIP_DATA, {}, 450000);
    const trend = indicators.find((i) => i.name === 'Home Value Trend (6 months)');
    expect(trend?.signal).toBe('sell-now');
  });

  it('should handle null ZIP data', () => {
    const indicators = analyzeMarketIndicators(null, METRO_DATA, 450000);
    const names = indicators.map((i) => i.name);
    expect(names).not.toContain('Home Value Trend (6 months)');
    expect(names).toContain('Metro Median Sale Price');
  });

  it('should handle empty metro data', () => {
    const indicators = analyzeMarketIndicators(ZIP_DATA, {}, 450000);
    const names = indicators.map((i) => i.name);
    expect(names).toContain('Home Value Trend (6 months)');
    expect(names).not.toContain('Metro Median Sale Price');
  });
});

// ---------------------------------------------------------------------------
// determineRecommendation
// ---------------------------------------------------------------------------

describe('determineRecommendation', () => {
  it('should return sell-now when sell-now signals dominate', () => {
    const result = determineRecommendation([
      { name: 'A', value: 1, interpretation: '', signal: 'sell-now' },
      { name: 'B', value: 1, interpretation: '', signal: 'sell-now' },
      { name: 'C', value: 1, interpretation: '', signal: 'neutral' },
    ]);
    expect(result).toBe('sell-now');
  });

  it('should return wait when wait signals dominate', () => {
    const result = determineRecommendation([
      { name: 'A', value: 1, interpretation: '', signal: 'wait' },
      { name: 'B', value: 1, interpretation: '', signal: 'wait' },
      { name: 'C', value: 1, interpretation: '', signal: 'sell-now' },
    ]);
    expect(result).toBe('wait');
  });

  it('should return neutral when signals are balanced', () => {
    const result = determineRecommendation([
      { name: 'A', value: 1, interpretation: '', signal: 'sell-now' },
      { name: 'B', value: 1, interpretation: '', signal: 'wait' },
      { name: 'C', value: 1, interpretation: '', signal: 'neutral' },
    ]);
    expect(result).toBe('neutral');
  });

  it('should return neutral for empty indicators', () => {
    expect(determineRecommendation([])).toBe('neutral');
  });
});

// ---------------------------------------------------------------------------
// generateSummary
// ---------------------------------------------------------------------------

describe('generateSummary', () => {
  it('should include ZIP and home value in sell-now summary', () => {
    const summary = generateSummary('sell-now', '85140', 450000);
    expect(summary).toContain('85140');
    expect(summary).toContain('450,000');
  });

  it('should include ZIP and home value in wait summary', () => {
    const summary = generateSummary('wait', '85140', 450000);
    expect(summary).toContain('85140');
    expect(summary).toContain('450,000');
  });

  it('should include ZIP and home value in neutral summary', () => {
    const summary = generateSummary('neutral', '85140', 450000);
    expect(summary).toContain('85140');
    expect(summary).toContain('450,000');
  });
});

// ---------------------------------------------------------------------------
// getZipMarketData / getMetroMarketData
// ---------------------------------------------------------------------------

describe('getZipMarketData', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return ZIP data from DynamoDB', async () => {
    mockGetItem.mockResolvedValue({ data: ZIP_DATA });
    const result = await getZipMarketData('85140');
    expect(result).toEqual(ZIP_DATA);
    expect(mockGetItem).toHaveBeenCalledWith('MARKET#ZIP#85140', 'ZHVI#LATEST');
  });

  it('should return null when no data exists', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const result = await getZipMarketData('99999');
    expect(result).toBeNull();
  });
});

describe('getMetroMarketData', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should read all metro metrics', async () => {
    mockGetItem.mockImplementation((...args: unknown[]) => {
      const sk = args[1] as string | undefined;
      if (!sk) return Promise.resolve(null);
      const metric = sk.replace('#LATEST', '');
      if (METRO_DATA[metric] !== undefined) {
        return Promise.resolve({ data: { value: METRO_DATA[metric] } });
      }
      return Promise.resolve(null);
    });

    const result = await getMetroMarketData();
    expect(result['medianSalePrice']).toBe(454000);
    expect(result['daysPending']).toBe(58);
    expect(result['inventory']).toBe(12500);
  });
});

// ---------------------------------------------------------------------------
// analyzeSellNowOrWait (integration)
// ---------------------------------------------------------------------------

describe('analyzeSellNowOrWait', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return full analysis with market data', async () => {
    // ZIP data
    mockGetItem.mockImplementation((...args: unknown[]) => {
      const pk = args[0] as string;
      const sk = args[1] as string | undefined;
      if (!sk) return Promise.resolve(null);
      if (pk === 'MARKET#ZIP#85140' && sk === 'ZHVI#LATEST') {
        return Promise.resolve({ data: ZIP_DATA });
      }
      const metric = sk.replace('#LATEST', '');
      if (pk === 'MARKET#METRO#phoenix-mesa' && METRO_DATA[metric] !== undefined) {
        return Promise.resolve({ data: { value: METRO_DATA[metric] } });
      }
      return Promise.resolve(null);
    });

    const result = await analyzeSellNowOrWait({
      zip: '85140',
      estimatedHomeValue: 450000,
    });

    expect(result.zip).toBe('85140');
    expect(result.estimatedHomeValue).toBe(450000);
    expect(result.zipData).toEqual(ZIP_DATA);
    expect(result.indicators.length).toBeGreaterThan(0);
    expect(['sell-now', 'wait', 'neutral']).toContain(result.recommendation);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('should throw for empty zip', async () => {
    await expect(
      analyzeSellNowOrWait({ zip: '', estimatedHomeValue: 450000 }),
    ).rejects.toThrow('zip is required');
  });

  it('should throw for estimatedHomeValue <= 0', async () => {
    await expect(
      analyzeSellNowOrWait({ zip: '85140', estimatedHomeValue: 0 }),
    ).rejects.toThrow('estimatedHomeValue must be greater than 0');
  });
});
