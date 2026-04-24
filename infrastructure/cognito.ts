/**
 * CloudFormation-style Cognito User Pool definition for the MesaHomes platform.
 *
 * User Pool: mesahomes-userpool
 * - Invite-only (self-signup disabled)
 * - Email as username attribute
 * - Custom attributes: custom:role (Agent | Team_Admin), custom:teamId
 * - Password policy: min 8 chars, require uppercase, lowercase, number, symbol
 * - Token validity: access 24h, refresh 30d
 * - App client for SPA dashboard (no client secret)
 *
 * This module exports the user pool and app client definitions as typed objects
 * that can be used with AWS CDK, CloudFormation, or the AWS SDK APIs.
 */

import type {
  CreateUserPoolCommandInput,
  CreateUserPoolClientCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/** The user pool name used across the platform. */
export const USER_POOL_NAME = 'mesahomes-userpool';

/** The app client name for the dashboard SPA. */
export const APP_CLIENT_NAME = 'mesahomes-dashboard-client';

/**
 * Full CreateUserPool input for the mesahomes-userpool Cognito User Pool.
 *
 * Includes:
 * - Email as the sign-in alias and auto-verified attribute
 * - Custom attributes: custom:role (Agent | Team_Admin), custom:teamId
 * - Password policy: min 8 chars, uppercase, lowercase, number, symbol
 * - Self-signup disabled (invite-only via admin)
 * - Email verification via code
 */
export const mesahomesUserPoolDefinition: CreateUserPoolCommandInput = {
  PoolName: USER_POOL_NAME,

  // Email as username
  UsernameAttributes: ['email'],
  AutoVerifiedAttributes: ['email'],

  // Password policy
  Policies: {
    PasswordPolicy: {
      MinimumLength: 8,
      RequireUppercase: true,
      RequireLowercase: true,
      RequireNumbers: true,
      RequireSymbols: true,
    },
  },

  // Custom attributes
  Schema: [
    {
      Name: 'role',
      AttributeDataType: 'String',
      Mutable: true,
      StringAttributeConstraints: {
        MinLength: '1',
        MaxLength: '20',
      },
    },
    {
      Name: 'teamId',
      AttributeDataType: 'String',
      Mutable: true,
      StringAttributeConstraints: {
        MinLength: '1',
        MaxLength: '64',
      },
    },
  ],

  // Self-signup disabled — invite-only
  AdminCreateUserConfig: {
    AllowAdminCreateUserOnly: true,
  },

  // Email verification
  VerificationMessageTemplate: {
    DefaultEmailOption: 'CONFIRM_WITH_CODE',
  },
};

/**
 * App client definition for the MesaHomes dashboard SPA.
 *
 * - No client secret (required for browser-based SPA)
 * - Supports USER_PASSWORD_AUTH and REFRESH_TOKEN_AUTH flows
 * - Access token validity: 24 hours (1440 minutes)
 * - Refresh token validity: 30 days
 *
 * Note: `UserPoolId` must be set after the user pool is created.
 */
export const mesahomesAppClientDefinition: CreateUserPoolClientCommandInput = {
  UserPoolId: '', // Set after user pool creation
  ClientName: APP_CLIENT_NAME,

  // No client secret for SPA
  GenerateSecret: false,

  // Allowed auth flows
  ExplicitAuthFlows: [
    'ALLOW_USER_PASSWORD_AUTH',
    'ALLOW_REFRESH_TOKEN_AUTH',
    'ALLOW_ADMIN_USER_PASSWORD_AUTH',
  ],

  // Token validity
  AccessTokenValidity: 24,   // 24 hours
  RefreshTokenValidity: 30,  // 30 days
  IdTokenValidity: 24,       // 24 hours

  TokenValidityUnits: {
    AccessToken: 'hours',
    RefreshToken: 'days',
    IdToken: 'hours',
  },
};
