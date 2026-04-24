/**
 * Lambda handler for the MesaHomes listing-service.
 *
 * Manages the flat-fee listing onboarding flow and Stripe payment processing.
 *
 * Routes:
 *   POST /api/v1/listing/start   → Create draft listing, collect property details
 *   POST /api/v1/listing/payment → Process Stripe payment, update listing status
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 15s
 */

import { randomUUID } from 'node:crypto';
import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  createValidationError,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import { putItem, getItem, updateItem } from '../../lib/dynamodb.js';
import { generateListingKeys } from '../../lib/models/keys.js';
import { EntityType } from '../../lib/types/dynamodb.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
  requestContext?: { requestId?: string };
}

/** Flat-fee listing status lifecycle. */
export type ListingStatus =
  | 'draft'
  | 'payment-pending'
  | 'paid'
  | 'mls-pending'
  | 'active'
  | 'sold'
  | 'cancelled';

/** Input for starting a flat-fee listing. */
export interface ListingStartInput {
  propertyAddress: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  upgrades?: string[];
  neighborhood?: string;
  listingDescription?: string;
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

/** Flat fee amount in dollars. */
export const FLAT_FEE_AMOUNT = 999;

/** Broker transaction fee in dollars. */
export const BROKER_FEE_AMOUNT = 400;

/** Valid listing statuses. */
const VALID_STATUSES = new Set<ListingStatus>([
  'draft', 'payment-pending', 'paid', 'mls-pending', 'active', 'sold', 'cancelled',
]);

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/listing/start — Create a new flat-fee listing (draft).
 *
 * Collects property details, creates a draft listing record,
 * and returns the listing ID for the payment step.
 */
async function handleStartListing(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const propertyAddress = body.propertyAddress as string | undefined;
  const bedrooms = body.bedrooms as number | undefined;
  const bathrooms = body.bathrooms as number | undefined;
  const sqft = body.sqft as number | undefined;

  // Validate required fields
  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (!propertyAddress || propertyAddress.trim().length === 0) {
    fieldErrors.push({ field: 'propertyAddress', message: 'propertyAddress is required' });
  }
  if (bedrooms === undefined || bedrooms === null || bedrooms < 0) {
    fieldErrors.push({ field: 'bedrooms', message: 'bedrooms is required and must be >= 0' });
  }
  if (bathrooms === undefined || bathrooms === null || bathrooms < 0) {
    fieldErrors.push({ field: 'bathrooms', message: 'bathrooms is required and must be >= 0' });
  }
  if (sqft === undefined || sqft === null || sqft <= 0) {
    fieldErrors.push({ field: 'sqft', message: 'sqft is required and must be > 0' });
  }

  if (fieldErrors.length > 0) {
    return toLambdaResponse(createValidationError(fieldErrors, correlationId));
  }

  const listingId = randomUUID();
  const now = new Date().toISOString();
  const status: ListingStatus = 'draft';

  const propertyDetails = {
    bedrooms,
    bathrooms,
    sqft,
    lotSize: body.lotSize as number | undefined,
    yearBuilt: body.yearBuilt as number | undefined,
    upgrades: body.upgrades as string[] | undefined,
    neighborhood: body.neighborhood as string | undefined,
  };

  const listingData = {
    listingId,
    propertyAddress: propertyAddress!,
    propertyDetails,
    listingDescription: (body.listingDescription as string) || '',
    photos: [],
    pricingRecommendation: null,
    status,
    stripePaymentId: null,
    assignedAdminId: '',
    mlsNumber: null,
  };

  const keys = generateListingKeys(listingId, status, now);

  await putItem({
    ...keys,
    entityType: EntityType.LISTING,
    data: listingData as unknown as Record<string, unknown>,
  });

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      listingId,
      status,
      pricing: {
        flatFee: FLAT_FEE_AMOUNT,
        brokerFee: BROKER_FEE_AMOUNT,
        total: FLAT_FEE_AMOUNT + BROKER_FEE_AMOUNT,
      },
      nextStep: 'payment',
    }),
  };
}

/**
 * POST /api/v1/listing/payment — Process payment for a flat-fee listing.
 *
 * MVP: Validates the listing exists and is in draft/payment-pending status,
 * then marks it as paid. In production, this would create a Stripe checkout
 * session and handle the webhook callback.
 */
async function handlePayment(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const listingId = body.listingId as string | undefined;
  const paymentToken = body.paymentToken as string | undefined;

  if (!listingId || listingId.trim().length === 0) {
    return toLambdaResponse(
      createValidationError(
        [{ field: 'listingId', message: 'listingId is required' }],
        correlationId,
      ),
    );
  }

  // Verify listing exists
  const item = await getItem(`LISTING#${listingId}`, `LISTING#${listingId}`);
  if (!item) {
    throw new AppError(ErrorCode.NOT_FOUND, `Listing ${listingId} not found`, correlationId);
  }

  const listingData = item.data as Record<string, unknown>;
  const currentStatus = listingData.status as string;

  // Only draft or payment-pending listings can be paid
  if (currentStatus !== 'draft' && currentStatus !== 'payment-pending') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Listing is in ${currentStatus} status and cannot be paid`,
      correlationId,
    );
  }

  // MVP: simulate Stripe payment processing
  // In production: create Stripe checkout session, return session URL
  const stripePaymentId = paymentToken || `sim_${randomUUID().slice(0, 8)}`;

  await updateItem(`LISTING#${listingId}`, `LISTING#${listingId}`, {
    'data.status': 'paid',
    'data.stripePaymentId': stripePaymentId,
  });

  // In production: notify Team_Admin via SES for MLS submission
  console.log(`[listing-service] Listing ${listingId} paid. Notify admin for MLS submission.`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      listingId,
      status: 'paid',
      stripePaymentId,
      message: 'Payment processed. Your listing will be submitted to MLS within 24 hours.',
    }),
  };
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
    if (event.httpMethod !== 'POST') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Only POST is supported', correlationId);
    }

    if (!event.body) {
      throw new AppError(ErrorCode.MISSING_FIELD, 'Request body is required', correlationId);
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;
    const path = event.path;

    if (path.endsWith('/listing/start')) {
      return await handleStartListing(body, correlationId);
    }

    if (path.endsWith('/listing/payment')) {
      return await handlePayment(body, correlationId);
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

    console.error('[listing-service] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
