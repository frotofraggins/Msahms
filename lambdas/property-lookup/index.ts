/**
 * Lambda handler for the MesaHomes property lookup service.
 *
 * Handles two endpoints:
 *   POST /api/v1/property/lookup  — Full property lookup with comps + market data
 *   POST /api/v1/property/comps   — Standalone comps query by ZIP or subdivision
 *
 * Runtime: Node.js 20 | Memory: 512 MB | Timeout: 30s
 */

import { getCounty } from '../../lib/county-router.js';
import {
  normalizePropertyRecord,
  type NormalizedProperty,
} from '../../lib/property-normalizer.js';
import { getItem, putItem } from '../../lib/dynamodb.js';
import { normalizeAddressForKey } from '../../lib/s3.js';
import { countyGisCircuit, streetViewCircuit } from '../../lib/retry.js';
import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import { generatePropertyCacheKeys } from '../../lib/models/keys.js';
import type { MarketDataZip } from '../../lib/types/market.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import {
  queryPropertyByAddress,
  queryCompsBySubdivision,
  queryCompsByZip,
} from './gis-client.js';
import { getPropertyPhoto, type PropertyPhotoResult } from './street-view.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** API Gateway Lambda proxy integration event (minimal shape). */
interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
  requestContext?: { requestId?: string };
}

/** Combined property lookup response. */
export interface PropertyLookupResponse {
  property: NormalizedProperty;
  photo: { url: string; source: 'streetview' | 'placeholder' };
  comps: {
    subdivision: NormalizedProperty[];
    zip: NormalizedProperty[];
  };
  market: {
    zip: MarketDataZip | null;
    metro: Record<string, number>;
  };
}

/** Request body for POST /api/v1/property/lookup. */
interface LookupRequestBody {
  address: string;
  zip: string;
}

