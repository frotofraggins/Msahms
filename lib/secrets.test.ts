import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AWS SDK before importing the module under test
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-secrets-manager', async () => {
  const actual = await vi.importActual<typeof import('@aws-sdk/client-secrets-manager')>(
    '@aws-sdk/client-secrets-manager',
  );
  return {
    ...actual,
    SecretsManagerClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
    GetSecretValueCommand: vi.fn().mockImplementation((input) => ({ input })),
  };
});

// Import after mocks are set up
const mod = await import('./secrets.js');
const { getSecret, getSecretJSON, clearSecretCache, isResourceNotFound } = mod;

// Import the real ResourceNotFoundException for isResourceNotFound tests
const { ResourceNotFoundException } = await import('@aws-sdk/client-secrets-manager');

describe('getSecret', () => {
  beforeEach(() => {
    mockSend.mockReset();
    clearSecretCache();
  });

  it('should return the secret string value', async () => {
    mockSend.mockResolvedValue({ SecretString: 'my-api-key-123' });

    const result = await getSecret('mesahomes/google-maps-api-key');
    expect(result).toBe('my-api-key-123');
  });

  it('should send a GetSecretValueCommand with the correct SecretId', async () => {
    mockSend.mockResolvedValue({ SecretString: 'key-value' });

    await getSecret('mesahomes/stripe-secret-key');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.SecretId).toBe('mesahomes/stripe-secret-key');
  });

  it('should cache the result and not call the API again within TTL', async () => {
    mockSend.mockResolvedValue({ SecretString: 'cached-value' });

    const first = await getSecret('mesahomes/rentcast-api-key');
    const second = await getSecret('mesahomes/rentcast-api-key');

    expect(first).toBe('cached-value');
    expect(second).toBe('cached-value');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should refetch after cache expires', async () => {
    mockSend
      .mockResolvedValueOnce({ SecretString: 'old-value' })
      .mockResolvedValueOnce({ SecretString: 'new-value' });

    // Use a very short TTL (1ms) so the cache expires immediately
    const first = await getSecret('mesahomes/test-secret', 1);
    expect(first).toBe('old-value');

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await getSecret('mesahomes/test-secret', 1);
    expect(second).toBe('new-value');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('should throw when SecretString is undefined', async () => {
    mockSend.mockResolvedValue({ SecretString: undefined });

    await expect(getSecret('mesahomes/bad-secret')).rejects.toThrow(
      'does not contain a string value',
    );
  });

  it('should propagate ResourceNotFoundException from the SDK', async () => {
    const error = new ResourceNotFoundException({
      message: 'Secret not found',
      $metadata: {},
    });
    mockSend.mockRejectedValue(error);

    await expect(getSecret('mesahomes/nonexistent')).rejects.toThrow(ResourceNotFoundException);
  });
});

describe('getSecretJSON', () => {
  beforeEach(() => {
    mockSend.mockReset();
    clearSecretCache();
  });

  it('should parse the secret value as JSON', async () => {
    const jsonValue = JSON.stringify({ username: 'smtp-user', password: 'smtp-pass' });
    mockSend.mockResolvedValue({ SecretString: jsonValue });

    const result = await getSecretJSON<{ username: string; password: string }>(
      'mesahomes/ses-smtp-credentials',
    );
    expect(result).toEqual({ username: 'smtp-user', password: 'smtp-pass' });
  });

  it('should throw SyntaxError for invalid JSON', async () => {
    mockSend.mockResolvedValue({ SecretString: 'not-json' });

    await expect(getSecretJSON('mesahomes/bad-json')).rejects.toThrow(SyntaxError);
  });

  it('should use the same cache as getSecret', async () => {
    const jsonValue = JSON.stringify({ key: 'value' });
    mockSend.mockResolvedValue({ SecretString: jsonValue });

    // First call via getSecret populates cache
    await getSecret('mesahomes/shared-cache-test');
    // Second call via getSecretJSON should use cache
    const result = await getSecretJSON('mesahomes/shared-cache-test');

    expect(result).toEqual({ key: 'value' });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});

describe('clearSecretCache', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should force a fresh API call after clearing', async () => {
    mockSend
      .mockResolvedValueOnce({ SecretString: 'original' })
      .mockResolvedValueOnce({ SecretString: 'rotated' });

    const first = await getSecret('mesahomes/rotate-test');
    expect(first).toBe('original');

    clearSecretCache();

    const second = await getSecret('mesahomes/rotate-test');
    expect(second).toBe('rotated');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});

describe('isResourceNotFound', () => {
  it('should return true for ResourceNotFoundException', () => {
    const error = new ResourceNotFoundException({
      message: 'not found',
      $metadata: {},
    });
    expect(isResourceNotFound(error)).toBe(true);
  });

  it('should return false for generic errors', () => {
    expect(isResourceNotFound(new Error('something else'))).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isResourceNotFound(null)).toBe(false);
    expect(isResourceNotFound(undefined)).toBe(false);
    expect(isResourceNotFound('string')).toBe(false);
  });
});
