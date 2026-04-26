/**
 * API Gateway REST API route definitions for the MesaHomes platform.
 *
 * API: mesahomes-api
 * - Region: us-west-2
 * - Base path: /api/v1
 * - 20 public routes (no auth required)
 * - 11 authenticated dashboard routes (Cognito JWT required)
 * - 3 auth routes (login, refresh, register — public)
 * - 34 total routes
 *
 * This module exports typed route definitions as arrays that can be used
 * with AWS CDK, CloudFormation, or the AWS SDK APIs.
 */

/** Supported HTTP methods for API routes. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Lambda function targets that routes can be mapped to. */
export type LambdaTarget =
  | 'leads-capture'
  | 'tools-calculator'
  | 'property-lookup'
  | 'market-data'
  | 'content-api'
  | 'ai-proxy'
  | 'listing-service'
  | 'dashboard-leads'
  | 'dashboard-team'
  | 'dashboard-notifications'
  | 'dashboard-listings'
  | 'auth-api';

/** A single API Gateway route definition. */
export interface RouteDefinition {
  /** HTTP method (GET, POST, PUT, PATCH, DELETE). */
  method: HttpMethod;
  /** Full path including the /api/v1 prefix. */
  path: string;
  /** Target Lambda function name. */
  lambdaTarget: LambdaTarget;
  /** Whether the route requires Cognito JWT authentication. */
  authRequired: boolean;
}

/** The REST API name. */
export const API_NAME = 'mesahomes-api';

/** The base path prefix for all routes. */
export const BASE_PATH = '/api/v1';

/** The AWS region for the API Gateway deployment. */
export const API_REGION = 'us-west-2';

/**
 * Public routes — no authentication required.
 *
 * These routes serve consumer-facing tools, lead capture, property lookup,
 * market data, content, AI features, and the flat-fee listing flow.
 */
export const publicRoutes: readonly RouteDefinition[] = [
  // Lead capture
  { method: 'POST', path: '/api/v1/leads', lambdaTarget: 'leads-capture', authRequired: false },

  // Tools
  { method: 'POST', path: '/api/v1/tools/net-sheet', lambdaTarget: 'tools-calculator', authRequired: false },
  { method: 'POST', path: '/api/v1/tools/affordability', lambdaTarget: 'tools-calculator', authRequired: false },
  { method: 'POST', path: '/api/v1/tools/comparison', lambdaTarget: 'tools-calculator', authRequired: false },
  { method: 'POST', path: '/api/v1/tools/sell-now-or-wait', lambdaTarget: 'tools-calculator', authRequired: false },

  // Property
  { method: 'POST', path: '/api/v1/property/lookup', lambdaTarget: 'property-lookup', authRequired: false },
  { method: 'POST', path: '/api/v1/property/comps', lambdaTarget: 'property-lookup', authRequired: false },

  // Market data
  { method: 'GET', path: '/api/v1/market/zip/{zip}', lambdaTarget: 'market-data', authRequired: false },
  { method: 'GET', path: '/api/v1/market/metro', lambdaTarget: 'market-data', authRequired: false },

  // Content
  { method: 'GET', path: '/api/v1/content/city/{slug}', lambdaTarget: 'content-api', authRequired: false },
  { method: 'GET', path: '/api/v1/content/blog', lambdaTarget: 'content-api', authRequired: false },
  { method: 'GET', path: '/api/v1/content/blog/{slug}', lambdaTarget: 'content-api', authRequired: false },

  // AI
  { method: 'POST', path: '/api/v1/ai/listing-description', lambdaTarget: 'ai-proxy', authRequired: false },
  { method: 'POST', path: '/api/v1/ai/offer-draft', lambdaTarget: 'ai-proxy', authRequired: false },

  // Valuation & booking
  { method: 'POST', path: '/api/v1/valuation-request', lambdaTarget: 'leads-capture', authRequired: false },
  { method: 'POST', path: '/api/v1/booking', lambdaTarget: 'leads-capture', authRequired: false },

  // Flat-fee listing
  { method: 'POST', path: '/api/v1/listing/start', lambdaTarget: 'listing-service', authRequired: false },
  { method: 'POST', path: '/api/v1/listing/payment', lambdaTarget: 'listing-service', authRequired: false },

  // FSBO Stripe handoff (Blocker 1 — Approach A)
  { method: 'POST', path: '/api/v1/listing/fsbo/intake', lambdaTarget: 'listing-service', authRequired: false },
  { method: 'POST', path: '/api/v1/listing/fsbo/vhz-webhook', lambdaTarget: 'listing-service', authRequired: false },
] as const;

