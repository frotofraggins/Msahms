import { describe, it, expect } from 'vitest';
import { mesahomesTableDefinition, ttlSpecification, TABLE_NAME } from './dynamodb.js';

describe('DynamoDB table definition', () => {
  it('should use the correct table name', () => {
    expect(TABLE_NAME).toBe('mesahomes-main');
    expect(mesahomesTableDefinition.TableName).toBe('mesahomes-main');
  });

  it('should use PAY_PER_REQUEST billing', () => {
    expect(mesahomesTableDefinition.BillingMode).toBe('PAY_PER_REQUEST');
  });

  it('should define PK (String) as partition key and SK (String) as sort key', () => {
    const keySchema = mesahomesTableDefinition.KeySchema!;
    expect(keySchema).toHaveLength(2);
    expect(keySchema[0]).toEqual({ AttributeName: 'PK', KeyType: 'HASH' });
    expect(keySchema[1]).toEqual({ AttributeName: 'SK', KeyType: 'RANGE' });

    const attrs = mesahomesTableDefinition.AttributeDefinitions!;
    const pkAttr = attrs.find((a) => a.AttributeName === 'PK');
    const skAttr = attrs.find((a) => a.AttributeName === 'SK');
    expect(pkAttr?.AttributeType).toBe('S');
    expect(skAttr?.AttributeType).toBe('S');
  });

  it('should define GSI1 with GSI1PK/GSI1SK and ALL projection', () => {
    const gsis = mesahomesTableDefinition.GlobalSecondaryIndexes!;
    const gsi1 = gsis.find((g) => g.IndexName === 'GSI1');
    expect(gsi1).toBeDefined();
    expect(gsi1!.KeySchema).toEqual([
      { AttributeName: 'GSI1PK', KeyType: 'HASH' },
      { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
    ]);
    expect(gsi1!.Projection?.ProjectionType).toBe('ALL');
  });

  it('should define GSI2 with GSI2PK/GSI2SK and ALL projection', () => {
    const gsis = mesahomesTableDefinition.GlobalSecondaryIndexes!;
    const gsi2 = gsis.find((g) => g.IndexName === 'GSI2');
    expect(gsi2).toBeDefined();
    expect(gsi2!.KeySchema).toEqual([
      { AttributeName: 'GSI2PK', KeyType: 'HASH' },
      { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
    ]);
    expect(gsi2!.Projection?.ProjectionType).toBe('ALL');
  });

  it('should declare all 6 key attributes as String type', () => {
    const attrs = mesahomesTableDefinition.AttributeDefinitions!;
    const expectedAttrs = ['PK', 'SK', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK'];
    expect(attrs).toHaveLength(6);
    for (const name of expectedAttrs) {
      const attr = attrs.find((a) => a.AttributeName === name);
      expect(attr, `${name} should be defined`).toBeDefined();
      expect(attr!.AttributeType).toBe('S');
    }
  });

  it('should enable DynamoDB Streams with NEW_AND_OLD_IMAGES', () => {
    const stream = mesahomesTableDefinition.StreamSpecification;
    expect(stream?.StreamEnabled).toBe(true);
    expect(stream?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
  });

  it('should configure TTL on the ttl attribute', () => {
    expect(ttlSpecification.TableName).toBe('mesahomes-main');
    expect(ttlSpecification.TimeToLiveSpecification.AttributeName).toBe('ttl');
    expect(ttlSpecification.TimeToLiveSpecification.Enabled).toBe(true);
  });
});
