/**
 * Brokerage constants — broker of record, ARMLS ID, syndication portals.
 *
 * Single source of truth for everything tied to our legal ability to list
 * property on the MLS. Reads broker-of-record identity from environment so
 * the same build can be used in dev/stage/prod with different brokerages
 * (or left unset pre-launch).
 *
 * Why this lives in lib/: every Lambda that emits marketing copy (listing
 * service, leads capture, content API) needs consistent broker naming and
 * the same portal list. Drift across Lambdas = legal exposure.
 *
 * See .kiro/specs/mls-syndication-messaging.md for full context.
 */

// ---------------------------------------------------------------------------
// Portal syndication list
// ---------------------------------------------------------------------------

/**
 * Canonical list of portals we claim syndication to in marketing copy.
 * Only edit this when an MLS feed-consumer relationship actually changes.
 *
 * These are the portals that pull from ARMLS (Arizona Regional MLS) as a
 * standard MLS data consumer. Do not add a portal here unless it actually
 * receives the ARMLS feed.
 */
export const SYNDICATION_PORTALS: readonly string[] = Object.freeze([
  'Zillow',
  'Realtor.com',
  'Redfin',
  'Trulia',
  'Homes.com',
]);

/** Full human-readable list for marketing copy. */
export function portalsSentence(): string {
  if (SYNDICATION_PORTALS.length === 0) return '';
  if (SYNDICATION_PORTALS.length === 1) return SYNDICATION_PORTALS[0] ?? '';
  const last = SYNDICATION_PORTALS[SYNDICATION_PORTALS.length - 1];
  const rest = SYNDICATION_PORTALS.slice(0, -1);
  return `${rest.join(', ')}, and ${last}`;
}

// ---------------------------------------------------------------------------
// Broker of record
// ---------------------------------------------------------------------------

/**
 * Broker of record identity, sourced from environment. Required for any
 * outgoing MLS submission or public marketing claim about our listings.
 */
export interface BrokerOfRecord {
  /** Legal brokerage or broker name displayed in disclosures. */
  name: string;
  /** Arizona Department of Real Estate license number. */
  licenseNumber: string;
  /** ARMLS subscriber ID. */
  armlsId: string;
}

/**
 * Read the broker of record from environment. Throws if any field is
 * missing — we never want a Lambda submitting to MLS or rendering
 * disclosure copy with a placeholder.
 *
 * @throws Error if BROKER_OF_RECORD_NAME, BROKER_OF_RECORD_LICENSE, or
 *   BROKER_OF_RECORD_ARMLS_ID is missing.
 */
export function getBrokerOfRecord(): BrokerOfRecord {
  const name = process.env['BROKER_OF_RECORD_NAME'];
  const licenseNumber = process.env['BROKER_OF_RECORD_LICENSE'];
  const armlsId = process.env['BROKER_OF_RECORD_ARMLS_ID'];
  const missing: string[] = [];
  if (!name) missing.push('BROKER_OF_RECORD_NAME');
  if (!licenseNumber) missing.push('BROKER_OF_RECORD_LICENSE');
  if (!armlsId) missing.push('BROKER_OF_RECORD_ARMLS_ID');
  if (missing.length > 0) {
    throw new Error(
      `Broker of record env vars missing: ${missing.join(', ')}. Set these in the Lambda environment before enabling listing features.`,
    );
  }
  return {
    name: name as string,
    licenseNumber: licenseNumber as string,
    armlsId: armlsId as string,
  };
}

/**
 * Non-throwing variant for UI paths that want a safe fallback rather
 * than an exception (e.g. rendering the footer during pre-launch).
 */
export function tryGetBrokerOfRecord(): BrokerOfRecord | null {
  try {
    return getBrokerOfRecord();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Listing payment gate
// ---------------------------------------------------------------------------

/**
 * Returns true when the human owner has confirmed license + ARMLS +
 * broker-of-record are all active, AND flipped the env flag. Default
 * false — the listing-service Lambda's payment endpoint MUST respect
 * this flag and return 503 UPSTREAM_UNAVAILABLE when false.
 *
 * This is intentionally a runtime env check, not a build-time constant,
 * so the owner can flip it without redeploying.
 */
export function listingsPaymentEnabled(): boolean {
  return process.env['LISTINGS_PAYMENT_ENABLED'] === 'true';
}

/**
 * Text to show in pre-launch copy when payment is disabled.
 * Keeps users in the funnel via Full Service Upgrade capture.
 */
export const PRE_LAUNCH_LISTING_MESSAGE =
  'Flat-fee listings launching soon. Book a free consultation with a licensed Arizona agent to get started.';
