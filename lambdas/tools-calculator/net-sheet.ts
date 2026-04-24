/**
 * Seller Net Sheet Calculator for the MesaHomes platform.
 *
 * Computes estimated net proceeds from a home sale after all deductions,
 * with side-by-side comparison of flat-fee vs traditional commission models.
 *
 * Runtime: Pure computation — no external API calls, sub-second response.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Service type for commission calculation. */
export type ServiceType = 'flat-fee' | 'traditional';

/** Input parameters for the net sheet calculation. */
export interface NetSheetInput {
  /** Estimated sale price (must be > 0) */
  salePrice: number;
  /** Outstanding mortgage balance (must be >= 0) */
  outstandingMortgage: number;
  /** Service type: flat-fee or traditional */
  serviceType: ServiceType;
}

/** A single line-item deduction. */
export interface DeductionItem {
  /** Human-readable label */
  label: string;
  /** Dollar amount of the deduction */
  amount: number;
  /** Description of how the deduction is calculated */
  description: string;
}

/** Result of a net sheet calculation for one service type. */
export interface NetSheetResult {
  /** Service type used for this calculation */
  serviceType: ServiceType;
  /** Sale price used */
  salePrice: number;
  /** Itemized deduction line items */
  deductions: DeductionItem[];
  /** Sum of all deductions */
  totalDeductions: number;
  /** Net proceeds = salePrice - totalDeductions */
  netProceeds: number;
}

/** Full net sheet response with side-by-side comparison. */
export interface NetSheetResponse {
  /** Result for the requested service type */
  primary: NetSheetResult;
  /** Side-by-side comparison: flat-fee vs traditional */
  comparison: {
    flatFee: NetSheetResult;
    traditional: NetSheetResult;
    savings: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Flat listing fee for flat-fee service (seller side). */
export const FLAT_FEE_AMOUNT = 999;

/** Traditional seller agent commission rate (3% of sale price). */
export const TRADITIONAL_SELLER_COMMISSION_RATE = 0.03;

/** Buyer agent commission rate (2.5% of sale price, both service types). */
export const BUYER_AGENT_COMMISSION_RATE = 0.025;

/** Broker transaction fee for flat-fee service only. */
export const BROKER_TRANSACTION_FEE = 400;

/** Title and escrow fee rate (0.5% of sale price). */
export const TITLE_ESCROW_RATE = 0.005;

/** Arizona transfer tax rate (0.1% of sale price). */
export const TRANSFER_TAX_RATE = 0.001;

/** Arizona property tax rate (0.68% annually). */
export const PROPERTY_TAX_RATE = 0.0068;

/** Number of months for prorated property tax calculation. */
export const PRORATED_TAX_MONTHS = 6;

/** Estimated repair credits rate (1% of sale price). */
export const REPAIR_CREDITS_RATE = 0.01;

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/**
 * Compute deductions for a given sale price, mortgage, and service type.
 */
export function computeDeductions(
  salePrice: number,
  outstandingMortgage: number,
  serviceType: ServiceType,
): DeductionItem[] {
  const deductions: DeductionItem[] = [];

  // Agent commission (seller side)
  if (serviceType === 'flat-fee') {
    deductions.push({
      label: 'Seller Agent Fee (Flat Fee)',
      amount: FLAT_FEE_AMOUNT,
      description: `Flat listing fee of $${FLAT_FEE_AMOUNT}`,
    });
  } else {
    const commission = salePrice * TRADITIONAL_SELLER_COMMISSION_RATE;
    deductions.push({
      label: 'Seller Agent Commission',
      amount: commission,
      description: `${(TRADITIONAL_SELLER_COMMISSION_RATE * 100).toFixed(1)}% of sale price`,
    });
  }

  // Buyer agent commission (both service types)
  const buyerCommission = salePrice * BUYER_AGENT_COMMISSION_RATE;
  deductions.push({
    label: 'Buyer Agent Commission',
    amount: buyerCommission,
    description: `${(BUYER_AGENT_COMMISSION_RATE * 100).toFixed(1)}% of sale price`,
  });

  // Broker transaction fee (flat-fee only)
  if (serviceType === 'flat-fee') {
    deductions.push({
      label: 'Broker Transaction Fee',
      amount: BROKER_TRANSACTION_FEE,
      description: `Flat broker fee of $${BROKER_TRANSACTION_FEE}`,
    });
  }

  // Title and escrow
  const titleEscrow = salePrice * TITLE_ESCROW_RATE;
  deductions.push({
    label: 'Title & Escrow Fees',
    amount: titleEscrow,
    description: `${(TITLE_ESCROW_RATE * 100).toFixed(1)}% of sale price`,
  });

  // Transfer taxes (Arizona)
  const transferTaxes = salePrice * TRANSFER_TAX_RATE;
  deductions.push({
    label: 'Transfer Taxes',
    amount: transferTaxes,
    description: `${(TRANSFER_TAX_RATE * 100).toFixed(1)}% of sale price (Arizona)`,
  });

  // Prorated property taxes (6 months)
  const proratedTaxes = (salePrice * PROPERTY_TAX_RATE / 12) * PRORATED_TAX_MONTHS;
  deductions.push({
    label: 'Prorated Property Taxes',
    amount: proratedTaxes,
    description: `${(PROPERTY_TAX_RATE * 100).toFixed(2)}% annual rate, ${PRORATED_TAX_MONTHS} months prorated`,
  });

  // Mortgage payoff
  deductions.push({
    label: 'Mortgage Payoff',
    amount: outstandingMortgage,
    description: 'Outstanding mortgage balance',
  });

  // Estimated repair credits
  const repairCredits = salePrice * REPAIR_CREDITS_RATE;
  deductions.push({
    label: 'Estimated Repair Credits',
    amount: repairCredits,
    description: `${(REPAIR_CREDITS_RATE * 100).toFixed(0)}% of sale price`,
  });

  return deductions;
}

/**
 * Build a NetSheetResult from deductions.
 */
function buildResult(
  salePrice: number,
  outstandingMortgage: number,
  serviceType: ServiceType,
): NetSheetResult {
  const deductions = computeDeductions(salePrice, outstandingMortgage, serviceType);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netProceeds = salePrice - totalDeductions;

  return {
    serviceType,
    salePrice,
    deductions,
    totalDeductions,
    netProceeds,
  };
}

/**
 * Calculate the full seller net sheet with side-by-side comparison.
 *
 * @throws {Error} if salePrice <= 0 or outstandingMortgage < 0
 */
export function calculateNetSheet(input: NetSheetInput): NetSheetResponse {
  const { salePrice, outstandingMortgage, serviceType } = input;

  if (salePrice <= 0) {
    throw new Error('salePrice must be greater than 0');
  }
  if (outstandingMortgage < 0) {
    throw new Error('outstandingMortgage must be >= 0');
  }

  const primary = buildResult(salePrice, outstandingMortgage, serviceType);
  const flatFee = buildResult(salePrice, outstandingMortgage, 'flat-fee');
  const traditional = buildResult(salePrice, outstandingMortgage, 'traditional');
  const savings = traditional.totalDeductions - flatFee.totalDeductions;

  return {
    primary,
    comparison: {
      flatFee,
      traditional,
      savings,
    },
  };
}
