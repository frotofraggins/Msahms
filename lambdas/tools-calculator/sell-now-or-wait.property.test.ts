// Feature: mesahomes-lead-generation, Property 19: Sell Now or Wait Analysis Uses Correct Market Data

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { MarketDataZip, TrendDirection } from '../../lib/types/market.js';

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
  METRO_METRICS,
} = await import('./sell-now-or-wait.js');

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Service area ZIP codes. */
const SERVICE_AREA_ZIPS = [
  '85120', '85121', '85122', '85123', '85128', '85130', '85131', '85132',
  '85137', '85138', '85139', '85140', '85141', '85142', '85143',
  '85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208',
  '85209', '85210', '85211', '85212', '85213', '85214', '85215', '85216',
  '85233', '85234', '85224', '85225', '85226', '85249',
];

const zipArb = fc.constantFrom(...SERVICE_AREA_ZIPS);

/** Estimated home value: $50,000 to $2,000,000. */
const homeValueArb = fc.double({ min: 50000, max: 2_000_000, noNaN: true });

/** ZHVI value: $100,000 to $1,000,000. */
const zhviArb = fc.integer({ min: 100000, max: 1000000 });

/** Trend direction. */
const trendArb: fc.Arbitrary<TrendDirection> = fc.constantFrom('rising', 'declining', 'stable');

/** 6-month change: -50000 to +50000. */
const changeArb = fc.integer({ min: -50000, max: 50000 });

/** Generate mock ZIP market data. */
const zipDataArb: fc.Arbitrary<MarketDataZip> = fc.record({
  zip: zipArb,
  city: fc.constantFrom('San Tan Valley', 'Mesa', 'Gilbert', 'Chandler', 'Queen Creek'),
  zhvi: zhviArb,
  zhviPrevMonth: zhviArb,
  zhviChange6Mo: changeArb,
  trendDirection: trendArb,
  month: fc.constant('2026-03'),
  updatedAt: fc.constant('2026-03-17T00:00:00Z'),
});

/** Generate mock metro data. */
const metroDataArb: fc.Arbitrary<Record<string, number>> = fc.record({
  medianSalePrice: fc.integer({ min: 200000, max: 800000 }),
  daysPending: fc.integer({ min: 10, max: 120 }),
  inventory: fc.integer({ min: 1000, max: 50000 }),
  priceCuts: fc.integer({ min: 5, max: 60 }),
  saleToList: fc.double({ min: 90, max: 105, noNaN: true }),
});

// ---------------------------------------------------------------------------
// Property 19: Sell Now or Wait Analysis Uses Correct Market Data
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 8.1**
 *
 * For any valid service-area ZIP code, the Sell Now or Wait analysis SHALL
 * incorporate the correct ZIP-level market data (ZHVI, trend direction) and
 * metro-level data (median sale price, days on market, inventory, price cuts
 * percentage) from the DynamoDB market data store, and the analysis output
 * SHALL reference values matching the stored data for that ZIP.
 */
describe('Property 19: Sell Now or Wait Analysis Uses Correct Market Data', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('analysis indicators reference the correct ZIP-level and metro-level data values', () => {
    fc.assert(
      fc.asyncProperty(
        zipArb,
        homeValueArb,
        zipDataArb,
        metroDataArb,
        async (zip, homeValue, zipData, metroData) => {
          // Override the zip in zipData to match the generated zip
          const adjustedZipData = { ...zipData, zip };

          // Set up DynamoDB mock
          mockGetItem.mockImplementation((pk: string, sk: string) => {
            if (pk === `MARKET#ZIP#${zip}` && sk === 'ZHVI#LATEST') {
              return Promise.resolve({ data: adjustedZipData });
            }
            if (pk === 'MARKET#METRO#phoenix-mesa') {
              const metric = sk.replace('#LATEST', '');
              if (metroData[metric] !== undefined) {
                return Promise.resolve({ data: { value: metroData[metric] } });
              }
            }
            return Promise.resolve(null);
          });

          const result = await analyzeSellNowOrWait({ zip, estimatedHomeValue: homeValue });

          // ZIP data should be passed through correctly
          expect(result.zipData).toEqual(adjustedZipData);
          expect(result.zip).toBe(zip);
          expect(result.estimatedHomeValue).toBe(homeValue);

          // Metro data should contain the values we provided
          for (const metric of METRO_METRICS) {
            if (metroData[metric] !== undefined) {
              expect(result.metroData[metric]).toBe(metroData[metric]);
            }
          }

          // Indicators should reference the correct ZHVI value
          const zhviIndicator = result.indicators.find(
            (i) => i.name === 'Zillow Home Value Index (ZHVI)',
          );
          expect(zhviIndicator).toBeDefined();
          expect(zhviIndicator!.value).toBe(adjustedZipData.zhvi);

          // Trend indicator should match the ZIP data trend direction
          const trendIndicator = result.indicators.find(
            (i) => i.name === 'Home Value Trend (6 months)',
          );
          expect(trendIndicator).toBeDefined();
          expect(trendIndicator!.value).toBe(adjustedZipData.trendDirection);

          // 6-month change indicator should match
          const changeIndicator = result.indicators.find(
            (i) => i.name === '6-Month Value Change',
          );
          expect(changeIndicator).toBeDefined();
          expect(changeIndicator!.value).toBe(adjustedZipData.zhviChange6Mo);

          // Metro indicators should reference correct values
          if (metroData['medianSalePrice'] !== undefined) {
            const medianIndicator = result.indicators.find(
              (i) => i.name === 'Metro Median Sale Price',
            );
            expect(medianIndicator).toBeDefined();
            expect(medianIndicator!.value).toBe(metroData['medianSalePrice']);
          }

          if (metroData['daysPending'] !== undefined) {
            const daysIndicator = result.indicators.find(
              (i) => i.name === 'Days on Market',
            );
            expect(daysIndicator).toBeDefined();
            expect(daysIndicator!.value).toBe(metroData['daysPending']);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('analyzeMarketIndicators uses correct values from provided data', () => {
    fc.assert(
      fc.property(
        zipDataArb,
        metroDataArb,
        homeValueArb,
        (zipData, metroData, homeValue) => {
          const indicators = analyzeMarketIndicators(zipData, metroData, homeValue);

          // All indicators should have valid signal values
          for (const indicator of indicators) {
            expect(['sell-now', 'wait', 'neutral']).toContain(indicator.signal);
            expect(indicator.name.length).toBeGreaterThan(0);
            expect(indicator.interpretation.length).toBeGreaterThan(0);
          }

          // Trend signal should be consistent with trend direction
          const trendIndicator = indicators.find(
            (i) => i.name === 'Home Value Trend (6 months)',
          );
          if (trendIndicator) {
            if (zipData.trendDirection === 'declining') {
              expect(trendIndicator.signal).toBe('sell-now');
            } else if (zipData.trendDirection === 'rising') {
              expect(trendIndicator.signal).toBe('wait');
            } else {
              expect(trendIndicator.signal).toBe('neutral');
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
