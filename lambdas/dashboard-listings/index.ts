/**
 * Lambda handler for the MesaHomes dashboard listings service.
 *
 * Routes authenticated requests to listing management endpoints.
 *
 * All endpoints require Cognito JWT authentication. Role-based access
 * control is enforced via the shared authorizer module.
 *
 * Routes:
 *   GET    /api/v1/dashboard/listings                 → Flat-fee listings
 *   PATCH  /api/v1/dashboard/listings/{id}            → Update listing (admin)
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 10s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import {
  extractClaims,
  requirePermission,
  type AuthorizedEvent,
  type AuthClaims,
} from '../../lib/authorizer.js';
import {
  getItem,
  queryGSI1,
  updateItem,
} from '../../lib/dynamodb.js';

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
// Listing management handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/listings — List flat-fee listings.
 */
async function handleListListings(
  _claims: AuthClaims,
  _correlationId: string,
): Promise<LambdaProxyResponse> {
  // Both agents and admins can view listings
  const statuses = ['draft', 'payment-pending', 'paid', 'mls-pending', 'active', 'sold', 'cancelled'];
  const allListings: Record<string, unknown>[] = [];

  for (const status of statuses) {
    const result = await queryGSI1(`LISTING#STATUS#${status}`, { limit: 50 });
    const listings = result.items
      .map((item) => item.data as Record<string, unknown>)
      .filter(Boolean);
    allListings.push(...listings);
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ listings: allListings, count: allListings.length }),
  };
}

/**
 * PATCH /api/v1/dashboard/listings/{id} — Update listing status (admin only).
 */
async function handleUpdateListing(
  listingId: string,
  body: Record<string, unknown>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'manage_listings', correlationId);

  const item = await getItem(`LISTING#${listingId}`, `LISTING#${listingId}`);
  if (!item) {
    throw new AppError(ErrorCode.NOT_FOUND, `Listing ${listingId} not found`, correlationId);
  }

  const updates: Record<string, unknown> = {};

  if (body.status) {
    const validStatuses = new Set([
      'draft', 'payment-pending', 'paid', 'mls-pending', 'active', 'sold', 'cancelled',
    ]);
    if (!validStatuses.has(body.status as string)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid listing status: ${body.status}`,
        correlationId,
      );
    }
    updates['data.status'] = body.status;
  }

  if (body.mlsNumber) {
    updates['data.mlsNumber'] = body.mlsNumber;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'No updates provided', correlationId);
  }

  await updateItem(`LISTING#${listingId}`, `LISTING#${listingId}`, updates);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ listingId, updated: true }),
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Extract a path parameter like {id} from the path. */
function extractPathParam(path: string, prefix: string): string | null {
  // e.g. path="/api/v1/dashboard/listings/abc-123", prefix="/listings/"
  const idx = path.indexOf(prefix);
  if (idx === -1) return null;
  const rest = path.substring(idx + prefix.length);
  // Take everything up to the next slash or end
  const slashIdx = rest.indexOf('/');
  return slashIdx === -1 ? rest : rest.substring(0, slashIdx);
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

export async function handler(event: AuthorizedEvent): Promise<LambdaProxyResponse> {
  const correlationId = event.requestContext?.requestId ?? generateCorrelationId();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // Extract and validate auth claims
    const claims = extractClaims(event, correlationId);
    const path = event.path;
    const method = event.httpMethod;

    // --- Listings ---
    if (path.match(/\/dashboard\/listings\/?$/) && method === 'GET') {
      return await handleListListings(claims, correlationId);
    }

    if (path.match(/\/dashboard\/listings\/[^/]+$/) && method === 'PATCH') {
      const listingId = extractPathParam(path, '/listings/');
      if (!listingId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Listing ID required', correlationId);
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleUpdateListing(listingId, body, claims, correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    if (error instanceof SyntaxError) {
      return toLambdaResponse(
        new AppError(ErrorCode.INVALID_FORMAT, 'Invalid JSON in request body', correlationId),
      );
    }

    console.error('[dashboard-listings] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
