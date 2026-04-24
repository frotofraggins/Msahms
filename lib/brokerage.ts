/**
 * Brokerage configuration — single source of truth for broker-of-record,
 * syndication portals, and listing payment gating.
 *
 * Reads from environment variables at call time.
 * Supports both Lambda (BROKER_OF_RECORD_NAME) and Next.js static export
 * (NEXT_PUBLIC_BROKER_OF_RECORD_NAME) env var prefixes.
 *
 * Originally authored by Kiro A (commit 512f672 on agent/kiro-nflos-review).
 * Recreated here with NEXT_PUBLIC_ dual-read support per Kiro A's recommendation.
 */

// ---------------------------------------------------------------------------
// Syndication portals
// ---------------------------------------------------------------------------

/** Portals that receive ARMLS MLS feed listings. */
export const SYNDICATION_PORTALS = [
  'Zillow',
  'Realtor.com',
  'Redfin',
  'Trulia',
  'Homes.com',
] as const;

/** Sentence listing the portals for marketing copy. */
export function portalsSentence(): string {
  const last = SYNDICATION_PORTALS[SYNDICATION_PORTALS.length - 1];
  const rest = SYNDICATION_PORTALS.slice(0, -1).join(', ');
  return `${rest}, and ${last}`;
}

// ---------------------------------------------------------------------------
// Broker of record
// ---------------------------------------------------------------------------

export interface BrokerOfRecord {
  name: string;
  licenseNumber: string;
  brokerageName: string;
}

/**
 * Read env var with fallback to NEXT_PUBLIC_ prefix.
 * Lambda uses BROKER_OF_RECORD_NAME; Next.js static export uses NEXT_PUBLIC_BROKER_OF_RECORD_NAME.
 */
function env(key: string): string | undefined {
  return process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`];
}

/**
 * Get broker-of-record config from environment.
 * Returns the broker info or null if not configured.
 */
export function tryGetBrokerOfRecord(): BrokerOfRecord | null {
  const name = env('BROKER_OF_RECORD_NAME');
  const license = env('BROKER_OF_RECORD_LICENSE');
  const brokerage = env('BROKER_OF_RECORD_BROKERAGE');

  if (!name || !license) return null;

  return {
    name,
    licenseNumber: license,
    brokerageName: brokerage ?? 'MesaHomes',
  };
}

/**
 * Get broker-of-record config. Throws if not configured.
 */
export function getBrokerOfRecord(): BrokerOfRecord {
  const broker = tryGetBrokerOfRecord();
  if (!broker) {
    throw new Error(
      'Broker of record not configured. Set BROKER_OF_RECORD_NAME and BROKER_OF_RECORD_LICENSE environment variables.',
    );
  }
  return broker;
}

// ---------------------------------------------------------------------------
// Listing payment gating
// ---------------------------------------------------------------------------

/** Pre-launch message when listings are not yet active. */
export const PRE_LAUNCH_LISTING_MESSAGE =
  'MesaHomes flat-fee listings are coming soon. Leave your info and we\'ll notify you when we\'re live on the MLS.';

/**
 * Whether the Stripe payment flow is enabled.
 * Default false until license + ARMLS + broker-of-record are active.
 */
export function listingsPaymentEnabled(): boolean {
  const val = env('LISTINGS_PAYMENT_ENABLED');
  return val === 'true';
}