/** Request body for POST /api/v1/property/comps. */
interface CompsRequestBody {
  zip?: string;
  subdivision?: string;
  county?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CORS headers for all responses. */
const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

/** Cache TTL: 24 hours in seconds. */
const CACHE_TTL_SECONDS = 86400;

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

/**
 * Parse a raw address string into street number and street name.
 *
 * Expects formats like:
 *   "39669 N Luke Ln, San Tan Valley, AZ 85140"
 *   "850 S Drew St"
 *
 * Extracts the leading numeric portion as streetNum and the next
 * alphabetic word (skipping directional prefixes) as streetName.
 */
export function parseAddress(address: string): { streetNum: string; streetName: string } {
  const trimmed = address.trim();

  // Extract leading number
  const numMatch = trimmed.match(/^(\d+)/);
  const streetNum = numMatch ? numMatch[1] : '';

  // Remove the number and any leading whitespace
  const rest = trimmed.slice(streetNum.length).trim();

  // Split remaining into words, skip directional prefixes
  const directions = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']);
  const words = rest.split(/[\s,]+/).filter((w) => w.length > 0);

  let streetName = '';
  for (const word of words) {
    if (directions.has(word.toUpperCase())) continue;
    streetName = word.toUpperCase();
    break;
  }

  return { streetNum, streetName };
}

// ---------------------------------------------------------------------------
// Market data helpers
// ---------------------------------------------------------------------------

/**
 * Read ZIP-level market data from DynamoDB.
 */
async function getZipMarketData(zip: string): Promise<MarketDataZip | null> {
  const item = await getItem(`MARKET#ZIP#${zip}`, 'ZHVI#LATEST');
  if (!item?.data) return null;
  return item.data as unknown as MarketDataZip;
}

/**
 * Read metro-level market data from DynamoDB.
 *
 * Queries multiple metric LATEST records and returns a flat map
 * of metric name → value.
 */
async function getMetroMarketData(): Promise<Record<string, number>> {
  const metrics = [
    'medianSalePrice',
    'salesCount',
    'saleToList',
    'daysPending',
    'priceCuts',
    'inventory',
    'zori',
    'marketHeat',
    'zhvi',
    'zhvfGrowth',
    'newConstruction',
    'affordability',
  ];

  const result: Record<string, number> = {};

  for (const metric of metrics) {
    const item = await getItem(`MARKET#METRO#phoenix-mesa`, `${metric}#LATEST`);
    if (item?.data && typeof item.data['value'] === 'number') {
      result[metric] = item.data['value'] as number;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Lookup handler
// ---------------------------------------------------------------------------

/**
 * Handle POST /api/v1/property/lookup.
 *
 * Full flow:
 *   1. Parse address from request body
 *   2. Check DynamoDB cache
 *   3. Parse address → streetNum, streetName
 *   4. Route by ZIP to county
 *   5. Query GIS for property record
 *   6. Query subdivision comps (top 20)
 *   7. Query ZIP comps (top 50)
 *   8. Read market data from DynamoDB
 *   9. Get Street View photo
 *  10. Normalize and assemble response
 *  11. Cache in DynamoDB with 24h TTL
 *  12. Return combined response
 */
async function handleLookup(body: LookupRequestBody): Promise<PropertyLookupResponse> {
  const { address, zip } = body;
  const normalizedAddr = normalizeAddressForKey(address);

  // Step 2: Check DynamoDB cache
  const cacheKeys = generatePropertyCacheKeys(normalizedAddr);
  const cached = await getItem(cacheKeys.PK, cacheKeys.SK);

  if (cached?.data && cached.ttl && cached.ttl > Math.floor(Date.now() / 1000)) {
    console.log(`[property-lookup] Cache hit for: ${address}`);
    return cached.data as unknown as PropertyLookupResponse;
  }

  // Step 3–4: Parse address and route to county
  const { streetNum, streetName } = parseAddress(address);
  const county = getCounty(zip);

  console.log(`[property-lookup] Looking up ${streetNum} ${streetName} in ${county} county`);

  // Step 5: Query GIS for property record
  const propertyRecords = await countyGisCircuit.execute(() =>
    queryPropertyByAddress(streetNum, streetName, county),
  );

  if (propertyRecords.length === 0) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `No property found for address: ${address}`,
    );
  }

  const primaryRecord = propertyRecords[0];
  const property = normalizePropertyRecord(primaryRecord, county);

  // Step 6: Query subdivision comps
  let subdivisionComps: NormalizedProperty[] = [];
  if (property.subdivision) {
    const subdivisionRaw = await countyGisCircuit.execute(() =>
      queryCompsBySubdivision(property.subdivision!, county, 20),
    );
    subdivisionComps = subdivisionRaw.map((r) => normalizePropertyRecord(r, county));
  }

  // Step 7: Query ZIP comps
  const zipCompsRaw = await countyGisCircuit.execute(() =>
    queryCompsByZip(zip, county, 50),
  );
  const zipComps = zipCompsRaw.map((r) => normalizePropertyRecord(r, county));

  // Step 8: Read market data
  const [zipMarket, metroMarket] = await Promise.all([
    getZipMarketData(zip),
    getMetroMarketData(),
  ]);

  // Step 9: Get Street View photo
  let photo: PropertyPhotoResult;
  try {
    photo = await streetViewCircuit.execute(() => getPropertyPhoto(address, zip));
  } catch {
    console.warn(`[property-lookup] Street View failed for ${address}, using placeholder`);
    photo = { url: 'https://mesahomes.com/images/property-placeholder.jpg', source: 'placeholder' };
  }

  // Step 10: Assemble response
  const response: PropertyLookupResponse = {
    property,
    photo: { url: photo.url, source: photo.source },
    comps: {
      subdivision: subdivisionComps,
      zip: zipComps,
    },
    market: {
      zip: zipMarket,
      metro: metroMarket,
    },
  };

  // Step 11: Cache in DynamoDB
  const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS;
  await putItem({
    ...cacheKeys,
    entityType: EntityType.PROPERTY_CACHE,
    data: response as unknown as Record<string, unknown>,
    ttl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`[property-lookup] Cached response for: ${address} (TTL: ${CACHE_TTL_SECONDS}s)`);

  return response;
}

// ---------------------------------------------------------------------------
// Comps handler
// ---------------------------------------------------------------------------

/**
 * Handle POST /api/v1/property/comps.
 *
 * Accepts zip or subdivision + county and returns normalized comps.
 */
async function handleComps(
  body: CompsRequestBody,
): Promise<{ comps: NormalizedProperty[] }> {
  const { zip, subdivision, county: countyOverride } = body;

  if (subdivision && (zip || countyOverride)) {
    const county = countyOverride
      ? (countyOverride as 'pinal' | 'maricopa')
      : getCounty(zip!);

    const raw = await countyGisCircuit.execute(() =>
      queryCompsBySubdivision(subdivision, county, 20),
    );
    return { comps: raw.map((r) => normalizePropertyRecord(r, county)) };
  }

  if (zip) {
    const county = getCounty(zip);
    const raw = await countyGisCircuit.execute(() =>
      queryCompsByZip(zip, county, 50),
    );
    return { comps: raw.map((r) => normalizePropertyRecord(r, county)) };
  }

  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    'Either zip or subdivision is required',
  );
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the property-lookup function.
 *
 * Routes requests to the appropriate handler based on the path.
 */
export async function handler(event: APIGatewayEvent): Promise<LambdaProxyResponse> {
  const correlationId = event.requestContext?.requestId ?? generateCorrelationId();

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    if (!event.body) {
      throw new AppError(ErrorCode.MISSING_FIELD, 'Request body is required', correlationId);
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;
    const path = event.path;

    // POST /api/v1/property/lookup
    if (path.endsWith('/property/lookup')) {
      if (!body['address'] || typeof body['address'] !== 'string') {
        throw new AppError(ErrorCode.MISSING_FIELD, 'address is required', correlationId);
      }
      if (!body['zip'] || typeof body['zip'] !== 'string') {
        throw new AppError(ErrorCode.MISSING_FIELD, 'zip is required', correlationId);
      }

      const result = await handleLookup({
        address: body['address'] as string,
        zip: body['zip'] as string,
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    }

    // POST /api/v1/property/comps
    if (path.endsWith('/property/comps')) {
      if (!body['zip'] && !body['subdivision']) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Either zip or subdivision is required',
          correlationId,
        );
      }

      const result = await handleComps({
        zip: body['zip'] as string | undefined,
        subdivision: body['subdivision'] as string | undefined,
        county: body['county'] as string | undefined,
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    console.error('[property-lookup] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : 'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
