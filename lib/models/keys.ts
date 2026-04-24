/**
 * DynamoDB key generation for all entity types in the mesahomes-main table.
 *
 * Each function produces the PK, SK, and optional GSI keys that match
 * the single-table design documented in the design doc.
 */

// ---------------------------------------------------------------------------
// Key interfaces
// ---------------------------------------------------------------------------

/** Base key set with PK and SK only. */
export interface BaseKeys {
  PK: string;
  SK: string;
}

/** Key set with PK, SK, and GSI1 keys. */
export interface KeysWithGSI1 extends BaseKeys {
  GSI1PK: string;
  GSI1SK: string;
}

// ---------------------------------------------------------------------------
// Agent keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for an Agent record.
 *
 * Key patterns:
 * - PK:     `AGENT#{agentId}`
 * - SK:     `AGENT#{agentId}`
 * - GSI1PK: `TEAM#{teamId}`
 * - GSI1SK: `AGENT#{agentId}`
 */
export function generateAgentKeys(agentId: string, teamId: string): KeysWithGSI1 {
  return {
    PK: `AGENT#${agentId}`,
    SK: `AGENT#${agentId}`,
    GSI1PK: `TEAM#${teamId}`,
    GSI1SK: `AGENT#${agentId}`,
  };
}

// ---------------------------------------------------------------------------
// Market data keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for a ZIP-level market data record.
 *
 * Key patterns:
 * - PK: `MARKET#ZIP#{zip}`
 * - SK: `ZHVI#{month}`
 */
export function generateMarketZipKeys(zip: string, month: string): BaseKeys {
  return {
    PK: `MARKET#ZIP#${zip}`,
    SK: `ZHVI#${month}`,
  };
}

/**
 * Generate DynamoDB keys for a metro-level market data record.
 *
 * Key patterns:
 * - PK: `MARKET#METRO#phoenix-mesa`
 * - SK: `{metric}#{month}`
 */
export function generateMarketMetroKeys(metric: string, month: string): BaseKeys {
  return {
    PK: `MARKET#METRO#phoenix-mesa`,
    SK: `${metric}#${month}`,
  };
}

// ---------------------------------------------------------------------------
// Property cache keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for a cached property lookup record.
 *
 * Key patterns:
 * - PK: `PROPERTY#{normalizedAddress}`
 * - SK: `LOOKUP`
 */
export function generatePropertyCacheKeys(normalizedAddress: string): BaseKeys {
  return {
    PK: `PROPERTY#${normalizedAddress}`,
    SK: `LOOKUP`,
  };
}

// ---------------------------------------------------------------------------
// Comps cache keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for cached comparable sales records.
 *
 * Key patterns:
 * - Subdivision comps: PK=`COMPS#SUB#{identifier}`, SK=`#{zip}`
 * - ZIP comps:         PK=`COMPS#ZIP#{identifier}`, SK=`LATEST`
 */
export function generateCompsCacheKeys(
  type: 'SUB' | 'ZIP',
  identifier: string,
  zip?: string,
): BaseKeys {
  if (type === 'SUB') {
    return {
      PK: `COMPS#SUB#${identifier}`,
      SK: `#${zip ?? ''}`,
    };
  }
  return {
    PK: `COMPS#ZIP#${identifier}`,
    SK: `LATEST`,
  };
}

// ---------------------------------------------------------------------------
// Blog post keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for a blog post record.
 *
 * Key patterns:
 * - PK:     `CONTENT#BLOG#{slug}`
 * - SK:     `CONTENT#BLOG#{slug}`
 * - GSI1PK: `CONTENT#BLOG`
 * - GSI1SK: `#{publishDate}`
 */
export function generateBlogPostKeys(slug: string, publishDate: string): KeysWithGSI1 {
  return {
    PK: `CONTENT#BLOG#${slug}`,
    SK: `CONTENT#BLOG#${slug}`,
    GSI1PK: `CONTENT#BLOG`,
    GSI1SK: `#${publishDate}`,
  };
}

// ---------------------------------------------------------------------------
// City page keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for a city page record.
 *
 * Key patterns:
 * - PK:     `CONTENT#CITY#{slug}`
 * - SK:     `CONTENT#CITY#{slug}`
 * - GSI1PK: `CONTENT#CITY`
 * - GSI1SK: `#{slug}`
 */
export function generateCityPageKeys(slug: string): KeysWithGSI1 {
  return {
    PK: `CONTENT#CITY#${slug}`,
    SK: `CONTENT#CITY#${slug}`,
    GSI1PK: `CONTENT#CITY`,
    GSI1SK: `#${slug}`,
  };
}

// ---------------------------------------------------------------------------
// Flat-fee listing keys
// ---------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for a flat-fee listing record.
 *
 * Key patterns:
 * - PK:     `LISTING#{listingId}`
 * - SK:     `LISTING#{listingId}`
 * - GSI1PK: `LISTING#STATUS#{status}`
 * - GSI1SK: `#{createdAt}`
 */
export function generateListingKeys(
  listingId: string,
  status: string,
  createdAt: string,
): KeysWithGSI1 {
  return {
    PK: `LISTING#${listingId}`,
    SK: `LISTING#${listingId}`,
    GSI1PK: `LISTING#STATUS#${status}`,
    GSI1SK: `#${createdAt}`,
  };
}

// ---------------------------------------------------------------------------
// Saved scenario keys
// ---------------------------------------------------------------------------

/** Key set for a scenario record, with optional visitor index keys. */
export interface ScenarioKeys extends BaseKeys {
  /** Visitor index PK (present when email is provided) */
  visitorPK?: string;
  /** Visitor index SK (present when email is provided) */
  visitorSK?: string;
}

/**
 * Generate DynamoDB keys for a saved scenario record.
 *
 * Key patterns:
 * - PK: `SCENARIO#{token}`
 * - SK: `SCENARIO#{token}`
 *
 * When email is provided, also generates visitor index keys:
 * - visitorPK: `VISITOR#{email}`
 * - visitorSK: `SCENARIO#{createdAt}`
 */
export function generateScenarioKeys(
  token: string,
  email?: string,
  createdAt?: string,
): ScenarioKeys {
  const keys: ScenarioKeys = {
    PK: `SCENARIO#${token}`,
    SK: `SCENARIO#${token}`,
  };

  if (email) {
    keys.visitorPK = `VISITOR#${email}`;
    keys.visitorSK = `SCENARIO#${createdAt ?? new Date().toISOString()}`;
  }

  return keys;
}