/**
 * Authenticated routes — require Cognito JWT authorization.
 *
 * These routes serve the agent/admin dashboard for lead management,
 * team management, performance metrics, listings, and notifications.
 */
export const authenticatedRoutes: readonly RouteDefinition[] = [
  // Dashboard — leads
  { method: 'GET', path: '/api/v1/dashboard/leads', lambdaTarget: 'dashboard-leads', authRequired: true },
  { method: 'GET', path: '/api/v1/dashboard/leads/{id}', lambdaTarget: 'dashboard-leads', authRequired: true },
  { method: 'PATCH', path: '/api/v1/dashboard/leads/{id}', lambdaTarget: 'dashboard-leads', authRequired: true },

  // Dashboard — team
  { method: 'GET', path: '/api/v1/dashboard/team', lambdaTarget: 'dashboard-team', authRequired: true },
  { method: 'POST', path: '/api/v1/dashboard/team/invite', lambdaTarget: 'dashboard-team', authRequired: true },
  { method: 'PATCH', path: '/api/v1/dashboard/team/{agentId}', lambdaTarget: 'dashboard-team', authRequired: true },

  // Dashboard — performance & listings
  { method: 'GET', path: '/api/v1/dashboard/performance', lambdaTarget: 'dashboard-leads', authRequired: true },
  { method: 'GET', path: '/api/v1/dashboard/listings', lambdaTarget: 'dashboard-listings', authRequired: true },
  { method: 'PATCH', path: '/api/v1/dashboard/listings/{id}', lambdaTarget: 'dashboard-listings', authRequired: true },

  // Dashboard — notifications
  { method: 'GET', path: '/api/v1/dashboard/notifications/settings', lambdaTarget: 'dashboard-notifications', authRequired: true },
  { method: 'PUT', path: '/api/v1/dashboard/notifications/settings', lambdaTarget: 'dashboard-notifications', authRequired: true },
] as const;

/**
 * Auth routes — public (no Cognito JWT required).
 *
 * Login, refresh, and register are public endpoints that issue or
 * validate tokens via the auth-api Lambda.
 */
export const authRoutes: readonly RouteDefinition[] = [
  { method: 'POST', path: '/api/v1/auth/login', lambdaTarget: 'auth-api', authRequired: false },
  { method: 'POST', path: '/api/v1/auth/refresh', lambdaTarget: 'auth-api', authRequired: false },
  { method: 'POST', path: '/api/v1/auth/register', lambdaTarget: 'auth-api', authRequired: false },
] as const;

/**
 * All routes combined — the complete API surface.
 *
 * - 20 public routes (consumer tools, lead capture, content, AI, listing flow)
 * - 11 authenticated dashboard routes (Cognito JWT required)
 * - 3 auth routes (login, refresh, register — public)
 * - 34 total routes
 */
export const allRoutes: readonly RouteDefinition[] = [
  ...publicRoutes,
  ...authenticatedRoutes,
  ...authRoutes,
] as const;

/**
 * Cognito authorizer configuration for the API Gateway.
 *
 * Attached to all routes where `authRequired` is true.
 */
export const cognitoAuthorizer = {
  /** Authorizer name. */
  name: 'mesahomes-cognito-authorizer',
  /** Authorizer type. */
  type: 'COGNITO_USER_POOLS' as const,
  /** Identity source — the Authorization header containing the JWT. */
  identitySource: 'method.request.header.Authorization',
  /** Cognito User Pool ARN placeholder — set during deployment. */
  providerArns: [] as string[],
};
