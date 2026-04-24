/**
 * Lambda handler for the MesaHomes auth-api service.
 *
 * Routes requests to the correct authentication flow based on the API path:
 *   POST /api/v1/auth/login    → Cognito USER_PASSWORD_AUTH, return JWT tokens
 *   POST /api/v1/auth/refresh  → Cognito REFRESH_TOKEN_AUTH, return new tokens
 *   POST /api/v1/auth/register → Validate invite token, create Cognito user
 *
 * Account lockout: 3 consecutive failures → 15-minute lock.
 * Failed attempt counter stored in DynamoDB (LOCKOUT#{email} / LOCKOUT).
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
import { authenticateUser, refreshTokens, createUser } from '../../lib/cognito.js';
import { putItem, getItem, updateItem, deleteItem } from '../../lib/dynamodb.js';
import { generateAgentKeys } from '../../lib/models/keys.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import type { AgentRole } from '../../lib/types/agent.js';

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

/** Lockout record stored in DynamoDB. */
interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: string | null;
  lastFailedAt: string;
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

/** Maximum consecutive failed login attempts before lockout. */
const MAX_FAILED_ATTEMPTS = 3;

/** Lockout duration in milliseconds (15 minutes). */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/** Invite token TTL in milliseconds (7 days). */
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Lockout helpers
// ---------------------------------------------------------------------------

/**
 * Get the lockout record for an email address.
 * Returns null if no lockout record exists.
 */
export async function getLockoutRecord(
  email: string,
): Promise<LockoutRecord | null> {
  const item = await getItem(`LOCKOUT#${email}`, 'LOCKOUT');
  if (!item?.data) return null;
  return item.data as unknown as LockoutRecord;
}

/**
 * Check if an account is currently locked.
 * Returns true if locked, false if not locked or lock has expired.
 */
export function isAccountLocked(record: LockoutRecord | null): boolean {
  if (!record) return false;
  if (!record.lockedUntil) return false;
  return new Date(record.lockedUntil).getTime() > Date.now();
}

/**
 * Record a failed login attempt. Locks the account after MAX_FAILED_ATTEMPTS.
 */
export async function recordFailedAttempt(email: string): Promise<LockoutRecord> {
  const existing = await getLockoutRecord(email);
  const now = new Date().toISOString();
  const attempts = (existing?.failedAttempts ?? 0) + 1;

  const record: LockoutRecord = {
    failedAttempts: attempts,
    lockedUntil:
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
        : null,
    lastFailedAt: now,
  };

  await putItem({
    PK: `LOCKOUT#${email}`,
    SK: 'LOCKOUT',
    entityType: 'LOCKOUT' as EntityType,
    data: record as unknown as Record<string, unknown>,
  });

  return record;
}

/**
 * Clear the lockout record on successful login.
 */
export async function clearLockout(email: string): Promise<void> {
  await deleteItem(`LOCKOUT#${email}`, 'LOCKOUT');
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/login — Authenticate with email and password.
 *
 * Checks lockout status before attempting Cognito auth.
 * On failure, increments the failed attempt counter.
 * On success, clears the lockout counter and returns tokens.
 */
async function handleLogin(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const email = body.email as string | undefined;
  const password = body.password as string | undefined;

  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (!email || email.trim().length === 0) {
    fieldErrors.push({ field: 'email', message: 'email is required' });
  }
  if (!password || password.trim().length === 0) {
    fieldErrors.push({ field: 'password', message: 'password is required' });
  }
  if (fieldErrors.length > 0) {
    return toLambdaResponse(createValidationError(fieldErrors, correlationId));
  }

  // Check lockout
  const lockout = await getLockoutRecord(email!);
  if (isAccountLocked(lockout)) {
    throw new AppError(
      ErrorCode.ACCOUNT_LOCKED,
      'Account is locked due to too many failed attempts. Try again in 15 minutes.',
      correlationId,
    );
  }

  // Attempt authentication
  try {
    const tokens = await authenticateUser(email!, password!);

    // Clear lockout on success
    await clearLockout(email!);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      }),
    };
  } catch (error: unknown) {
    // Record failed attempt on auth failure
    if (
      error instanceof Error &&
      (error.name === 'NotAuthorizedException' ||
        error.name === 'UserNotFoundException' ||
        error.message.includes('Authentication failed'))
    ) {
      const record = await recordFailedAttempt(email!);

      if (record.lockedUntil) {
        throw new AppError(
          ErrorCode.ACCOUNT_LOCKED,
          'Account is locked due to too many failed attempts. Try again in 15 minutes.',
          correlationId,
        );
      }

      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        correlationId,
      );
    }

    throw error;
  }
}

