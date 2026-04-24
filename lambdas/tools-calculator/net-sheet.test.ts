import { describe, it, expect } from 'vitest';
import {
  calculateNetSheet,
  computeDeductions,
  FLAT_FEE_AMOUNT,
  BROKER_TRANSACTION_FEE,
  BUYER_AGENT_COMMISSION_RATE,
  TRADITIONAL_SELLER_COMMISSION_RATE,
  TITLE_ESCROW_RATE,
  TRANSFER_TAX_RATE,
  PROPERTY_TAX_RATE,
  PRORATED_TAX_MONTHS,
  REPAIR_CREDITS_RATE,
} from './net-sheet.js';

// ---------------------------------------------------------------------------
// computeDeductions
// ---------------------------------------------------------------------------

describe('computeDeductions', () => {
  it('should compute flat-fee deductions correctly for $400K sale', () => {
    const deductions = computeDeductions(400000, 200000, 'flat-fee');

    const labels = deductions.map((d) => d.label);
    expect(labels).toContain('Seller Agent Fee (Flat Fee)');
    expect(labels).toContain('Buyer Agent Commission');
    expect(labels).toContain('Broker Transaction Fee');
    expect(labels).toContain('Title & Escrow Fees');
    expect(labels).toContain('Transfer Taxes');
    expect(labels).toContain('Prorated Property Taxes');
    expect(labels).toContain('Mortgage Payoff');
    expect(labels).toContain('Estimated Repair Credits');

    const byLabel = Object.fromEntries(deductions.map((d) => [d.label, d.amount]));
    expect(byLabel['Seller Agent Fee (Flat Fee)']).toBe(FLAT_FEE_AMOUNT);
    expect(byLabel['Buyer Agent Commission']).toBe(400000 * BUYER_AGENT_COMMISSION_RATE);
    expect(byLabel['Broker Transaction Fee']).toBe(BROKER_TRANSACTION_FEE);
    expect(byLabel['Title & Escrow Fees']).toBe(400000 * TITLE_ESCROW_RATE);
    expect(byLabel['Transfer Taxes']).toBe(400000 * TRANSFER_TAX_RATE);
    expect(byLabel['Prorated Property Taxes']).toBeCloseTo(
      (400000 * PROPERTY_TAX_RATE / 12) * PRORATED_TAX_MONTHS,
    );
    expect(byLabel['Mortgage Payoff']).toBe(200000);
    expect(byLabel['Estimated Repair Credits']).toBe(400000 * REPAIR_CREDITS_RATE);
  });

  it('should compute traditional deductions correctly for $400K sale', () => {
    const deductions = computeDeductions(400000, 200000, 'traditional');

    const labels = deductions.map((d) => d.label);
    expect(labels).toContain('Seller Agent Commission');
    expect(labels).not.toContain('Broker Transaction Fee');

    const byLabel = Object.fromEntries(deductions.map((d) => [d.label, d.amount]));
    expect(byLabel['Seller Agent Commission']).toBe(400000 * TRADITIONAL_SELLER_COMMISSION_RATE);
  });

  it('should handle zero mortgage', () => {
    const deductions = computeDeductions(500000, 0, 'flat-fee');
    const mortgage = deductions.find((d) => d.label === 'Mortgage Payoff');
    expect(mortgage?.amount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateNetSheet
// ---------------------------------------------------------------------------

describe('calculateNetSheet', () => {
  it('should return correct net proceeds for flat-fee $400K sale with $200K mortgage', () => {
    const result = calculateNetSheet({
      salePrice: 400000,
      outstandingMortgage: 200000,
      serviceType: 'flat-fee',
    });

    expect(result.primary.serviceType).toBe('flat-fee');
    expect(result.primary.salePrice).toBe(400000);
    expect(result.primary.netProceeds).toBe(
      400000 - result.primary.totalDeductions,
    );
    expect(result.primary.totalDeductions).toBeGreaterThan(0);
  });

  it('should return side-by-side comparison', () => {
    const result = calculateNetSheet({
      salePrice: 400000,
      outstandingMortgage: 200000,
      serviceType: 'flat-fee',
    });

    expect(result.comparison.flatFee.serviceType).toBe('flat-fee');
    expect(result.comparison.traditional.serviceType).toBe('traditional');
    expect(result.comparison.savings).toBeGreaterThan(0);
  });

  it('should show flat-fee net >= traditional net for same inputs', () => {
    const result = calculateNetSheet({
      salePrice: 400000,
      outstandingMortgage: 200000,
      serviceType: 'flat-fee',
    });

    expect(result.comparison.flatFee.netProceeds).toBeGreaterThanOrEqual(
      result.comparison.traditional.netProceeds,
    );
  });

  it('should throw for salePrice <= 0', () => {
    expect(() =>
      calculateNetSheet({ salePrice: 0, outstandingMortgage: 0, serviceType: 'flat-fee' }),
    ).toThrow('salePrice must be greater than 0');

    expect(() =>
      calculateNetSheet({ salePrice: -100, outstandingMortgage: 0, serviceType: 'flat-fee' }),
    ).toThrow('salePrice must be greater than 0');
  });

  it('should throw for negative mortgage', () => {
    expect(() =>
      calculateNetSheet({ salePrice: 400000, outstandingMortgage: -1, serviceType: 'flat-fee' }),
    ).toThrow('outstandingMortgage must be >= 0');
  });

  it('should handle very high sale price', () => {
    const result = calculateNetSheet({
      salePrice: 5000000,
      outstandingMortgage: 0,
      serviceType: 'traditional',
    });

    expect(result.primary.netProceeds).toBeLessThan(5000000);
    expect(result.primary.netProceeds).toBeGreaterThan(0);
  });
});
