/**
 * Signing and verification module for the VHZ (Virtual Home Zone) Stripe handoff.
 *
 * Blocker 1 — Approach A: MesaHomes signs a redirect URL with HMAC-SHA256
 * so VHZ can verify the handoff is authentic. VHZ sends a webhook callback
 * after payment succeeds, signed with a separate shared secret.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// Handoff signing (MesaHomes → VHZ redirect)
// ---------------------------------------------------------------------------

/**
 * Sign handoff params for the redirect URL to VHZ.
 *
 * Produces a deterministic HMAC-SHA256 hex digest over the canonical
 * query string (sorted keys, excluding `sig`).
 *
 * @param params - Key/value pairs that will appear in the redirect URL.
 * @returns Hex-encoded HMAC-SHA256 signature.
 * @throws If `VHZ_HANDOFF_SECRET` is not set.
 */
export function signHandoff(params: Record<string, string | number>): string {
  const secret = process.env['VHZ_HANDOFF_SECRET'];
  if (!secret) throw new Error('VHZ_HANDOFF_SECRET not set');

  const canonical = Object.keys(params)
    .sort()
    .filter((k) => k !== 'sig')
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  return createHmac('sha256', secret).update(canonical).digest('hex');
}

// ---------------------------------------------------------------------------
// Webhook verification (VHZ → MesaHomes callback)
// ---------------------------------------------------------------------------

/**
 * Verify an incoming webhook from VHZ.
 *
 * Compares the `X-VHZ-Signature` header value against a locally computed
 * HMAC-SHA256 of the raw request body, using timing-safe comparison to
 * prevent timing attacks.
 *
 * @param rawBody - The raw (unparsed) request body string.
 * @param signatureHeader - The value of the `X-VHZ-Signature` header.
 * @returns `true` if the signature is valid, `false` otherwise.
 */
export function verifyVhzWebhook(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env['VHZ_MESAHOMES_WEBHOOK_SECRET'];
  if (!secret) return false;

  const expected =
    'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}
