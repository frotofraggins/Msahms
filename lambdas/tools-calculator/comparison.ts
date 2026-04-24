/**
 * Flat-Fee vs Traditional Commission Comparison for the MesaHomes platform.
 *
 * Computes total costs under each model and dollar savings for the seller.
 *
 * Runtime: Pure computation — no external API calls, sub-second response.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for the comparison calculation. */
export interface ComparisonInput {
  /** Estimated sale price (must be > 0) */
  estimatedSalePrice: number;
}

/** Cost breakdown for one service model. */
export interface ServiceCostBreakdown {
  /** Service model label */
  model: 'flat-fee' | 'traditional';
  /** Seller-side commission or fee */
  sellerCommission: number;
  /** Buyer agent commission */
  buyerAgentCommission: number;
  /** Broker transaction fee (flat-fee only, $0 for traditional) */
  brokerFee: number;
  /** Total cost to the seller */
  totalCost: number;
  /** Description of what's included */
  servicesIncluded: string[];
}

/** Full comparison response. */
export interface ComparisonResponse {
  /** Estimated sale price used */
  estimatedSalePrice: number;
  /** Flat-fee model cost breakdown */
  flatFee: ServiceCostBreakdown;
  /** Traditional model cost breakdown */
  traditional: ServiceCostBreakdown;
  /** Dollar savings (traditional total - flat-fee total) */
  savings: number;
  /** Savings as a percentage of sale price */
  savingsPercent: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Flat listing fee for flat-fee service (seller side). */
export const FLAT_FEE_AMOUNT = 999;

/** Broker transaction fee for flat-fee service. */
export const BROKER_FEE = 400;

/** Buyer agent commission rate (2.5%). */
export const BUYER_AGENT_RATE = 0.025;

/** Traditional seller agent commission rate (3%). */
export const TRADITIONAL_SELLER_RATE = 0.03;

/** Traditional buyer agent commission rate (2.5–3%, we use 2.5% for comparison). */
export const TRADITIONAL_BUYER_RATE = 0.025;

/** Services included in flat-fee listing. */
export const FLAT_FEE_SERVICES: string[] = [
  'MLS listing placement',
  'Professional photo guidance',
  'Showing coordination',
  'Contract review',
  'Closing coordination support',
  'Yard sign and lockbox',
];

/** Services included in traditional full-service listing. */
export const TRADITIONAL_SERVICES: string[] = [
  'Full agent representation',
  'Comparative market analysis',
  'Professional photography',
  'Staging advice and coordination',
  'Pricing strategy',
  'Marketing and advertising',
  'Showing management',
  'Offer negotiation',
  'Contract management',
  'Closing coordination',
];

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate flat-fee vs traditional commission comparison.
 *
 * @throws {Error} if estimatedSalePrice <= 0
 */
export function calculateComparison(input: ComparisonInput): ComparisonResponse {
  const { estimatedSalePrice } = input;

  if (estimatedSalePrice <= 0) {
    throw new Error('estimatedSalePrice must be greater than 0');
  }

  // Flat-fee model
  const flatFeeSellerCommission = FLAT_FEE_AMOUNT;
  const flatFeeBuyerCommission = estimatedSalePrice * BUYER_AGENT_RATE;
  const flatFeeBrokerFee = BROKER_FEE;
  const flatFeeTotalCost = flatFeeSellerCommission + flatFeeBuyerCommission + flatFeeBrokerFee;

  const flatFee: ServiceCostBreakdown = {
    model: 'flat-fee',
    sellerCommission: flatFeeSellerCommission,
    buyerAgentCommission: flatFeeBuyerCommission,
    brokerFee: flatFeeBrokerFee,
    totalCost: flatFeeTotalCost,
    servicesIncluded: FLAT_FEE_SERVICES,
  };

  // Traditional model
  const traditionalSellerCommission = estimatedSalePrice * TRADITIONAL_SELLER_RATE;
  const traditionalBuyerCommission = estimatedSalePrice * TRADITIONAL_BUYER_RATE;
  const traditionalTotalCost = traditionalSellerCommission + traditionalBuyerCommission;

  const traditional: ServiceCostBreakdown = {
    model: 'traditional',
    sellerCommission: traditionalSellerCommission,
    buyerAgentCommission: traditionalBuyerCommission,
    brokerFee: 0,
    totalCost: traditionalTotalCost,
    servicesIncluded: TRADITIONAL_SERVICES,
  };

  const savings = traditionalTotalCost - flatFeeTotalCost;
  const savingsPercent = (savings / estimatedSalePrice) * 100;

  return {
    estimatedSalePrice,
    flatFee,
    traditional,
    savings,
    savingsPercent,
  };
}
