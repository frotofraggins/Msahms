/**
 * Lambda handler for the Zillow Research CSV data pipeline.
 *
 * Triggered by EventBridge on a monthly cron schedule (0 6 17 * ? *),
 * this handler downloads all 13 Zillow Research CSVs, archives them to S3,
 * parses ZIP-level and metro-level data, and batch-writes the results to
 * DynamoDB.
 *
 * Runtime: Node.js 20 | Memory: 1024 MB | Timeout: 300s
 */

import {
  ZILLOW_CSV_URLS,
  downloadCsv,
  parseZhviZipCsv,
  parseMetroCsv,
  generateDynamoDBItems,
} from './zillow-csv.js';
import { uploadFile, DATA_BUCKET } from '../../lib/s3.js';
import { batchWrite } from '../../lib/dynamodb.js';
import type { DynamoDBItem } from '../../lib/types/dynamodb.js';

// ---------------------------------------------------------------------------
// Metric name mapping (CSV key → DynamoDB metric name)
// ---------------------------------------------------------------------------

/** Maps each metro CSV key to the metric name stored in DynamoDB. */
const METRO_METRIC_NAMES: Record<string, string> = {
  zhvi_metro: 'zhvi',
  zhvf_metro: 'zhvfGrowth',
  zori_metro: 'zori',
  inventory_metro: 'inventory',
  sale_price_metro: 'medianSalePrice',
  sales_count_metro: 'salesCount',
  sale_to_list_metro: 'saleToList',
  days_pending_metro: 'daysPending',
  price_cuts_metro: 'priceCuts',
  market_heat_metro: 'marketHeat',
  new_construction_metro: 'newConstruction',
  affordability_metro: 'affordability',
};

// ---------------------------------------------------------------------------
// Batch write helper
// ---------------------------------------------------------------------------

/** DynamoDB BatchWrite limit is 25 items per request. */
const BATCH_SIZE = 25;

/**
 * Write items to DynamoDB in batches of 25.
 */
async function batchWriteAll(items: DynamoDBItem[]): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await batchWrite(batch);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/** EventBridge scheduled event shape (minimal). */
interface ScheduledEvent {
  source?: string;
  'detail-type'?: string;
  time?: string;
}

/** Pipeline execution summary returned by the handler. */
interface PipelineResult {
  success: boolean;
  month: string;
  zipRecords: number;
  metroRecords: number;
  errors: string[];
}

/**
 * Lambda handler for the monthly Zillow CSV data pipeline.
 *
 * 1. Downloads all 13 CSVs
 * 2. Archives raw CSVs to S3
 * 3. Parses ZIP-level and metro-level data
 * 4. BatchWrites to DynamoDB
 * 5. Returns success/failure summary
 */
export async function handler(_event: ScheduledEvent): Promise<PipelineResult> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const errors: string[] = [];

  console.log(`[data-pipeline] Starting Zillow CSV ingest for ${month}`);

  // -----------------------------------------------------------------------
  // Step 1: Download all CSVs
  // -----------------------------------------------------------------------

  const csvContents: Record<string, string> = {};

  for (const [key, url] of Object.entries(ZILLOW_CSV_URLS)) {
    try {
      console.log(`[data-pipeline] Downloading ${key}...`);
      csvContents[key] = await downloadCsv(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[data-pipeline] Failed to download ${key}: ${message}`);
      errors.push(`download:${key}: ${message}`);
    }
  }

  // -----------------------------------------------------------------------
  // Step 2: Archive raw CSVs to S3
  // -----------------------------------------------------------------------

  for (const [key, content] of Object.entries(csvContents)) {
    try {
      const s3Key = `zillow-raw/${month}/${key}.csv`;
      await uploadFile(DATA_BUCKET, s3Key, content, 'text/csv');
      console.log(`[data-pipeline] Archived ${key} to s3://${DATA_BUCKET}/${s3Key}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[data-pipeline] Failed to archive ${key}: ${message}`);
      errors.push(`archive:${key}: ${message}`);
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Parse ZIP-level ZHVI data
  // -----------------------------------------------------------------------

  const zipCsv = csvContents['zhvi_zip'];
  const zipData = zipCsv ? parseZhviZipCsv(zipCsv) : [];

  if (zipCsv && zipData.length === 0) {
    console.warn('[data-pipeline] No ZIP-level records parsed from ZHVI CSV');
    errors.push('parse:zhvi_zip: no records found');
  } else {
    console.log(`[data-pipeline] Parsed ${zipData.length} ZIP-level ZHVI records`);
  }

  // -----------------------------------------------------------------------
  // Step 4: Parse metro-level data
  // -----------------------------------------------------------------------

  const metroData = [];

  for (const [key, metricName] of Object.entries(METRO_METRIC_NAMES)) {
    const content = csvContents[key];
    if (!content) continue;

    try {
      const result = parseMetroCsv(content, metricName);
      if (result) {
        metroData.push(result);
        console.log(`[data-pipeline] Parsed metro metric: ${metricName} = ${result.value}`);
      } else {
        console.warn(`[data-pipeline] No Phoenix-Mesa row found in ${key}`);
        errors.push(`parse:${key}: no Phoenix-Mesa row`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[data-pipeline] Failed to parse ${key}: ${message}`);
      errors.push(`parse:${key}: ${message}`);
    }
  }

  console.log(`[data-pipeline] Parsed ${metroData.length} metro-level records`);

  // -----------------------------------------------------------------------
  // Step 5: Generate DynamoDB items and batch write
  // -----------------------------------------------------------------------

  const dynamoItems = generateDynamoDBItems(zipData, metroData);
  console.log(`[data-pipeline] Generated ${dynamoItems.length} DynamoDB items`);

  try {
    await batchWriteAll(dynamoItems);
    console.log(`[data-pipeline] Successfully wrote ${dynamoItems.length} items to DynamoDB`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[data-pipeline] DynamoDB batch write failed: ${message}`);
    errors.push(`dynamodb:batchWrite: ${message}`);
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------

  const result: PipelineResult = {
    success: errors.length === 0,
    month,
    zipRecords: zipData.length,
    metroRecords: metroData.length,
    errors,
  };

  console.log(`[data-pipeline] Pipeline complete:`, JSON.stringify(result));
  return result;
}
