/**
 * Shared DynamoDB client module for the MesaHomes platform.
 *
 * Provides a configured DynamoDB Document Client and helper functions
 * for common single-table operations against the mesahomes-main table.
 *
 * All write operations automatically set createdAt/updatedAt timestamps.
 * All operations retry up to 3 times with exponential backoff on failure.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  type PutCommandInput,
  type GetCommandInput,
  type QueryCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import type { DynamoDBItem, QueryOptions } from './types/dynamodb.js';

/** Table name constant used across the platform. */
export const MESAHOMES_TABLE = 'mesahomes-main';

/** Maximum retries for DynamoDB operations. */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff. */
const BASE_DELAY_MS = 100;

/** Maximum items per BatchWrite request (DynamoDB limit). */
const BATCH_WRITE_LIMIT = 25;

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

const ddbClient = new DynamoDBClient({
  region: process.env['AWS_REGION'] ?? 'us-west-2',
});

/** Configured DynamoDB Document Client with marshalling options. */
export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

/**
 * Execute an async operation with exponential backoff retry.
 * Retries up to {@link MAX_RETRIES} times with 100ms × 2^attempt jittered delay.
 */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      if (attempt === MAX_RETRIES) break;

      // Exponential backoff with jitter
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Write an item to the table with automatic createdAt/updatedAt timestamps.
 *
 * If the item already has a `createdAt` value it is preserved; `updatedAt`
 * is always overwritten with the current time.
 */
export async function putItem(item: DynamoDBItem): Promise<void> {
  const now = new Date().toISOString();
  const timestamped: DynamoDBItem = {
    ...item,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };

  const params: PutCommandInput = {
    TableName: MESAHOMES_TABLE,
    Item: timestamped,
  };

  await withRetry(() => docClient.send(new PutCommand(params)));
}

/**
 * Get a single item by its composite primary key.
 * Returns `undefined` if the item does not exist.
 */
export async function getItem(pk: string, sk: string): Promise<DynamoDBItem | undefined> {
  const params: GetCommandInput = {
    TableName: MESAHOMES_TABLE,
    Key: { PK: pk, SK: sk },
  };

  const result = await withRetry(() => docClient.send(new GetCommand(params)));
  return result.Item as DynamoDBItem | undefined;
}

/**
 * Query all items sharing a partition key on the base table.
 */
export async function queryByPK(
  pk: string,
  options?: QueryOptions,
): Promise<{ items: DynamoDBItem[]; lastKey?: Record<string, unknown> }> {
  const params: QueryCommandInput = {
    TableName: MESAHOMES_TABLE,
    KeyConditionExpression: buildKeyCondition('PK', 'SK', options),
    ExpressionAttributeValues: buildExpressionValues(pk, options),
    ScanIndexForward: options?.scanForward ?? true,
    ...(options?.limit && { Limit: options.limit }),
    ...(options?.startKey && { ExclusiveStartKey: options.startKey }),
  };

  const result = await withRetry(() => docClient.send(new QueryCommand(params)));
  return {
    items: (result.Items ?? []) as DynamoDBItem[],
    lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

/**
 * Query items on GSI1 (GSI1PK / GSI1SK).
 */
export async function queryGSI1(
  gsi1pk: string,
  options?: QueryOptions,
): Promise<{ items: DynamoDBItem[]; lastKey?: Record<string, unknown> }> {
  const params: QueryCommandInput = {
    TableName: MESAHOMES_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: buildKeyCondition('GSI1PK', 'GSI1SK', options),
    ExpressionAttributeValues: buildExpressionValues(gsi1pk, options),
    ScanIndexForward: options?.scanForward ?? true,
    ...(options?.limit && { Limit: options.limit }),
    ...(options?.startKey && { ExclusiveStartKey: options.startKey }),
  };

  const result = await withRetry(() => docClient.send(new QueryCommand(params)));
  return {
    items: (result.Items ?? []) as DynamoDBItem[],
    lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

/**
 * Partial update of an item identified by PK/SK.
 *
 * Automatically sets `updatedAt` to the current time. The `updates` map
 * should contain attribute names and their new values. Reserved words are
 * handled via expression attribute names.
 */
export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const now = new Date().toISOString();
  const allUpdates = { ...updates, updatedAt: now };

  const expressionParts: string[] = [];
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};

  let index = 0;
  for (const [key, value] of Object.entries(allUpdates)) {
    const nameAlias = `#attr${index}`;
    const valueAlias = `:val${index}`;
    expressionNames[nameAlias] = key;
    expressionValues[valueAlias] = value;
    expressionParts.push(`${nameAlias} = ${valueAlias}`);
    index++;
  }

  const params: UpdateCommandInput = {
    TableName: MESAHOMES_TABLE,
    Key: { PK: pk, SK: sk },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
  };

  await withRetry(() => docClient.send(new UpdateCommand(params)));
}

/**
 * Delete an item by its composite primary key.
 */
export async function deleteItem(pk: string, sk: string): Promise<void> {
  const params: DeleteCommandInput = {
    TableName: MESAHOMES_TABLE,
    Key: { PK: pk, SK: sk },
  };

  await withRetry(() => docClient.send(new DeleteCommand(params)));
}

/**
 * Batch write up to 25 items. Items are written as PutRequests.
 *
 * Automatically sets createdAt/updatedAt on each item.
 * Throws if more than 25 items are provided (DynamoDB limit).
 */
export async function batchWrite(items: DynamoDBItem[]): Promise<void> {
  if (items.length === 0) return;
  if (items.length > BATCH_WRITE_LIMIT) {
    throw new Error(`batchWrite accepts at most ${BATCH_WRITE_LIMIT} items, received ${items.length}`);
  }

  const now = new Date().toISOString();
  const requests = items.map((item) => ({
    PutRequest: {
      Item: {
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: now,
      },
    },
  }));

  const params: BatchWriteCommandInput = {
    RequestItems: {
      [MESAHOMES_TABLE]: requests,
    },
  };

  await withRetry(async () => {
    const result = await docClient.send(new BatchWriteCommand(params));

    // Handle unprocessed items by retrying them
    if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
      const retryParams: BatchWriteCommandInput = {
        RequestItems: result.UnprocessedItems,
      };
      await docClient.send(new BatchWriteCommand(retryParams));
    }
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the KeyConditionExpression string for a query.
 */
function buildKeyCondition(
  pkAttr: string,
  skAttr: string,
  options?: QueryOptions,
): string {
  let expression = `${pkAttr} = :pk`;

  if (options?.skCondition) {
    const { operator } = options.skCondition;
    switch (operator) {
      case 'begins_with':
        expression += ` AND begins_with(${skAttr}, :skVal)`;
        break;
      case 'between':
        expression += ` AND ${skAttr} BETWEEN :skVal AND :skVal2`;
        break;
      default:
        expression += ` AND ${skAttr} ${operator} :skVal`;
        break;
    }
  }

  return expression;
}

/**
 * Build the ExpressionAttributeValues map for a query.
 */
function buildExpressionValues(
  pkValue: string,
  options?: QueryOptions,
): Record<string, string> {
  const values: Record<string, string> = { ':pk': pkValue };

  if (options?.skCondition) {
    values[':skVal'] = options.skCondition.value;
    if (options.skCondition.operator === 'between' && options.skCondition.value2) {
      values[':skVal2'] = options.skCondition.value2;
    }
  }

  return values;
}
