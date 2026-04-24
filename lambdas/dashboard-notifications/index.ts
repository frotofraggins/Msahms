/**
 * Lambda handler for the MesaHomes dashboard notifications service.
 *
 * Routes authenticated requests to notification preference endpoints.
 *
 * All endpoints require Cognito JWT authentication. Role-based access
 * control is enforced via the shared authorizer module.
 *
 * Routes:
 *   GET    /api/v1/dashboard/notifications/settings   → Get notification prefs
 *   PUT    /api/v1/dashboard/notifications/settings   → Update notification prefs
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
  extractClaims,
  type AuthorizedEvent,
  type AuthClaims,
} from '../../lib/authorizer.js';
import {
  getItem,
  putItem,
} from '../../lib/dynamodb.js';
import { EntityType } from '../../lib/types/dynamodb.js';

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
// Notification preferences handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/notifications/settings — Get notification prefs.
 */
async function handleGetNotificationSettings(
  claims: AuthClaims,
): Promise<LambdaProxyResponse> {
  const item = await getItem(`AGENT#${claims.sub}`, 'NOTIF_PREFS');

  const defaults = { newLead: 'email', statusChange: 'email' };
  const prefs = item?.data ?? defaults;

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ preferences: prefs }),
  };
}

/**
 * PUT /api/v1/dashboard/notifications/settings — Update notification prefs.
 */
async function handleUpdateNotificationSettings(
  body: Record<string, unknown>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const validOptions = new Set(['email', 'email-sms', 'none']);

  const newLead = body.newLead as string | undefined;
  const statusChange = body.statusChange as string | undefined;

  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (newLead && !validOptions.has(newLead)) {
    fieldErrors.push({ field: 'newLead', message: 'Must be email, email-sms, or none' });
  }
  if (statusChange && !validOptions.has(statusChange)) {
    fieldErrors.push({ field: 'statusChange', message: 'Must be email, email-sms, or none' });
  }
  if (fieldErrors.length > 0) {
    return toLambdaResponse(createValidationError(fieldErrors, correlationId));
  }

  const prefs = {
    newLead: newLead ?? 'email',
    statusChange: statusChange ?? 'email',
  };

  await putItem({
    PK: `AGENT#${claims.sub}`,
    SK: 'NOTIF_PREFS',
    entityType: 'NOTIF_PREFS' as EntityType,
    data: prefs,
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ preferences: prefs }),
  };
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

    // --- Notifications ---
    if (path.match(/\/dashboard\/notifications\/settings\/?$/) && method === 'GET') {
      return await handleGetNotificationSettings(claims);
    }

    if (path.match(/\/dashboard\/notifications\/settings\/?$/) && method === 'PUT') {
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleUpdateNotificationSettings(body, claims, correlationId);
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

    console.error('[dashboard-notifications] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
