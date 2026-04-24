import { describe, it, expect } from 'vitest';
import {
  publicRoutes,
  authenticatedRoutes,
  authRoutes,
  allRoutes,
  API_NAME,
  BASE_PATH,
  API_REGION,
  cognitoAuthorizer,
} from './api-gateway.js';

describe('API Gateway configuration', () => {
  it('should use the correct API name', () => {
    expect(API_NAME).toBe('mesahomes-api');
  });

  it('should use /api/v1 as the base path', () => {
    expect(BASE_PATH).toBe('/api/v1');
  });

  it('should deploy to us-west-2', () => {
    expect(API_REGION).toBe('us-west-2');
  });
});

describe('Route definitions', () => {
  it('should define 18 public routes', () => {
    expect(publicRoutes).toHaveLength(18);
  });

  it('should define 11 authenticated dashboard routes', () => {
    expect(authenticatedRoutes).toHaveLength(11);
  });

  it('should define 3 auth routes', () => {
    expect(authRoutes).toHaveLength(3);
  });

  it('should define 32 total routes', () => {
    expect(allRoutes).toHaveLength(32);
  });

  it('should have all paths start with /api/v1', () => {
    for (const route of allRoutes) {
      expect(route.path, `${route.method} ${route.path}`).toMatch(/^\/api\/v1\//);
    }
  });

  it('should have no duplicate routes (same method + path)', () => {
    const keys = allRoutes.map((r) => `${r.method} ${r.path}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('should have a valid HTTP method on every route', () => {
    const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    for (const route of allRoutes) {
      expect(validMethods.has(route.method), `${route.method} ${route.path}`).toBe(true);
    }
  });

  it('should have a non-empty lambda target on every route', () => {
    for (const route of allRoutes) {
      expect(route.lambdaTarget.length, `${route.method} ${route.path}`).toBeGreaterThan(0);
    }
  });

  it('should have an explicit authRequired boolean on every route', () => {
    for (const route of allRoutes) {
      expect(typeof route.authRequired, `${route.method} ${route.path}`).toBe('boolean');
    }
  });
});

describe('Public routes', () => {
  it('should have no auth requirement on any public route', () => {
    for (const route of publicRoutes) {
      expect(route.authRequired, `${route.method} ${route.path}`).toBe(false);
    }
  });

  it('should include POST /api/v1/leads targeting leads-capture', () => {
    const route = publicRoutes.find((r) => r.path === '/api/v1/leads');
    expect(route).toBeDefined();
    expect(route!.method).toBe('POST');
    expect(route!.lambdaTarget).toBe('leads-capture');
  });

  it('should include all four tools routes targeting tools-calculator', () => {
    const toolPaths = [
      '/api/v1/tools/net-sheet',
      '/api/v1/tools/affordability',
      '/api/v1/tools/comparison',
      '/api/v1/tools/sell-now-or-wait',
    ];
    for (const path of toolPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('POST');
      expect(route!.lambdaTarget).toBe('tools-calculator');
    }
  });

  it('should include property routes targeting property-lookup', () => {
    const propertyPaths = ['/api/v1/property/lookup', '/api/v1/property/comps'];
    for (const path of propertyPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('POST');
      expect(route!.lambdaTarget).toBe('property-lookup');
    }
  });

  it('should include market data routes targeting market-data', () => {
    const zipRoute = publicRoutes.find((r) => r.path === '/api/v1/market/zip/{zip}');
    expect(zipRoute).toBeDefined();
    expect(zipRoute!.method).toBe('GET');
    expect(zipRoute!.lambdaTarget).toBe('market-data');

    const metroRoute = publicRoutes.find((r) => r.path === '/api/v1/market/metro');
    expect(metroRoute).toBeDefined();
    expect(metroRoute!.method).toBe('GET');
    expect(metroRoute!.lambdaTarget).toBe('market-data');
  });

  it('should include content routes targeting content-api', () => {
    const contentPaths = [
      '/api/v1/content/city/{slug}',
      '/api/v1/content/blog',
      '/api/v1/content/blog/{slug}',
    ];
    for (const path of contentPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('GET');
      expect(route!.lambdaTarget).toBe('content-api');
    }
  });

  it('should include AI routes targeting ai-proxy', () => {
    const aiPaths = ['/api/v1/ai/listing-description', '/api/v1/ai/offer-draft'];
    for (const path of aiPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('POST');
      expect(route!.lambdaTarget).toBe('ai-proxy');
    }
  });

  it('should include valuation-request and booking targeting leads-capture', () => {
    const leadPaths = ['/api/v1/valuation-request', '/api/v1/booking'];
    for (const path of leadPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('POST');
      expect(route!.lambdaTarget).toBe('leads-capture');
    }
  });

  it('should include listing routes targeting listing-service', () => {
    const listingPaths = ['/api/v1/listing/start', '/api/v1/listing/payment'];
    for (const path of listingPaths) {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(route!.method).toBe('POST');
      expect(route!.lambdaTarget).toBe('listing-service');
    }
  });
});

describe('Authenticated dashboard routes', () => {
  it('should require Cognito auth on all dashboard routes', () => {
    for (const route of authenticatedRoutes) {
      expect(route.authRequired, `${route.method} ${route.path}`).toBe(true);
    }
  });

  it('should target dashboard-api Lambda for all dashboard routes', () => {
    for (const route of authenticatedRoutes) {
      expect(route.lambdaTarget, `${route.method} ${route.path}`).toBe('dashboard-api');
    }
  });

  it('should include lead management routes (GET, GET/{id}, PATCH/{id})', () => {
    const leadRoutes = authenticatedRoutes.filter((r) =>
      r.path.startsWith('/api/v1/dashboard/leads'),
    );
    expect(leadRoutes).toHaveLength(3);
    expect(leadRoutes.map((r) => r.method).sort()).toEqual(['GET', 'GET', 'PATCH']);
  });

  it('should include team management routes (GET, POST invite, PATCH/{agentId})', () => {
    const teamRoutes = authenticatedRoutes.filter((r) =>
      r.path.startsWith('/api/v1/dashboard/team'),
    );
    expect(teamRoutes).toHaveLength(3);
    expect(teamRoutes.map((r) => r.method).sort()).toEqual(['GET', 'PATCH', 'POST']);
  });

  it('should include notification settings routes (GET, PUT)', () => {
    const notifRoutes = authenticatedRoutes.filter((r) =>
      r.path.includes('/notifications/settings'),
    );
    expect(notifRoutes).toHaveLength(2);
    expect(notifRoutes.map((r) => r.method).sort()).toEqual(['GET', 'PUT']);
  });
});

describe('Auth routes', () => {
  it('should be public (no auth required)', () => {
    for (const route of authRoutes) {
      expect(route.authRequired, `${route.method} ${route.path}`).toBe(false);
    }
  });

  it('should target auth-api Lambda', () => {
    for (const route of authRoutes) {
      expect(route.lambdaTarget, `${route.method} ${route.path}`).toBe('auth-api');
    }
  });

  it('should include login, refresh, and register', () => {
    const paths = authRoutes.map((r) => r.path).sort();
    expect(paths).toEqual([
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/register',
    ]);
  });
});

describe('Cognito authorizer', () => {
  it('should use COGNITO_USER_POOLS type', () => {
    expect(cognitoAuthorizer.type).toBe('COGNITO_USER_POOLS');
  });

  it('should use the Authorization header as identity source', () => {
    expect(cognitoAuthorizer.identitySource).toBe(
      'method.request.header.Authorization',
    );
  });

  it('should have a provider ARNs array for deployment configuration', () => {
    expect(Array.isArray(cognitoAuthorizer.providerArns)).toBe(true);
  });
});
