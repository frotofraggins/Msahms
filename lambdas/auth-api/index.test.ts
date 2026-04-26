/**
 * Tests for the auth-api Lambda handler.
 *
 * Covers login, refresh, register flows, account lockout,
 * invite token validation, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handler,
  getLockoutRecord,
  isAccountLocked,
  recordFailedAttempt,
  clearLockout,
} from './index.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/cognito.js', () => ({
  authenticateUser: vi.fn(),
  refreshTokens: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../../lib/dynamodb.js', () => ({
  putItem: vi.fn(),
  getItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock('../../lib/retry.js', () => ({
  withRetry: vi.fn((fn: () => unknown) => fn()),
  DYNAMODB_RETRY: { maxRetries: 3, baseDelayMs: 100, strategy: 'exponential' },
}));

import { authenticateUser, refreshTokens, createUser } from '../../lib/cognito.js';
import { putItem, getItem, updateItem, deleteItem } from '../../lib/dynamodb.js';

const mockAuthenticateUser = vi.mocked(authenticateUser);
const mockRefreshTokens = vi.mocked(refreshTokens);
const mockCreateUser = vi.mocked(createUser);
const mockPutItem = vi.mocked(putItem);
const mockGetItem = vi.mocked(getItem);
const mockUpdateItem = vi.mocked(updateItem);
const mockDeleteItem = vi.mocked(deleteItem);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  path: string,
  body: Record<string, unknown> | null = null,
  method = 'POST',
) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    requestContext: { requestId: 'test-correlation-id' },
  };
}

function parseBody(body: string) {
  return JSON.parse(body) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Lockout helper tests
// ---------------------------------------------------------------------------

describe('lockout helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLockoutRecord', () => {
    it('should return null when no lockout record exists', async () => {
      mockGetItem.mockResolvedValue(undefined);
      const result = await getLockoutRecord('test@example.com');
      expect(result).toBeNull();
      expect(mockGetItem).toHaveBeenCalledWith('LOCKOUT#test@example.com', 'LOCKOUT');
    });

    it('should return the lockout record when it exists', async () => {
      const record = { failedAttempts: 2, lockedUntil: null, lastFailedAt: '2026-01-01T00:00:00Z' };
      mockGetItem.mockResolvedValue({ PK: 'LOCKOUT#test@example.com', SK: 'LOCKOUT', data: record });
      const result = await getLockoutRecord('test@example.com');
      expect(result).toEqual(record);
    });
  });

  describe('isAccountLocked', () => {
    it('should return false for null record', () => {
      expect(isAccountLocked(null)).toBe(false);
    });

    it('should return false when lockedUntil is null', () => {
      expect(isAccountLocked({ failedAttempts: 2, lockedUntil: null, lastFailedAt: '' })).toBe(false);
    });

    it('should return false when lock has expired', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      expect(isAccountLocked({ failedAttempts: 3, lockedUntil: pastDate, lastFailedAt: '' })).toBe(false);
    });

    it('should return true when lock is active', () => {
      const futureDate = new Date(Date.now() + 600000).toISOString();
      expect(isAccountLocked({ failedAttempts: 3, lockedUntil: futureDate, lastFailedAt: '' })).toBe(true);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should create a new lockout record on first failure', async () => {
      mockGetItem.mockResolvedValue(undefined);
      mockPutItem.mockResolvedValue(undefined);

      const result = await recordFailedAttempt('test@example.com');
      expect(result.failedAttempts).toBe(1);
      expect(result.lockedUntil).toBeNull();
      expect(mockPutItem).toHaveBeenCalled();
    });

    it('should increment attempts on subsequent failures', async () => {
      mockGetItem.mockResolvedValue({
        PK: 'LOCKOUT#test@example.com',
        SK: 'LOCKOUT',
        data: { failedAttempts: 1, lockedUntil: null, lastFailedAt: '2026-01-01T00:00:00Z' },
      });
      mockPutItem.mockResolvedValue(undefined);

      const result = await recordFailedAttempt('test@example.com');
      expect(result.failedAttempts).toBe(2);
      expect(result.lockedUntil).toBeNull();
    });

    it('should lock account after 3 failures', async () => {
      mockGetItem.mockResolvedValue({
        PK: 'LOCKOUT#test@example.com',
        SK: 'LOCKOUT',
        data: { failedAttempts: 2, lockedUntil: null, lastFailedAt: '2026-01-01T00:00:00Z' },
      });
      mockPutItem.mockResolvedValue(undefined);

      const result = await recordFailedAttempt('test@example.com');
      expect(result.failedAttempts).toBe(3);
      expect(result.lockedUntil).not.toBeNull();
    });
  });

  describe('clearLockout', () => {
    it('should delete the lockout record', async () => {
      mockDeleteItem.mockResolvedValue(undefined);
      await clearLockout('test@example.com');
      expect(mockDeleteItem).toHaveBeenCalledWith('LOCKOUT#test@example.com', 'LOCKOUT');
    });
  });
});

// ---------------------------------------------------------------------------
// Login tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tokens on successful login', async () => {
    mockGetItem.mockResolvedValue(undefined); // No lockout
    mockAuthenticateUser.mockResolvedValue({
      accessToken: 'access-123',
      idToken: 'id-123',
      refreshToken: 'refresh-123',
      expiresIn: 86400,
    });
    mockDeleteItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com', password: 'P@ssw0rd!' }),
    );

    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.accessToken).toBe('access-123');
    expect(body.idToken).toBe('id-123');
    expect(body.refreshToken).toBe('refresh-123');
    expect(body.expiresIn).toBe(86400);
  });

  it('should return 400 when email is missing', async () => {
    const result = await handler(
      makeEvent('/api/v1/auth/login', { password: 'P@ssw0rd!' }),
    );
    expect(result.statusCode).toBe(400);
    const body = parseBody(result.body);
    expect(body.error).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const result = await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com' }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 401 on invalid credentials', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const authError = new Error('Authentication failed');
    authError.name = 'NotAuthorizedException';
    mockAuthenticateUser.mockRejectedValue(authError);
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com', password: 'wrong' }),
    );

    expect(result.statusCode).toBe(401);
    const body = parseBody(result.body);
    expect(body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('should return 429 when account is locked', async () => {
    const futureDate = new Date(Date.now() + 600000).toISOString();
    mockGetItem.mockResolvedValue({
      PK: 'LOCKOUT#agent@mesa.com',
      SK: 'LOCKOUT',
      data: { failedAttempts: 3, lockedUntil: futureDate, lastFailedAt: '2026-01-01T00:00:00Z' },
    });

    const result = await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com', password: 'P@ssw0rd!' }),
    );

    expect(result.statusCode).toBe(429);
    const body = parseBody(result.body);
    expect(body.error).toHaveProperty('code', 'ACCOUNT_LOCKED');
  });

  it('should lock account after 3 consecutive failures', async () => {
    // 2 previous failures
    mockGetItem.mockResolvedValue({
      PK: 'LOCKOUT#agent@mesa.com',
      SK: 'LOCKOUT',
      data: { failedAttempts: 2, lockedUntil: null, lastFailedAt: '2026-01-01T00:00:00Z' },
    });
    const authError = new Error('Authentication failed');
    authError.name = 'NotAuthorizedException';
    mockAuthenticateUser.mockRejectedValue(authError);
    mockPutItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com', password: 'wrong' }),
    );

    expect(result.statusCode).toBe(429);
    expect(mockPutItem).toHaveBeenCalled();
  });

  it('should clear lockout on successful login', async () => {
    mockGetItem.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue({
      accessToken: 'a', idToken: 'i', refreshToken: 'r', expiresIn: 86400,
    });
    mockDeleteItem.mockResolvedValue(undefined);

    await handler(
      makeEvent('/api/v1/auth/login', { email: 'agent@mesa.com', password: 'P@ssw0rd!' }),
    );

    expect(mockDeleteItem).toHaveBeenCalledWith('LOCKOUT#agent@mesa.com', 'LOCKOUT');
  });
});

// ---------------------------------------------------------------------------
// Refresh tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return new tokens on valid refresh', async () => {
    mockRefreshTokens.mockResolvedValue({
      accessToken: 'new-access',
      idToken: 'new-id',
      expiresIn: 86400,
    });

    const result = await handler(
      makeEvent('/api/v1/auth/refresh', { refreshToken: 'valid-refresh-token' }),
    );

    expect(result.statusCode).toBe(200);
    const body = parseBody(result.body);
    expect(body.accessToken).toBe('new-access');
    expect(body.idToken).toBe('new-id');
  });

  it('should return 400 when refreshToken is missing', async () => {
    const result = await handler(makeEvent('/api/v1/auth/refresh', {}));
    expect(result.statusCode).toBe(400);
  });

  it('should return 401 on invalid refresh token', async () => {
    const error = new Error('Token refresh failed');
    error.name = 'NotAuthorizedException';
    mockRefreshTokens.mockRejectedValue(error);

    const result = await handler(
      makeEvent('/api/v1/auth/refresh', { refreshToken: 'expired-token' }),
    );

    expect(result.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Register tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new agent with valid invite token', async () => {
    const inviteCreatedAt = new Date().toISOString();
    mockGetItem.mockResolvedValue({
      PK: 'INVITE#valid-token',
      SK: 'INVITE',
      createdAt: inviteCreatedAt,
      data: {
        email: 'newagent@mesa.com',
        role: 'Agent',
        teamId: 'team-1',
        agentId: 'agent-123',
        used: false,
      },
    });
    mockCreateUser.mockResolvedValue('cognito-sub-456');
    mockUpdateItem.mockResolvedValue(undefined);
    mockAuthenticateUser.mockResolvedValue({
      accessToken: 'a', idToken: 'i', refreshToken: 'r', expiresIn: 86400,
    });

    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'valid-token',
        name: 'New Agent',
        email: 'newagent@mesa.com',
        password: 'Str0ng!Pass',
      }),
    );

    expect(result.statusCode).toBe(201);
    const body = parseBody(result.body);
    expect(body.agentId).toBe('agent-123');
    expect(body.accessToken).toBe('a');
    expect(mockCreateUser).toHaveBeenCalledWith('newagent@mesa.com', 'Str0ng!Pass', 'Agent', 'team-1');
  });

  it('should return 400 when required fields are missing', async () => {
    const result = await handler(
      makeEvent('/api/v1/auth/register', { token: 'valid-token' }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when password is too short', async () => {
    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'valid-token',
        name: 'Agent',
        email: 'agent@mesa.com',
        password: 'short',
      }),
    );
    expect(result.statusCode).toBe(400);
  });

  it('should return 404 for invalid invite token', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'bad-token',
        name: 'Agent',
        email: 'agent@mesa.com',
        password: 'Str0ng!Pass',
      }),
    );

    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for already-used invite token', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'INVITE#used-token',
      SK: 'INVITE',
      createdAt: new Date().toISOString(),
      data: { email: 'agent@mesa.com', used: true },
    });

    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'used-token',
        name: 'Agent',
        email: 'agent@mesa.com',
        password: 'Str0ng!Pass',
      }),
    );

    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for expired invite token', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    mockGetItem.mockResolvedValue({
      PK: 'INVITE#expired-token',
      SK: 'INVITE',
      createdAt: oldDate,
      data: { email: 'agent@mesa.com', used: false },
    });

    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'expired-token',
        name: 'Agent',
        email: 'agent@mesa.com',
        password: 'Str0ng!Pass',
      }),
    );

    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when email does not match invite', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'INVITE#token',
      SK: 'INVITE',
      createdAt: new Date().toISOString(),
      data: { email: 'invited@mesa.com', used: false, role: 'Agent', teamId: 't1', agentId: 'a1' },
    });

    const result = await handler(
      makeEvent('/api/v1/auth/register', {
        token: 'token',
        name: 'Agent',
        email: 'different@mesa.com',
        password: 'Str0ng!Pass',
      }),
    );

    expect(result.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// General handler tests
// ---------------------------------------------------------------------------

describe('handler general', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 for OPTIONS preflight', async () => {
    const result = await handler(makeEvent('/api/v1/auth/login', null, 'OPTIONS'));
    expect(result.statusCode).toBe(200);
  });

  it('should return 400 for non-POST methods', async () => {
    const result = await handler(makeEvent('/api/v1/auth/login', null, 'GET'));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for missing body', async () => {
    const result = await handler({
      httpMethod: 'POST',
      path: '/api/v1/auth/login',
      body: null,
      headers: {},
      requestContext: { requestId: 'test' },
    });
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for invalid JSON', async () => {
    const result = await handler({
      httpMethod: 'POST',
      path: '/api/v1/auth/login',
      body: 'not-json',
      headers: {},
      requestContext: { requestId: 'test' },
    });
    expect(result.statusCode).toBe(400);
  });

  it('should return 404 for unknown path', async () => {
    const result = await handler(
      makeEvent('/api/v1/auth/unknown', { foo: 'bar' }),
    );
    expect(result.statusCode).toBe(404);
  });
});
