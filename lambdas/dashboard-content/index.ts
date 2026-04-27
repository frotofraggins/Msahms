/**
 * Dashboard API for content drafts.
 *
 * Routes (all Cognito-authenticated, Team_Admin + Agent roles):
 *   GET  /api/v1/dashboard/content/drafts         — list pending drafts
 *   GET  /api/v1/dashboard/content/drafts/{id}    — get one
 *   PATCH /api/v1/dashboard/content/drafts/{id}   — edit + status change
 *   POST /api/v1/dashboard/content/drafts/{id}/approve — publish
 *
 * See .kiro/specs/content-pipeline-phase-2.md §2D
 */

import { queryGSI1, getItem, updateItem, putItem } from '../../lib/dynamodb.js';
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
import { EntityType } from '../../lib/types/dynamodb.js';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
};

/** Interface mirrors Draft from content-drafter. */
interface DraftRecord {
  draftId: string;
  bundleId: string;
  topic: string;
  title: string;
  slug: string;
  metaDescription: string;
  bodyMarkdown: string;
  citationSources: Array<{ url: string; attribution: string }>;
  photos: Array<{
    url: string;
    attribution: string;
    license: string;
    sourceUrl: string;
    alt: string;
  }>;
  status: 'pending-review' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  modelUsed: string;
  inputTokens?: number;
  outputTokens?: number;
}

// ---------------------------------------------------------------------------
// List pending drafts
// ---------------------------------------------------------------------------

async function handleList(claims: AuthClaims, correlationId: string): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'view_team_performance', correlationId);

  const res = await queryGSI1('DRAFT#PENDING', {
    scanForward: false,
    limit: 50,
  });

  const drafts = (res.items ?? []).map((item) => {
    const d = (item as unknown as { data: DraftRecord }).data;
    return {
      draftId: d.draftId,
      title: d.title,
      topic: d.topic,
      slug: d.slug,
      metaDescription: d.metaDescription,
      citationCount: d.citationSources?.length ?? 0,
      photoCount: d.photos?.length ?? 0,
      createdAt: d.createdAt,
      status: d.status,
      modelUsed: d.modelUsed,
    };
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ drafts }),
  };
}

// ---------------------------------------------------------------------------
// Get one draft
// ---------------------------------------------------------------------------

async function handleGet(
  draftId: string,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'view_team_performance', correlationId);

  const item = await getItem(`CONTENT#DRAFT#${draftId}`, 'v1');
  if (!item) throw new AppError(ErrorCode.NOT_FOUND, 'Draft not found', correlationId);

  const d = (item as unknown as { data: DraftRecord }).data;
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ draft: d }),
  };
}

// ---------------------------------------------------------------------------
// Edit draft (title, body, meta, slug)
// ---------------------------------------------------------------------------

async function handleUpdate(
  draftId: string,
  body: Partial<DraftRecord>,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'update_any_lead', correlationId);

  const existing = await getItem(`CONTENT#DRAFT#${draftId}`, 'v1');
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Draft not found', correlationId);

  // Allowlist — only these fields can change via update
  const allowedFields: (keyof DraftRecord)[] = [
    'title',
    'slug',
    'metaDescription',
    'bodyMarkdown',
    'photos',
  ];
  const existingData = (existing as unknown as { data: DraftRecord }).data;
  const merged: DraftRecord = { ...existingData };
  for (const field of allowedFields) {
    if (field in body) {
      (merged as unknown as Record<string, unknown>)[field] = body[field];
    }
  }
  merged.updatedAt = new Date().toISOString();

  await updateItem(`CONTENT#DRAFT#${draftId}`, 'v1', {
    data: merged,
    updatedAt: merged.updatedAt,
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ draft: merged }),
  };
}

// ---------------------------------------------------------------------------
// Approve (publishes to CONTENT#BLOG#{slug})
// ---------------------------------------------------------------------------

