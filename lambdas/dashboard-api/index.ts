/**
 * Lambda handler for the MesaHomes dashboard-api service.
 *
 * Routes authenticated requests to lead management, team management,
 * notification preferences, performance metrics, and listing management.
 *
 * All endpoints require Cognito JWT authentication. Role-based access
 * control is enforced via the shared authorizer module.
 *
 * Routes:
 *   GET    /api/v1/dashboard/leads                    → List leads (filtered)
 *   GET    /api/v1/dashboard/leads/{id}               → Lead detail
 *   PATCH  /api/v1/dashboard/leads/{id}               → Update lead
 *   GET    /api/v1/dashboard/team                     → Team roster (admin)
 *   POST   /api/v1/dashboard/team/invite              → Invite agent (admin)
 *   PATCH  /api/v1/dashboard/team/{agentId}           → Update agent (admin)
 *   GET    /api/v1/dashboard/performance              → Performance metrics (admin)
 *   GET    /api/v1/dashboard/listings                 → Flat-fee listings
 *   PATCH  /api/v1/dashboard/listings/{id}            → Update listing (admin)
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
  requirePermission,
  type AuthorizedEvent,
  type AuthClaims,
} from '../../lib/authorizer.js';
import {
  getItem,
  queryByPK,
  queryGSI1,
  updateItem,
  putItem,
} from '../../lib/dynamodb.js';
import { generateAgentKeys } from '../../lib/models/keys.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import type { LeadStatus } from '../../lib/types/lead.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const VALID_LEAD_STATUSES: Set<string> = new Set([
  'New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost',
]);

// ---------------------------------------------------------------------------
// Lead management handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/leads — List leads with filters and sorting.
 *
 * Agent: sees only own leads (filtered by assignedAgentId).
 * Team_Admin: sees all team leads.
 *
 * Query params: status, type, source, city, zip, timeframe, sort, limit, startKey
 */
async function handleListLeads(
  event: AuthorizedEvent,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const params = parseQueryParams(event);
  const limit = Math.min(parseInt(params.limit || '50', 10), 100);
  const scanForward = params.sort !== 'oldest';

  let items: Record<string, unknown>[];
  let lastKey: Record<string, unknown> | undefined;

  if (claims.role === 'Team_Admin') {
    // Admin: query by status or get all team leads
    if (params.status && VALID_LEAD_STATUSES.has(params.status)) {
      const result = await queryGSI1(`STATUS#${params.status}`, {
        limit,
        scanForward,
        startKey: params.startKey ? JSON.parse(params.startKey) : undefined,
      });
      items = result.items;
      lastKey = result.lastKey;
    } else {
      // Get all leads for the team by querying each agent
      const teamResult = await queryGSI1(`TEAM#${claims.teamId}`);
      const agentIds = teamResult.items
        .map((a) => (a.data as Record<string, unknown>)?.agentId as string)
        .filter(Boolean);

      const allLeads: Record<string, unknown>[] = [];
      for (const agentId of agentIds) {
        const agentLeads = await queryGSI1(`AGENT#${agentId}`, {
          skCondition: { operator: 'begins_with', value: 'LEAD#' },
          limit: 100,
          scanForward,
        });
        allLeads.push(...agentLeads.items);
      }

      // Also get unassigned leads
      const unassigned = await queryGSI1('AGENT#unassigned', {
        skCondition: { operator: 'begins_with', value: 'LEAD#' },
        limit: 100,
        scanForward,
      });
      allLeads.push(...unassigned.items);

      items = allLeads.slice(0, limit);
      lastKey = undefined;
    }
  } else {
    // Agent: only own leads
    const result = await queryGSI1(`AGENT#${claims.sub}`, {
      skCondition: { operator: 'begins_with', value: 'LEAD#' },
      limit,
      scanForward,
      startKey: params.startKey ? JSON.parse(params.startKey) : undefined,
    });
    items = result.items;
    lastKey = result.lastKey;
  }

  // Apply client-side filters
  let filtered = items.map((item) => item.data as Record<string, unknown>).filter(Boolean);

  if (params.type) {
    filtered = filtered.filter((l) => l.leadType === params.type);
  }
  if (params.source) {
    filtered = filtered.filter((l) => l.toolSource === params.source);
  }
  if (params.city) {
    filtered = filtered.filter((l) => l.city === params.city);
  }
  if (params.zip) {
    filtered = filtered.filter((l) => l.zip === params.zip);
  }
  if (params.timeframe) {
    filtered = filtered.filter((l) => l.timeframe === params.timeframe);
  }
  if (params.status && claims.role !== 'Team_Admin') {
    filtered = filtered.filter((l) => l.leadStatus === params.status);
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      leads: filtered,
      count: filtered.length,
      lastKey: lastKey ? JSON.stringify(lastKey) : null,
    }),
  };
}

/**
 * GET /api/v1/dashboard/leads/{id} — Full lead detail.
 */
async function handleGetLead(
  leadId: string,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  const item = await getItem(`LEAD#${leadId}`, `LEAD#${leadId}`);

  if (!item) {
    throw new AppError(ErrorCode.NOT_FOUND, `Lead ${leadId} not found`, correlationId);
  }

  const leadData = item.data as Record<string, unknown>;

  // Agent can only view own leads
  if (claims.role === 'Agent' && leadData.assignedAgentId !== claims.sub) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Cannot view leads assigned to other agents', correlationId);
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ lead: leadData }),
  };
}

/**
 * PATCH /api/v1/dashboard/leads/{id} — Update lead status, add notes.
 */
