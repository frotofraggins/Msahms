/**
 * Lambda handler for the MesaHomes content-api service.
 *
 * Routes requests to the correct content query:
 *   GET /api/v1/content/city/{slug}  → City page data
 *   GET /api/v1/content/blog         → Blog post listing (sorted by date)
 *   GET /api/v1/content/blog/{slug}  → Single blog post
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 5s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import { getItem, queryGSI1 } from '../../lib/dynamodb.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** API Gateway Lambda proxy integration event (minimal shape). */
interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
  pathParameters?: Record<string, string | undefined> | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  requestContext?: { requestId?: string };
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

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/content/city/{slug} — City page data.
 *
 * Reads from DynamoDB: PK=CONTENT#CITY#{slug}, SK=CONTENT#CITY#{slug}
 */
async function handleCityPage(
  slug: string,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  if (!slug || slug.trim().length === 0) {
    throw new AppError(ErrorCode.MISSING_FIELD, 'City slug is required', correlationId);
  }

  const item = await getItem(`CONTENT#CITY#${slug}`, `CONTENT#CITY#${slug}`);

  if (!item) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `City page not found: ${slug}`,
      correlationId,
    );
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(item.data),
  };
}

/**
 * GET /api/v1/content/blog — List published blog posts sorted by date.
 *
 * Queries GSI1: GSI1PK=CONTENT#BLOG, sorted by GSI1SK (publishDate).
 * Returns posts in reverse chronological order (newest first).
 */
async function handleBlogList(
  event: APIGatewayEvent,
  _correlationId: string,
): Promise<LambdaProxyResponse> {
  const limit = parseInt(event.queryStringParameters?.limit ?? '20', 10);
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const result = await queryGSI1('CONTENT#BLOG', {
    scanForward: false, // Newest first
    limit: safeLimit,
  });

  // Filter to only published posts
  const posts = result.items
    .map((item) => item.data)
    .filter((data) => data.status === 'published');

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      posts,
      count: posts.length,
    }),
  };
}

/**
 * GET /api/v1/content/blog/{slug} — Single blog post.
 *
 * Reads from DynamoDB: PK=CONTENT#BLOG#{slug}, SK=CONTENT#BLOG#{slug}
 */
async function handleBlogPost(
  slug: string,
  correlationId: string,
): Promise<LambdaProxyResponse> {
  if (!slug || slug.trim().length === 0) {
    throw new AppError(ErrorCode.MISSING_FIELD, 'Blog slug is required', correlationId);
  }

  const item = await getItem(`CONTENT#BLOG#${slug}`, `CONTENT#BLOG#${slug}`);

  if (!item) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Blog post not found: ${slug}`,
      correlationId,
    );
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(item.data),
  };
}

// ---------------------------------------------------------------------------
// Path parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the slug from a path like /api/v1/content/city/{slug}
 * or /api/v1/content/blog/{slug}.
 */
function extractSlug(
  event: APIGatewayEvent,
  prefix: string,
  paramName: string,
): string | undefined {
  // Try pathParameters first (API Gateway)
  if (event.pathParameters?.[paramName]) {
    return event.pathParameters[paramName];
  }

  // Fall back to manual path parsing
  const prefixIndex = event.path.indexOf(prefix);
  if (prefixIndex === -1) return undefined;

  const afterPrefix = event.path.substring(prefixIndex + prefix.length);
  // Return the next path segment (no trailing slash)
  const slug = afterPrefix.split('/')[0];
  return slug || undefined;
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
    if (event.httpMethod !== 'GET') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Only GET is supported', correlationId);
    }

    const path = event.path;

    // GET /api/v1/content/city/{slug}
    if (path.includes('/content/city/')) {
      const slug = extractSlug(event, '/content/city/', 'slug');
      if (!slug) {
        throw new AppError(ErrorCode.MISSING_FIELD, 'City slug is required', correlationId);
      }
      return await handleCityPage(slug, correlationId);
    }

    // GET /api/v1/content/blog/{slug} — must check before /content/blog
    if (path.includes('/content/blog/')) {
      const slug = extractSlug(event, '/content/blog/', 'slug');
      if (!slug) {
        throw new AppError(ErrorCode.MISSING_FIELD, 'Blog slug is required', correlationId);
      }
      return await handleBlogPost(slug, correlationId);
    }

    // GET /api/v1/content/blog
    if (path.endsWith('/content/blog')) {
      return await handleBlogList(event, correlationId);
    }

    throw new AppError(ErrorCode.NOT_FOUND, `Unknown path: ${path}`, correlationId);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return toLambdaResponse(error);
    }

    console.error('[content-api] Unexpected error:', error);
    const appError = new AppError(
      ErrorCode.UPSTREAM_ERROR,
      'Internal server error',
      correlationId,
    );
    return toLambdaResponse(appError);
  }
}
