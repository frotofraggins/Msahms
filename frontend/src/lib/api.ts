/**
 * Typed API client for frontend-to-backend communication.
 *
 * Wraps fetch with:
 * - Base URL configuration
 * - Auth token management (localStorage)
 * - Auto-refresh on 401
 * - Correlation ID forwarding
 * - Typed response handling
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api/v1';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

/**
 * Get the Cognito ID token for API Gateway authorizer.
 *
 * API Gateway's Cognito User Pool authorizer validates the ID token's
 * audience against the App Client ID. Access tokens don't include the
 * `aud` claim so they're rejected. Use ID tokens for Authorization
 * headers; use the access token only for direct Cognito API calls
 * (get/update user attributes).
 */
function getIdToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mesahomes_id_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mesahomes_refresh_token');
}

export function setTokens(access: string, refresh: string, id?: string): void {
  localStorage.setItem('mesahomes_access_token', access);
  localStorage.setItem('mesahomes_refresh_token', refresh);
  if (id) localStorage.setItem('mesahomes_id_token', id);
}

export function clearTokens(): void {
  localStorage.removeItem('mesahomes_access_token');
  localStorage.removeItem('mesahomes_refresh_token');
  localStorage.removeItem('mesahomes_id_token');
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
  correlationId: string;
  details?: Array<{ field: string; message: string }>;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly apiError?: ApiError;

  constructor(status: number, apiError?: ApiError) {
    super(apiError?.message ?? `API error ${status}`);
    this.status = status;
    this.apiError = apiError;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, refreshToken, data.idToken);
    return true;
  } catch (err) {
    console.warn('[api] Token refresh failed:', err);
    return false;
  }
}

/**
 * Make an API request with optional auth and auto-refresh.
 */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getIdToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    let apiError: ApiError | undefined;
    try {
      const errorData = await res.json();
      apiError = errorData.error;
    } catch {
      // Response wasn't JSON
    }
    throw new ApiRequestError(res.status, apiError);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed API methods
// ---------------------------------------------------------------------------

// Public endpoints
export const api = {
  // Tools
  netSheet: (body: unknown) =>
    apiRequest('/tools/net-sheet', { method: 'POST', body }),
  affordability: (body: unknown) =>
    apiRequest('/tools/affordability', { method: 'POST', body }),
  comparison: (body: unknown) =>
    apiRequest('/tools/comparison', { method: 'POST', body }),
  sellNowOrWait: (body: unknown) =>
    apiRequest('/tools/sell-now-or-wait', { method: 'POST', body }),

  // Property
  propertyLookup: (body: unknown) =>
    apiRequest('/property/lookup', { method: 'POST', body }),

  // Market
  marketZip: (zip: string) =>
    apiRequest(`/market/zip/${zip}`),
  marketMetro: () =>
    apiRequest('/market/metro'),

  // Content
  cityPage: (slug: string) =>
    apiRequest(`/content/city/${slug}`),
  blogList: () =>
    apiRequest('/content/blog'),
  blogPost: (slug: string) =>
    apiRequest(`/content/blog/${slug}`),

  // Leads
  createLead: (body: unknown) =>
    apiRequest('/leads', { method: 'POST', body }),
  valuationRequest: (body: unknown) =>
    apiRequest('/valuation-request', { method: 'POST', body }),
  booking: (body: unknown) =>
    apiRequest('/booking', { method: 'POST', body }),

  // AI
  listingDescription: (body: unknown) =>
    apiRequest('/ai/listing-description', { method: 'POST', body }),
  offerDraft: (body: unknown) =>
    apiRequest('/ai/offer-draft', { method: 'POST', body }),

  // Listing
  startListing: (body: unknown) =>
    apiRequest('/listing/start', { method: 'POST', body }),
  payListing: (body: unknown) =>
    apiRequest('/listing/payment', { method: 'POST', body }),
  startFsboListing: (body: unknown) =>
    apiRequest('/listing/fsbo/intake', { method: 'POST', body }),

  // Auth
  login: (body: unknown) =>
    apiRequest('/auth/login', { method: 'POST', body }),
  refresh: (body: unknown) =>
    apiRequest('/auth/refresh', { method: 'POST', body }),
  register: (body: unknown) =>
    apiRequest('/auth/register', { method: 'POST', body }),

  // Dashboard (auth required)
  dashboard: {
    leads: () =>
      apiRequest('/dashboard/leads', { auth: true }),
    lead: (id: string) =>
      apiRequest(`/dashboard/leads/${id}`, { auth: true }),
    updateLead: (id: string, body: unknown) =>
      apiRequest(`/dashboard/leads/${id}`, { method: 'PATCH', body, auth: true }),
    deleteLead: (id: string) =>
      apiRequest(`/dashboard/leads/${id}`, { method: 'DELETE', auth: true }),
    team: () =>
      apiRequest('/dashboard/team', { auth: true }),
    inviteAgent: (body: unknown) =>
      apiRequest('/dashboard/team/invite', { method: 'POST', body, auth: true }),
    performance: () =>
      apiRequest('/dashboard/performance', { auth: true }),
    listings: () =>
      apiRequest('/dashboard/listings', { auth: true }),
    notificationSettings: () =>
      apiRequest('/dashboard/notifications/settings', { auth: true }),
    updateNotificationSettings: (body: unknown) =>
      apiRequest('/dashboard/notifications/settings', { method: 'PUT', body, auth: true }),
  },
};
