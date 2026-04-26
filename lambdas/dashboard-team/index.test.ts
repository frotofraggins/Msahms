/**
 * Tests for the dashboard-team Lambda handler.
 *
 * Covers team management and permission enforcement.
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

import { getItem, queryGSI1, updateItem, putItem } from '../../lib/dynamodb.js';

const mockGetItem = vi.mocked(getItem);
const mockQueryGSI1 = vi.mocked(queryGSI1);
const mockUpdateItem = vi.mocked(updateItem);
const mockPutItem = vi.mocked(putItem);

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
// Team management tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/dashboard/team', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return team roster for admin', async () => {
    mockQueryGSI1.mockResolvedValue({
      items: [
        { PK: 'AGENT#a1', SK: 'AGENT#a1', data: { agentId: 'a1', name: 'Agent One' } },
      ],
      lastKey: undefined,
    });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/team', null, 'Team_Admin'));
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.count).toBe(1);
  });

  it('should return 403 for non-admin', async () => {
    const result = await handler(makeEvent('GET', '/api/v1/dashboard/team'));
    expect(result.statusCode).toBe(403);
  });
});

describe('POST /api/v1/dashboard/team/invite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create invite for admin', async () => {
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('POST', '/api/v1/dashboard/team/invite', { email: 'new@mesa.com' }, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(201);
    const body = parseBody(result.body);
    expect(body.agentId).toBeDefined();
    expect(body.inviteToken).toBeDefined();
    expect(body.registrationUrl).toBeDefined();
  });

  it('should return 400 when email is missing', async () => {
    const result = await handler(
      makeEvent('POST', '/api/v1/dashboard/team/invite', {}, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const result = await handler(
      makeEvent('POST', '/api/v1/dashboard/team/invite', { email: 'new@mesa.com' }),
    );
    expect(result.statusCode).toBe(403);
  });
});

describe('PATCH /api/v1/dashboard/team/{agentId}', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should deactivate agent for admin', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'AGENT#a1',
      SK: 'AGENT#a1',
      data: { agentId: 'a1', status: 'active' },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/team/a1', { status: 'deactivated' }, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should return 403 for non-admin', async () => {
    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/team/a1', { status: 'deactivated' }),
    );
    expect(result.statusCode).toBe(403);
  });

  it('should return 404 for non-existent agent', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/team/nope', { status: 'deactivated' }, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// General handler tests
// ---------------------------------------------------------------------------

describe('handler general', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 200 for OPTIONS preflight', async () => {
    const result = await handler(makeEvent('OPTIONS', '/api/v1/dashboard/team'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 401 when no auth claims', async () => {
    const result = await handler({
      httpMethod: 'GET',
      path: '/api/v1/dashboard/team',
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
