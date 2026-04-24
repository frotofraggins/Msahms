/**
 * Buyer Affordability Calculator for the MesaHomes platform.
 *
 * Computes maximum purchase price based on 28% front-end DTI rule,
 * estimated monthly payment, DTI ratio, and generates 3 mortgage scenarios.
 *
 * Runtime: Pure computation — no external API calls, sub-second response.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for the affordability calculation. */
export interface AffordabilityInput {
  /** Annual gross income (must be > 0) */
  annualIncome: number;
  /** Total monthly debt payments excluding housing (must be >= 0) */
  monthlyDebts: number;
  /** Down payment amount in dollars (must be >= 0) */
  downPayment: number;
  /** Annual interest rate as a percentage, e.g. 6.5 for 6.5% (0–15) */
  interestRate: number;
  /** Loan term in years (15 or 30) */
  loanTerm: 15 | 30;
}

/** A single mortgage scenario result. */
export interface MortgageScenario {
  /** Scenario label */
  label: string;
  /** Down payment used */
  downPayment: number;
  /** Interest rate used (percentage) */
  interestRate: number;
  /** Loan term in years */
  loanTerm: number;
  /** Maximum purchase price */
  maxPurchasePrice: number;
  /** Estimated monthly payment (P&I only) */
  monthlyPayment: number;
  /** Loan amount (purchase price - down payment) */
  loanAmount: number;
}

/** Full affordability calculator response. */
export interface AffordabilityResponse {
  /** Maximum purchase price based on inputs */
  maxPurchasePrice: number;
  /** Estimated monthly mortgage payment (P&I) */
  monthlyPayment: number;
  /** Debt-to-income ratio as a decimal (e.g. 0.35 for 35%) */
  dtiRatio: number;
  /** Gross monthly income */
  grossMonthlyIncome: number;
  /** Maximum monthly housing payment (28% of gross monthly) */
  maxMonthlyHousingPayment: number;
  /** Three mortgage scenarios with varying parameters */
  scenarios: MortgageScenario[];
  /** Arizona down payment assistance program links */
  dpaPrograms: DPAProgram[];
}

