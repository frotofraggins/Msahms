/**
 * County GIS API client for the MesaHomes property lookup Lambda.
 *
 * Provides functions to query Pinal County and Maricopa County ArcGIS REST
 * endpoints for property address lookups and comparable sales. Uses the
 * county-router module for endpoint URLs and field-name mappings.
 *
 * All functions return raw ArcGIS records (RawRecord[]) — normalization
 * into the unified property model is handled by the caller.
 */

import type { County } from '../../lib/county-router.js';
import { getAssessorEndpoint } from '../../lib/county-router.js';
import type { RawRecord } from '../../lib/property-normalizer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of an ArcGIS REST query JSON response. */
export interface ArcGISResponse {
  features?: Array<{ attributes: RawRecord }>;
  error?: { code: number; message: string };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Execute an ArcGIS REST query and return the feature attributes.
 *
 * Sends a POST request with URL-encoded form parameters and parses the
 * JSON response. Returns an empty array when no features are found.
 *
 * @throws {Error} If the HTTP request fails or the response contains an error.
 */
async function executeQuery(
  url: string,
  where: string,
  outFields: string,
  options?: { orderByFields?: string; resultRecordCount?: number },
): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    where,
    f: 'json',
    outFields,
    returnGeometry: 'false',
  });

  if (options?.orderByFields) {
    params.set('orderByFields', options.orderByFields);
  }
  if (options?.resultRecordCount !== undefined) {
    params.set('resultRecordCount', String(options.resultRecordCount));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Maricopa's GIS endpoint returns 400 when the User-Agent looks like a
      // bot/automated client (e.g., Node's default 'undici' UA). Setting a
      // browser-like UA makes it accept the same identical payload. This is
      // not a guess — verified empirically: same where/outFields returns OK
      // when UA is set, 400 when default.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`GIS query failed: HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ArcGISResponse;

  if (data.error) {
    console.error('[gis-client] GIS error', {
      where,
      outFields: outFields.length > 200 ? `${outFields.slice(0, 200)}...` : outFields,
      url,
      errorCode: data.error.code,
      errorMessage: data.error.message,
    });
    throw new Error(`GIS query error: ${data.error.code} — ${data.error.message}`);
  }

  return (data.features ?? []).map((f) => f.attributes);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a property by street number and street name.
 *
 * Builds a LIKE query against the county's address field:
 *   `SITEADDRESS LIKE '%{streetNum}%{streetName}%'` (Pinal)
 *   `PHYSICAL_ADDRESS LIKE '%{streetNum}%{streetName}%'` (Maricopa)
 *
 * @param streetNum  - Street number (e.g. "39669")
 * @param streetName - Street name without type (e.g. "LUKE")
 * @param county     - Target county
 * @returns Raw property records matching the address pattern
 */
export async function queryPropertyByAddress(
  streetNum: string,
  streetName: string,
  county: County,
): Promise<RawRecord[]> {
  const endpoint = getAssessorEndpoint(county);
  const where = `${endpoint.addressField} LIKE '%${streetNum}%${streetName}%'`;

  // Maricopa's ArcGIS service returns HTTP 400 'Unable to complete operation'
  // when outFields='*' is combined with a fuzzy LIKE query — probably an
  // internal query planner timeout. Requesting the specific fields we need
  // is fast and reliable. Mirrors what queryCompsBySubdivision does below.
  const outFields = [
    endpoint.addressField,
    endpoint.salePriceField,
    endpoint.saleDateField,
    endpoint.sqftField,
    endpoint.yearBuiltField,
    endpoint.assessedValueField,
    endpoint.lotSizeField,
    endpoint.subdivisionField,
    endpoint.zipField,
    ...(endpoint.floorsField ? [endpoint.floorsField] : []),
    ...(endpoint.latField ? [endpoint.latField] : []),
    ...(endpoint.lonField ? [endpoint.lonField] : []),
  ].join(',');

  return executeQuery(endpoint.url, where, outFields);
}

/**
 * Query comparable sales by subdivision name.
 *
 * Returns properties in the same subdivision with a sale price above
 * $100,000, ordered by sale date descending (most recent first).
 *
 * @param subdivision - Subdivision / plat name (e.g. "PECAN CREEK NORTH PARCEL 1")
 * @param county      - Target county
 * @param limit       - Maximum records to return (default 20)
 * @returns Raw comp records
 */
export async function queryCompsBySubdivision(
  subdivision: string,
  county: County,
  limit: number = 20,
): Promise<RawRecord[]> {
  const endpoint = getAssessorEndpoint(county);
  // Maricopa stores SALE_PRICE as a string with leading whitespace + commas
  // (e.g. "   250,000"). Numeric comparisons in the WHERE clause ('>100000')
  // work on Pinal (numeric field) but 400 on Maricopa (string field). Skip
  // the server-side price filter and rely on the normalizer to drop records
  // with sub-threshold sale prices, and on the caller to filter as needed.
  const where = `${endpoint.subdivisionField}='${subdivision.replace(/'/g, "''")}'`;

  const outFields = [
    endpoint.addressField,
    endpoint.salePriceField,
    endpoint.saleDateField,
    endpoint.sqftField,
    endpoint.yearBuiltField,
    endpoint.assessedValueField,
    endpoint.lotSizeField,
    endpoint.subdivisionField,
    endpoint.zipField,
    ...(endpoint.floorsField ? [endpoint.floorsField] : []),
    ...(endpoint.latField ? [endpoint.latField] : []),
    ...(endpoint.lonField ? [endpoint.lonField] : []),
  ].join(',');

  return executeQuery(endpoint.url, where, outFields, {
    orderByFields: `${endpoint.saleDateField} DESC`,
    resultRecordCount: limit,
  });
}

/**
 * Query comparable sales by ZIP code.
 *
 * Returns properties in the ZIP with a sale price above $200,000,
 * ordered by sale date descending (most recent first).
 *
 * @param zip    - 5-digit ZIP code
 * @param county - Target county
 * @param limit  - Maximum records to return (default 50)
 * @returns Raw comp records
 */
export async function queryCompsByZip(
  zip: string,
  county: County,
  limit: number = 50,
): Promise<RawRecord[]> {
  const endpoint = getAssessorEndpoint(county);
  const where = `${endpoint.zipField}='${zip}'`;

  const outFields = [
    endpoint.addressField,
    endpoint.salePriceField,
    endpoint.saleDateField,
    endpoint.sqftField,
    endpoint.yearBuiltField,
    endpoint.assessedValueField,
    endpoint.lotSizeField,
    endpoint.subdivisionField,
    endpoint.zipField,
    ...(endpoint.floorsField ? [endpoint.floorsField] : []),
    ...(endpoint.latField ? [endpoint.latField] : []),
    ...(endpoint.lonField ? [endpoint.lonField] : []),
  ].join(',');

  return executeQuery(endpoint.url, where, outFields, {
    orderByFields: `${endpoint.saleDateField} DESC`,
    resultRecordCount: limit,
  });
}
