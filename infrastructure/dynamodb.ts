/**
 * CloudFormation-style DynamoDB table definition for the MesaHomes platform.
 *
 * Table: mesahomes-main
 * - Single-table design with PK/SK, two GSIs, TTL, and Streams.
 * - PAY_PER_REQUEST billing (on-demand).
 *
 * This module exports the table definition as a typed object that can be used
 * with AWS CDK, CloudFormation, or the AWS SDK CreateTable API.
 */

import {
  CreateTableCommandInput,
  BillingMode,
  KeyType,
  ScalarAttributeType,
  ProjectionType,
  StreamViewType,
} from '@aws-sdk/client-dynamodb';

/** The table name used across the platform. */
export const TABLE_NAME = 'mesahomes-main';

/**
 * Full CreateTable input for the mesahomes-main DynamoDB table.
 *
 * Includes:
 * - PK (String) / SK (String) composite primary key
 * - GSI1: GSI1PK / GSI1SK with ALL projection
 * - GSI2: GSI2PK / GSI2SK with ALL projection
 * - TTL on the `ttl` attribute
 * - DynamoDB Streams with NEW_AND_OLD_IMAGES
 * - PAY_PER_REQUEST (on-demand) billing
 */
export const mesahomesTableDefinition: CreateTableCommandInput = {
  TableName: TABLE_NAME,
  BillingMode: BillingMode.PAY_PER_REQUEST,

  // Key schema
  KeySchema: [
    { AttributeName: 'PK', KeyType: KeyType.HASH },
    { AttributeName: 'SK', KeyType: KeyType.RANGE },
  ],

  // Attribute definitions (only key attributes need to be declared)
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'SK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI1PK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI1SK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI2PK', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'GSI2SK', AttributeType: ScalarAttributeType.S },
  ],

  // Global Secondary Indexes
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: KeyType.HASH },
        { AttributeName: 'GSI1SK', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: KeyType.HASH },
        { AttributeName: 'GSI2SK', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],

  // DynamoDB Streams — triggers notification-worker Lambda
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
  },
};

/**
 * TTL configuration to apply after table creation.
 * Use UpdateTimeToLive API with this spec.
 */
export const ttlSpecification = {
  TableName: TABLE_NAME,
  TimeToLiveSpecification: {
    AttributeName: 'ttl',
    Enabled: true,
  },
};
