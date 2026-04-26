/**
 * Lambda handler for the MesaHomes dashboard team service.
 *
 * Routes authenticated requests to team management endpoints.
 *
 * All endpoints require Cognito JWT authentication. Role-based access
 * control is enforced via the shared authorizer module.
 *
 * Routes:
 *   GET    /api/v1/dashboard/team                     → Team roster (admin)
 *   POST   /api/v1/dashboard/team/invite              → Invite agent (admin)
 *   PATCH  /api/v1/dashboard/team/{agentId}           → Update agent (admin)
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
  requirePermission,
  type AuthorizedEvent,
  type AuthClaims,
} from '../../lib/authorizer.js';
import {
  getItem,
  queryGSI1,
  updateItem,
  putItem,
} from '../../lib/dynamodb.js';
import { generateAgentKeys } from '../../lib/models/keys.js';
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
// Team management handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/team — List team agents (admin only).
 */
async function handleListTeam(
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'invite_agent', correlationId);

  const result = await queryGSI1(`TEAM#${claims.teamId}`);
  const agents = result.items
    .map((item) => item.data as Record<string, unknown>)
    .filter(Boolean);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ agents, count: agents.length }),
  };
}

/**
 * POST /api/v1/dashboard/team/invite — Invite a new agent (admin only).
 */
async function handleInviteAgent(
  body: Record<string, unknown>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'invite_agent', correlationId);

  const email = body.email as string | undefined;
  if (!email || email.trim().length === 0) {
    return toLambdaResponse(
      createValidationError([{ field: 'email', message: 'email is required' }], correlationId),
    );
  }

  const { randomUUID } = await import('node:crypto');
  const agentId = randomUUID();
  const inviteToken = randomUUID();

  // Create pending agent record
  const agentKeys = generateAgentKeys(agentId, claims.teamId);
  await putItem({
    ...agentKeys,
    entityType: EntityType.AGENT,
    data: {
      agentId,
      cognitoSub: '',
      name: '',
      email,
      phone: '',
      role: 'Agent',
      status: 'pending',
      teamId: claims.teamId,
      specialties: [],
      assignedCities: [],
      assignedZips: [],
      productionData: { transactionsClosed: 0, volume: 0 },
      notificationPrefs: { newLead: 'email', statusChange: 'email' },
    },
  });

  // Create invite token record
  await putItem({
    PK: `INVITE#${inviteToken}`,
    SK: 'INVITE',
    entityType: 'INVITE' as EntityType,
    data: {
      email,
      role: 'Agent',
      teamId: claims.teamId,
      agentId,
      used: false,
    },
  });

  // SES email would be sent here in production
  // For MVP, return the invite token for manual distribution

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      agentId,
      inviteToken,
      registrationUrl: `/auth/register?token=${inviteToken}`,
    }),
  };
}

/**
 * PATCH /api/v1/dashboard/team/{agentId} — Deactivate agent (admin only).
 */
async function handleUpdateAgent(
  agentId: string,
  body: Record<string, unknown>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'deactivate_agent', correlationId);

  // Find agent record
  const agentItem = await getItem(`AGENT#${agentId}`, `AGENT#${agentId}`);
  if (!agentItem) {
    throw new AppError(ErrorCode.NOT_FOUND, `Agent ${agentId} not found`, correlationId);
  }

  const updates: Record<string, unknown> = {};

  if (body.status === 'deactivated') {
    updates['data.status'] = 'deactivated';
    // In production: reassign open leads to Team_Admin
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'No updates provided', correlationId);
  }

  await updateItem(`AGENT#${agentId}`, `AGENT#${agentId}`, updates);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ agentId, updated: true }),
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Extract a path parameter like {id} from the path. */
function extractPathParam(path: string, prefix: string): string | null {
  // e.g. path="/api/v1/dashboard/team/abc-123", prefix="/team/"
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

    // --- Team management ---
    if (path.match(/\/dashboard\/team\/?$/) && method === 'GET') {
      return await handleListTeam(claims, correlationId);
    }

    if (path.match(/\/dashboard\/team\/invite\/?$/) && method === 'POST') {
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleInviteAgent(body, claims, correlationId);
    }

    if (path.match(/\/dashboard\/team\/[^/]+$/) && !path.includes('/invite') && method === 'PATCH') {
      const agentId = extractPathParam(path, '/team/');
      if (!agentId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Agent ID required', correlationId);
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleUpdateAgent(agentId, body, claims, correlationId);
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

    console.error('[dashboard-team] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
