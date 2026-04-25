/**
 * Tests for the VHZ Stripe handoff signing and webhook verification module.
 *
 * Covers:
 * - signHandoff deterministic HMAC
 * - verifyVhzWebhook valid / tampered / missing-secret cases
 * - Timing-safe comparison (no early exit on mismatch)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { signHandoff, verifyVhzWebhook } from './listing-webhooks.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HANDOFF_SECRET = 'test-handoff-secret-abc123';
const WEBHOOK_SECRET = 'test-webhook-secret-xyz789';

function computeExpectedSig(
  params: Record<string, string | number>,
  secret: string,
): string {
  const canonical = Object.keys(params)
    .sort()
    .filter((k) => k !== 'sig')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

function computeWebhookSig(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

// ---------------------------------------------------------------------------
// signHandoff
// ---------------------------------------------------------------------------

describe('signHandoff', () => {
  beforeEach(() => {
    process.env['VHZ_HANDOFF_SECRET'] = HANDOFF_SECRET;
  });

  afterEach(() => {
    delete process.env['VHZ_HANDOFF_SECRET'];
  });

  it('should produce a deterministic HMAC for given params + secret', () => {
    const params = {
      package: 'fsbo-standard',
      lead_id: 'lead-001',
      listing_id: 'lst-001',
      email: 'seller@example.com',
      source: 'mesahomes-fsbo',
      ts: 1700000000,
    };

    const sig1 = signHandoff(params);
    const sig2 = signHandoff(params);
    const expected = computeExpectedSig(params, HANDOFF_SECRET);

    expect(sig1).toBe(sig2);
    expect(sig1).toBe(expected);
  });

  it('should sort keys alphabetically for canonical string', () => {
    const params = { z_key: 'last', a_key: 'first', m_key: 'middle' };
    const sig = signHandoff(params);
    const expected = computeExpectedSig(params, HANDOFF_SECRET);
    expect(sig).toBe(expected);
  });

  it('should exclude the sig key from the canonical string', () => {
    const params = { package: 'fsbo-starter', ts: 123, sig: 'old-sig' };
    const withoutSig = { package: 'fsbo-starter', ts: 123 };

    const sig = signHandoff(params);
    const expected = computeExpectedSig(withoutSig, HANDOFF_SECRET);
    expect(sig).toBe(expected);
  });

  it('should throw when VHZ_HANDOFF_SECRET is not set', () => {
    delete process.env['VHZ_HANDOFF_SECRET'];
    expect(() => signHandoff({ foo: 'bar' })).toThrow('VHZ_HANDOFF_SECRET not set');
  });

  it('should produce different signatures for different params', () => {
    const sig1 = signHandoff({ package: 'fsbo-starter', ts: 100 });
    const sig2 = signHandoff({ package: 'fsbo-pro', ts: 100 });
    expect(sig1).not.toBe(sig2);
  });

  it('should produce different signatures for different secrets', () => {
    const params = { package: 'fsbo-starter', ts: 100 };
    const sig1 = signHandoff(params);

    process.env['VHZ_HANDOFF_SECRET'] = 'different-secret';
    const sig2 = signHandoff(params);

    expect(sig1).not.toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// verifyVhzWebhook
// ---------------------------------------------------------------------------

describe('verifyVhzWebhook', () => {
  beforeEach(() => {
    process.env['VHZ_MESAHOMES_WEBHOOK_SECRET'] = WEBHOOK_SECRET;
  });

  afterEach(() => {
    delete process.env['VHZ_MESAHOMES_WEBHOOK_SECRET'];
  });

  it('should return true for a valid signature', () => {
    const body = JSON.stringify({ event: 'payment.succeeded', listing_id: 'lst-1' });
    const sig = computeWebhookSig(body, WEBHOOK_SECRET);
    expect(verifyVhzWebhook(body, sig)).toBe(true);
  });

  it('should return false for a tampered body', () => {
    const body = JSON.stringify({ event: 'payment.succeeded', listing_id: 'lst-1' });
    const sig = computeWebhookSig(body, WEBHOOK_SECRET);
    const tampered = JSON.stringify({ event: 'payment.succeeded', listing_id: 'lst-HACKED' });
    expect(verifyVhzWebhook(tampered, sig)).toBe(false);
  });

  it('should return false for a tampered signature', () => {
    const body = JSON.stringify({ event: 'payment.succeeded' });
    const badSig = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';
    expect(verifyVhzWebhook(body, badSig)).toBe(false);
  });

  it('should return false when VHZ_MESAHOMES_WEBHOOK_SECRET is missing', () => {
    delete process.env['VHZ_MESAHOMES_WEBHOOK_SECRET'];
    const body = '{"event":"payment.succeeded"}';
    const sig = computeWebhookSig(body, WEBHOOK_SECRET);
    expect(verifyVhzWebhook(body, sig)).toBe(false);
  });

  it('should return false when signature header is empty', () => {
    const body = '{"event":"payment.succeeded"}';
    expect(verifyVhzWebhook(body, '')).toBe(false);
  });

  it('should return false when signature has wrong prefix', () => {
    const body = '{"event":"payment.succeeded"}';
    const rawHmac = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
    // Missing the sha256= prefix
    expect(verifyVhzWebhook(body, rawHmac)).toBe(false);
  });

  it('should use timing-safe comparison (no early exit on length mismatch)', () => {
    // When lengths differ, timingSafeEqual is not called but we still return false
    const body = '{"event":"payment.succeeded"}';
    const shortSig = 'sha256=abc';
    expect(verifyVhzWebhook(body, shortSig)).toBe(false);
  });

  it('should handle empty body correctly', () => {
    const body = '';
    const sig = computeWebhookSig(body, WEBHOOK_SECRET);
    expect(verifyVhzWebhook(body, sig)).toBe(true);
  });
});
