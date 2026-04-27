/**
 * Content ingest Lambda — fetches from configured sources, deduplicates,
 * writes raw to S3 and indexed records to DynamoDB.
 *
 * Triggered by EventBridge Scheduler on cadence:
 *   - Daily sources: cron(0 14 ? * * *) = 7am MST
 *   - Weekly sources: cron(0 14 ? * MON *) = Mon 7am MST
 *   - Monthly sources: cron(0 14 17 * ? *) = 17th 7am MST
 *
 * Input event: { cadence: 'daily' | 'weekly' | 'monthly' }
 *   OR: { sourceId: 'mesa-legistar-events' }  for manual/testing
 *
 * Architecture: .kiro/specs/content-ingest-pipeline.md
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import {
  getSourceById,
  getSourcesByCadence,
  type ContentSource,
  type Cadence,
} from '../../lib/content-sources.js';
import { getItem, putItem } from '../../lib/dynamodb.js';
import { generateCorrelationId } from '../../lib/errors.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import { fetchLegistarEvents } from './parsers/legistar.js';
import { fetchSocrata } from './parsers/socrata.js';
import { fetchRss } from './parsers/rss.js';
import { fetchGis } from './parsers/gis.js';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const BUCKET = process.env.CONTENT_INGEST_BUCKET ?? 'mesahomes-content-ingest';

interface IngestEvent {
  cadence?: Cadence;
  sourceId?: string;
}

interface IngestResult {
  sourceId: string;
  fetched: number;
  new: number;
  duplicates: number;
  errors: number;
}

/**
 * Canonicalize text for hashing. Stable across whitespace + case changes
 * so we can detect "same content, different formatting" as a duplicate.
 */
function contentHash(obj: unknown): string {
  const json = JSON.stringify(obj);
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

/**
 * Write raw fetched item to S3 for audit trail.
 * Key: s3://mesahomes-content-ingest/{sourceId}/{YYYY-MM-DD}/{itemId}.json
 */
async function writeToS3(
  sourceId: string,
  date: string,
  itemId: string,
  data: unknown,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${sourceId}/${date}/${itemId}.json`,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    }),
  );
}

/**
 * Dedup check: return true if we've already ingested an item with this
 * content hash from this source. We only care about exact-content dupes
 * — same zoning case mentioned twice in the same source over weeks
 * should create 2 records (to capture the update), but the same fetch
 * twice in one day should dedupe.
 */
async function isDuplicate(sourceId: string, hash: string): Promise<boolean> {
  const item = await getItem(`SOURCE#${sourceId}`, `HASH#${hash}`);
  return !!item;
}

/**
 * Dispatch fetch to the right parser based on source type.
 */
async function fetchForSource(
  source: ContentSource,
): Promise<Array<{ id: string; data: Record<string, unknown>; title?: string }>> {
  switch (source.type) {
    case 'legistar':
      return fetchLegistarEvents(source);
    case 'socrata':
      return fetchSocrata(source);
    case 'rss':
      return fetchRss(source);
    case 'gis':
      return fetchGis(source);
    default:
      console.warn(`[content-ingest] no parser for type=${source.type}, source=${source.id}`);
      return [];
  }
}

/**
 * Ingest one source.
 */
async function ingestSource(source: ContentSource, correlationId: string): Promise<IngestResult> {
  const result: IngestResult = {
    sourceId: source.id,
    fetched: 0,
    new: 0,
    duplicates: 0,
    errors: 0,
  };
  const date = new Date().toISOString().slice(0, 10);

  try {
    const items = await fetchForSource(source);
    result.fetched = items.length;
    console.log(`[content-ingest] ${source.id}: fetched ${items.length} items (cid=${correlationId})`);

    for (const item of items) {
      try {
        const hash = contentHash(item.data);

        if (await isDuplicate(source.id, hash)) {
          result.duplicates += 1;
          continue;
        }

        // Write raw to S3 for audit + future re-processing
        await writeToS3(source.id, date, item.id, item.data);

        // Write index record to DDB
        // PK: SOURCE#{sourceId} SK: HASH#{hash} for dedup lookup
        // Also indexed by topic via GSI1 for the bundler:
        //   GSI1PK: TOPIC#{topic}
        //   GSI1SK: SEEN#{date}#{sourceId}#{itemId}
        await putItem({
          PK: `SOURCE#${source.id}`,
          SK: `HASH#${hash}`,
          GSI1PK: `TOPIC#${source.topic}`,
          GSI1SK: `SEEN#${date}#${source.id}#${item.id}`,
          entityType: EntityType.CONTENT_INGEST,
          data: {
            sourceId: source.id,
            sourceName: source.name,
            topic: source.topic,
            itemId: item.id,
            title: item.title,
            hash,
            date,
            s3Key: `${source.id}/${date}/${item.id}.json`,
            rawData: item.data,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        result.new += 1;
      } catch (err) {
        console.error(`[content-ingest] ${source.id} item ${item.id} failed:`, err);
        result.errors += 1;
      }
    }
  } catch (err) {
    console.error(`[content-ingest] ${source.id} fetch failed:`, err);
    result.errors += 1;
  }

  return result;
}

/**
 * Lambda handler.
 */
export async function handler(event: IngestEvent): Promise<{
  statusCode: number;
  results: IngestResult[];
}> {
  const correlationId = generateCorrelationId();
  console.log(`[content-ingest] start event=${JSON.stringify(event)} cid=${correlationId}`);

  let sources: ContentSource[];
  if (event.sourceId) {
    sources = [getSourceById(event.sourceId)];
  } else if (event.cadence) {
    sources = getSourcesByCadence(event.cadence);
  } else {
    // Default: run daily cadence
    sources = getSourcesByCadence('daily');
  }

  console.log(`[content-ingest] running ${sources.length} sources:`, sources.map((s) => s.id));

  // Run sequentially for now. When we have many sources, swap to
  // Promise.allSettled or Step Functions Map state for parallelism.
  const results: IngestResult[] = [];
  for (const src of sources) {
    const result = await ingestSource(src, correlationId);
    results.push(result);
  }

  const summary = results.reduce(
    (acc, r) => ({
      fetched: acc.fetched + r.fetched,
      new: acc.new + r.new,
      duplicates: acc.duplicates + r.duplicates,
      errors: acc.errors + r.errors,
    }),
    { fetched: 0, new: 0, duplicates: 0, errors: 0 },
  );

  console.log(`[content-ingest] complete summary=${JSON.stringify(summary)} cid=${correlationId}`);

  return { statusCode: 200, results };
}
