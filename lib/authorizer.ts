/**
 * Cognito JWT authorizer and role-based permission enforcement.
 *
 * Extracts claims from the API Gateway request context (populated by the
 * Cognito authorizer) and enforces the permission matrix:
 *
 * | Action                    | Agent | Team_Admin |
 * |---------------------------|-------|------------|
 * | View own leads            | ✅    | ✅         |
 * | View all team leads       | ❌    | ✅         |
 * | Update lead status (own)  | ✅    | ✅         |
 * | Update lead status (all)  | ❌    | ✅         |
 * | Invite agents             | ❌    | ✅         |
 * | Deactivate agents         | ❌    | ✅         |
 * | View team performance     | ❌    | ✅         |
 * | Manage flat-fee listings  | ❌    | ✅         |
 * | Update notification prefs | ✅    | ✅         |
 */

import { AppError, ErrorCode } from './errors.js';
import type { AgentRole } from './types/agent.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Claims extracted from a Cognito JWT via API Gateway authorizer. */
export interface AuthClaims {
  /** Cognito user pool subject identifier */
  sub: string;
  /** Agent email address */
  email: string;
  /** Agent role: Agent or Team_Admin */
  role: AgentRole;
  /** Team identifier */
  teamId: string;
}

/** Minimal API Gateway event shape with authorizer claims. */
export interface AuthorizedEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string | undefined> | null;
  body: string | null;
  headers: Record<string, string | undefined>;
  requestContext?: {
    requestId?: string;
    authorizer?: {
      claims?: Record<string, string>;
    };
  };
}

/** Actions that can be checked against the permission matrix. */
export type PermissionAction =
  | 'view_own_leads'
  | 'view_all_team_leads'
  | 'update_own_lead'
  | 'update_any_lead'
  | 'invite_agent'
  | 'deactivate_agent'
  | 'view_team_performance'
  | 'manage_listings'
  | 'update_own_notifications';

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------

/** Permission matrix: which roles can perform which actions. */
const PERMISSION_MATRIX: Record<PermissionAction, Set<AgentRole>> = {
  view_own_leads: new Set(['Agent', 'Team_Admin']),
  view_all_team_leads: new Set(['Team_Admin']),
  update_own_lead: new Set(['Agent', 'Team_Admin']),
  update_any_lead: new Set(['Team_Admin']),
  invite_agent: new Set(['Team_Admin']),
  deactivate_agent: new Set(['Team_Admin']),
  view_team_performance: new Set(['Team_Admin']),
  manage_listings: new Set(['Team_Admin']),
  update_own_notifications: new Set(['Agent', 'Team_Admin']),
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Extract authentication claims from an API Gateway event.
 *
 * The Cognito authorizer populates `requestContext.authorizer.claims`
 * with the decoded JWT claims. This function extracts the relevant
 * fields and validates they are present.
 *
 * @throws AppError with UNAUTHORIZED if claims are missing or incomplete.
 */
export function extractClaims(
  event: AuthorizedEvent,
  correlationId: string,
): AuthClaims {
  const claims = event.requestContext?.authorizer?.claims;

  if (!claims) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      correlationId,
    );
  }

  const sub = claims['sub'];
  const email = claims['email'];
  const role = claims['custom:role'] as AgentRole | undefined;
  const teamId = claims['custom:teamId'];

  if (!sub || !email || !role || !teamId) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      'Incomplete authentication claims',
      correlationId,
    );
  }

  if (role !== 'Agent' && role !== 'Team_Admin') {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      `Invalid role: ${role}`,
      correlationId,
    );
  }

  return { sub, email, role, teamId };
}

/**
 * Check if a role has permission to perform an action.
 *
 * @returns true if the role is allowed, false otherwise.
 */
export function hasPermission(role: AgentRole, action: PermissionAction): boolean {
  const allowed = PERMISSION_MATRIX[action];
  return allowed ? allowed.has(role) : false;
}

/**
 * Enforce that the caller has permission to perform an action.
 *
 * @throws AppError with FORBIDDEN if the role lacks permission.
 */
export function requirePermission(
  claims: AuthClaims,
  action: PermissionAction,
  correlationId: string,
): void {
  if (!hasPermission(claims.role, action)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      `Insufficient permissions for action: ${action}`,
      correlationId,
    );
  }
}
