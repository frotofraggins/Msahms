import { describe, it, expect, afterEach } from 'vitest';
import {
  SYNDICATION_PORTALS,
  portalsSentence,
  getBrokerOfRecord,
  tryGetBrokerOfRecord,
  listingsPaymentEnabled,
  PRE_LAUNCH_LISTING_MESSAGE,
} from './brokerage.js';

const ENV_KEYS = [
  'BROKER_OF_RECORD_NAME',
  'BROKER_OF_RECORD_LICENSE',
  'BROKER_OF_RECORD_ARMLS_ID',
  'LISTINGS_PAYMENT_ENABLED',
] as const;

function clearEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

describe('SYNDICATION_PORTALS', () => {
  it('contains the five canonical portals', () => {
    expect(SYNDICATION_PORTALS).toEqual([
      'Zillow',
      'Realtor.com',
      'Redfin',
      'Trulia',
      'Homes.com',
    ]);
  });
  it('is frozen (cannot be mutated)', () => {
    expect(Object.isFrozen(SYNDICATION_PORTALS)).toBe(true);
  });
});

describe('portalsSentence', () => {
  it('returns Oxford-comma list with "and" before the last item', () => {
    expect(portalsSentence()).toBe(
      'Zillow, Realtor.com, Redfin, Trulia, and Homes.com',
    );
  });
});

describe('getBrokerOfRecord', () => {
  afterEach(clearEnv);

  it('throws when all env vars missing, listing them', () => {
    clearEnv();
    expect(() => getBrokerOfRecord()).toThrowError(
      /BROKER_OF_RECORD_NAME.*BROKER_OF_RECORD_LICENSE.*BROKER_OF_RECORD_ARMLS_ID/s,
    );
  });

  it('throws when any single env var is missing', () => {
    clearEnv();
    process.env['BROKER_OF_RECORD_NAME'] = 'Test Broker LLC';
    process.env['BROKER_OF_RECORD_LICENSE'] = 'BR123456';
    // armlsId intentionally missing
    expect(() => getBrokerOfRecord()).toThrowError(/BROKER_OF_RECORD_ARMLS_ID/);
  });

  it('returns all three fields when set', () => {
    process.env['BROKER_OF_RECORD_NAME'] = 'Test Broker LLC';
    process.env['BROKER_OF_RECORD_LICENSE'] = 'BR123456';
    process.env['BROKER_OF_RECORD_ARMLS_ID'] = 'ARM789';
    expect(getBrokerOfRecord()).toEqual({
      name: 'Test Broker LLC',
      licenseNumber: 'BR123456',
      armlsId: 'ARM789',
    });
  });
});

describe('tryGetBrokerOfRecord', () => {
  afterEach(clearEnv);

  it('returns null instead of throwing when env is incomplete', () => {
    clearEnv();
    expect(tryGetBrokerOfRecord()).toBeNull();
  });

  it('returns the broker when env is complete', () => {
    process.env['BROKER_OF_RECORD_NAME'] = 'X';
    process.env['BROKER_OF_RECORD_LICENSE'] = 'Y';
    process.env['BROKER_OF_RECORD_ARMLS_ID'] = 'Z';
    expect(tryGetBrokerOfRecord()).toEqual({
      name: 'X',
      licenseNumber: 'Y',
      armlsId: 'Z',
    });
  });
});

describe('listingsPaymentEnabled', () => {
  afterEach(clearEnv);

  it('defaults to false when unset', () => {
    clearEnv();
    expect(listingsPaymentEnabled()).toBe(false);
  });

  it('returns false for any value except the literal string "true"', () => {
    for (const v of ['', 'false', 'FALSE', 'True', '1', 'yes', 'enabled']) {
      process.env['LISTINGS_PAYMENT_ENABLED'] = v;
      expect(listingsPaymentEnabled()).toBe(false);
    }
  });

  it('returns true when set to the literal string "true"', () => {
    process.env['LISTINGS_PAYMENT_ENABLED'] = 'true';
    expect(listingsPaymentEnabled()).toBe(true);
  });
});

describe('PRE_LAUNCH_LISTING_MESSAGE', () => {
  it('mentions consultation so users stay in the funnel', () => {
    expect(PRE_LAUNCH_LISTING_MESSAGE.toLowerCase()).toContain('consultation');
  });
});
