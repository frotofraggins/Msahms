import { describe, it, expect } from 'vitest';
import {
  calculateAffordability,
  calculateMonthlyPayment,
  calculateMaxLoanAmount,
  FRONT_END_DTI_LIMIT,
  AZ_DPA_PROGRAMS,
} from './affordability.js';

// ---------------------------------------------------------------------------
// calculateMonthlyPayment
// ---------------------------------------------------------------------------

describe('calculateMonthlyPayment', () => {
  it('should compute correct payment for $300K loan at 6.5% for 30 years', () => {
    const payment = calculateMonthlyPayment(300000, 6.5, 30);
    // Expected ~$1,896.20 per standard amortization tables
    expect(payment).toBeCloseTo(1896.20, 0);
  });

  it('should compute correct payment for $300K loan at 6.5% for 15 years', () => {
    const payment = calculateMonthlyPayment(300000, 6.5, 15);
    // Expected ~$2,613.32
    expect(payment).toBeCloseTo(2613.32, 0);
  });

  it('should handle 0% interest rate', () => {
    const payment = calculateMonthlyPayment(360000, 0, 30);
    expect(payment).toBe(1000); // 360000 / 360
  });

  it('should return 0 for zero principal', () => {
    expect(calculateMonthlyPayment(0, 6.5, 30)).toBe(0);
  });

  it('should return 0 for negative principal', () => {
    expect(calculateMonthlyPayment(-100, 6.5, 30)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateMaxLoanAmount
// ---------------------------------------------------------------------------

describe('calculateMaxLoanAmount', () => {
  it('should be inverse of calculateMonthlyPayment', () => {
    const principal = 300000;
    const rate = 6.5;
    const term = 30;

    const payment = calculateMonthlyPayment(principal, rate, term);
    const recoveredPrincipal = calculateMaxLoanAmount(payment, rate, term);

    expect(recoveredPrincipal).toBeCloseTo(principal, 0);
  });

  it('should handle 0% interest rate', () => {
    const maxLoan = calculateMaxLoanAmount(1000, 0, 30);
    expect(maxLoan).toBe(360000); // 1000 * 360
  });

  it('should return 0 for zero payment', () => {
    expect(calculateMaxLoanAmount(0, 6.5, 30)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateAffordability
// ---------------------------------------------------------------------------

describe('calculateAffordability', () => {
  it('should compute affordability for $100K income, $500/mo debts, $50K down, 6.5%, 30yr', () => {
    const result = calculateAffordability({
      annualIncome: 100000,
      monthlyDebts: 500,
      downPayment: 50000,
      interestRate: 6.5,
      loanTerm: 30,
    });

    expect(result.grossMonthlyIncome).toBeCloseTo(100000 / 12);
    expect(result.maxMonthlyHousingPayment).toBeCloseTo(
      (100000 / 12) * FRONT_END_DTI_LIMIT,
    );
    expect(result.monthlyPayment).toBeLessThanOrEqual(result.maxMonthlyHousingPayment + 0.01);
    expect(result.maxPurchasePrice).toBeGreaterThan(50000); // at least down payment
    expect(result.dtiRatio).toBeGreaterThan(0);
    expect(result.scenarios).toHaveLength(3);
    expect(result.dpaPrograms).toEqual(AZ_DPA_PROGRAMS);
  });

  it('should enforce 28% front-end DTI limit', () => {
    const result = calculateAffordability({
      annualIncome: 100000,
      monthlyDebts: 0,
      downPayment: 0,
      interestRate: 6.5,
      loanTerm: 30,
    });

    const maxHousing = (100000 / 12) * FRONT_END_DTI_LIMIT;
    expect(result.monthlyPayment).toBeLessThanOrEqual(maxHousing + 0.01);
  });

  it('should generate 3 distinct scenarios', () => {
    const result = calculateAffordability({
      annualIncome: 100000,
      monthlyDebts: 500,
      downPayment: 50000,
      interestRate: 6.5,
      loanTerm: 30,
    });

    expect(result.scenarios).toHaveLength(3);

    // Scenarios should have different labels
    const labels = result.scenarios.map((s) => s.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(3);
  });

  it('should compute DTI correctly', () => {
    const result = calculateAffordability({
      annualIncome: 120000,
      monthlyDebts: 1000,
      downPayment: 60000,
      interestRate: 7.0,
      loanTerm: 30,
    });

    const expectedDTI = (1000 + result.monthlyPayment) / result.grossMonthlyIncome;
    expect(result.dtiRatio).toBeCloseTo(expectedDTI, 6);
  });

  it('should throw for annualIncome <= 0', () => {
    expect(() =>
      calculateAffordability({
        annualIncome: 0,
        monthlyDebts: 0,
        downPayment: 0,
        interestRate: 6.5,
        loanTerm: 30,
      }),
    ).toThrow('annualIncome must be greater than 0');
  });

  it('should throw for negative monthlyDebts', () => {
    expect(() =>
      calculateAffordability({
        annualIncome: 100000,
        monthlyDebts: -1,
        downPayment: 0,
        interestRate: 6.5,
        loanTerm: 30,
      }),
    ).toThrow('monthlyDebts must be >= 0');
  });

  it('should throw for interestRate > 15', () => {
    expect(() =>
      calculateAffordability({
        annualIncome: 100000,
        monthlyDebts: 0,
        downPayment: 0,
        interestRate: 16,
        loanTerm: 30,
      }),
    ).toThrow('interestRate must be between 0 and 15');
  });

  it('should throw for invalid loanTerm', () => {
    expect(() =>
      calculateAffordability({
        annualIncome: 100000,
        monthlyDebts: 0,
        downPayment: 0,
        interestRate: 6.5,
        loanTerm: 20 as 15 | 30,
      }),
    ).toThrow('loanTerm must be 15 or 30');
  });
});
