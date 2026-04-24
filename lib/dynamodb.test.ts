import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityType } from './types/dynamodb.js';
import type { DynamoDBItem } from './types/dynamodb.js';

// Mock the AWS SDK before importing the module under test
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
}));

vi.mock('@aws-sdk/lib-dynamodb', async () => {
  const actual = await vi.importActual<typeof import('@aws-sdk/lib-dynamodb')>('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: vi.fn().mockReturnValue({ send: mockSend }),
    },
  };
});

// Import after mocks are set up
const mod = await import('./dynamodb.js');
const { MESAHOMES_TABLE, putItem, getItem, queryByPK, queryGSI1, updateItem, deleteItem, batchWrite } = mod;

describe('MESAHOMES_TABLE constant', () => {
  it('should equal mesahomes-main', () => {
    expect(MESAHOMES_TABLE).toBe('mesahomes-main');
  });
});

describe('putItem', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should send a PutCommand with automatic timestamps', async () => {
    const item: DynamoDBItem = {
      PK: 'LEAD#123',
      SK: 'LEAD#123',
      entityType: EntityType.LEAD,
      data: { name: 'Test' },
      createdAt: '',
      updatedAt: '',
    };

    await putItem(item);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.TableName).toBe('mesahomes-main');
    expect(call.input.Item.PK).toBe('LEAD#123');
    // Should have set timestamps
    expect(call.input.Item.createdAt).toBeTruthy();
    expect(call.input.Item.updatedAt).toBeTruthy();
  });

  it('should preserve existing createdAt', async () => {
    const item: DynamoDBItem = {
      PK: 'LEAD#123',
      SK: 'LEAD#123',
      entityType: EntityType.LEAD,
      data: {},
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '',
    };

    await putItem(item);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Item.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('should retry on failure up to 3 times', async () => {
    mockSend
      .mockRejectedValueOnce(new Error('Throttled'))
      .mockRejectedValueOnce(new Error('Throttled'))
      .mockResolvedValueOnce({});

    const item: DynamoDBItem = {
      PK: 'LEAD#123',
      SK: 'LEAD#123',
      entityType: EntityType.LEAD,
      data: {},
      createdAt: '',
      updatedAt: '',
    };

    await putItem(item);
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting retries', async () => {
    mockSend.mockRejectedValue(new Error('Persistent failure'));

    const item: DynamoDBItem = {
      PK: 'LEAD#123',
      SK: 'LEAD#123',
      entityType: EntityType.LEAD,
      data: {},
      createdAt: '',
      updatedAt: '',
    };

    await expect(putItem(item)).rejects.toThrow('Persistent failure');
    // 1 initial + 3 retries = 4 calls
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});

describe('getItem', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return the item when found', async () => {
    const mockItem = { PK: 'LEAD#1', SK: 'LEAD#1', entityType: 'LEAD', data: {} };
    mockSend.mockResolvedValue({ Item: mockItem });

    const result = await getItem('LEAD#1', 'LEAD#1');
    expect(result).toEqual(mockItem);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Key).toEqual({ PK: 'LEAD#1', SK: 'LEAD#1' });
  });

  it('should return undefined when item not found', async () => {
    mockSend.mockResolvedValue({});

    const result = await getItem('LEAD#missing', 'LEAD#missing');
    expect(result).toBeUndefined();
  });
});

describe('queryByPK', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should query by partition key', async () => {
    mockSend.mockResolvedValue({ Items: [{ PK: 'LEAD#1', SK: 'LEAD#1' }] });

    const result = await queryByPK('LEAD#1');
    expect(result.items).toHaveLength(1);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.TableName).toBe('mesahomes-main');
    expect(call.input.KeyConditionExpression).toBe('PK = :pk');
  });

  it('should support begins_with sort key condition', async () => {
    mockSend.mockResolvedValue({ Items: [] });

    await queryByPK('AGENT#1', {
      skCondition: { operator: 'begins_with', value: 'LEAD#' },
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.input.KeyConditionExpression).toBe('PK = :pk AND begins_with(SK, :skVal)');
    expect(call.input.ExpressionAttributeValues[':skVal']).toBe('LEAD#');
  });

  it('should return empty items when no results', async () => {
    mockSend.mockResolvedValue({ Items: undefined });

    const result = await queryByPK('NONEXISTENT');
    expect(result.items).toEqual([]);
  });
});

describe('queryGSI1', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should query GSI1 index', async () => {
    mockSend.mockResolvedValue({ Items: [{ GSI1PK: 'AGENT#1' }] });

    const result = await queryGSI1('AGENT#1');
    expect(result.items).toHaveLength(1);

    const call = mockSend.mock.calls[0][0];
    expect(call.input.IndexName).toBe('GSI1');
    expect(call.input.KeyConditionExpression).toBe('GSI1PK = :pk');
  });
});

describe('updateItem', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should build an update expression with automatic updatedAt', async () => {
    await updateItem('LEAD#1', 'LEAD#1', { 'data.status': 'Contacted' });

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Key).toEqual({ PK: 'LEAD#1', SK: 'LEAD#1' });
    expect(call.input.UpdateExpression).toContain('SET');
    // Should include updatedAt in the expression
    const names = Object.values(call.input.ExpressionAttributeNames) as string[];
    expect(names).toContain('updatedAt');
  });
});

describe('deleteItem', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should send a DeleteCommand with the correct key', async () => {
    await deleteItem('LEAD#1', 'LEAD#1');

    const call = mockSend.mock.calls[0][0];
    expect(call.input.Key).toEqual({ PK: 'LEAD#1', SK: 'LEAD#1' });
  });
});

describe('batchWrite', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ UnprocessedItems: {} });
  });

  it('should do nothing for empty array', async () => {
    await batchWrite([]);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should throw if more than 25 items are provided', async () => {
    const items: DynamoDBItem[] = Array.from({ length: 26 }, (_, i) => ({
      PK: `ITEM#${i}`,
      SK: `ITEM#${i}`,
      entityType: EntityType.MARKET,
      data: {},
      createdAt: '',
      updatedAt: '',
    }));

    await expect(batchWrite(items)).rejects.toThrow('batchWrite accepts at most 25 items');
  });

  it('should batch write items with timestamps', async () => {
    const items: DynamoDBItem[] = [
      {
        PK: 'MARKET#ZIP#85140',
        SK: 'ZHVI#2026-03',
        entityType: EntityType.MARKET,
        data: { zhvi: 432201 },
        createdAt: '',
        updatedAt: '',
      },
    ];

    await batchWrite(items);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    const requests = call.input.RequestItems['mesahomes-main'];
    expect(requests).toHaveLength(1);
    expect(requests[0].PutRequest.Item.PK).toBe('MARKET#ZIP#85140');
    expect(requests[0].PutRequest.Item.createdAt).toBeTruthy();
    expect(requests[0].PutRequest.Item.updatedAt).toBeTruthy();
  });
});
