/**
 * Tests for the dashboard-listings Lambda handler.
 *
 * Covers listing management and permission enforcement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './index.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: vi.fn(),
  queryByPK: vi.fn(),
  queryGSI1: vi.fn(),
  updateItem: vi.fn(),
  putItem: vi.fn(),
}));

import { getItem, queryGSI1, updateItem } from '../../lib/dynamodb.js';

const mockGetItem = vi.mocked(getItem);
const mockQueryGSI1 = vi.mocked(queryGSI1);
const mockUpdateItem = vi.mocked(updateItem);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  method: string,
  path: string,
  body: Record<string, unknown> | null = null,
  role: 'Agent' | 'Team_Admin' = 'Agent',
  sub = 'agent-sub-1',
) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    requestContext: {
      requestId: 'test-corr',
      authorizer: {
        claims: {
          sub,
          email: `${role.toLowerCase()}@mesa.com`,
          'custom:role': role,
          'custom:teamId': 'team-1',
        },
      },
    },
  };
}

function parseBody(body: string) {
  return JSON.parse(body) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Listing management tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/dashboard/listings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return listings', async () => {
    // Mock 7 status queries (one per status)
    for (let i = 0; i < 7; i++) {
      mockQueryGSI1.mockResolvedValueOnce({
        items: i === 0
          ? [{ PK: 'LISTING#l1', SK: 'LISTING#l1', data: { listingId: 'l1', status: 'draft' } }]
          : [],
        lastKey: undefined,
      });
    }

    const result = await handler(
      makeEvent('GET', '/api/v1/dashboard/listings'),
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.count).toBe(1);
  });
});

describe('PATCH /api/v1/dashboard/listings/{id}', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should update listing status for admin', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l1',
      SK: 'LISTING#l1',
      data: { listingId: 'l1', status: 'paid' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/listings/l1', { status: 'mls-pending' }, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should return 403 for non-admin', async () => {
    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/listings/l1', { status: 'active' }),
    );
    expect(result.statusCode).toBe(403);
  });

  it('should return 400 for invalid listing status', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LISTING#l1',
      SK: 'LISTING#l1',
      data: { listingId: 'l1' },
    });

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/listings/l1', { status: 'bogus' }, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// General handler tests
// ---------------------------------------------------------------------------

describe('handler general', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 200 for OPTIONS preflight', async () => {
    const result = await handler(makeEvent('OPTIONS', '/api/v1/dashboard/listings'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 401 when no auth claims', async () => {
    const result = await handler({
      httpMethod: 'GET',
      path: '/api/v1/dashboard/listings',
      body: null,
      headers: {},
      requestContext: { requestId: 'test' },
    });
    expect(result.statusCode).toBe(401);
  });

  it('should return 404 for unknown path', async () => {
    const result = await handler(makeEvent('GET', '/api/v1/dashboard/unknown'));
    expect(result.statusCode).toBe(404);
  });
});
