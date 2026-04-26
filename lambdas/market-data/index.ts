/**
 * Lambda handler for the MesaHomes market-data service.
 *
 * Routes requests to the correct market data query:
 *   GET /api/v1/market/zip/{zip}  → ZIP-level ZHVI data
 *   GET /api/v1/market/metro      → Metro-level market metrics
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 5s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import { getItem, queryByPK } from '../../lib/dynamodb.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** API Gateway Lambda proxy integration event (minimal shape). */
interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
  pathParameters?: Record<string, string | undefined> | null;
  requestContext?: { requestId?: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/market/zip/{zip} — ZIP-level market data.
 *
 * Reads ZHVI, trend, previous month from DynamoDB:
 *   PK: MARKET#ZIP#{zip}, SK: ZHVI#LATEST
 */
async function handleMarketZip(
  zip: string,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  if (!/^\d{5}$/.test(zip)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'zip must be a 5-digit string',
      correlationId,
    );
  }

  const item = await getItem(`MARKET#ZIP#${zip}`, 'ZHVI#LATEST');

  if (!item) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `No market data found for ZIP ${zip}`,
      correlationId,
    );
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(item.data),
  };
}

/**
 * GET /api/v1/market/metro — Metro-level market metrics.
 *
 * Reads all metro metrics from DynamoDB:
 *   PK: MARKET#METRO#phoenix-mesa
 *   SK: {metric}#LATEST (e.g., MEDIAN_PRICE#LATEST, DAYS_ON_MARKET#LATEST)
 *
 * Also-stored per-month snapshots have SK `{metric}#{YYYY-MM}`; this endpoint
 * returns only the `#LATEST` pointers.
 *
 * Filters SK ends-with '#LATEST' at the application layer because DynamoDB
 * only supports prefix matching (`begins_with`), not suffix matching.
 */
async function handleMarketMetro(
  _correlationId: string,
): Promise<LambdaProxyResponse> {
  // Query all items under this PK. No SK filter — we need both the
  // dated records AND the LATEST pointers in the raw result to then
  // filter on the suffix below.
  const result = await queryByPK('MARKET#METRO#phoenix-mesa');

  // Keep only the `{metric}#LATEST` pointers.
  const latestMetrics = result.items
    .filter((item) => typeof item.SK === 'string' && item.SK.endsWith('#LATEST'))
    .map((item) => item.data);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ metrics: latestMetrics }),
  };
}

// ---------------------------------------------------------------------------
// Path parsing helper
// ---------------------------------------------------------------------------

/**
 * Extract the ZIP code from the request path.
 *
 * Supports both API Gateway pathParameters and manual path parsing.
 */
function extractZip(event: APIGatewayEvent): string | undefined {
  // Try pathParameters first (API Gateway)
  if (event.pathParameters?.zip) {
    return event.pathParameters.zip;
  }

  // Fall back to manual path parsing
  const match = event.path.match(/\/market\/zip\/(\d{5})$/);
  return match?.[1];
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

export async function handler(event: APIGatewayEvent): Promise<LambdaProxyResponse> {
  const correlationId = event.requestContext?.requestId ?? generateCorrelationId();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    if (event.httpMethod !== 'GET') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Only GET is supported', correlationId);
    }

    const path = event.path;

    // GET /api/v1/market/zip/{zip}
    if (path.includes('/market/zip/')) {
      const zip = extractZip(event);
      if (!zip) {
        throw new AppError(ErrorCode.MISSING_FIELD, 'zip parameter is required', correlationId);
      }
      return await handleMarketZip(zip, correlationId);
    }

    // GET /api/v1/market/metro
    if (path.endsWith('/market/metro')) {
      return await handleMarketMetro(correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    console.error('[market-data] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
