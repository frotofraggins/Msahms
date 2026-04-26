/**
 * Guided decision path definitions for the MesaHomes platform.
 *
 * Each path represents a sequence of tools a visitor should complete
 * based on their persona (seller, buyer, landlord, investor). Steps
 * are ordered — the engine walks the visitor through them one at a time.
 */

import type { GuidedPath } from '../types/scenario.js';

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

/** A single step in a guided decision path. */
export interface PathStep {
  /** Unique step identifier (matches tool slug). */
  id: string;
  /** Human-readable label shown in the progress indicator. */
  label: string;
  /** Route to the tool page. */
  href: string;
  /** Why this step matters — shown in the WhatsNextCard. */
  description: string;
}

// ---------------------------------------------------------------------------
// Path definitions
// ---------------------------------------------------------------------------

const sellerPath: readonly PathStep[] = [
  {
    id: 'home-value',
    label: 'Home Value',
    href: '/tools/home-value',
    description:
      'Find out what your home is worth in today\'s Mesa-area market so you can set a competitive asking price.',
  },
  {
    id: 'net-sheet',
    label: 'Net Sheet',
    href: '/tools/net-sheet',
    description:
      'See exactly how much you\'ll walk away with after commissions, closing costs, and mortgage payoff.',
  },
  {
    id: 'sell-now-or-wait',
    label: 'Sell Now or Wait',
    href: '/tools/sell-now-or-wait',
    description:
      'Compare selling now vs. waiting based on market trends, seasonality, and your personal timeline.',
  },
  {
    id: 'listing-prep',
    label: 'Listing Prep',
    href: '/sell/listing-prep',
    description:
      'Get a personalized checklist of repairs, staging tips, and photos that maximize your sale price.',
  },
  {
    id: 'flat-fee-or-full-service',
    label: 'Flat Fee or Full Service',
    href: '/compare/flat-fee-vs-traditional-agent',
    description:
      'Decide whether our flat-fee listing saves you money or if full-service agent support is the better fit.',
  },
] as const;

const buyerPath: readonly PathStep[] = [
  {
    id: 'affordability',
    label: 'Affordability',
    href: '/tools/affordability',
    description:
      'Calculate your monthly payment and max purchase price so you know your budget before you start looking.',
  },
  {
    id: 'first-time-guide',
    label: 'First-Time Guide',
    href: '/buy/first-time-buyer',
    description:
      'Walk through the home-buying process step by step — from pre-approval to closing day.',
  },
  {
    id: 'offer-guidance',
    label: 'Offer Guidance',
    href: '/buy/offer-guidance',
    description:
      'Learn how to structure a competitive offer in the Mesa market including contingencies and escalation clauses.',
  },
  {
    id: 'offer-writer',
    label: 'Offer Writer',
    href: '/tools/offer-writer',
    description:
      'Generate a draft offer letter with the right terms for your situation and the current market.',
  },
  {
    id: 'consult-or-full-service',
    label: 'Consult or Full Service',
    href: '/compare/flat-fee-vs-traditional-agent',
    description:
      'Choose between a one-time buyer consultation or full-service representation with a licensed agent.',
  },
] as const;

const landlordPath: readonly PathStep[] = [
  {
    id: 'rent-estimate',
    label: 'Rent Estimate',
    href: '/rent',
    description:
      'See what your property could rent for based on comparable rentals in your Mesa-area neighborhood.',
  },
  {
    id: 'pm-pain-points',
    label: 'PM Pain Points',
    href: '/rent',
    description:
      'Identify the biggest headaches of self-managing — late payments, maintenance calls, tenant screening.',
  },
  {
    id: 'pm-overview',
    label: 'PM Overview',
    href: '/rent',
    description:
      'Understand what a property manager handles and how it affects your net rental income.',
  },
  {
    id: 'pm-sub-or-consult',
    label: 'PM Subscribe or Consult',
    href: '/rent',
    description:
      'Decide between ongoing property management or a one-time landlord consultation.',
  },
] as const;

const investorPath: readonly PathStep[] = [
  {
    id: 'cash-flow-check',
    label: 'Cash Flow Check',
    href: '/invest',
    description:
      'Run the numbers on a potential investment property — rent, expenses, cap rate, and cash-on-cash return.',
  },
  {
    id: 'market-comparison',
    label: 'Market Comparison',
    href: '/invest',
    description:
      'Compare Mesa-area sub-markets to find the neighborhoods with the best investment fundamentals.',
  },
  {
    id: 'investment-consult',
    label: 'Investment Consult',
    href: '/invest',
    description:
      'Book a strategy session with a licensed agent who specializes in Mesa-area investment properties.',
  },
] as const;

// ---------------------------------------------------------------------------
// Path registry
// ---------------------------------------------------------------------------

/** Map of path type to its ordered step sequence. */
export const GUIDED_PATHS: Record<GuidedPath, readonly PathStep[]> = {
  seller: sellerPath,
  buyer: buyerPath,
  landlord: landlordPath,
  investor: investorPath,
} as const;

/** All valid path types. */
export const PATH_TYPES: readonly GuidedPath[] = ['seller', 'buyer', 'landlord', 'investor'];
