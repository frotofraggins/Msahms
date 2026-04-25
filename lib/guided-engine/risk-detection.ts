/**
 * Risk detection for the MesaHomes guided decision engine.
 *
 * Scans tool results for indicators that suggest the visitor's situation
 * is complex enough to benefit from full-service agent support. Risk
 * detection triggers a Full Service Upgrade modal with an explanation —
 * it is NOT a hard block. The visitor can always proceed.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Severity level for a detected risk. */
export type RiskSeverity = 'low' | 'medium' | 'high';

/** A single risk indicator detected from tool results. */
export interface RiskIndicator {
  /** Machine-readable risk type. */
  type: string;
  /** How serious this risk is. */
  severity: RiskSeverity;
  /** Human-readable explanation shown to the visitor. */
  explanation: string;
  /** Whether this risk should trigger the Full Service Upgrade modal. */
  suggestFullService: boolean;
}

/** Shape of tool results the risk detector inspects. */
export interface ToolResultsForRisk {
  /** Estimated sale price or home value. */
  salePrice?: number;
  /** Outstanding mortgage balance. */
  mortgageBalance?: number;
  /** Free-text notes from the visitor. */
  notes?: string;
  /** Whether the property has existing tenants. */
  hasTenants?: boolean;
  /** Whether this is an investment property analysis. */
  isInvestment?: boolean;
  /** Down payment percentage (0–100). */
  downPaymentPercent?: number;
  /** Whether the visitor is a first-time buyer. */
  isFirstTimeBuyer?: boolean;
  /** Allow additional fields from tool results. */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Risk detection
// ---------------------------------------------------------------------------

/**
 * Analyze tool results and return an array of risk indicators.
 *
 * Returns an empty array when no risk indicators are present.
 * Each risk includes a human-readable explanation and a flag indicating
 * whether the Full Service Upgrade modal should be shown.
 */
export function detectRisks(toolResults: ToolResultsForRisk): RiskIndicator[] {
  const risks: RiskIndicator[] = [];

  // Short sale: mortgage exceeds sale price
  if (
    typeof toolResults.mortgageBalance === 'number' &&
    typeof toolResults.salePrice === 'number' &&
    toolResults.mortgageBalance > toolResults.salePrice
  ) {
    risks.push({
      type: 'short-sale',
      severity: 'high',
      explanation:
        'Your mortgage balance exceeds the estimated sale price. This is a short sale situation that requires lender approval and specialized negotiation.',
      suggestFullService: true,
    });
  }

  // Estate sale: keyword detected in notes
  if (
    typeof toolResults.notes === 'string' &&
    /\b(estate\s+sale|probate|inherited|deceased|trust\s+sale)\b/i.test(toolResults.notes)
  ) {
    risks.push({
      type: 'estate-sale',
      severity: 'high',
      explanation:
        'Estate and probate sales involve legal requirements, court approvals, and title complexities that benefit from professional guidance.',
      suggestFullService: true,
    });
  }

  // Investment with tenants
  if (toolResults.isInvestment && toolResults.hasTenants) {
    risks.push({
      type: 'investment-with-tenants',
      severity: 'medium',
      explanation:
        'Selling or managing an investment property with existing tenants requires careful handling of lease agreements, tenant rights, and Arizona landlord-tenant law.',
      suggestFullService: true,
    });
  }

  // First-time buyer with low down payment
  if (
    toolResults.isFirstTimeBuyer &&
    typeof toolResults.downPaymentPercent === 'number' &&
    toolResults.downPaymentPercent < 5
  ) {
    risks.push({
      type: 'low-down-payment',
      severity: 'medium',
      explanation:
        'With less than 5% down, you\'ll need PMI and may face stricter lender requirements. A full-service agent can help you navigate loan programs and negotiate seller concessions.',
      suggestFullService: true,
    });
  }

  return risks;
}
