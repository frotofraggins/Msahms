/**
 * Frontend brokerage constants — mirrors lib/brokerage.ts from Kiro A's branch.
 *
 * When lib/brokerage.ts merges to main, this file should be updated to stay
 * in sync. The backend module is the source of truth.
 *
 * IMPORTANT: Do not publish syndication claims until the human confirms
 * license + ARMLS + broker-of-record are active.
 */

/** Portals that receive ARMLS MLS feed listings. */
export const SYNDICATION_PORTALS = [
  'Zillow',
  'Realtor.com',
  'Redfin',
  'Trulia',
  'Homes.com',
] as const;

/** Sentence listing the portals for use in marketing copy. */
export function portalsSentence(): string {
  const last = SYNDICATION_PORTALS[SYNDICATION_PORTALS.length - 1];
  const rest = SYNDICATION_PORTALS.slice(0, -1).join(', ');
  return `${rest}, and ${last}`;
}

/** Pre-launch message when listings are not yet active. */
export const PRE_LAUNCH_LISTING_MESSAGE =
  'MesaHomes flat-fee listings are coming soon. Leave your info and we\'ll notify you when we\'re live on the MLS.';

/** Whether the Stripe payment flow is enabled. Default false until license is active. */
export const LISTINGS_PAYMENT_ENABLED = process.env.NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED === 'true';
