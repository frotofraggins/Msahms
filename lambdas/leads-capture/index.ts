/**
 * Lambda handler for the MesaHomes leads-capture service.
 *
 * Routes requests to the correct lead capture flow based on the API path:
 *   POST /api/v1/leads              → General lead capture (all tools)
 *   POST /api/v1/valuation-request  → Home value request (seller)
 *   POST /api/v1/booking            → Consultation booking (hot lead)
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 10s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  createValidationError,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import {
  validateLeadInput,
  createLeadRecord,
  generateLeadKeys,
  type LeadInput,
} from '../../lib/models/lead.js';
import { putItem, getItem } from '../../lib/dynamodb.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import { withRetry, DYNAMODB_RETRY } from '../../lib/retry.js';
import { SERVICE_AREA_ZIPS } from '../../lib/county-router.js';
import { sendUserEmail } from '../../lib/email-sender.js';
import {
  leadCaptureTemplate,
  bookingTemplate,
} from '../../lib/email-templates/index.js';

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

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/leads — General lead capture from any tool.
 */
async function handleCreateLead(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const input = body as LeadInput;
  const errors = validateLeadInput(input);

  if (errors.length > 0) {
    const appError = createValidationError(errors, correlationId);
    return toLambdaResponse(appError);
  }

  const lead = createLeadRecord(input);
  const keys = generateLeadKeys(lead.leadId, lead.assignedAgentId, lead.createdAt);

  await withRetry(
    () =>
      putItem({
        ...keys,
        entityType: EntityType.LEAD,
        data: lead as unknown as Record<string, unknown>,
        createdAt: lead.createdAt,
        updatedAt: lead.createdAt,
      }),
    DYNAMODB_RETRY,
  );

  // Await with timeout. Lambda freezes after the handler returns, so we
  // must await the email before responding — otherwise the SES call
  // gets suspended and never completes. 3s budget is generous for SES.
  await Promise.race([
    sendUserEmail(lead.email, leadCaptureTemplate, {
      name: lead.name,
      toolSource: lead.toolSource,
    }).catch((err) =>
      console.error('[leads-capture] user email failed:', err),
    ),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({ leadId: lead.leadId, status: lead.leadStatus }),
  };
}

/**
 * POST /api/v1/valuation-request — Home value request.
 *
 * Accepts name, email, phone, propertyAddress. Validates address is in
 * service area. Creates lead with leadType=Seller, toolSource="home-value".
 * Returns teaser range from ZIP market data.
 */
async function handleValuationRequest(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const name = body.name as string | undefined;
  const email = body.email as string | undefined;
  const phone = body.phone as string | undefined;
  const propertyAddress = body.propertyAddress as string | undefined;
  const zip = body.zip as string | undefined;

  // Validate required fields
  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (!name || name.trim().length === 0) {
    fieldErrors.push({ field: 'name', message: 'name is required' });
  }
  if (!email || email.trim().length === 0) {
    fieldErrors.push({ field: 'email', message: 'email is required' });
  }
  if (!phone || phone.trim().length === 0) {
    fieldErrors.push({ field: 'phone', message: 'phone is required' });
  }
  if (!propertyAddress || propertyAddress.trim().length === 0) {
    fieldErrors.push({ field: 'propertyAddress', message: 'propertyAddress is required' });
  }
  if (!zip || zip.trim().length === 0) {
    fieldErrors.push({ field: 'zip', message: 'zip is required' });
  }

  if (fieldErrors.length > 0) {
    const appError = createValidationError(fieldErrors, correlationId);
    return toLambdaResponse(appError);
  }

  // Validate address is in service area
  if (!SERVICE_AREA_ZIPS.has(zip!)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Property address is not within the Mesa metro service area',
      correlationId,
    );
  }

  // Create lead
  const leadInput: LeadInput = {
    name: name!,
    email: email!,
    phone: phone!,
    city: body.city as string || 'Mesa',
    zip: zip!,
    timeframe: (body.timeframe as string) || 'now',
    leadType: 'Seller',
    toolSource: 'home-value',
    toolData: { propertyAddress: propertyAddress! },
  };

  const lead = createLeadRecord(leadInput);
  const keys = generateLeadKeys(lead.leadId, lead.assignedAgentId, lead.createdAt);

  await withRetry(
    () =>
      putItem({
        ...keys,
        entityType: EntityType.LEAD,
        data: lead as unknown as Record<string, unknown>,
        createdAt: lead.createdAt,
        updatedAt: lead.createdAt,
      }),
    DYNAMODB_RETRY,
  );

  sendUserEmail(lead.email, leadCaptureTemplate, {
    name: lead.name,
    toolSource: 'valuation-request',
  }).catch((err) => console.error('[leads-capture] valuation email failed:', err));

  // Fetch teaser range from ZIP market data
  let teaserRange: string | null = null;
  try {
    const marketData = await getItem(`MARKET#ZIP#${zip}`, 'ZHVI#LATEST');
    if (marketData?.data) {
      const zhvi = marketData.data.zhvi as number;
      const low = Math.round(zhvi * 0.9);
      const high = Math.round(zhvi * 1.1);
      teaserRange = `Homes in your ZIP typically sell for $${low.toLocaleString()}–$${high.toLocaleString()}`;
    }
  } catch {
    // Non-critical — teaser is optional
  }

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      leadId: lead.leadId,
      status: lead.leadStatus,
      teaserRange,
    }),
  };
}

