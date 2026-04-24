/**
 * Cognito type definitions for the MesaHomes authentication system.
 *
 * User Pool: mesahomes-userpool
 * Roles: Agent, Team_Admin (invite-only via admin).
 */

/** Allowed user roles within the MesaHomes platform. */
export type UserRole = 'Agent' | 'Team_Admin';

/** Tokens returned from a successful Cognito authentication. */
export interface AuthTokens {
  /** JWT access token for API authorization */
  accessToken: string;
  /** JWT ID token containing user claims */
  idToken: string;
  /** Opaque refresh token for obtaining new access/ID tokens */
  refreshToken: string;
  /** Access token lifetime in seconds */
  expiresIn: number;
}

/** Core user attributes stored in the Cognito User Pool. */
export interface CognitoUserAttributes {
  /** User email (also the username) */
  email: string;
  /** User role: Agent or Team_Admin */
  role: UserRole;
  /** Team identifier the user belongs to */
  teamId: string;
  /** Cognito unique user identifier */
  sub: string;
}