async function handleUpdateLead(
  leadId: string,
  body: Record<string, unknown>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  // Verify lead exists
  const item = await getItem(`LEAD#${leadId}`, `LEAD#${leadId}`);
  if (!item) {
    throw new AppError(ErrorCode.NOT_FOUND, `Lead ${leadId} not found`, correlationId);
  }

  const leadData = item.data as Record<string, unknown>;

  // Agent can only update own leads
  if (claims.role === 'Agent' && leadData.assignedAgentId !== claims.sub) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Cannot update leads assigned to other agents', correlationId);
  }

  const updates: Record<string, unknown> = {};

  // Update status
  if (body.status) {
    const newStatus = body.status as string;
    if (!VALID_LEAD_STATUSES.has(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status: ${newStatus}. Valid: ${[...VALID_LEAD_STATUSES].join(', ')}`,
        correlationId,
      );
    }

    updates['data.leadStatus'] = newStatus;

    // Append to status history
    const statusHistory = (leadData.statusHistory as Array<Record<string, unknown>>) || [];
    statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      agentId: claims.sub,
    });
    updates['data.statusHistory'] = statusHistory;
  }

  // Add note
  if (body.note) {
    const notes = (leadData.notes as Array<Record<string, unknown>>) || [];
    notes.push({
      agentId: claims.sub,
      text: body.note as string,
      timestamp: new Date().toISOString(),
    });
    updates['data.notes'] = notes;
  }

  // Reassign agent (admin only)
  if (body.assignedAgentId) {
    requirePermission(claims, 'update_any_lead', correlationId);
    updates['data.assignedAgentId'] = body.assignedAgentId;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'No updates provided', correlationId);
  }

  await updateItem(`LEAD#${leadId}`, `LEAD#${leadId}`, updates);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ leadId, updated: true }),
  };
}

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
// Performance metrics handler
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/performance — Performance metrics (admin only).
 */
async function handlePerformance(
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'view_team_performance', correlationId);

  // Get all team agents
  const teamResult = await queryGSI1(`TEAM#${claims.teamId}`);
  const agents = teamResult.items
    .map((item) => item.data as Record<string, unknown>)
    .filter(Boolean);

  // For each agent, count leads by status
  const agentMetrics: Array<Record<string, unknown>> = [];

  for (const agent of agents) {
    const agentId = agent.agentId as string;
    const leadsResult = await queryGSI1(`AGENT#${agentId}`, {
      skCondition: { operator: 'begins_with', value: 'LEAD#' },
      limit: 1000,
    });

    const leads = leadsResult.items
      .map((item) => item.data as Record<string, unknown>)
      .filter(Boolean);

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const lead of leads) {
      const status = lead.leadStatus as string;
      const type = lead.leadType as string;
      const source = lead.toolSource as string;
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      byType[type] = (byType[type] ?? 0) + 1;
      bySource[source] = (bySource[source] ?? 0) + 1;
    }

    const closed = byStatus['Closed'] ?? 0;
    const total = leads.length;

    agentMetrics.push({
      agentId,
      name: agent.name,
      email: agent.email,
      totalLeads: total,
      conversionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      leadsByStatus: byStatus,
      leadsByType: byType,
      leadsBySource: bySource,
    });
  }

  // Team summary
  const totalLeads = agentMetrics.reduce((sum, a) => sum + (a.totalLeads as number), 0);
  const totalClosed = agentMetrics.reduce(
    (sum, a) => sum + ((a.leadsByStatus as Record<string, number>)['Closed'] ?? 0),
    0,
  );

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      agents: agentMetrics,
      teamSummary: {
        totalLeads,
        totalClosed,
        conversionRate: totalLeads > 0 ? Math.round((totalClosed / totalLeads) * 100) : 0,
        agentCount: agents.length,
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// Listing management handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/listings — List flat-fee listings.
 */
async function handleListListings(
  claims: AuthClaims,
  correlationId: string,
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

/** Parse query string parameters from the event. */
function parseQueryParams(event: AuthorizedEvent): Record<string, string> {
  const raw = (event as Record<string, unknown>).queryStringParameters as
    | Record<string, string | undefined>
    | null;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value) result[key] = value;
  }
  return result;
}

/** Extract a path parameter like {id} from the path. */
function extractPathParam(path: string, prefix: string): string | null {
  // e.g. path="/api/v1/dashboard/leads/abc-123", prefix="/leads/"
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

    // --- Lead management ---
    if (path.match(/\/dashboard\/leads\/?$/) && method === 'GET') {
      return await handleListLeads(event, claims, correlationId);
    }

    if (path.match(/\/dashboard\/leads\/[^/]+$/) && method === 'GET') {
      const leadId = extractPathParam(path, '/leads/');
      if (!leadId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Lead ID required', correlationId);
      return await handleGetLead(leadId, claims, correlationId);
    }

    if (path.match(/\/dashboard\/leads\/[^/]+$/) && method === 'PATCH') {
      const leadId = extractPathParam(path, '/leads/');
      if (!leadId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Lead ID required', correlationId);
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleUpdateLead(leadId, body, claims, correlationId);
    }

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

    // --- Notifications ---
    if (path.match(/\/dashboard\/notifications\/settings\/?$/) && method === 'GET') {
      return await handleGetNotificationSettings(claims);
    }

    if (path.match(/\/dashboard\/notifications\/settings\/?$/) && method === 'PUT') {
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Request body required', correlationId);
      const body = JSON.parse(event.body) as Record<string, unknown>;
      return await handleUpdateNotificationSettings(body, claims, correlationId);
    }

    // --- Performance ---
    if (path.match(/\/dashboard\/performance\/?$/) && method === 'GET') {
      return await handlePerformance(claims, correlationId);
    }

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

    console.error('[dashboard-api] Unexpected error:', error);
    return toLambdaResponse(
      new AppError(ErrorCode.UPSTREAM_ERROR, 'Internal server error', correlationId),
    );
  }
}
