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
import {
  listingsPaymentEnabled,
  PRE_LAUNCH_LISTING_MESSAGE,
} from '../../lib/brokerage.js';
import { signHandoff, verifyVhzWebhook } from '../../lib/listing-webhooks.js';

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
  | 'awaiting-vhz-launch'
  | 'awaiting-payment'
  | 'payment-pending'
  | 'paid'
  | 'mls-pending'
  | 'active'
  | 'sold'
  | 'cancelled';

/** FSBO launch mode — controls whether intake redirects to VHZ or captures lead only. */
export type FsboLaunchMode = 'lead-only' | 'stripe';

/** Read FSBO launch mode from env var. Defaults to 'lead-only'. */
export function getFsboLaunchMode(): FsboLaunchMode {
  const mode = process.env['FSBO_LAUNCH_MODE'] ?? 'lead-only';
  return mode === 'stripe' ? 'stripe' : 'lead-only';
}

/** Three-tier product model package types. */
export type PackageType =
  | 'fsbo-starter'
  | 'fsbo-standard'
  | 'fsbo-pro'
  | 'flat-fee'
  | 'full-service';

/** FSBO packages are always allowed — no broker needed. */
const FSBO_PACKAGES: ReadonlySet<PackageType> = new Set([
  'fsbo-starter',
  'fsbo-standard',
  'fsbo-pro',
]);

/** Valid package type values for input validation. */
const VALID_PACKAGE_TYPES: ReadonlySet<string> = new Set<string>([
  'fsbo-starter',
  'fsbo-standard',
  'fsbo-pro',
  'flat-fee',
  'full-service',
]);

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
  packageType?: PackageType;
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
  const packageType = (body.packageType as string | undefined) ?? 'flat-fee';

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
  if (!VALID_PACKAGE_TYPES.has(packageType)) {
    fieldErrors.push({ field: 'packageType', message: `packageType must be one of: ${[...VALID_PACKAGE_TYPES].join(', ')}` });
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
    packageType,
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
  const pkgType = (listingData.packageType as string) ?? 'flat-fee';

  // Gate flat-fee and full-service payments behind feature flag
  if (!listingsPaymentEnabled() && !FSBO_PACKAGES.has(pkgType as PackageType)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      PRE_LAUNCH_LISTING_MESSAGE,
      correlationId,
    );
  }

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
// FSBO intake (Blocker 1 — Stripe handoff Approach A)
// ---------------------------------------------------------------------------

/** Valid FSBO package types for the intake endpoint. */
const FSBO_INTAKE_PACKAGES: ReadonlySet<string> = new Set([
  'fsbo-starter',
  'fsbo-standard',
  'fsbo-pro',
]);

/**
 * POST /api/v1/listing/fsbo/intake — Create an FSBO listing and return
 * a signed handoff URL for VHZ Stripe checkout.
 */
