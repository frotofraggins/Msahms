/**
 * Tests for the Cognito authorizer and permission enforcement module.
 */

import { describe, it, expect } from 'vitest';
import {
  extractClaims,
  hasPermission,
  requirePermission,
  type AuthorizedEvent,
  type PermissionAction,
} from './authorizer.js';
import { AppError, ErrorCode } from './errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(claims?: Record<string, string>): AuthorizedEvent {
  return {
    httpMethod: 'GET',
    path: '/api/v1/dashboard/leads',
    body: null,
    headers: {},
    requestContext: {
      requestId: 'test-id',
      authorizer: claims ? { claims } : undefined,
    },
  };
}

const validAgentClaims = {
  sub: 'sub-123',
  email: 'agent@mesa.com',
  'custom:role': 'Agent',
  'custom:teamId': 'team-1',
};

const validAdminClaims = {
  sub: 'sub-456',
  email: 'admin@mesa.com',
  'custom:role': 'Team_Admin',
  'custom:teamId': 'team-1',
};

// ---------------------------------------------------------------------------
// extractClaims tests
// ---------------------------------------------------------------------------

describe('extractClaims', () => {
  it('should extract valid agent claims', () => {
    const claims = extractClaims(makeEvent(validAgentClaims), 'corr-1');
    expect(claims.sub).toBe('sub-123');
    expect(claims.email).toBe('agent@mesa.com');
    expect(claims.role).toBe('Agent');
    expect(claims.teamId).toBe('team-1');
  });

  it('should extract valid admin claims', () => {
    const claims = extractClaims(makeEvent(validAdminClaims), 'corr-1');
    expect(claims.role).toBe('Team_Admin');
  });

  it('should throw UNAUTHORIZED when no authorizer context', () => {
    const event = makeEvent();
    event.requestContext = { requestId: 'test' };
    expect(() => extractClaims(event, 'corr-1')).toThrow(AppError);
    try {
      extractClaims(event, 'corr-1');
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });

  it('should throw UNAUTHORIZED when claims are missing', () => {
    expect(() => extractClaims(makeEvent(undefined), 'corr-1')).toThrow(AppError);
  });

  it('should throw UNAUTHORIZED when sub is missing', () => {
    const claims = { ...validAgentClaims, sub: '' };
    expect(() => extractClaims(makeEvent(claims), 'corr-1')).toThrow(AppError);
  });

  it('should throw UNAUTHORIZED when email is missing', () => {
    const claims = { ...validAgentClaims, email: '' };
    expect(() => extractClaims(makeEvent(claims), 'corr-1')).toThrow(AppError);
  });

  it('should throw UNAUTHORIZED when role is missing', () => {
    const claims = { ...validAgentClaims, 'custom:role': '' };
    expect(() => extractClaims(makeEvent(claims), 'corr-1')).toThrow(AppError);
  });

  it('should throw UNAUTHORIZED when teamId is missing', () => {
    const claims = { ...validAgentClaims, 'custom:teamId': '' };
    expect(() => extractClaims(makeEvent(claims), 'corr-1')).toThrow(AppError);
  });

  it('should throw FORBIDDEN for invalid role', () => {
    const claims = { ...validAgentClaims, 'custom:role': 'SuperAdmin' };
    try {
      extractClaims(makeEvent(claims), 'corr-1');
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FORBIDDEN);
    }
  });
});

// ---------------------------------------------------------------------------
// hasPermission tests
// ---------------------------------------------------------------------------

describe('hasPermission', () => {
  const agentAllowed: PermissionAction[] = [
    'view_own_leads',
    'update_own_lead',
    'update_own_notifications',
  ];

  const adminOnly: PermissionAction[] = [
    'view_all_team_leads',
    'update_any_lead',
    'invite_agent',
    'deactivate_agent',
    'view_team_performance',
    'manage_listings',
  ];

  for (const action of agentAllowed) {
    it(`Agent should have permission for ${action}`, () => {
      expect(hasPermission('Agent', action)).toBe(true);
    });

    it(`Team_Admin should have permission for ${action}`, () => {
      expect(hasPermission('Team_Admin', action)).toBe(true);
    });
  }

  for (const action of adminOnly) {
    it(`Agent should NOT have permission for ${action}`, () => {
      expect(hasPermission('Agent', action)).toBe(false);
    });

    it(`Team_Admin should have permission for ${action}`, () => {
      expect(hasPermission('Team_Admin', action)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// requirePermission tests
// ---------------------------------------------------------------------------

describe('requirePermission', () => {
  const agentClaims = { sub: 's', email: 'e', role: 'Agent' as const, teamId: 't' };
  const adminClaims = { sub: 's', email: 'e', role: 'Team_Admin' as const, teamId: 't' };

  it('should not throw when agent has permission', () => {
    expect(() => requirePermission(agentClaims, 'view_own_leads', 'c')).not.toThrow();
  });

  it('should throw FORBIDDEN when agent lacks permission', () => {
    try {
      requirePermission(agentClaims, 'invite_agent', 'c');
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as AppError).code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it('should not throw when admin has permission', () => {
    expect(() => requirePermission(adminClaims, 'invite_agent', 'c')).not.toThrow();
  });
});
