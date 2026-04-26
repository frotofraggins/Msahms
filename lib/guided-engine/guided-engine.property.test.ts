/**
 * Property tests 16, 17, 18 for the MesaHomes guided decision engine.
 *
 * Property 16: Guided Decision Path Progression
 * Property 17: Guided Path Save/Resume Round-Trip
 * Property 18: Risk Detection in Guided Paths
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { GuidedPath } from '../types/scenario.js';
import { GUIDED_PATHS, PATH_TYPES } from './paths.js';
import { getNextStep, getPathProgress } from './engine.js';
import { detectRisks, type ToolResultsForRisk } from './risk-detection.js';

// ---------------------------------------------------------------------------
// Mock DynamoDB for scenario tests
// ---------------------------------------------------------------------------

interface MockItem {
  PK: string;
  SK: string;
  data: Record<string, unknown>;
  ttl?: number;
  createdAt?: string;
  [key: string]: unknown;
}

const mockStore = new Map<string, MockItem>();

vi.mock('../dynamodb.js', () => ({
  MESAHOMES_TABLE: 'mesahomes-main',
  putItem: vi.fn(async (item: MockItem) => {
    mockStore.set(`${item.PK}#${item.SK}`, item);
  }),
  getItem: vi.fn(async (pk: string, sk: string) => {
    return mockStore.get(`${pk}#${sk}`) ?? undefined;
  }),
}));

beforeEach(() => {
  mockStore.clear();
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const pathTypeArb = fc.constantFrom<GuidedPath>(...PATH_TYPES);

/** Generate a random subset of step IDs for a given path type. */
function completedStepsArb(pathType: GuidedPath): fc.Arbitrary<string[]> {
  const stepIds = GUIDED_PATHS[pathType].map((s) => s.id);
  return fc.subarray(stepIds, { minLength: 0, maxLength: stepIds.length });
}

/** Arbitrary that produces a path type paired with a valid subset of completed steps. */
const pathWithCompletedArb = pathTypeArb.chain((pathType) =>
  completedStepsArb(pathType).map((completed) => ({ pathType, completed })),
);

// ---------------------------------------------------------------------------
// Property 16: Guided Decision Path Progression
// ---------------------------------------------------------------------------

