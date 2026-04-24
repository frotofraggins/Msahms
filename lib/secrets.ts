/**
 * Shared Secrets Manager client module for the MesaHomes platform.
 *
 * Provides helper functions to retrieve secrets from AWS Secrets Manager
 * with an in-memory cache (configurable TTL, default 5 minutes) to avoid
 * repeated API calls within the same Lambda invocation or process.
 *
 * Uses @aws-sdk/client-secrets-manager for all operations.
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default cache TTL in milliseconds (5 minutes). */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

const smClient = new SecretsManagerClient({
  region: process.env['AWS_REGION'] ?? 'us-west-2',
});

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const secretCache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Retrieve a secret string value from Secrets Manager.
 *
 * Results are cached in-memory for {@link DEFAULT_CACHE_TTL_MS} (5 min)
 * by default. Pass a custom `ttlMs` to override.
 *
 * @param secretName - The Secrets Manager secret ID / path
 * @param ttlMs - Cache TTL in milliseconds (default 5 minutes)
 * @returns The secret string value
 * @throws {ResourceNotFoundException} if the secret does not exist
 */
export async function getSecret(
  secretName: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<string> {
  const now = Date.now();
  const cached = secretCache.get(secretName);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const response = await smClient.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );

  const value = response.SecretString;
  if (value === undefined) {
    throw new Error(`Secret "${secretName}" does not contain a string value`);
  }

  secretCache.set(secretName, { value, expiresAt: now + ttlMs });
  return value;
}

/**
 * Retrieve a secret from Secrets Manager and parse it as JSON.
 *
 * Useful for secrets stored as JSON objects (e.g. SMTP credentials
 * with `{ username, password }`).
 *
 * @param secretName - The Secrets Manager secret ID / path
 * @param ttlMs - Cache TTL in milliseconds (default 5 minutes)
 * @returns Parsed JSON object
 * @throws {ResourceNotFoundException} if the secret does not exist
 * @throws {SyntaxError} if the secret value is not valid JSON
 */
export async function getSecretJSON<T = Record<string, unknown>>(
  secretName: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<T> {
  const raw = await getSecret(secretName, ttlMs);
  return JSON.parse(raw) as T;
}

/**
 * Clear the in-memory secret cache.
 *
 * Primarily intended for testing; also useful if a secret has been
 * rotated and the Lambda needs to pick up the new value immediately.
 */
export function clearSecretCache(): void {
  secretCache.clear();
}

/**
 * Check if an error is a Secrets Manager ResourceNotFoundException.
 */
export function isResourceNotFound(error: unknown): boolean {
  return error instanceof ResourceNotFoundException;
}
