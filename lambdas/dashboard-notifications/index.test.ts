/**
 * Tests for the dashboard-notifications Lambda handler.
 *
 * Covers notification preferences and permission enforcement.
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

import { getItem, putItem } from '../../lib/dynamodb.js';

const mockGetItem = vi.mocked(getItem);
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
// Notification preferences tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/dashboard/notifications/settings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return notification preferences', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'AGENT#agent-sub-1',
      SK: 'NOTIF_PREFS',
      data: { newLead: 'email-sms', statusChange: 'email' },
    });

    const result = await handler(
      makeEvent('GET', '/api/v1/dashboard/notifications/settings'),
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect((body.preferences as Record<string, unknown>).newLead).toBe('email-sms');
  });

  it('should return defaults when no prefs exist', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('GET', '/api/v1/dashboard/notifications/settings'),
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect((body.preferences as Record<string, unknown>).newLead).toBe('email');
  });
});

describe('PUT /api/v1/dashboard/notifications/settings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should update notification preferences', async () => {
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('PUT', '/api/v1/dashboard/notifications/settings', {
        newLead: 'email-sms',
        statusChange: 'none',
      }),
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect((body.preferences as Record<string, unknown>).newLead).toBe('email-sms');
    expect((body.preferences as Record<string, unknown>).statusChange).toBe('none');
  });

  it('should return 400 for invalid preference value', async () => {
    const result = await handler(
      makeEvent('PUT', '/api/v1/dashboard/notifications/settings', {
        newLead: 'invalid',
      }),
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
    const result = await handler(makeEvent('OPTIONS', '/api/v1/dashboard/notifications/settings'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 401 when no auth claims', async () => {
    const result = await handler({
      httpMethod: 'GET',
      path: '/api/v1/dashboard/notifications/settings',
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
