/**
 * Property test 12: Dashboard Lead Query Correctness
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.5
 *
 * Properties verified:
 * - Agent can only see leads assigned to them (never another agent's leads)
 * - Team_Admin can see any lead regardless of assignment
 * - All valid lead statuses are accepted by the update endpoint
 * - Invalid lead statuses are rejected by the update endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
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

import { getItem, updateItem } from '../../lib/dynamodb.js';

const mockGetItem = vi.mocked(getItem);
const mockUpdateItem = vi.mocked(updateItem);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAuthEvent(
  method: string,
  path: string,
  body: Record<string, unknown> | null,
  role: 'Agent' | 'Team_Admin',
  sub: string,
) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    requestContext: {
      requestId: 'test',
      authorizer: {
        claims: {
          sub,
          email: `${sub}@mesa.com`,
          'custom:role': role,
          'custom:teamId': 'team-1',
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Property tests — using fc.sample + async loops
// ---------------------------------------------------------------------------

describe('Property 12: Dashboard Lead Query Correctness', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Agent can only view leads assigned to their own sub', async () => {
    const cases = fc.sample(fc.tuple(fc.uuid(), fc.uuid(), fc.uuid()), 50);

    for (const [agentSub, leadId, otherAgentSub] of cases) {
      mockGetItem.mockReset();
      mockGetItem.mockResolvedValue({
        PK: `LEAD#${leadId}`,
        SK: `LEAD#${leadId}`,
        data: { leadId, assignedAgentId: otherAgentSub },
      });

      const result = await handler(
        makeAuthEvent('GET', `/api/v1/dashboard/leads/${leadId}`, null, 'Agent', agentSub),
      );

      if (agentSub === otherAgentSub) {
        expect(result.statusCode).toBe(200);
      } else {
        expect(result.statusCode).toBe(403);
      }
    }
  });

  it('Team_Admin can view any lead regardless of assignment', async () => {
    const cases = fc.sample(fc.tuple(fc.uuid(), fc.uuid(), fc.uuid()), 50);

    for (const [adminSub, leadId, assignedAgent] of cases) {
      mockGetItem.mockReset();
      mockGetItem.mockResolvedValue({
        PK: `LEAD#${leadId}`,
        SK: `LEAD#${leadId}`,
        data: { leadId, assignedAgentId: assignedAgent },
      });

      const result = await handler(
        makeAuthEvent('GET', `/api/v1/dashboard/leads/${leadId}`, null, 'Team_Admin', adminSub),
      );

      expect(result.statusCode).toBe(200);
    }
  });

  it('all valid lead statuses are accepted by update endpoint', async () => {
    const validStatuses = ['New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost'];
    const cases = fc.sample(
      fc.tuple(fc.constantFrom(...validStatuses), fc.uuid()),
      validStatuses.length * 3,
    );

    for (const [status, leadId] of cases) {
      mockGetItem.mockReset();
      mockUpdateItem.mockReset();
      mockGetItem.mockResolvedValue({
        PK: `LEAD#${leadId}`,
        SK: `LEAD#${leadId}`,
        data: { leadId, assignedAgentId: 'agent-1', statusHistory: [] },
      });
      mockUpdateItem.mockResolvedValue(undefined);

      const result = await handler(
        makeAuthEvent('PATCH', `/api/v1/dashboard/leads/${leadId}`, { status }, 'Agent', 'agent-1'),
      );

      expect(result.statusCode).toBe(200);
    }
  });

  it('invalid lead statuses are rejected by update endpoint', async () => {
    const validSet = new Set(['New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost']);
    const cases = fc.sample(
      fc.tuple(
        fc.stringMatching(/^[A-Za-z_]{2,20}$/).filter((s) => !validSet.has(s)),
        fc.uuid(),
      ),
      50,
    );

    for (const [invalidStatus, leadId] of cases) {
      mockGetItem.mockReset();
      mockGetItem.mockResolvedValue({
        PK: `LEAD#${leadId}`,
        SK: `LEAD#${leadId}`,
        data: { leadId, assignedAgentId: 'agent-1' },
      });

      const result = await handler(
        makeAuthEvent('PATCH', `/api/v1/dashboard/leads/${leadId}`, { status: invalidStatus }, 'Agent', 'agent-1'),
      );

      expect(result.statusCode).toBe(400);
    }
  });
});