async function handleApprove(
  draftId: string,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'update_any_lead', correlationId);

  const existing = await getItem(`CONTENT#DRAFT#${draftId}`, 'v1');
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Draft not found', correlationId);

  const d = (existing as unknown as { data: DraftRecord }).data;
  if (d.status !== 'pending-review') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Draft is not pending review (status=${d.status})`,
      correlationId,
    );
  }

  const now = new Date().toISOString();

  // Publish to content table: PK=CONTENT#BLOG#{slug}
  await putItem({
    PK: `CONTENT#BLOG#${d.slug}`,
    SK: 'v1',
    GSI1PK: 'BLOG#PUBLISHED',
    GSI1SK: now,
    entityType: EntityType.CONTENT,
    data: {
      ...d,
      status: 'published',
      publishedAt: now,
    },
    createdAt: d.createdAt,
    updatedAt: now,
  });

  // Mark draft as published (keep for audit, don't delete)
  await updateItem(`CONTENT#DRAFT#${draftId}`, 'v1', {
    data: { ...d, status: 'published', publishedAt: now },
    GSI1PK: 'DRAFT#PUBLISHED', // move out of PENDING feed
    GSI1SK: now,
    updatedAt: now,
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      draftId,
      slug: d.slug,
      publishedUrl: `https://mesahomes.com/blog/${d.slug}`,
    }),
  };
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

async function handleReject(
  draftId: string,
  claims: AuthClaims,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  requirePermission(claims, 'update_any_lead', correlationId);

  const existing = await getItem(`CONTENT#DRAFT#${draftId}`, 'v1');
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Draft not found', correlationId);

  const d = (existing as unknown as { data: DraftRecord }).data;
  const now = new Date().toISOString();

  await updateItem(`CONTENT#DRAFT#${draftId}`, 'v1', {
    data: { ...d, status: 'rejected', rejectedAt: now },
    GSI1PK: 'DRAFT#REJECTED',
    GSI1SK: now,
    updatedAt: now,
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ draftId, status: 'rejected' }),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

function extractPath(event: AuthorizedEvent): string {
  return event.path ?? '';
}

function extractPathParam(path: string, prefix: string): string | undefined {
  const idx = path.indexOf(prefix);
  if (idx < 0) return undefined;
  const rest = path.slice(idx + prefix.length);
  return rest.split('/')[0] || undefined;
}

export async function handler(event: AuthorizedEvent): Promise<LambdaProxyResponse> {
  const correlationId = generateCorrelationId();
  const method = event.httpMethod ?? 'GET';
  const path = extractPath(event);

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const claims = extractClaims(event, correlationId);

    if (path.match(/\/dashboard\/content\/drafts\/?$/) && method === 'GET') {
      return await handleList(claims, correlationId);
    }

    if (path.match(/\/dashboard\/content\/drafts\/[^/]+\/approve$/) && method === 'POST') {
      const draftId = extractPathParam(path, '/drafts/');
      if (!draftId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Draft ID required', correlationId);
      return await handleApprove(draftId, claims, correlationId);
    }

    if (path.match(/\/dashboard\/content\/drafts\/[^/]+\/reject$/) && method === 'POST') {
      const draftId = extractPathParam(path, '/drafts/');
      if (!draftId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Draft ID required', correlationId);
      return await handleReject(draftId, claims, correlationId);
    }

    if (path.match(/\/dashboard\/content\/drafts\/[^/]+$/) && method === 'GET') {
      const draftId = extractPathParam(path, '/drafts/');
      if (!draftId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Draft ID required', correlationId);
      return await handleGet(draftId, claims, correlationId);
    }

    if (path.match(/\/dashboard\/content\/drafts\/[^/]+$/) && method === 'PATCH') {
      const draftId = extractPathParam(path, '/drafts/');
      if (!draftId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Draft ID required', correlationId);
      if (!event.body) throw new AppError(ErrorCode.MISSING_FIELD, 'Body required', correlationId);
      const body = JSON.parse(event.body) as Partial<DraftRecord>;
      return await handleUpdate(draftId, body, claims, correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `No route matched: ${method} ${path}`, correlationId);
  } catch (err) {
    if (err instanceof AppError) return toLambdaResponse(err);
    console.error('[dashboard-content] unexpected:', err);
    return toLambdaResponse(new AppError(ErrorCode.STORAGE_ERROR, 'Internal error', correlationId));
  }
}
