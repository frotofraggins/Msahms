// Feature: mesahomes-lead-generation, Property 2: Affordability Calculator Mathematical Consistency

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAffordability,
  calculateMonthlyPayment,
  FRONT_END_DTI_LIMIT,
} from './affordability.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Annual income: $20,000 to $500,000. */
const annualIncomeArb = fc.double({ min: 20000, max: 500000, noNaN: true });

/** Monthly debts: $0 to $10,000. */
const monthlyDebtsArb = fc.double({ min: 0, max: 10000, noNaN: true });

/** Down payment: $0 to $200,000. */
const downPaymentArb = fc.double({ min: 0, max: 200000, noNaN: true });

/** Interest rate: 0.1% to 15% (avoid exact 0 for numerical stability). */
const interestRateArb = fc.double({ min: 0.1, max: 15, noNaN: true });

/** Loan term: 15 or 30 years. */
const loanTermArb: fc.Arbitrary<15 | 30> = fc.constantFrom(15 as const, 30 as const);

// ---------------------------------------------------------------------------
// Property 2: Affordability Calculator Mathematical Consistency
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 7.1, 7.3**
 *
 * For any valid combination of annual income (> 0), monthly debts (≥ 0),
 * down payment (≥ 0), interest rate (0–15%), and loan term (15 or 30 years),
 * the Affordability Calculator SHALL produce:
 *   (a) a maximum purchase price consistent with the computed monthly payment
 *   (b) a monthly payment that does not exceed 28% of gross monthly income
 *   (c) DTI = (monthly debts + monthly payment) / gross monthly income
 *   (d) three distinct mortgage scenarios with different parameter values
 */
describe('Property 2: Affordability Calculator Mathematical Consistency', () => {
  it('(a) max purchase price is consistent with monthly payment and loan terms', () => {
    fc.assert(
      fc.property(
        annualIncomeArb,
        monthlyDebtsArb,
        downPaymentArb,
        interestRateArb,
        loanTermArb,
        (annualIncome, monthlyDebts, downPayment, interestRate, loanTerm) => {
          const result = calculateAffordability({
            annualIncome,
            monthlyDebts,
            downPayment,
            interestRate,
            loanTerm,
          });

          // maxPurchasePrice = loanAmount + downPayment
          // monthlyPayment should correspond to the loan amount
          const loanAmount = result.maxPurchasePrice - downPayment;
          const expectedPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

          expect(result.monthlyPayment).toBeCloseTo(expectedPayment, 2);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('(b) monthly payment does not exceed 28% of gross monthly income', () => {
    fc.assert(
      fc.property(
        annualIncomeArb,
        monthlyDebtsArb,
        downPaymentArb,
        interestRateArb,
        loanTermArb,
        (annualIncome, monthlyDebts, downPayment, interestRate, loanTerm) => {
          const result = calculateAffordability({
            annualIncome,
            monthlyDebts,
            downPayment,
            interestRate,
            loanTerm,
          });

          const maxHousing = (annualIncome / 12) * FRONT_END_DTI_LIMIT;

          // Allow small floating-point tolerance
          expect(result.monthlyPayment).toBeLessThanOrEqual(maxHousing + 0.01);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('(c) DTI = (monthly debts + monthly payment) / gross monthly income', () => {
    fc.assert(
      fc.property(
        annualIncomeArb,
        monthlyDebtsArb,
        downPaymentArb,
        interestRateArb,
        loanTermArb,
        (annualIncome, monthlyDebts, downPayment, interestRate, loanTerm) => {
          const result = calculateAffordability({
            annualIncome,
            monthlyDebts,
            downPayment,
            interestRate,
            loanTerm,
          });

          const grossMonthly = annualIncome / 12;
          const expectedDTI = (monthlyDebts + result.monthlyPayment) / grossMonthly;

          expect(result.dtiRatio).toBeCloseTo(expectedDTI, 6);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('(d) three distinct mortgage scenarios with different parameter values', () => {
    fc.assert(
      fc.property(
        annualIncomeArb,
        monthlyDebtsArb,
        downPaymentArb,
        interestRateArb,
        loanTermArb,
        (annualIncome, monthlyDebts, downPayment, interestRate, loanTerm) => {
          const result = calculateAffordability({
            annualIncome,
            monthlyDebts,
            downPayment,
            interestRate,
            loanTerm,
          });

          // Must have exactly 3 scenarios
          expect(result.scenarios).toHaveLength(3);

          // All scenarios must have distinct labels
          const labels = result.scenarios.map((s) => s.label);
          const uniqueLabels = new Set(labels);
          expect(uniqueLabels.size).toBe(3);

          // Each scenario must have valid positive values
          for (const scenario of result.scenarios) {
            expect(scenario.maxPurchasePrice).toBeGreaterThan(0);
            expect(scenario.monthlyPayment).toBeGreaterThan(0);
            expect(scenario.loanAmount).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