/**
 * POST /api/v1/booking — Consultation booking.
 *
 * Accepts name, phone, email, intent. Creates lead with
 * toolSource="direct-consult", tag="hot-direct-consult".
 */
async function handleBooking(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const name = body.name as string | undefined;
  const email = body.email as string | undefined;
  const phone = body.phone as string | undefined;
  const intent = body.intent as string | undefined;

  // Validate required fields
  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (!name || name.trim().length === 0) {
    fieldErrors.push({ field: 'name', message: 'name is required' });
  }
  if (!email || email.trim().length === 0) {
    fieldErrors.push({ field: 'email', message: 'email is required' });
  }
  if (!phone || phone.trim().length === 0) {
    fieldErrors.push({ field: 'phone', message: 'phone is required' });
  }

  if (fieldErrors.length > 0) {
    const appError = createValidationError(fieldErrors, correlationId);
    return toLambdaResponse(appError);
  }

  // Map intent to leadType
  const intentToLeadType: Record<string, string> = {
    buying: 'Buyer',
    selling: 'Seller',
    renting: 'Renter',
    investing: 'Investor',
  };
  const leadType = intentToLeadType[intent ?? ''] ?? 'Buyer';

  const leadInput: LeadInput = {
    name: name!,
    email: email!,
    phone: phone!,
    city: (body.city as string) || 'Mesa',
    zip: (body.zip as string) || '85201',
    timeframe: 'now',
    leadType,
    toolSource: 'direct-consult',
    tags: ['hot-direct-consult'],
  };

  const lead = createLeadRecord(leadInput);
  const keys = generateLeadKeys(lead.leadId, lead.assignedAgentId, lead.createdAt);

  await withRetry(
    () =>
      putItem({
        ...keys,
        entityType: EntityType.LEAD,
        data: lead as unknown as Record<string, unknown>,
        createdAt: lead.createdAt,
        updatedAt: lead.createdAt,
      }),
    DYNAMODB_RETRY,
  );

  sendUserEmail(lead.email, bookingTemplate, {
    name: lead.name,
    intent: (body.intent as string | undefined) ?? 'general',
  }).catch((err) => console.error('[leads-capture] booking email failed:', err));

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({ leadId: lead.leadId, status: lead.leadStatus }),
  };
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the leads-capture function.
 *
 * Routes requests to the appropriate lead capture flow based on the path.
 */
export async function handler(event: APIGatewayEvent): Promise<LambdaProxyResponse> {
  const correlationId = event.requestContext?.requestId ?? generateCorrelationId();

  // Handle OPTIONS preflight
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

    if (path.endsWith('/leads')) {
      return await handleCreateLead(body, correlationId);
    }

    if (path.endsWith('/valuation-request')) {
      return await handleValuationRequest(body, correlationId);
    }

    if (path.endsWith('/booking')) {
      return await handleBooking(body, correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    if (error instanceof SyntaxError) {
      const appError = new AppError(
        ErrorCode.INVALID_FORMAT,
        'Invalid JSON in request body',
        correlationId,
      );
      return toLambdaResponse(appError);
    }

    console.error('[leads-capture] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
