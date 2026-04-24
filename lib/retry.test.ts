import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  CircuitBreaker,
  DYNAMODB_RETRY,
  COUNTY_GIS_RETRY,
  SES_RETRY,
  STREET_VIEW_RETRY,
  AI_PROXY_RETRY,
  countyGisCircuit,
  streetViewCircuit,
  aiProxyCircuit,
} from './retry.js';
import type { RetryConfig, CircuitBreakerConfig } from './retry.js';

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  const fastConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1,
    backoffType: 'exponential',
  };

  it('should succeed on the first attempt without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await withRetry(fn, fastConfig);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on a later attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('recovered');

    const result = await withRetry(fn, fastConfig);

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw the last error when all retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent'));

    await expect(withRetry(fn, fastConfig)).rejects.toThrow('persistent');
    // 1 initial + 3 retries = 4 total calls
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should apply exponential backoff timing', async () => {
    const config: RetryConfig = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffType: 'exponential',
    };

    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const start = Date.now();
    await expect(withRetry(fn, config)).rejects.toThrow('fail');
    const elapsed = Date.now() - start;

    // Minimum delay with jitter (50%): 100*0.5 + 200*0.5 + 400*0.5 = 350ms
    // Maximum delay: 100 + 200 + 400 = 700ms
    // Allow some tolerance for timer imprecision
    expect(elapsed).toBeGreaterThanOrEqual(250);
  });

  it('should apply linear backoff timing', async () => {
    const config: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 50,
      backoffType: 'linear',
    };

    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const start = Date.now();
    await expect(withRetry(fn, config)).rejects.toThrow('fail');
    const elapsed = Date.now() - start;

    // Linear: attempt 0 → 50*1=50ms, attempt 1 → 50*2=100ms
    // Minimum with jitter (50%): 25 + 50 = 75ms
    expect(elapsed).toBeGreaterThanOrEqual(50);
  });

  it('should not retry when maxRetries is 0', async () => {
    const config: RetryConfig = {
      maxRetries: 0,
      baseDelayMs: 100,
      backoffType: 'exponential',
    };

    const fn = vi.fn().mockRejectedValue(new Error('no-retry'));

    await expect(withRetry(fn, config)).rejects.toThrow('no-retry');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// CircuitBreaker
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  const config: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeMs: 100,
  };

  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(config);
  });

  it('should start in the closed state', () => {
    expect(breaker.getState()).toBe('closed');
  });

  it('should pass through successful calls in closed state', async () => {
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe('closed');
  });

  it('should open after reaching the failure threshold', async () => {
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error(`fail-${i}`))),
      ).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('open');
  });

  it('should reject calls immediately when open', async () => {
    // Trip the breaker
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('trip'))),
      ).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('open');

    await expect(
      breaker.execute(() => Promise.resolve('should not run')),
    ).rejects.toThrow('Circuit breaker is open');
  });

  it('should transition to half-open after the reset time elapses', async () => {
    // Trip the breaker
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('trip'))),
      ).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('open');

    // Wait for reset time
    await new Promise((resolve) => setTimeout(resolve, config.resetTimeMs + 20));

    // The next execute call should transition to half-open and allow the probe
    const result = await breaker.execute(() => Promise.resolve('probe-ok'));
    expect(result).toBe('probe-ok');
    // Successful probe closes the circuit
    expect(breaker.getState()).toBe('closed');
  });

  it('should close on success in half-open state', async () => {
    // Trip the breaker
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('trip'))),
      ).rejects.toThrow();
    }

    // Wait for reset time
    await new Promise((resolve) => setTimeout(resolve, config.resetTimeMs + 20));

    // Successful probe
    await breaker.execute(() => Promise.resolve('success'));
    expect(breaker.getState()).toBe('closed');

    // Subsequent calls should work normally
    const result = await breaker.execute(() => Promise.resolve('normal'));
    expect(result).toBe('normal');
  });

  it('should reopen on failure in half-open state', async () => {
    // Trip the breaker
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('trip'))),
      ).rejects.toThrow();
    }

    // Wait for reset time
    await new Promise((resolve) => setTimeout(resolve, config.resetTimeMs + 20));

    // Failed probe should reopen
    await expect(
      breaker.execute(() => Promise.reject(new Error('probe-fail'))),
    ).rejects.toThrow('probe-fail');

    expect(breaker.getState()).toBe('open');
  });

  it('should allow manual reset', async () => {
    // Trip the breaker
    for (let i = 0; i < config.failureThreshold; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('trip'))),
      ).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('open');

    breaker.reset();
    expect(breaker.getState()).toBe('closed');

    // Should work normally after reset
    const result = await breaker.execute(() => Promise.resolve('after-reset'));
    expect(result).toBe('after-reset');
  });

  it('should not open before reaching the failure threshold', async () => {
    // Fail one less than threshold
    for (let i = 0; i < config.failureThreshold - 1; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail'))),
      ).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('closed');
  });

  it('should reset failure count on success', async () => {
    // Fail twice (below threshold of 3)
    await expect(
      breaker.execute(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow();
    await expect(
      breaker.execute(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow();

    // Succeed — resets counter
    await breaker.execute(() => Promise.resolve('ok'));

    // Fail twice more — should still be closed (counter was reset)
    await expect(
      breaker.execute(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow();
    await expect(
      breaker.execute(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow();

    expect(breaker.getState()).toBe('closed');
  });
});

// ---------------------------------------------------------------------------
// Pre-configured retry configs
// ---------------------------------------------------------------------------

describe('Pre-configured retry configs', () => {
  it('DYNAMODB_RETRY: 3 retries, exponential, 100ms base', () => {
    expect(DYNAMODB_RETRY).toEqual({
      maxRetries: 3,
      baseDelayMs: 100,
      backoffType: 'exponential',
    });
  });

  it('COUNTY_GIS_RETRY: 2 retries, linear, 1000ms base', () => {
    expect(COUNTY_GIS_RETRY).toEqual({
      maxRetries: 2,
      baseDelayMs: 1000,
      backoffType: 'linear',
    });
  });

  it('SES_RETRY: 3 retries, exponential, 1000ms base', () => {
    expect(SES_RETRY).toEqual({
      maxRetries: 3,
      baseDelayMs: 1000,
      backoffType: 'exponential',
    });
  });

  it('STREET_VIEW_RETRY: 1 retry, linear, 0ms base', () => {
    expect(STREET_VIEW_RETRY).toEqual({
      maxRetries: 1,
      baseDelayMs: 0,
      backoffType: 'linear',
    });
  });

  it('AI_PROXY_RETRY: 1 retry, linear, 2000ms base', () => {
    expect(AI_PROXY_RETRY).toEqual({
      maxRetries: 1,
      baseDelayMs: 2000,
      backoffType: 'linear',
    });
  });
});

// ---------------------------------------------------------------------------
// Pre-configured circuit breakers
// ---------------------------------------------------------------------------

describe('Pre-configured circuit breakers', () => {
  beforeEach(() => {
    // Reset all shared circuit breakers between tests
    countyGisCircuit.reset();
    streetViewCircuit.reset();
    aiProxyCircuit.reset();
  });

  it('countyGisCircuit: opens after 5 failures', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        countyGisCircuit.execute(() => Promise.reject(new Error('gis-fail'))),
      ).rejects.toThrow();
    }
    expect(countyGisCircuit.getState()).toBe('open');
  });

  it('streetViewCircuit: opens after 10 failures', async () => {
    for (let i = 0; i < 10; i++) {
      await expect(
        streetViewCircuit.execute(() => Promise.reject(new Error('sv-fail'))),
      ).rejects.toThrow();
    }
    expect(streetViewCircuit.getState()).toBe('open');
  });

  it('aiProxyCircuit: opens after 3 failures', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(
        aiProxyCircuit.execute(() => Promise.reject(new Error('ai-fail'))),
      ).rejects.toThrow();
    }
    expect(aiProxyCircuit.getState()).toBe('open');
  });
});
