import { describe, it, expect } from 'vitest';
import {
  calculateComparison,
  FLAT_FEE_AMOUNT,
  BROKER_FEE,
  BUYER_AGENT_RATE,
  TRADITIONAL_SELLER_RATE,
  TRADITIONAL_BUYER_RATE,
  FLAT_FEE_SERVICES,
  TRADITIONAL_SERVICES,
} from './comparison.js';

// ---------------------------------------------------------------------------
// calculateComparison
// ---------------------------------------------------------------------------

describe('calculateComparison', () => {
  it('should compute correct flat-fee costs for $400K sale', () => {
    const result = calculateComparison({ estimatedSalePrice: 400000 });

    expect(result.flatFee.sellerCommission).toBe(FLAT_FEE_AMOUNT);
    expect(result.flatFee.buyerAgentCommission).toBe(400000 * BUYER_AGENT_RATE);
    expect(result.flatFee.brokerFee).toBe(BROKER_FEE);
    expect(result.flatFee.totalCost).toBe(
      FLAT_FEE_AMOUNT + 400000 * BUYER_AGENT_RATE + BROKER_FEE,
    );
  });

  it('should compute correct traditional costs for $400K sale', () => {
    const result = calculateComparison({ estimatedSalePrice: 400000 });

    expect(result.traditional.sellerCommission).toBe(400000 * TRADITIONAL_SELLER_RATE);
    expect(result.traditional.buyerAgentCommission).toBe(400000 * TRADITIONAL_BUYER_RATE);
    expect(result.traditional.brokerFee).toBe(0);
    expect(result.traditional.totalCost).toBe(
      400000 * TRADITIONAL_SELLER_RATE + 400000 * TRADITIONAL_BUYER_RATE,
    );
  });

  it('should compute positive savings for $400K sale', () => {
    const result = calculateComparison({ estimatedSalePrice: 400000 });

    expect(result.savings).toBeGreaterThan(0);
    expect(result.savings).toBe(result.traditional.totalCost - result.flatFee.totalCost);
  });

  it('should include service tier descriptions', () => {
    const result = calculateComparison({ estimatedSalePrice: 400000 });

    expect(result.flatFee.servicesIncluded).toEqual(FLAT_FEE_SERVICES);
    expect(result.traditional.servicesIncluded).toEqual(TRADITIONAL_SERVICES);
    expect(result.flatFee.servicesIncluded.length).toBeGreaterThan(0);
    expect(result.traditional.servicesIncluded.length).toBeGreaterThan(0);
  });

  it('should compute savings percentage', () => {
    const result = calculateComparison({ estimatedSalePrice: 400000 });

    expect(result.savingsPercent).toBeCloseTo(
      (result.savings / 400000) * 100,
    );
  });

  it('should throw for estimatedSalePrice <= 0', () => {
    expect(() => calculateComparison({ estimatedSalePrice: 0 })).toThrow(
      'estimatedSalePrice must be greater than 0',
    );
    expect(() => calculateComparison({ estimatedSalePrice: -100 })).toThrow(
      'estimatedSalePrice must be greater than 0',
    );
  });

  it('should handle very low sale price where flat-fee may not save', () => {
    // At very low prices, the flat fee + broker fee could exceed traditional seller commission
    // But buyer commission is the same, so savings = traditional seller - (flat fee + broker)
    const result = calculateComparison({ estimatedSalePrice: 10000 });

    // Traditional seller: 10000 * 0.03 = 300
    // Flat fee seller: 999 + 400 = 1399
    // So savings would be negative at very low prices
    expect(result.savings).toBe(result.traditional.totalCost - result.flatFee.totalCost);
  });
});
