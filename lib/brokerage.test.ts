/**
 * Tests for lib/brokerage.ts — broker-of-record, syndication portals, payment gating.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SYNDICATION_PORTALS,
  portalsSentence,
  tryGetBrokerOfRecord,
  getBrokerOfRecord,
  listingsPaymentEnabled,
  PRE_LAUNCH_LISTING_MESSAGE,
} from './brokerage.js';

describe('SYNDICATION_PORTALS', () => {
  it('contains the 5 major portals', () => {
    expect(SYNDICATION_PORTALS).toContain('Zillow');
    expect(SYNDICATION_PORTALS).toContain('Realtor.com');
    expect(SYNDICATION_PORTALS).toContain('Redfin');
    expect(SYNDICATION_PORTALS).toContain('Trulia');
    expect(SYNDICATION_PORTALS).toContain('Homes.com');
    expect(SYNDICATION_PORTALS.length).toBe(5);
  });
});

describe('portalsSentence', () => {
  it('returns a grammatically correct sentence', () => {
    const sentence = portalsSentence();
    expect(sentence).toContain('Zillow');
    expect(sentence).toContain('and Homes.com');
    expect(sentence).not.toContain(', and ,');
  });
});

describe('tryGetBrokerOfRecord', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null when env vars not set', () => {
    delete process.env['BROKER_OF_RECORD_NAME'];
    delete process.env['BROKER_OF_RECORD_LICENSE'];
    delete process.env['NEXT_PUBLIC_BROKER_OF_RECORD_NAME'];
    delete process.env['NEXT_PUBLIC_BROKER_OF_RECORD_LICENSE'];
    expect(tryGetBrokerOfRecord()).toBeNull();
  });

  it('reads from standard env vars', () => {
    process.env['BROKER_OF_RECORD_NAME'] = 'Jane Smith';
    process.env['BROKER_OF_RECORD_LICENSE'] = 'BR-12345';
    process.env['BROKER_OF_RECORD_BROKERAGE'] = 'MesaHomes Realty';

    const broker = tryGetBrokerOfRecord();
    expect(broker).not.toBeNull();
    expect(broker!.name).toBe('Jane Smith');
    expect(broker!.licenseNumber).toBe('BR-12345');
    expect(broker!.brokerageName).toBe('MesaHomes Realty');
  });

  it('falls back to NEXT_PUBLIC_ prefix', () => {
    delete process.env['BROKER_OF_RECORD_NAME'];
    delete process.env['BROKER_OF_RECORD_LICENSE'];
    process.env['NEXT_PUBLIC_BROKER_OF_RECORD_NAME'] = 'Bob Jones';
    process.env['NEXT_PUBLIC_BROKER_OF_RECORD_LICENSE'] = 'BR-99999';

    const broker = tryGetBrokerOfRecord();
    expect(broker).not.toBeNull();
    expect(broker!.name).toBe('Bob Jones');
  });

  it('defaults brokerageName to MesaHomes', () => {
    process.env['BROKER_OF_RECORD_NAME'] = 'Test';
    process.env['BROKER_OF_RECORD_LICENSE'] = 'BR-1';
    delete process.env['BROKER_OF_RECORD_BROKERAGE'];
    delete process.env['NEXT_PUBLIC_BROKER_OF_RECORD_BROKERAGE'];

    const broker = tryGetBrokerOfRecord();
    expect(broker!.brokerageName).toBe('MesaHomes');
  });
});

describe('getBrokerOfRecord', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when not configured', () => {
    delete process.env['BROKER_OF_RECORD_NAME'];
    delete process.env['BROKER_OF_RECORD_LICENSE'];
    delete process.env['NEXT_PUBLIC_BROKER_OF_RECORD_NAME'];
    delete process.env['NEXT_PUBLIC_BROKER_OF_RECORD_LICENSE'];
    expect(() => getBrokerOfRecord()).toThrow('Broker of record not configured');
  });
});

describe('listingsPaymentEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns false by default', () => {
    delete process.env['LISTINGS_PAYMENT_ENABLED'];
    delete process.env['NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED'];
    expect(listingsPaymentEnabled()).toBe(false);
  });

  it('returns true when set', () => {
    process.env['LISTINGS_PAYMENT_ENABLED'] = 'true';
    expect(listingsPaymentEnabled()).toBe(true);
  });

  it('reads NEXT_PUBLIC_ fallback', () => {
    delete process.env['LISTINGS_PAYMENT_ENABLED'];
    process.env['NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED'] = 'true';
    expect(listingsPaymentEnabled()).toBe(true);
  });
});

describe('PRE_LAUNCH_LISTING_MESSAGE', () => {
  it('is a non-empty string', () => {
    expect(PRE_LAUNCH_LISTING_MESSAGE.length).toBeGreaterThan(10);
    expect(PRE_LAUNCH_LISTING_MESSAGE).toContain('coming soon');
  });
});
