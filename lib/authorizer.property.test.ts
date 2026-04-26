/**
 * Property test 15: Permission Enforcement
 *
 * Validates: Requirements 18.4, 18.5
 *
 * Properties verified:
 * - Team_Admin has a superset of Agent permissions (every action Agent can do, Admin can too)
 * - Agent can never perform admin-only actions
 * - requirePermission throws FORBIDDEN for unauthorized actions, never for authorized ones
 * - extractClaims rejects any event missing required claim fields
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  hasPermission,
  requirePermission,
  extractClaims,
  type PermissionAction,
  type AuthorizedEvent,
} from './authorizer.js';
import { AppError, ErrorCode } from './errors.js';
import type { AgentRole } from './types/agent.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const allActions: PermissionAction[] = [
  'view_own_leads',
  'view_all_team_leads',
  'update_own_lead',
  'update_any_lead',
  'invite_agent',
  'deactivate_agent',
  'view_team_performance',
  'manage_listings',
  'update_own_notifications',
];

const actionArb = fc.constantFrom(...allActions);
const roleArb = fc.constantFrom<AgentRole>('Agent', 'Team_Admin');

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 15: Permission Enforcement', () => {
  it('Team_Admin permissions are a superset of Agent permissions', () => {
    fc.assert(
      fc.property(actionArb, (action) => {
        const agentAllowed = hasPermission('Agent', action);
        const adminAllowed = hasPermission('Team_Admin', action);

        // If Agent can do it, Admin must also be able to
        if (agentAllowed) {
          expect(adminAllowed).toBe(true);
        }
        // Admin can always do at least as much as Agent
      }),
      { numRuns: allActions.length * 5 },
    );
  });

  it('Agent cannot perform any admin-only action', () => {
    const adminOnlyActions: PermissionAction[] = [
      'view_all_team_leads',
      'update_any_lead',
      'invite_agent',
      'deactivate_agent',
      'view_team_performance',
      'manage_listings',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...adminOnlyActions), (action) => {
        expect(hasPermission('Agent', action)).toBe(false);
        expect(hasPermission('Team_Admin', action)).toBe(true);
      }),
      { numRuns: adminOnlyActions.length * 5 },
    );
  });

  it('requirePermission throws FORBIDDEN iff hasPermission returns false', () => {
    fc.assert(
      fc.property(
        roleArb,
        actionArb,
        fc.uuid(),
        (role, action, correlationId) => {
          const claims = { sub: 's', email: 'e@e.com', role, teamId: 't' };
          const allowed = hasPermission(role, action);

          if (allowed) {
            // Should not throw
            expect(() => requirePermission(claims, action, correlationId)).not.toThrow();
          } else {
            // Should throw FORBIDDEN
            try {
              requirePermission(claims, action, correlationId);
              expect.fail('Should have thrown AppError');
            } catch (e) {
              expect(e).toBeInstanceOf(AppError);
              expect((e as AppError).code).toBe(ErrorCode.FORBIDDEN);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('extractClaims rejects events with any missing required claim field', () => {
    const requiredFields = ['sub', 'email', 'custom:role', 'custom:teamId'];

    fc.assert(
      fc.property(
        fc.constantFrom(...requiredFields),
        fc.uuid(),
        (fieldToRemove, correlationId) => {
          const claims: Record<string, string> = {
            sub: 'sub-1',
            email: 'test@mesa.com',
            'custom:role': 'Agent',
            'custom:teamId': 'team-1',
          };

          // Remove one required field
          claims[fieldToRemove] = '';

          const event: AuthorizedEvent = {
            httpMethod: 'GET',
            path: '/api/v1/dashboard/leads',
            body: null,
            headers: {},
            requestContext: {
              requestId: 'test',
              authorizer: { claims },
            },
          };

          expect(() => extractClaims(event, correlationId)).toThrow(AppError);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('extractClaims rejects events with no authorizer context', () => {
    fc.assert(
      fc.property(fc.uuid(), (correlationId) => {
        const event: AuthorizedEvent = {
          httpMethod: 'GET',
          path: '/test',
          body: null,
          headers: {},
          requestContext: { requestId: 'test' },
        };

        expect(() => extractClaims(event, correlationId)).toThrow(AppError);
      }),
      { numRuns: 20 },
    );
  });
});