async function handleFsboIntake(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const propertyAddress = body.propertyAddress as string | undefined;
  const bedrooms = body.bedrooms as number | undefined;
  const bathrooms = body.bathrooms as number | undefined;
  const sqft = body.sqft as number | undefined;
  const packageType = body.packageType as string | undefined;
  const email = body.email as string | undefined;
  const name = body.name as string | undefined;
  const phone = body.phone as string | undefined;

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
  if (!packageType || !FSBO_INTAKE_PACKAGES.has(packageType)) {
    fieldErrors.push({
      field: 'packageType',
      message: `packageType must be one of: ${[...FSBO_INTAKE_PACKAGES].join(', ')}`,
    });
  }
  if (!email || email.trim().length === 0) {
    fieldErrors.push({ field: 'email', message: 'email is required' });
  }

  if (fieldErrors.length > 0) {
    return toLambdaResponse(createValidationError(fieldErrors, correlationId));
  }

  const listingId = randomUUID();
  const leadId = randomUUID();
  const now = new Date().toISOString();
  const launchMode = getFsboLaunchMode();
  const status: ListingStatus = launchMode === 'stripe' ? 'awaiting-payment' : 'awaiting-vhz-launch';

  const listingData = {
    listingId,
    leadId,
    propertyAddress: propertyAddress!,
    propertyDetails: {
      bedrooms,
      bathrooms,
      sqft,
    },
    packageType,
    status,
    email: email!,
    name: name ?? '',
    phone: phone ?? '',
    stripePaymentId: null,
  };

  const keys = generateListingKeys(listingId, status, now);

  await putItem({
    ...keys,
    entityType: EntityType.LISTING,
    data: listingData as unknown as Record<string, unknown>,
  });

  // In lead-only mode, skip the signed handoff URL — just return the listing/lead IDs
  if (launchMode === 'lead-only') {
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        listingId,
        leadId,
        status,
      }),
    };
  }

  // Stripe mode: build signed handoff URL for VHZ checkout
  const baseUrl =
    process.env['VHZ_CHECKOUT_BASE_URL'] ?? 'https://virtualhomezone.com/checkout';
  const ts = Math.floor(Date.now() / 1000);
  const handoffParams: Record<string, string | number> = {
    package: packageType!,
    lead_id: leadId,
    listing_id: listingId,
    email: email!,
    source: 'mesahomes-fsbo',
    ts,
  };
  const sig = signHandoff(handoffParams);
  const qs = Object.entries({ ...handoffParams, sig })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const handoffUrl = `${baseUrl}?${qs}`;

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      listingId,
      leadId,
      handoffUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// VHZ webhook (Blocker 1 — payment confirmation callback)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/listing/fsbo/vhz-webhook — Receives payment confirmation
 * from Virtual Home Zone after Stripe checkout completes.
 */
async function handleVhzWebhook(
  event: APIGatewayEvent,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const rawBody = event.body ?? '';
  const signatureHeader =
    event.headers['X-VHZ-Signature'] ??
    event.headers['x-vhz-signature'] ??
    '';

  if (!verifyVhzWebhook(rawBody, signatureHeader)) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature', correlationId },
      }),
    };
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const eventType = payload.event as string | undefined;
  const listingId = payload.listing_id as string | undefined;
  const stripeSessionId = payload.stripe_session_id as string | undefined;

  if (eventType === 'payment.succeeded') {
    if (!listingId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'listing_id is required', correlationId },
        }),
      };
    }

    // Fetch listing to check idempotency
    const item = await getItem(`LISTING#${listingId}`, `LISTING#${listingId}`);
    if (!item) {
      console.warn(`[vhz-webhook] Listing ${listingId} not found — ignoring`);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    const listingData = item.data as Record<string, unknown>;

    // Idempotency: skip if already paid with the same stripe session
    if (
      listingData.stripePaymentId === stripeSessionId &&
      listingData.status === 'paid'
    ) {
      console.log(`[vhz-webhook] Duplicate payment for listing ${listingId} — skipping`);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    await updateItem(`LISTING#${listingId}`, `LISTING#${listingId}`, {
      'data.status': 'paid',
      'data.stripePaymentId': stripeSessionId ?? null,
      'data.paidAt': payload.paid_at ?? new Date().toISOString(),
      'data.amountPaidCents': payload.amount_paid_cents ?? null,
    });

    console.log(`[vhz-webhook] Listing ${listingId} marked as paid via VHZ webhook`);
  } else {
    // Future-proofing: log unhandled event types and return 200
    console.log(`[vhz-webhook] Unhandled event type: ${eventType}`);
  }

  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
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

    const path = event.path;

    // VHZ webhook needs raw body for signature verification — handle before JSON parse
    if (path.endsWith('/listing/fsbo/vhz-webhook')) {
      return await handleVhzWebhook(event, correlationId);
    }

    const body = JSON.parse(event.body) as Record<string, unknown>;

    if (path.endsWith('/listing/fsbo/intake')) {
      return await handleFsboIntake(body, correlationId);
    }

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
