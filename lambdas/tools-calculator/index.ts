/**
 * Lambda handler for the MesaHomes tools-calculator service.
 *
 * Routes requests to the correct calculator based on the API path:
 *   POST /api/v1/tools/net-sheet        → Seller Net Sheet Calculator
 *   POST /api/v1/tools/affordability    → Buyer Affordability Calculator
 *   POST /api/v1/tools/comparison       → Flat-Fee vs Traditional Comparison
 *   POST /api/v1/tools/sell-now-or-wait → Sell Now or Wait Analysis
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
import { calculateNetSheet, type NetSheetInput, type ServiceType } from './net-sheet.js';
import { calculateAffordability, type AffordabilityInput } from './affordability.js';
import { calculateComparison } from './comparison.js';
import { analyzeSellNowOrWait } from './sell-now-or-wait.js';

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
    throw new AppError(
      ErrorCode.INVALID_FORMAT,
      `${field} must be a valid number`,
      correlationId,
    );
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
    throw new AppError(
      ErrorCode.INVALID_FORMAT,
      `${field} must be a string`,
      correlationId,
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleNetSheet(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const salePrice = requireNumber(body, 'salePrice', correlationId);
  const outstandingMortgage = requireNumber(body, 'outstandingMortgage', correlationId);
  const serviceType = requireString(body, 'serviceType', correlationId);

  if (serviceType !== 'flat-fee' && serviceType !== 'traditional') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'serviceType must be "flat-fee" or "traditional"',
      correlationId,
    );
  }

  const input: NetSheetInput = {
    salePrice,
    outstandingMortgage,
    serviceType: serviceType as ServiceType,
  };

  const result = calculateNetSheet(input);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

async function handleAffordability(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const annualIncome = requireNumber(body, 'annualIncome', correlationId);
  const monthlyDebts = requireNumber(body, 'monthlyDebts', correlationId);
  const downPayment = requireNumber(body, 'downPayment', correlationId);
  const interestRate = requireNumber(body, 'interestRate', correlationId);
  const loanTerm = requireNumber(body, 'loanTerm', correlationId);

  if (loanTerm !== 15 && loanTerm !== 30) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'loanTerm must be 15 or 30',
      correlationId,
    );
  }

  const input: AffordabilityInput = {
    annualIncome,
    monthlyDebts,
    downPayment,
    interestRate,
    loanTerm: loanTerm as 15 | 30,
  };

  const result = calculateAffordability(input);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

async function handleComparison(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const estimatedSalePrice = requireNumber(body, 'estimatedSalePrice', correlationId);

  const result = calculateComparison({ estimatedSalePrice });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

async function handleSellNowOrWait(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const zip = requireString(body, 'zip', correlationId);
  const estimatedHomeValue = requireNumber(body, 'estimatedHomeValue', correlationId);

  const result = await analyzeSellNowOrWait({ zip, estimatedHomeValue });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the tools-calculator function.
 *
 * Routes requests to the appropriate calculator based on the path.
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

    if (path.endsWith('/tools/net-sheet')) {
      return await handleNetSheet(body, correlationId);
    }

    if (path.endsWith('/tools/affordability')) {
      return await handleAffordability(body, correlationId);
    }

    if (path.endsWith('/tools/comparison')) {
      return await handleComparison(body, correlationId);
    }

    if (path.endsWith('/tools/sell-now-or-wait')) {
      return await handleSellNowOrWait(body, correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    // Domain errors from calculators (e.g. "salePrice must be > 0")
    if (error instanceof Error && error.message) {
      const appError = new AppError(
        ErrorCode.VALIDATION_ERROR,
        error.message,
        correlationId,
      );
      return toLambdaResponse(appError);
    }

    console.error('[tools-calculator] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
