import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AWS SDK before importing the module under test
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
  InitiateAuthCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
  AdminCreateUserCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
  AdminSetUserPasswordCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
  AdminGetUserCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
  AdminUpdateUserAttributesCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
}));

// Import after mocks are set up
const mod = await import('./cognito.js');
const {
  USER_POOL_ID,
  CLIENT_ID,
  authenticateUser,
  refreshTokens,
  createUser,
  getUserByEmail,
  updateUserAttributes,
} = mod;

describe('Cognito constants', () => {
  it('should read USER_POOL_ID from environment (defaults to empty string)', () => {
    expect(typeof USER_POOL_ID).toBe('string');
  });

  it('should read CLIENT_ID from environment (defaults to empty string)', () => {
    expect(typeof CLIENT_ID).toBe('string');
  });
});

describe('authenticateUser', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return tokens on successful authentication', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'access-token-123',
        IdToken: 'id-token-123',
        RefreshToken: 'refresh-token-123',
        ExpiresIn: 86400,
      },
    });

    const result = await authenticateUser('agent@mesahomes.com', 'P@ssw0rd!');

    expect(result).toEqual({
      accessToken: 'access-token-123',
      idToken: 'id-token-123',
      refreshToken: 'refresh-token-123',
      expiresIn: 86400,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.AuthFlow).toBe('USER_PASSWORD_AUTH');
    expect(call.input.AuthParameters.USERNAME).toBe('agent@mesahomes.com');
    expect(call.input.AuthParameters.PASSWORD).toBe('P@ssw0rd!');
  });

  it('should throw on incomplete token response', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'access-token-123',
        // Missing IdToken and RefreshToken
      },
    });

    await expect(authenticateUser('agent@mesahomes.com', 'P@ssw0rd!')).rejects.toThrow(
      'Authentication failed: incomplete token response',
    );
  });

  it('should propagate Cognito errors', async () => {
    mockSend.mockRejectedValue(new Error('NotAuthorizedException'));

    await expect(authenticateUser('agent@mesahomes.com', 'wrong')).rejects.toThrow(
      'NotAuthorizedException',
    );
  });
});

describe('refreshTokens', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return new access and ID tokens', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'new-access-token',
        IdToken: 'new-id-token',
        ExpiresIn: 86400,
      },
    });

    const result = await refreshTokens('refresh-token-123');

    expect(result).toEqual({
      accessToken: 'new-access-token',
      idToken: 'new-id-token',
      expiresIn: 86400,
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.input.AuthFlow).toBe('REFRESH_TOKEN_AUTH');
    expect(call.input.AuthParameters.REFRESH_TOKEN).toBe('refresh-token-123');
  });

  it('should throw on incomplete refresh response', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'new-access-token',
        // Missing IdToken
      },
    });

    await expect(refreshTokens('refresh-token-123')).rejects.toThrow(
      'Token refresh failed: incomplete token response',
    );
  });
});

describe('createUser', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should create a user and set permanent password', async () => {
    // First call: AdminCreateUser
    mockSend.mockResolvedValueOnce({
      User: {
        Attributes: [
          { Name: 'sub', Value: 'user-sub-123' },
          { Name: 'email', Value: 'newagent@mesahomes.com' },
        ],
      },
    });
    // Second call: AdminSetUserPassword
    mockSend.mockResolvedValueOnce({});

    const sub = await createUser('newagent@mesahomes.com', 'Temp@1234', 'Agent', 'team-1');

    expect(sub).toBe('user-sub-123');
    expect(mockSend).toHaveBeenCalledTimes(2);

    // Verify AdminCreateUser params
    const createCall = mockSend.mock.calls[0][0];
    expect(createCall.input.Username).toBe('newagent@mesahomes.com');
    expect(createCall.input.TemporaryPassword).toBe('Temp@1234');
    expect(createCall.input.MessageAction).toBe('SUPPRESS');

    const attrs = createCall.input.UserAttributes;
    expect(attrs).toContainEqual({ Name: 'custom:role', Value: 'Agent' });
    expect(attrs).toContainEqual({ Name: 'custom:teamId', Value: 'team-1' });
    expect(attrs).toContainEqual({ Name: 'email', Value: 'newagent@mesahomes.com' });
    expect(attrs).toContainEqual({ Name: 'email_verified', Value: 'true' });

    // Verify AdminSetUserPassword params
    const setPasswordCall = mockSend.mock.calls[1][0];
    expect(setPasswordCall.input.Username).toBe('newagent@mesahomes.com');
    expect(setPasswordCall.input.Password).toBe('Temp@1234');
    expect(setPasswordCall.input.Permanent).toBe(true);
  });

  it('should throw if no sub is returned', async () => {
    mockSend.mockResolvedValueOnce({
      User: { Attributes: [] },
    });

    await expect(
      createUser('newagent@mesahomes.com', 'Temp@1234', 'Team_Admin', 'team-1'),
    ).rejects.toThrow('User creation failed: no sub returned');
  });
});

describe('getUserByEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return user attributes when user exists', async () => {
    const mockAttributes = [
      { Name: 'sub', Value: 'user-sub-123' },
      { Name: 'email', Value: 'agent@mesahomes.com' },
      { Name: 'custom:role', Value: 'Agent' },
      { Name: 'custom:teamId', Value: 'team-1' },
    ];

    mockSend.mockResolvedValue({ UserAttributes: mockAttributes });

    const result = await getUserByEmail('agent@mesahomes.com');

    expect(result).toEqual(mockAttributes);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Username).toBe('agent@mesahomes.com');
  });

  it('should return undefined when user does not exist', async () => {
    const error = new Error('UserNotFoundException');
    error.name = 'UserNotFoundException';
    mockSend.mockRejectedValue(error);

    const result = await getUserByEmail('nonexistent@mesahomes.com');
    expect(result).toBeUndefined();
  });

  it('should rethrow non-UserNotFoundException errors', async () => {
    mockSend.mockRejectedValue(new Error('InternalErrorException'));

    await expect(getUserByEmail('agent@mesahomes.com')).rejects.toThrow(
      'InternalErrorException',
    );
  });
});

describe('updateUserAttributes', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should update user attributes', async () => {
    await updateUserAttributes('agent@mesahomes.com', {
      'custom:role': 'Team_Admin',
      'custom:teamId': 'team-2',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Username).toBe('agent@mesahomes.com');
    expect(call.input.UserAttributes).toContainEqual({
      Name: 'custom:role',
      Value: 'Team_Admin',
    });
    expect(call.input.UserAttributes).toContainEqual({
      Name: 'custom:teamId',
      Value: 'team-2',
    });
  });

  it('should propagate errors from Cognito', async () => {
    mockSend.mockRejectedValue(new Error('UserNotFoundException'));

    await expect(
      updateUserAttributes('nonexistent@mesahomes.com', { 'custom:role': 'Agent' }),
    ).rejects.toThrow('UserNotFoundException');
  });
});
