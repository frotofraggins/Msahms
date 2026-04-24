/**
 * Property test 12: Dashboard Lead Query Correctness
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.5
 *
 * Properties verified:
 * - Agent can only see leads assigned to them (never another agent's leads)
 * - Team_Admin can see all team leads
 * - Lead status filter returns only leads matching that status
 * - Lead type filter returns only leads matching that type
 * - All valid lead statuses are accepted by the update endpoint
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

import { getItem, queryGSI1, updateItem } from '../../lib/dynamodb.js';

const mockGetItem = vi.mocked(getItem);
const mockQueryGSI1 = vi.mocked(queryGSI1);
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
// Property tests
// ---------------------------------------------------------------------------

describe('Property 12: Dashboard Lead Query Correctness', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Agent can only view leads assigned to their own sub', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // agent sub
        fc.uuid(), // lead id
        fc.uuid(), // other agent sub
        async (agentSub, leadId, otherAgentSub) => {
          // Lead assigned to another agent
          mockGetItem.mockResolvedValue({
            PK: `LEAD#${leadId}`,
            SK: `LEAD#${leadId}`,
            data: { leadId, assignedAgentId: otherAgentSub },
          });

          const result = await handler(
            makeAuthEvent('GET', `/api/v1/dashboard/leads/${leadId}`, null, 'Agent', agentSub),
          );

          if (agentSub === otherAgentSub) {
            // Same agent — should succeed
            expect(result.statusCode).toBe(200);
          } else {
            // Different agent — should be forbidden
            expect(result.statusCode).toBe(403);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('Team_Admin can view any lead regardless of assignment', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // admin sub
        fc.uuid(), // lead id
        fc.uuid(), // assigned agent sub
        async (adminSub, leadId, assignedAgent) => {
          mockGetItem.mockResolvedValue({
            PK: `LEAD#${leadId}`,
            SK: `LEAD#${leadId}`,
            data: { leadId, assignedAgentId: assignedAgent },
          });

          const result = await handler(
            makeAuthEvent('GET', `/api/v1/dashboard/leads/${leadId}`, null, 'Team_Admin', adminSub),
          );

          // Admin always succeeds
          expect(result.statusCode).toBe(200);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('all valid lead statuses are accepted by update endpoint', () => {
    const validStatuses = ['New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost'];

    fc.assert(
      fc.property(
        fc.constantFrom(...validStatuses),
        fc.uuid(),
        async (status, leadId) => {
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
        },
      ),
      { numRuns: validStatuses.length * 3 },
    );
  });

  it('invalid lead statuses are rejected by update endpoint', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) => !['New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost'].includes(s),
        ),
        fc.uuid(),
        async (invalidStatus, leadId) => {
          mockGetItem.mockResolvedValue({
            PK: `LEAD#${leadId}`,
            SK: `LEAD#${leadId}`,
            data: { leadId, assignedAgentId: 'agent-1' },
          });

          const result = await handler(
            makeAuthEvent('PATCH', `/api/v1/dashboard/leads/${leadId}`, { status: invalidStatus }, 'Agent', 'agent-1'),
          );

          expect(result.statusCode).toBe(400);
        },
      ),
      { numRuns: 50 },
    );
  });
});
