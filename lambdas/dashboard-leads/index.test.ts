/**
 * Tests for the dashboard-leads Lambda handler.
 *
 * Covers lead management, performance metrics, and permission enforcement.
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
// Lead management tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/dashboard/leads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return leads for an agent (own leads only)', async () => {
    mockQueryGSI1.mockResolvedValue({
      items: [
        { PK: 'LEAD#1', SK: 'LEAD#1', data: { leadId: '1', name: 'John', assignedAgentId: 'agent-sub-1' } },
      ],
      lastKey: undefined,
    });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads'));
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.count).toBe(1);
    expect(mockQueryGSI1).toHaveBeenCalledWith(
      'AGENT#agent-sub-1',
      expect.objectContaining({ skCondition: { operator: 'begins_with', value: 'LEAD#' } }),
    );
  });

  it('should return all team leads for admin', async () => {
    // First call: get team agents
    mockQueryGSI1
      .mockResolvedValueOnce({
        items: [{ PK: 'AGENT#a1', SK: 'AGENT#a1', data: { agentId: 'a1' } }],
        lastKey: undefined,
      })
      // Second call: agent's leads
      .mockResolvedValueOnce({
        items: [{ PK: 'LEAD#1', SK: 'LEAD#1', data: { leadId: '1', name: 'Lead 1' } }],
        lastKey: undefined,
      })
      // Third call: unassigned leads
      .mockResolvedValueOnce({
        items: [],
        lastKey: undefined,
      });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads', null, 'Team_Admin'));
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.count).toBe(1);
  });
});

describe('GET /api/v1/dashboard/leads/{id}', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return lead detail for own lead', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-1',
      SK: 'LEAD#lead-1',
      data: { leadId: 'lead-1', name: 'Jane', assignedAgentId: 'agent-sub-1' },
    });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads/lead-1'));
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect((body.lead as Record<string, unknown>).leadId).toBe('lead-1');
  });

  it('should return 403 when agent tries to view another agents lead', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-2',
      SK: 'LEAD#lead-2',
      data: { leadId: 'lead-2', assignedAgentId: 'other-agent' },
    });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads/lead-2'));
    expect(result.statusCode).toBe(403);
  });

  it('should return 404 for non-existent lead', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads/nope'));
    expect(result.statusCode).toBe(404);
  });

  it('admin can view any lead', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-3',
      SK: 'LEAD#lead-3',
      data: { leadId: 'lead-3', assignedAgentId: 'other-agent' },
    });

    const result = await handler(makeEvent('GET', '/api/v1/dashboard/leads/lead-3', null, 'Team_Admin'));
    expect(result.statusCode).toBe(200);
  });
});

describe('PATCH /api/v1/dashboard/leads/{id}', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should update lead status', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-1',
      SK: 'LEAD#lead-1',
      data: { leadId: 'lead-1', assignedAgentId: 'agent-sub-1', statusHistory: [] },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/leads/lead-1', { status: 'Contacted' }),
    );
    expect(result.statusCode).toBe(200);
    expect(mockUpdateItem).toHaveBeenCalled();
  });

  it('should add a note to a lead', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-1',
      SK: 'LEAD#lead-1',
      data: { leadId: 'lead-1', assignedAgentId: 'agent-sub-1', notes: [] },
    });
    mockUpdateItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/leads/lead-1', { note: 'Called, left voicemail' }),
    );
    expect(result.statusCode).toBe(200);
  });

  it('should return 400 for invalid status', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-1',
      SK: 'LEAD#lead-1',
      data: { leadId: 'lead-1', assignedAgentId: 'agent-sub-1' },
    });

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/leads/lead-1', { status: 'InvalidStatus' }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 403 when agent updates another agents lead', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-2',
      SK: 'LEAD#lead-2',
      data: { leadId: 'lead-2', assignedAgentId: 'other-agent' },
    });

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/leads/lead-2', { status: 'Contacted' }),
    );
    expect(result.statusCode).toBe(403);
  });

  it('should return 400 when no updates provided', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'LEAD#lead-1',
      SK: 'LEAD#lead-1',
      data: { leadId: 'lead-1', assignedAgentId: 'agent-sub-1' },
    });

    const result = await handler(
      makeEvent('PATCH', '/api/v1/dashboard/leads/lead-1', {}),
    );
    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Performance metrics tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/dashboard/performance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return performance metrics for admin', async () => {
    mockQueryGSI1
      .mockResolvedValueOnce({
        items: [{ PK: 'AGENT#a1', SK: 'AGENT#a1', data: { agentId: 'a1', name: 'Agent 1' } }],
        lastKey: undefined,
      })
      .mockResolvedValueOnce({
        items: [
          { PK: 'LEAD#1', SK: 'LEAD#1', data: { leadStatus: 'Closed', leadType: 'Buyer', toolSource: 'net-sheet' } },
          { PK: 'LEAD#2', SK: 'LEAD#2', data: { leadStatus: 'New', leadType: 'Seller', toolSource: 'home-value' } },
        ],
        lastKey: undefined,
      });

    const result = await handler(
      makeEvent('GET', '/api/v1/dashboard/performance', null, 'Team_Admin'),
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect((body.teamSummary as Record<string, unknown>).totalLeads).toBe(2);
    expect((body.teamSummary as Record<string, unknown>).totalClosed).toBe(1);
    expect((body.teamSummary as Record<string, unknown>).conversionRate).toBe(50);
  });

  it('should return 403 for non-admin', async () => {
    const result = await handler(
      makeEvent('GET', '/api/v1/dashboard/performance'),
    );
    expect(result.statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// General handler tests
// ---------------------------------------------------------------------------

describe('handler general', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 200 for OPTIONS preflight', async () => {
    const result = await handler(makeEvent('OPTIONS', '/api/v1/dashboard/leads'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 401 when no auth claims', async () => {
    const result = await handler({
      httpMethod: 'GET',
      path: '/api/v1/dashboard/leads',
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
