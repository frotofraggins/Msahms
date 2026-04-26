#!/usr/bin/env node
/**
 * CDK app entry point for MesaHomes infrastructure.
 *
 * Synthesizes one CloudFormation stack covering:
 * - DynamoDB single-table with 2 GSIs + Streams + TTL
 * - Cognito User Pool + App Client
 * - S3 buckets (data, photos)
 * - 14 Lambda functions
 * - API Gateway REST API with 32 routes + Cognito authorizer
 * - Secrets Manager entries (empty placeholders)
 * - EventBridge cron for data-pipeline
 * - DynamoDB Streams trigger for notification-worker
 *
 * Deploy: `npx cdk deploy --profile Msahms`
 */
import { App } from 'aws-cdk-lib';
import { MesaHomesStack } from './stack.js';

const app = new App();
new MesaHomesStack(app, 'MesaHomesStack', {
  env: { account: '304052673868', region: 'us-west-2' },
  description: 'MesaHomes MVP — all backend infrastructure',
});
