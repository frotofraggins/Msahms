/**
 * DynamoDB type definitions for the MesaHomes single-table design.
 *
 * Table: mesahomes-main
 * Pattern: PK/SK with GSI1 and GSI2 for alternate access patterns.
 */

/** Entity type discriminator for all records in the single table. */
export enum EntityType {
  LEAD = 'LEAD',
  AGENT = 'AGENT',
  TEAM = 'TEAM',
  LISTING = 'LISTING',
  CONTENT = 'CONTENT',
  MARKET = 'MARKET',
  PROPERTY_CACHE = 'PROPERTY_CACHE',
  NOTIFICATION = 'NOTIFICATION',
  VISITOR_PROFILE = 'VISITOR_PROFILE',
  SAVED_SCENARIO = 'SAVED_SCENARIO',
  CONTENT_INGEST = 'CONTENT_INGEST',
}

/** Base interface for every item stored in the mesahomes-main table. */
export interface DynamoDBItem {
  /** Partition key (entity-prefixed, e.g. "LEAD#abc123") */
  PK: string;
  /** Sort key (entity-prefixed) */
  SK: string;
  /** GSI1 partition key (optional — used for alternate access patterns) */
  GSI1PK?: string;
  /** GSI1 sort key */
  GSI1SK?: string;
  /** GSI2 partition key (provisioned for Phase 1B+) */
  GSI2PK?: string;
  /** GSI2 sort key */
  GSI2SK?: string;
  /** Discriminator identifying the entity type (required at runtime, optional in type for putItem callers) */
  entityType?: EntityType;
  /** Entity-specific payload */
  data: Record<string, unknown>;
  /** TTL epoch seconds (for cache entries, optional) */
  ttl?: number;
  /** ISO 8601 creation timestamp (auto-filled by putItem if omitted) */
  createdAt?: string;
  /** ISO 8601 last-updated timestamp (auto-filled by putItem on every write) */
  updatedAt?: string;
}

/** Options for query operations. */
export interface QueryOptions {
  /** Maximum number of items to return */
  limit?: number;
  /** Sort order — true for ascending (default), false for descending */
  scanForward?: boolean;
  /** Sort key condition: begins_with, between, >, <, >=, <= */
  skCondition?: {
    operator: 'begins_with' | 'between' | '>' | '<' | '>=' | '<=';
    value: string;
    /** Second value for 'between' operator */
    value2?: string;
  };
  /** Exclusive start key for pagination */
  startKey?: Record<string, unknown>;
}
