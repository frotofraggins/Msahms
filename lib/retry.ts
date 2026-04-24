/**
 * Shared retry and circuit breaker module for the MesaHomes platform.
 *
 * Provides generic retry logic with exponential or linear backoff and jitter,
 * plus a circuit breaker pattern for external service calls (County GIS,
 * Google Street View, AI proxy). Pre-configured retry and circuit breaker
 * instances are exported for each external dependency.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Configuration for the retry utility. */
export interface RetryConfig {
  /** Maximum number of retry attempts (not counting the initial call). */
  maxRetries: number;
  /** Base delay in milliseconds before the first retry. */
  baseDelayMs: number;
  /** Backoff strategy: exponential doubles the delay, linear adds baseDelayMs. */
  backoffType: 'exponential' | 'linear';
}

/** Configuration for the circuit breaker. */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before the circuit opens. */
  failureThreshold: number;
  /** Time in milliseconds the circuit stays open before transitioning to half-open. */
  resetTimeMs: number;
}

/** Possible states of a circuit breaker. */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

/**
 * Circuit breaker that protects external service calls.
 *
 * - **Closed**: requests pass through normally; failures are counted.
 * - **Open**: all requests are immediately rejected for {@link resetTimeMs}.
 * - **Half-open**: one probe request is allowed; success closes the circuit,
 *   failure reopens it.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private openedAt = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Execute an async function through the circuit breaker.
   *
   * @throws {Error} If the circuit is open and the reset window has not elapsed.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.config.resetTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success: close the circuit and reset failure count
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;

      if (this.state === 'half-open') {
        // Probe failed — reopen
        this.state = 'open';
        this.openedAt = Date.now();
      } else if (this.failureCount >= this.config.failureThreshold) {
        this.state = 'open';
        this.openedAt = Date.now();
      }

      throw error;
    }
  }

  /** Return the current circuit breaker state. */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /** Manually reset the circuit breaker to closed with zero failures. */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.openedAt = 0;
  }
}

// ---------------------------------------------------------------------------
// Retry utility
// ---------------------------------------------------------------------------

/**
 * Execute an async function with configurable retry and backoff.
 *
 * Each retry delay includes random jitter (50–100 % of the computed delay)
 * to avoid thundering-herd effects.
 *
 * @param fn     The async operation to attempt.
 * @param config Retry configuration (max retries, base delay, backoff type).
 * @returns The result of a successful invocation of `fn`.
 * @throws The last error if all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (attempt === config.maxRetries) break;

      const baseDelay =
        config.backoffType === 'exponential'
          ? config.baseDelayMs * Math.pow(2, attempt)
          : config.baseDelayMs * (attempt + 1);

      // Jitter: 50–100 % of the computed delay
      const delay = baseDelay * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Pre-configured retry configs
// ---------------------------------------------------------------------------

/** DynamoDB: 3 retries, exponential backoff (100ms, 200ms, 400ms). */
export const DYNAMODB_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  backoffType: 'exponential',
};

/** County GIS APIs: 2 retries, linear backoff (1s, 2s). */
export const COUNTY_GIS_RETRY: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  backoffType: 'linear',
};

/** SES email: 3 retries, exponential backoff (1s, 2s, 4s). */
export const SES_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  backoffType: 'exponential',
};

/** Google Street View: 1 retry, no backoff (0ms base). */
export const STREET_VIEW_RETRY: RetryConfig = {
  maxRetries: 1,
  baseDelayMs: 0,
  backoffType: 'linear',
};

/** AI proxy (RTX 4090 MCP): 1 retry, 2s delay. */
export const AI_PROXY_RETRY: RetryConfig = {
  maxRetries: 1,
  baseDelayMs: 2000,
  backoffType: 'linear',
};

// ---------------------------------------------------------------------------
// Pre-configured circuit breakers
// ---------------------------------------------------------------------------

/** County GIS circuit breaker: 5 failures → 60 s open. */
export const countyGisCircuit = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeMs: 60_000,
});

/** Google Street View circuit breaker: 10 failures → 300 s open. */
export const streetViewCircuit = new CircuitBreaker({
  failureThreshold: 10,
  resetTimeMs: 300_000,
});

/** AI proxy circuit breaker: 3 failures → 30 s open. */
export const aiProxyCircuit = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeMs: 30_000,
});
