// Feature: mesahomes-lead-generation, Property 3: Flat-Fee vs Traditional Comparison Savings

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateComparison,
  FLAT_FEE_AMOUNT,
  BROKER_FEE,
  BUYER_AGENT_RATE,
  TRADITIONAL_SELLER_RATE,
  TRADITIONAL_BUYER_RATE,
} from './comparison.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Sale price: $1 to $5,000,000. */
const salePriceArb = fc.double({ min: 1, max: 5_000_000, noNaN: true });

// ---------------------------------------------------------------------------
// Property 3: Flat-Fee vs Traditional Comparison Savings
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 4.1, 4.2**
 *
 * For any estimated sale price > 0, the comparison tool SHALL compute:
 *   (a) flat-fee total cost = flat listing fee + $400 broker fee + buyer agent commission
 *   (b) traditional total cost = seller commission + buyer commission (5.5% total)
 *   (c) dollar savings = traditional total − flat-fee total
 *   (d) savings > 0 when flat fee + broker < seller's traditional commission
 */
describe('Property 3: Flat-Fee vs Traditional Comparison Savings', () => {
  it('(a) flat-fee total = flat fee + $400 broker + buyer agent commission', () => {
    fc.assert(
      fc.property(salePriceArb, (salePrice) => {
        const result = calculateComparison({ estimatedSalePrice: salePrice });

        const expectedFlatFeeTotal =
          FLAT_FEE_AMOUNT + BROKER_FEE + salePrice * BUYER_AGENT_RATE;

        expect(result.flatFee.totalCost).toBeCloseTo(expectedFlatFeeTotal, 4);
        expect(result.flatFee.sellerCommission).toBe(FLAT_FEE_AMOUNT);
        expect(result.flatFee.brokerFee).toBe(BROKER_FEE);
        expect(result.flatFee.buyerAgentCommission).toBeCloseTo(
          salePrice * BUYER_AGENT_RATE,
          4,
        );
      }),
      { numRuns: 150 },
    );
  });

  it('(b) traditional total = seller commission (3%) + buyer commission (2.5%)', () => {
    fc.assert(
      fc.property(salePriceArb, (salePrice) => {
        const result = calculateComparison({ estimatedSalePrice: salePrice });

        const expectedTraditionalTotal =
          salePrice * TRADITIONAL_SELLER_RATE + salePrice * TRADITIONAL_BUYER_RATE;

        expect(result.traditional.totalCost).toBeCloseTo(expectedTraditionalTotal, 4);
        expect(result.traditional.sellerCommission).toBeCloseTo(
          salePrice * TRADITIONAL_SELLER_RATE,
          4,
        );
        expect(result.traditional.buyerAgentCommission).toBeCloseTo(
          salePrice * TRADITIONAL_BUYER_RATE,
          4,
        );
        expect(result.traditional.brokerFee).toBe(0);
      }),
      { numRuns: 150 },
    );
  });

  it('(c) savings = traditional total − flat-fee total', () => {
    fc.assert(
      fc.property(salePriceArb, (salePrice) => {
        const result = calculateComparison({ estimatedSalePrice: salePrice });

        expect(result.savings).toBeCloseTo(
          result.traditional.totalCost - result.flatFee.totalCost,
          4,
        );
      }),
      { numRuns: 150 },
    );
  });

  it('(d) savings > 0 when flat fee + broker < traditional seller commission', () => {
    fc.assert(
      fc.property(salePriceArb, (salePrice) => {
        const result = calculateComparison({ estimatedSalePrice: salePrice });

        const flatFeeSeller = FLAT_FEE_AMOUNT + BROKER_FEE;
        const traditionalSeller = salePrice * TRADITIONAL_SELLER_RATE;

        // When flat-fee seller costs are less than traditional seller commission,
        // savings must be positive (buyer commission is the same in both models)
        if (flatFeeSeller < traditionalSeller) {
          expect(result.savings).toBeGreaterThan(0);
        }
      }),
      { numRuns: 150 },
    );
  });
});
