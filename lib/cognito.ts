/**
 * Shared Cognito client module for the MesaHomes platform.
 *
 * Provides helper functions for agent/admin authentication operations
 * against the mesahomes-userpool Cognito User Pool.
 *
 * Environment variables:
 * - COGNITO_USER_POOL_ID — Cognito User Pool ID
 * - COGNITO_CLIENT_ID    — Cognito App Client ID
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  type InitiateAuthCommandInput,
  type AdminCreateUserCommandInput,
  type AdminSetUserPasswordCommandInput,
  type AdminGetUserCommandInput,
  type AdminUpdateUserAttributesCommandInput,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AuthTokens, UserRole } from './types/cognito.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cognito User Pool ID (from environment). */
export const USER_POOL_ID = process.env['COGNITO_USER_POOL_ID'] ?? '';

/** Cognito App Client ID (from environment). */
export const CLIENT_ID = process.env['COGNITO_CLIENT_ID'] ?? '';

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env['AWS_REGION'] ?? 'us-west-2',
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Authenticate a user with email and password.
 *
 * Uses InitiateAuth with USER_PASSWORD_AUTH flow (non-admin). The user
 * pool client must have ALLOW_USER_PASSWORD_AUTH enabled.
 * Returns access, ID, and refresh tokens on success.
 *
 * @throws Error if credentials are invalid or the user does not exist.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const params: InitiateAuthCommandInput = {
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  const result = await cognitoClient.send(new InitiateAuthCommand(params));

  const authResult = result.AuthenticationResult;
  if (!authResult?.AccessToken || !authResult.IdToken || !authResult.RefreshToken) {
    throw new Error('Authentication failed: incomplete token response');
  }

  return {
    accessToken: authResult.AccessToken,
    idToken: authResult.IdToken,
    refreshToken: authResult.RefreshToken,
    expiresIn: authResult.ExpiresIn ?? 86400,
  };
}

/**
 * Refresh access and ID tokens using a refresh token.
 *
 * Uses InitiateAuth with REFRESH_TOKEN_AUTH flow. This is the non-admin
 * API call; the client must have ALLOW_REFRESH_TOKEN_AUTH enabled on the
 * user pool client.
 * Note: Cognito does not return a new refresh token on refresh.
 *
 * @throws Error if the refresh token is invalid or expired.
 */
export async function refreshTokens(
  refreshToken: string,
): Promise<Omit<AuthTokens, 'refreshToken'>> {
  const params: InitiateAuthCommandInput = {
    ClientId: CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  };

  const result = await cognitoClient.send(new InitiateAuthCommand(params));

  const authResult = result.AuthenticationResult;
  if (!authResult?.AccessToken || !authResult.IdToken) {
    throw new Error('Token refresh failed: incomplete token response');
  }

  return {
    accessToken: authResult.AccessToken,
    idToken: authResult.IdToken,
    expiresIn: authResult.ExpiresIn ?? 86400,
  };
}

/**
 * Create a new user in the Cognito User Pool (invite-only).
 *
 * Creates the user with AdminCreateUser (sends a temporary password via email),
 * then immediately sets a permanent password with AdminSetUserPassword so the
 * user does not need to change it on first login.
 *
 * @throws Error if the user already exists or creation fails.
 */
export async function createUser(
  email: string,
  temporaryPassword: string,
  role: UserRole,
  teamId: string,
): Promise<string> {
  const createParams: AdminCreateUserCommandInput = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    TemporaryPassword: temporaryPassword,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:role', Value: role },
      { Name: 'custom:teamId', Value: teamId },
    ],
    MessageAction: 'SUPPRESS', // We handle invitation emails ourselves
  };

  const createResult = await cognitoClient.send(new AdminCreateUserCommand(createParams));

  const sub = createResult.User?.Attributes?.find(
    (attr: AttributeType) => attr.Name === 'sub',
  )?.Value;

  if (!sub) {
    throw new Error('User creation failed: no sub returned');
  }

  // Set permanent password so user doesn't need to change on first login
  const setPasswordParams: AdminSetUserPasswordCommandInput = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    Password: temporaryPassword,
    Permanent: true,
  };

  await cognitoClient.send(new AdminSetUserPasswordCommand(setPasswordParams));

  return sub;
}

/**
 * Get a user's details by email address.
 *
 * @returns User attributes or undefined if the user does not exist.
 * @throws Error on unexpected Cognito errors (non-UserNotFoundException).
 */
export async function getUserByEmail(
  email: string,
): Promise<AttributeType[] | undefined> {
  const params: AdminGetUserCommandInput = {
    UserPoolId: USER_POOL_ID,
    Username: email,
  };

  try {
    const result = await cognitoClient.send(new AdminGetUserCommand(params));
    return result.UserAttributes;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Update user attributes in the Cognito User Pool.
 *
 * @param email - The user's email (username).
 * @param attributes - Key-value pairs of attributes to update.
 * @throws Error if the user does not exist or the update fails.
 */
export async function updateUserAttributes(
  email: string,
  attributes: Record<string, string>,
): Promise<void> {
  const userAttributes: AttributeType[] = Object.entries(attributes).map(
    ([key, value]) => ({ Name: key, Value: value }),
  );

  const params: AdminUpdateUserAttributesCommandInput = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: userAttributes,
  };

  await cognitoClient.send(new AdminUpdateUserAttributesCommand(params));
}