/**
 * POST /api/v1/auth/refresh — Refresh access and ID tokens.
 */
async function handleRefresh(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const refreshToken = body.refreshToken as string | undefined;

  if (!refreshToken || refreshToken.trim().length === 0) {
    return toLambdaResponse(
      createValidationError(
        [{ field: 'refreshToken', message: 'refreshToken is required' }],
        correlationId,
      ),
    );
  }

  try {
    const tokens = await refreshTokens(refreshToken);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        expiresIn: tokens.expiresIn,
      }),
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.name === 'NotAuthorizedException' ||
        error.message.includes('Token refresh failed'))
    ) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired refresh token',
        correlationId,
      );
    }
    throw error;
  }
}

/**
 * POST /api/v1/auth/register — Register a new agent using an invite token.
 *
 * Flow:
 * 1. Validate invite token exists in DynamoDB and is not expired/used
 * 2. Create Cognito user with role and teamId from the invite
 * 3. Update agent record to active with cognitoSub
 * 4. Mark invite token as used
 * 5. Return JWT tokens
 */
async function handleRegister(
  body: Record<string, unknown>,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const token = body.token as string | undefined;
  const name = body.name as string | undefined;
  const email = body.email as string | undefined;
  const password = body.password as string | undefined;

  const fieldErrors: Array<{ field: string; message: string }> = [];
  if (!token || token.trim().length === 0) {
    fieldErrors.push({ field: 'token', message: 'token is required' });
  }
  if (!name || name.trim().length === 0) {
    fieldErrors.push({ field: 'name', message: 'name is required' });
  }
  if (!email || email.trim().length === 0) {
    fieldErrors.push({ field: 'email', message: 'email is required' });
  }
  if (!password || password.trim().length === 0) {
    fieldErrors.push({ field: 'password', message: 'password is required' });
  }
  if (fieldErrors.length > 0) {
    return toLambdaResponse(createValidationError(fieldErrors, correlationId));
  }

  // Validate password strength
  if (password!.length < 8) {
    return toLambdaResponse(
      createValidationError(
        [{ field: 'password', message: 'Password must be at least 8 characters' }],
        correlationId,
      ),
    );
  }

  // Validate invite token
  const inviteItem = await getItem(`INVITE#${token}`, 'INVITE');
  if (!inviteItem) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Invalid invite token', correlationId);
  }

  const inviteData = inviteItem.data as Record<string, unknown>;

  // Check if token is already used
  if (inviteData.used === true) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Invite token has already been used',
      correlationId,
    );
  }

  // Check if token is expired
  const createdAt = inviteItem.createdAt as string;
  if (Date.now() - new Date(createdAt).getTime() > INVITE_TOKEN_TTL_MS) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Invite token has expired',
      correlationId,
    );
  }

  // Check email matches invite
  if (inviteData.email !== email) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Email does not match the invitation',
      correlationId,
    );
  }

  const role = (inviteData.role as AgentRole) ?? 'Agent';
  const teamId = inviteData.teamId as string;
  const agentId = inviteData.agentId as string;

  // Create Cognito user
  const cognitoSub = await createUser(email!, password!, role, teamId);

  // Update agent record to active
  const agentKeys = generateAgentKeys(agentId, teamId);
  await updateItem(agentKeys.PK, agentKeys.SK, {
    'data.status': 'active',
    'data.cognitoSub': cognitoSub,
    'data.name': name,
  });

  // Mark invite token as used
  await updateItem(`INVITE#${token}`, 'INVITE', {
    'data.used': true,
    'data.usedAt': new Date().toISOString(),
  });

  // Authenticate the new user to return tokens
  const tokens = await authenticateUser(email!, password!);

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      agentId,
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    }),
  };
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the auth-api function.
 */
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

    if (path.endsWith('/auth/login')) {
      return await handleLogin(body, correlationId);
    }

    if (path.endsWith('/auth/refresh')) {
      return await handleRefresh(body, correlationId);
    }

    if (path.endsWith('/auth/register')) {
      return await handleRegister(body, correlationId);
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

    console.error('[auth-api] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
