/**
 * Lambda handler for the MesaHomes AI proxy service.
 *
 * Routes requests to the correct AI generation flow:
 *   POST /api/v1/ai/listing-description → Generate MLS listing description
 *   POST /api/v1/ai/offer-draft        → Generate offer draft summary
 *
 * For MVP: returns mock AI responses. The actual RTX 4090 MCP server
 * integration will be configured at deployment.
 *
 * Runtime: Node.js 20 | Memory: 512 MB | Timeout: 30s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import { scanForCompliance } from './compliance-filter.js';

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

/** Input for listing description generation. */
export interface ListingInput {
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  upgrades?: string[];
  neighborhood?: string;
}

/** Input for offer draft generation. */
export interface OfferInput {
  propertyAddress: string;
  offeredPrice: number;
  earnestMoney: number;
  financingType: string;
  contingencies: string[];
  closingDate: string;
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

const LEGAL_DISCLAIMER =
  'DISCLAIMER: This offer draft is generated for informational purposes only. ' +
  'It does not constitute a legal document or legal advice. Please have this ' +
  'reviewed by a licensed real estate agent or attorney before submission.';

// ---------------------------------------------------------------------------
// Mock AI generation (MVP)
// ---------------------------------------------------------------------------

/**
 * Generate a mock MLS listing description.
 *
 * For MVP, this returns a template-based description. In production,
 * this will proxy to the local RTX 4090 MCP server.
 */
export function generateListingDescription(input: ListingInput): string {
  const { bedrooms, bathrooms, sqft, lotSize, yearBuilt, upgrades, neighborhood } = input;

  const parts: string[] = [
    `Welcome to this stunning ${bedrooms}-bedroom, ${bathrooms}-bathroom home`,
    `featuring ${sqft.toLocaleString()} square feet of living space.`,
  ];

  if (yearBuilt) {
    parts.push(`Built in ${yearBuilt}, this property has been well-maintained.`);
  }

  if (lotSize) {
    parts.push(`Situated on a ${lotSize.toLocaleString()} sqft lot.`);
  }

  if (neighborhood) {
    parts.push(`Located in the desirable ${neighborhood} neighborhood.`);
  }

  if (upgrades && upgrades.length > 0) {
    parts.push(`Recent upgrades include ${upgrades.join(', ')}.`);
  }

  parts.push(
    `This ${bedrooms} bed, ${bathrooms} bath home offers an exceptional living experience.`,
    'Schedule your showing today!',
  );

  return parts.join(' ');
}

/**
 * Generate a mock offer draft summary.
 *
 * For MVP, this returns a template-based draft. In production,
 * this will proxy to the local RTX 4090 MCP server.
 */
export function generateOfferDraft(input: OfferInput): string {
  const {
    propertyAddress,
    offeredPrice,
    earnestMoney,
    financingType,
    contingencies,
    closingDate,
  } = input;

  const parts: string[] = [
    `PURCHASE OFFER DRAFT`,
    ``,
    `Property: ${propertyAddress}`,
    `Offered Price: $${offeredPrice.toLocaleString()}`,
    `Earnest Money: $${earnestMoney.toLocaleString()}`,
    `Financing: ${financingType}`,
    `Contingencies: ${contingencies.length > 0 ? contingencies.join(', ') : 'None'}`,
    `Closing Date: ${closingDate}`,
    ``,
    `This offer is submitted in good faith for the purchase of the above property.`,
    `The buyer proposes a purchase price of $${offeredPrice.toLocaleString()} with ` +
      `$${earnestMoney.toLocaleString()} in earnest money to be deposited within 3 business days.`,
    ``,
    LEGAL_DISCLAIMER,
  ];

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function requireNumber(
  body: Record<string, unknown>,
  field: string,
  correlationId: string,
): number {
  const value = body[field];
  if (value === undefined || value === null) {
    throw new AppError(ErrorCode.MISSING_FIELD, `${field} is required`, correlationId);
  }
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new AppError(ErrorCode.INVALID_FORMAT, `${field} must be a valid number`, correlationId);
  }
  return value;
}

function requireString(
  body: Record<string, unknown>,
  field: string,
  correlationId: string,
): string {
  const value = body[field];
  if (value === undefined || value === null || value === '') {
    throw new AppError(ErrorCode.MISSING_FIELD, `${field} is required`, correlationId);
  }
  if (typeof value !== 'string') {
    throw new AppError(ErrorCode.INVALID_FORMAT, `${field} must be a string`, correlationId);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleListingDescription(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const bedrooms = requireNumber(body, 'bedrooms', correlationId);
  const bathrooms = requireNumber(body, 'bathrooms', correlationId);
  const sqft = requireNumber(body, 'sqft', correlationId);

  const input: ListingInput = {
    bedrooms,
    bathrooms,
    sqft,
    lotSize: typeof body.lotSize === 'number' ? body.lotSize : undefined,
    yearBuilt: typeof body.yearBuilt === 'number' ? body.yearBuilt : undefined,
    upgrades: Array.isArray(body.upgrades) ? (body.upgrades as string[]) : undefined,
    neighborhood: typeof body.neighborhood === 'string' ? body.neighborhood : undefined,
  };

  const description = generateListingDescription(input);

  // Run compliance filter
  const compliance = scanForCompliance(description);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      description,
      compliance,
      metadata: {
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        sqft: input.sqft,
      },
    }),
  };
}

async function handleOfferDraft(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const propertyAddress = requireString(body, 'propertyAddress', correlationId);
  const offeredPrice = requireNumber(body, 'offeredPrice', correlationId);
  const earnestMoney = requireNumber(body, 'earnestMoney', correlationId);
  const financingType = requireString(body, 'financingType', correlationId);
  const closingDate = requireString(body, 'closingDate', correlationId);

  const contingencies = Array.isArray(body.contingencies)
    ? (body.contingencies as string[])
    : [];

  const input: OfferInput = {
    propertyAddress,
    offeredPrice,
    earnestMoney,
    financingType,
    contingencies,
    closingDate,
  };

  const draft = generateOfferDraft(input);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      draft,
      disclaimer: LEGAL_DISCLAIMER,
      metadata: {
        propertyAddress: input.propertyAddress,
        offeredPrice: input.offeredPrice,
        closingDate: input.closingDate,
      },
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

    if (path.endsWith('/ai/listing-description')) {
      return await handleListingDescription(body, correlationId);
    }

    if (path.endsWith('/ai/offer-draft')) {
      return await handleOfferDraft(body, correlationId);
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

    console.error('[ai-proxy] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
