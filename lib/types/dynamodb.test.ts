import { describe, it, expect } from 'vitest';
import { EntityType } from './dynamodb.js';
import type { DynamoDBItem, QueryOptions } from './dynamodb.js';

describe('EntityType enum', () => {
  it('should contain all 11 required entity types', () => {
    const expected = [
      'LEAD',
      'AGENT',
      'TEAM',
      'LISTING',
      'CONTENT',
      'MARKET',
      'PROPERTY_CACHE',
      'NOTIFICATION',
      'VISITOR_PROFILE',
      'SAVED_SCENARIO',
      'CONTENT_INGEST',
    ];

    for (const name of expected) {
      expect(EntityType[name as keyof typeof EntityType]).toBe(name);
    }

    // Verify exact count — no extra values
    expect(Object.keys(EntityType)).toHaveLength(expected.length);
  });
});

describe('DynamoDBItem type', () => {
  it('should accept a fully populated item', () => {
    const item: DynamoDBItem = {
      PK: 'LEAD#abc123',
      SK: 'LEAD#abc123',
      GSI1PK: 'AGENT#agent1',
      GSI1SK: 'LEAD#2026-04-01',
      GSI2PK: 'STATUS#New',
      GSI2SK: 'LEAD#2026-04-01',
      entityType: EntityType.LEAD,
      data: { name: 'Test Lead', email: 'test@example.com' },
      ttl: 1714000000,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    };

    expect(item.PK).toBe('LEAD#abc123');
    expect(item.entityType).toBe(EntityType.LEAD);
    expect(item.ttl).toBe(1714000000);
  });

  it('should accept an item with only required fields (no GSI keys, no TTL)', () => {
    const item: DynamoDBItem = {
      PK: 'MARKET#ZIP#85140',
      SK: 'ZHVI#LATEST',
      entityType: EntityType.MARKET,
      data: { zhvi: 432201 },
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    };

    expect(item.GSI1PK).toBeUndefined();
    expect(item.ttl).toBeUndefined();
  });
});

describe('QueryOptions type', () => {
  it('should accept query options with all fields', () => {
    const opts: QueryOptions = {
      limit: 10,
      scanForward: false,
      skCondition: { operator: 'begins_with', value: 'LEAD#' },
      startKey: { PK: 'AGENT#1', SK: 'LEAD#2026-01-01' },
    };

    expect(opts.limit).toBe(10);
    expect(opts.skCondition?.operator).toBe('begins_with');
  });

  it('should accept between operator with two values', () => {
    const opts: QueryOptions = {
      skCondition: {
        operator: 'between',
        value: '2026-01-01',
        value2: '2026-12-31',
      },
    };

    expect(opts.skCondition?.value2).toBe('2026-12-31');
  });
});