describe('Property 16: Guided Decision Path Progression', () => {
  it('getNextStep returns a step NOT in the completed set, or null if all done', () => {
    fc.assert(
      fc.property(pathWithCompletedArb, ({ pathType, completed }) => {
        const completedSet = new Set(completed);
        const next = getNextStep(pathType, completed);

        if (completedSet.size === GUIDED_PATHS[pathType].length) {
          // All steps completed → should return null
          expect(next).toBeNull();
        } else {
          // Should return a step that is NOT in the completed set
          expect(next).not.toBeNull();
          expect(completedSet.has(next!.id)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('path progress percentage is always between 0 and 100 inclusive', () => {
    fc.assert(
      fc.property(pathWithCompletedArb, ({ pathType, completed }) => {
        const progress = getPathProgress(pathType, completed);
        expect(progress.percentComplete).toBeGreaterThanOrEqual(0);
        expect(progress.percentComplete).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 },
    );
  });

  it('completing all steps returns null for next step and 100% progress', () => {
    fc.assert(
      fc.property(pathTypeArb, (pathType) => {
        const allStepIds = GUIDED_PATHS[pathType].map((s) => s.id);
        const next = getNextStep(pathType, allStepIds);
        const progress = getPathProgress(pathType, allStepIds);

        expect(next).toBeNull();
        expect(progress.percentComplete).toBe(100);
        expect(progress.currentStep).toBeNull();
        expect(progress.remainingSteps).toHaveLength(0);
      }),
      { numRuns: 50 },
    );
  });

  it('completed + remaining steps equal total path steps', () => {
    fc.assert(
      fc.property(pathWithCompletedArb, ({ pathType, completed }) => {
        const progress = getPathProgress(pathType, completed);
        const totalSteps = GUIDED_PATHS[pathType].length;
        expect(progress.completedSteps.length + progress.remainingSteps.length).toBe(totalSteps);
      }),
      { numRuns: 200 },
    );
  });

  it('getNextStep returns the first remaining step in path order', () => {
    fc.assert(
      fc.property(pathWithCompletedArb, ({ pathType, completed }) => {
        const next = getNextStep(pathType, completed);
        const progress = getPathProgress(pathType, completed);

        if (next === null) {
          expect(progress.remainingSteps).toHaveLength(0);
        } else {
          expect(next.id).toBe(progress.remainingSteps[0].id);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: Guided Path Save/Resume Round-Trip
// ---------------------------------------------------------------------------

describe('Property 17: Guided Path Save/Resume Round-Trip', () => {
  it('save then load returns identical state', async () => {
    // Use fc.sample to generate test cases, then run async assertions
    const { saveScenario, loadScenario } = await import('./scenario.js');

    const samples = fc.sample(
      fc.record({
        pathType: pathTypeArb,
        email: fc.emailAddress(),
        completedSteps: pathTypeArb.chain((pt) => completedStepsArb(pt)),
      }),
      50,
    );

    for (const sample of samples) {
      mockStore.clear();

      const toolInputs: Record<string, Record<string, unknown>> = {};
      const toolResults: Record<string, Record<string, unknown>> = {};

      // Populate tool inputs/results for completed steps
      for (const stepId of sample.completedSteps) {
        toolInputs[stepId] = { address: '123 Main St' };
        toolResults[stepId] = { value: 350000 };
      }

      const token = await saveScenario(
        sample.email,
        sample.pathType,
        sample.completedSteps,
        toolInputs,
        toolResults,
      );

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const loaded = await loadScenario(token);

      expect(loaded).not.toBeNull();
      expect(loaded!.email).toBe(sample.email);
      expect(loaded!.pathType).toBe(sample.pathType);
      expect(loaded!.completedSteps).toEqual(sample.completedSteps);
      expect(loaded!.toolInputs).toEqual(toolInputs);
      expect(loaded!.toolResults).toEqual(toolResults);
    }
  });

  it('loading a non-existent token returns null', async () => {
    const { loadScenario } = await import('./scenario.js');

    const samples = fc.sample(fc.uuid(), 20);

    for (const token of samples) {
      mockStore.clear();
      const result = await loadScenario(token);
      expect(result).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Property 18: Risk Detection in Guided Paths
// ---------------------------------------------------------------------------

describe('Property 18: Risk Detection in Guided Paths', () => {
  it('scenarios without risk indicators return empty array', () => {
    // Generate tool results that should NOT trigger any risk
    const safeResultsArb = fc.record({
      salePrice: fc.integer({ min: 200000, max: 1000000 }),
      mortgageBalance: fc.integer({ min: 0, max: 199999 }),
      notes: fc.constantFrom('nice house', 'great location', 'move-in ready', ''),
      hasTenants: fc.constant(false),
      isInvestment: fc.constant(false),
      downPaymentPercent: fc.integer({ min: 5, max: 50 }),
      isFirstTimeBuyer: fc.constant(false),
    });

    fc.assert(
      fc.property(safeResultsArb, (results) => {
        // Ensure mortgage < sale price (safe scenario)
        const safeResults: ToolResultsForRisk = {
          ...results,
          mortgageBalance: Math.min(results.mortgageBalance, results.salePrice - 1),
        };
        const risks = detectRisks(safeResults);
        expect(risks).toHaveLength(0);
      }),
      { numRuns: 200 },
    );
  });

  it('mortgage > sale price triggers short-sale risk', () => {
    const shortSaleArb = fc.record({
      salePrice: fc.integer({ min: 100000, max: 500000 }),
      excess: fc.integer({ min: 1, max: 200000 }),
    });

    fc.assert(
      fc.property(shortSaleArb, ({ salePrice, excess }) => {
        const results: ToolResultsForRisk = {
          salePrice,
          mortgageBalance: salePrice + excess,
        };
        const risks = detectRisks(results);
        const shortSale = risks.find((r) => r.type === 'short-sale');
        expect(shortSale).toBeDefined();
        expect(shortSale!.suggestFullService).toBe(true);
        expect(shortSale!.severity).toBe('high');
      }),
      { numRuns: 100 },
    );
  });

  it('down payment < 5% for first-time buyer triggers low-down-payment risk', () => {
    const lowDownArb = fc.record({
      downPaymentPercent: fc.double({ min: 0, max: 4.99, noNaN: true }),
      isFirstTimeBuyer: fc.constant(true),
    });

    fc.assert(
      fc.property(lowDownArb, (results) => {
        const risks = detectRisks(results);
        const lowDown = risks.find((r) => r.type === 'low-down-payment');
        expect(lowDown).toBeDefined();
        expect(lowDown!.suggestFullService).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('estate sale keywords in notes trigger estate-sale risk', () => {
    const estateKeywords = ['estate sale', 'probate', 'inherited', 'deceased', 'trust sale'];
    const estateArb = fc.constantFrom(...estateKeywords);

    fc.assert(
      fc.property(estateArb, (keyword) => {
        const results: ToolResultsForRisk = {
          notes: `This is an ${keyword} property`,
        };
        const risks = detectRisks(results);
        const estate = risks.find((r) => r.type === 'estate-sale');
        expect(estate).toBeDefined();
        expect(estate!.suggestFullService).toBe(true);
        expect(estate!.severity).toBe('high');
      }),
      { numRuns: estateKeywords.length * 5 },
    );
  });

  it('investment with tenants triggers investment-with-tenants risk', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const results: ToolResultsForRisk = {
          isInvestment: true,
          hasTenants: true,
        };
        const risks = detectRisks(results);
        const tenantRisk = risks.find((r) => r.type === 'investment-with-tenants');
        expect(tenantRisk).toBeDefined();
        expect(tenantRisk!.suggestFullService).toBe(true);
      }),
      { numRuns: 20 },
    );
  });

  it('every detected risk has suggestFullService set to true', () => {
    // Generate results that may or may not trigger risks
    const anyResultsArb = fc.record({
      salePrice: fc.option(fc.integer({ min: 100000, max: 1000000 }), { nil: undefined }),
      mortgageBalance: fc.option(fc.integer({ min: 0, max: 1200000 }), { nil: undefined }),
      notes: fc.option(fc.constantFrom('estate sale', 'nice house', 'probate', ''), { nil: undefined }),
      hasTenants: fc.option(fc.boolean(), { nil: undefined }),
      isInvestment: fc.option(fc.boolean(), { nil: undefined }),
      downPaymentPercent: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
      isFirstTimeBuyer: fc.option(fc.boolean(), { nil: undefined }),
    });

    fc.assert(
      fc.property(anyResultsArb, (results) => {
        const risks = detectRisks(results as ToolResultsForRisk);
        for (const risk of risks) {
          expect(risk.suggestFullService).toBe(true);
          expect(risk.type).toBeTruthy();
          expect(risk.explanation).toBeTruthy();
          expect(['low', 'medium', 'high']).toContain(risk.severity);
        }
      }),
      { numRuns: 200 },
    );
  });
});
