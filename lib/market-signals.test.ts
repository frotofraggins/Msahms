import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TOTAL_WEIGHT,
  getSeasonalBias,
  computeWeightedAnalysis,
  projectThreeMonths,
} from './market-signals.js';
import type { MarketDataZip } from './types/market.js';

const sampleZip: MarketDataZip = {
  zip: '85140',
  city: 'San Tan Valley',
  zhvi: 450000,
  zhviPrevMonth: 448000,
  trendDirection: 'rising',
  zhviChange6Mo: 15000,
  month: '2026-04',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('SIGNAL_WEIGHTS', () => {
  it('sums to 1 (within floating-point epsilon)', () => {
    expect(TOTAL_WEIGHT).toBeCloseTo(1, 10);
  });
});

describe('getSeasonalBias', () => {
  it('returns strongest positive in April and May', () => {
    const april = getSeasonalBias(new Date('2026-04-15'));
    const may = getSeasonalBias(new Date('2026-05-15'));
    const december = getSeasonalBias(new Date('2026-12-15'));
    expect(april).toBeGreaterThan(december);
    expect(may).toBeGreaterThan(december);
  });

  it('bias magnitude is always <= 0.15', () => {
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, m, 15);
      expect(Math.abs(getSeasonalBias(d))).toBeLessThanOrEqual(0.15);
    }
  });
});

describe('computeWeightedAnalysis', () => {
  it('returns neutral low-confidence when no data observed', () => {
    const r = computeWeightedAnalysis(null, {}, 400000);
    expect(r.confidence).toBe(0);
    expect(r.recommendation).toBe('neutral');
    expect(r.signals.every(s => !s.observed)).toBe(true);
  });

  it('returns high confidence when all signals observed', () => {
    const r = computeWeightedAnalysis(
      sampleZip,
      { saleToList: 100, daysPending: 30, priceCuts: 20, inventory: 8000 },
      450000,
    );
    expect(r.confidence).toBeCloseTo(1, 5);
  });

  it('rising trend + strong metro nudges toward wait', () => {
    // Rising ZIP trend + 6mo gain + neutral everything else → score should lean negative (wait)
    const r = computeWeightedAnalysis(
      sampleZip,
      { saleToList: 100, daysPending: 30, priceCuts: 20, inventory: 8000 },
      450000,
      new Date('2026-01-15'), // winter so seasonal doesn't mask the effect
    );
    expect(r.score).toBeLessThan(0);
  });

  it('declining trend + sale-to-list above 100 tips toward sell-now', () => {
    const r = computeWeightedAnalysis(
      { ...sampleZip, trendDirection: 'declining', zhviChange6Mo: -15000 },
      { saleToList: 103, daysPending: 20, priceCuts: 25, inventory: 7000 },
      450000,
      new Date('2026-04-15'),
    );
    expect(r.score).toBeGreaterThan(0);
    expect(r.recommendation).toBe('sell-now');
  });

  it('forces neutral recommendation when confidence < 0.4', () => {
    // Only one small-weight signal observed (inventory at 0.05)
    const r = computeWeightedAnalysis(null, { inventory: 5000 }, 400000);
    expect(r.confidence).toBeLessThan(0.4);
    expect(r.recommendation).toBe('neutral');
  });
});

describe('projectThreeMonths', () => {
  it('projects upward when 6-month change is positive', () => {
    const p = projectThreeMonths(sampleZip, 500000);
    expect(p.projectedValue3Mo).toBeGreaterThan(500000);
    expect(p.delta3Mo).toBeGreaterThan(0);
  });

  it('projects flat when data missing', () => {
    const p = projectThreeMonths(null, 500000);
    expect(p.projectedValue3Mo).toBe(500000);
    expect(p.delta3Mo).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('property: weighted analysis invariants', () => {
  it('confidence is always in [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.option(fc.record({
          zip: fc.constantFrom('85140', '85210'),
          city: fc.constant('Test'),
          zhvi: fc.integer({ min: 100000, max: 2000000 }),
          zhviPrevMonth: fc.integer({ min: 100000, max: 2000000 }),
          trendDirection: fc.constantFrom('rising', 'declining', 'stable'),
          zhviChange6Mo: fc.integer({ min: -100000, max: 100000 }),
          month: fc.constant('2026-04'),
          updatedAt: fc.constant('2026-04-01T00:00:00Z'),
        })),
        fc.record({
          saleToList: fc.option(fc.integer({ min: 80, max: 110 })),
          daysPending: fc.option(fc.integer({ min: 5, max: 120 })),
          priceCuts: fc.option(fc.integer({ min: 0, max: 80 })),
          inventory: fc.option(fc.integer({ min: 100, max: 20000 })),
        }),
        fc.integer({ min: 50000, max: 3000000 }),
        (zipData, metro, value) => {
          const metroClean: Record<string, number> = {};
          for (const [k, v] of Object.entries(metro)) if (v !== null) metroClean[k] = v;
          const r = computeWeightedAnalysis(zipData as MarketDataZip | null, metroClean, value);
          expect(r.confidence).toBeGreaterThanOrEqual(0);
          expect(r.confidence).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('score is always in [-1, 1]', () => {
    fc.assert(
      fc.property(
        fc.option(fc.record({
          zip: fc.constant('85140'),
          city: fc.constant('Test'),
          zhvi: fc.integer({ min: 100000, max: 2000000 }),
          zhviPrevMonth: fc.integer({ min: 100000, max: 2000000 }),
          trendDirection: fc.constantFrom('rising', 'declining', 'stable'),
          zhviChange6Mo: fc.integer({ min: -200000, max: 200000 }),
          month: fc.constant('2026-04'),
          updatedAt: fc.constant('2026-04-01T00:00:00Z'),
        })),
        fc.integer({ min: 50000, max: 3000000 }),
        (zipData, value) => {
          const r = computeWeightedAnalysis(zipData as MarketDataZip | null, {}, value);
          expect(r.score).toBeGreaterThanOrEqual(-1);
          expect(r.score).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('recommendation is neutral whenever confidence is below 0.4', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50000, max: 3000000 }),
        (value) => {
          // Only one small-weight signal (inventory = 0.05) → confidence 0.05 < 0.4
          const r = computeWeightedAnalysis(null, { inventory: 5000 }, value);
          expect(r.confidence).toBeLessThan(0.4);
          expect(r.recommendation).toBe('neutral');
        },
      ),
      { numRuns: 100 },
    );
  });
});
