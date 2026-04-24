import { describe, it, expect } from 'vitest';
import {
  MESAHOMES_SECRETS,
  MESAHOMES_SECRET_NAMES,
  GOOGLE_MAPS_API_KEY_SECRET,
  STRIPE_SECRET_KEY_SECRET,
  STRIPE_WEBHOOK_SECRET_SECRET,
  RENTCAST_API_KEY_SECRET,
  COGNITO_CLIENT_SECRET_SECRET,
  SES_SMTP_CREDENTIALS_SECRET,
} from './secrets.js';

describe('Secret name constants', () => {
  it('should define the Google Maps API key secret path', () => {
    expect(GOOGLE_MAPS_API_KEY_SECRET).toBe('mesahomes/google-maps-api-key');
  });

  it('should define the Stripe secret key path', () => {
    expect(STRIPE_SECRET_KEY_SECRET).toBe('mesahomes/stripe-secret-key');
  });

  it('should define the Stripe webhook secret path', () => {
    expect(STRIPE_WEBHOOK_SECRET_SECRET).toBe('mesahomes/stripe-webhook-secret');
  });

  it('should define the RentCast API key secret path', () => {
    expect(RENTCAST_API_KEY_SECRET).toBe('mesahomes/rentcast-api-key');
  });

  it('should define the Cognito client secret path', () => {
    expect(COGNITO_CLIENT_SECRET_SECRET).toBe('mesahomes/cognito-client-secret');
  });

  it('should define the SES SMTP credentials secret path', () => {
    expect(SES_SMTP_CREDENTIALS_SECRET).toBe('mesahomes/ses-smtp-credentials');
  });
});

describe('MESAHOMES_SECRETS definitions', () => {
  it('should contain exactly 6 secret definitions', () => {
    expect(MESAHOMES_SECRETS).toHaveLength(6);
  });

  it('should include all required secret names', () => {
    const names = MESAHOMES_SECRETS.map((s) => s.name);
    expect(names).toContain('mesahomes/google-maps-api-key');
    expect(names).toContain('mesahomes/stripe-secret-key');
    expect(names).toContain('mesahomes/stripe-webhook-secret');
    expect(names).toContain('mesahomes/rentcast-api-key');
    expect(names).toContain('mesahomes/cognito-client-secret');
    expect(names).toContain('mesahomes/ses-smtp-credentials');
  });

  it('should have a description and service for every secret', () => {
    for (const secret of MESAHOMES_SECRETS) {
      expect(secret.description).toBeTruthy();
      expect(secret.service).toBeTruthy();
    }
  });

  it('should prefix all secret names with mesahomes/', () => {
    for (const secret of MESAHOMES_SECRETS) {
      expect(secret.name).toMatch(/^mesahomes\//);
    }
  });
});

describe('MESAHOMES_SECRET_NAMES list', () => {
  it('should contain exactly 6 names', () => {
    expect(MESAHOMES_SECRET_NAMES).toHaveLength(6);
  });

  it('should match the names from MESAHOMES_SECRETS in order', () => {
    const expected = MESAHOMES_SECRETS.map((s) => s.name);
    expect([...MESAHOMES_SECRET_NAMES]).toEqual(expected);
  });
});