/** Arizona down payment assistance program info. */
export interface DPAProgram {
  name: string;
  description: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Front-end DTI limit (28% of gross monthly income for housing). */
export const FRONT_END_DTI_LIMIT = 0.28;

/** Arizona DPA programs. */
export const AZ_DPA_PROGRAMS: DPAProgram[] = [
  {
    name: 'Arizona Home Plus',
    description: 'Up to 5% DPA for FHA, VA, USDA, and conventional loans',
    url: 'https://www.arizonahousing.com/home-plus',
  },
  {
    name: 'Pathway to Purchase',
    description: 'Up to $20,000 in DPA for eligible homebuyers in targeted areas',
    url: 'https://www.arizonahousing.com/pathway-to-purchase',
  },
  {
    name: 'Home in Five Advantage',
    description: 'Maricopa County program with up to 5% DPA grant',
    url: 'https://www.homeinfive.org/',
  },
];

// ---------------------------------------------------------------------------
// Calculation helpers
// ---------------------------------------------------------------------------

/**
 * Calculate monthly mortgage payment (principal & interest) using the
 * standard amortization formula.
 *
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * Where:
 *   P = loan principal
 *   r = monthly interest rate (annual rate / 12)
 *   n = total number of payments (years * 12)
 *
 * If rate is 0, returns P / n (simple division).
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const factor = Math.pow(1 + monthlyRate, numPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate maximum loan amount given a maximum monthly payment,
 * interest rate, and term.
 *
 * Inverse of the amortization formula:
 *   P = M * [(1+r)^n - 1] / [r(1+r)^n]
 */
export function calculateMaxLoanAmount(
  maxMonthlyPayment: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (maxMonthlyPayment <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return maxMonthlyPayment * numPayments;
  }

  const factor = Math.pow(1 + monthlyRate, numPayments);
  return maxMonthlyPayment * (factor - 1) / (monthlyRate * factor);
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Calculate buyer affordability with 3 mortgage scenarios.
 *
 * @throws {Error} if inputs are out of valid range
 */
export function calculateAffordability(input: AffordabilityInput): AffordabilityResponse {
  const { annualIncome, monthlyDebts, downPayment, interestRate, loanTerm } = input;

  if (annualIncome <= 0) {
    throw new Error('annualIncome must be greater than 0');
  }
  if (monthlyDebts < 0) {
    throw new Error('monthlyDebts must be >= 0');
  }
  if (downPayment < 0) {
    throw new Error('downPayment must be >= 0');
  }
  if (interestRate < 0 || interestRate > 15) {
    throw new Error('interestRate must be between 0 and 15');
  }
  if (loanTerm !== 15 && loanTerm !== 30) {
    throw new Error('loanTerm must be 15 or 30');
  }

  const grossMonthlyIncome = annualIncome / 12;
  const maxMonthlyHousingPayment = grossMonthlyIncome * FRONT_END_DTI_LIMIT;

  // Max loan amount based on max monthly housing payment
  const maxLoanAmount = calculateMaxLoanAmount(maxMonthlyHousingPayment, interestRate, loanTerm);
  const maxPurchasePrice = maxLoanAmount + downPayment;

  // Actual monthly payment for the max loan
  const monthlyPayment = calculateMonthlyPayment(maxLoanAmount, interestRate, loanTerm);

  // DTI ratio = (monthly debts + housing payment) / gross monthly income
  const dtiRatio = (monthlyDebts + monthlyPayment) / grossMonthlyIncome;

  // Generate 3 scenarios
  const scenarios = generateScenarios(input, maxMonthlyHousingPayment);

  return {
    maxPurchasePrice,
    monthlyPayment,
    dtiRatio,
    grossMonthlyIncome,
    maxMonthlyHousingPayment,
    scenarios,
    dpaPrograms: AZ_DPA_PROGRAMS,
  };
}

/**
 * Generate 3 distinct mortgage scenarios by varying parameters.
 *
 * Scenario 1: Base case (user's inputs)
 * Scenario 2: Higher down payment (+20%)
 * Scenario 3: Different loan term (swap 15↔30)
 */
function generateScenarios(
  input: AffordabilityInput,
  maxMonthlyHousingPayment: number,
): MortgageScenario[] {
  const { downPayment, interestRate, loanTerm } = input;

  // Scenario 1: Base case
  const baseLoan = calculateMaxLoanAmount(maxMonthlyHousingPayment, interestRate, loanTerm);
  const basePrice = baseLoan + downPayment;
  const basePayment = calculateMonthlyPayment(baseLoan, interestRate, loanTerm);

  const scenario1: MortgageScenario = {
    label: 'Your scenario',
    downPayment,
    interestRate,
    loanTerm,
    maxPurchasePrice: basePrice,
    monthlyPayment: basePayment,
    loanAmount: baseLoan,
  };

  // Scenario 2: Higher down payment (+20% or +$10,000, whichever is larger)
  const higherDown = downPayment + Math.max(downPayment * 0.2, 10000);
  const higherDownLoan = calculateMaxLoanAmount(maxMonthlyHousingPayment, interestRate, loanTerm);
  const higherDownPrice = higherDownLoan + higherDown;
  const higherDownPayment = calculateMonthlyPayment(higherDownLoan, interestRate, loanTerm);

  const scenario2: MortgageScenario = {
    label: 'Higher down payment',
    downPayment: higherDown,
    interestRate,
    loanTerm,
    maxPurchasePrice: higherDownPrice,
    monthlyPayment: higherDownPayment,
    loanAmount: higherDownLoan,
  };

  // Scenario 3: Different loan term (swap 15↔30)
  const altTerm = loanTerm === 30 ? 15 : 30;
  const altLoan = calculateMaxLoanAmount(maxMonthlyHousingPayment, interestRate, altTerm);
  const altPrice = altLoan + downPayment;
  const altPayment = calculateMonthlyPayment(altLoan, interestRate, altTerm);

  const scenario3: MortgageScenario = {
    label: altTerm === 15 ? '15-year fixed' : '30-year fixed',
    downPayment,
    interestRate,
    loanTerm: altTerm,
    maxPurchasePrice: altPrice,
    monthlyPayment: altPayment,
    loanAmount: altLoan,
  };

  return [scenario1, scenario2, scenario3];
}
