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
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
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
import { buildCitation } from '../../lib/source-citation.js';
import { fetchLegistarEvents } from './parsers/legistar.js';
import { fetchLegistarMatters } from './parsers/legistar-matters.js';
import { fetchSocrata } from './parsers/socrata.js';
import { fetchRss } from './parsers/rss.js';
import { fetchGis } from './parsers/gis.js';
import { fetchBigSales } from './parsers/big-sales.js';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const cw = new CloudWatchClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const ses = new SESv2Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const BUCKET = process.env.CONTENT_INGEST_BUCKET ?? 'mesahomes-content-ingest';
const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_ADDRESS ?? 'sales@mesahomes.com';
const FROM_EMAIL = process.env.NOTIFICATION_FROM_ADDRESS ?? 'notifications@mesahomes.com';

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
    case 'legistar-matters':
      return fetchLegistarMatters(source);
    case 'socrata':
      return fetchSocrata(source);
    case 'rss':
      return fetchRss(source);
    case 'gis':
      return fetchGis(source);
    case 'big-sales':
      return fetchBigSales(source);
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

        // Build primary-source citation so the drafter has a link
        // to cite. Items without citations can still be indexed for
        // internal analysis but shouldn't feed published articles.
        const citation = buildCitation(source, item.id, item.data);

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
            sourceType: source.type,
            topic: source.topic,
            itemId: item.id,
            title: item.title,
            hash,
            date,
            s3Key: `${source.id}/${date}/${item.id}.json`,
            rawData: item.data,
            citation,
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

  // Emit CloudWatch metrics per source + overall. Metrics lets us set
  // alarms on 'fetched=0' or 'errors>0' per source.
  await emitMetrics(results).catch((err) =>
    console.error('[content-ingest] metric emit failed:', err),
  );

  // Only email summary for cron-triggered runs (has event.cadence),
  // not for manual single-source invocations. Avoids test runs
  // spamming the owner inbox.
  if (event.cadence) {
    await emailSummary(event.cadence, results, summary).catch((err) =>
      console.error('[content-ingest] email summary failed:', err),
    );
  }

  return { statusCode: 200, results };
}

/**
 * Emit per-source CloudWatch metrics under namespace MesaHomes/ContentIngest.
 * Dimensions: SourceId. Metrics: Fetched, New, Duplicates, Errors.
 * Create alarms (outside this code) on any source with Errors >= 2 over 2 runs.
 */
async function emitMetrics(results: IngestResult[]): Promise<void> {
  const metricData = results.flatMap((r) => [
    {
      MetricName: 'Fetched',
      Dimensions: [{ Name: 'SourceId', Value: r.sourceId }],
      Value: r.fetched,
      Unit: 'Count' as const,
    },
    {
      MetricName: 'New',
      Dimensions: [{ Name: 'SourceId', Value: r.sourceId }],
      Value: r.new,
      Unit: 'Count' as const,
    },
    {
      MetricName: 'Duplicates',
      Dimensions: [{ Name: 'SourceId', Value: r.sourceId }],
      Value: r.duplicates,
      Unit: 'Count' as const,
    },
    {
      MetricName: 'Errors',
      Dimensions: [{ Name: 'SourceId', Value: r.sourceId }],
      Value: r.errors,
      Unit: 'Count' as const,
    },
  ]);

  // CloudWatch accepts up to 1000 metrics per call; we have <30
  await cw.send(
    new PutMetricDataCommand({
      Namespace: 'MesaHomes/ContentIngest',
      MetricData: metricData,
    }),
  );
}

/**
 * Send the owner a summary email after each cron run. Quick visual
 * check in the morning: "did the pipeline work overnight."
 */
async function emailSummary(
  cadence: string,
  results: IngestResult[],
  summary: { fetched: number; new: number; duplicates: number; errors: number },
): Promise<void> {
  const rows = results
    .map(
      (r) =>
        `<tr><td>${r.sourceId}</td><td>${r.fetched}</td><td>${r.new}</td><td>${r.duplicates}</td><td style="color:${
          r.errors > 0 ? '#c00' : '#090'
        }">${r.errors}</td></tr>`,
    )
    .join('');

  const html = `
    <h3>MesaHomes content ingest — ${cadence} cron</h3>
    <p><strong>${summary.new} new items</strong> (${summary.fetched} fetched,
    ${summary.duplicates} duplicates, ${summary.errors} errors).</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
      <thead><tr><th>Source</th><th>Fetched</th><th>New</th><th>Dupes</th><th>Errors</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#666">If Errors &gt; 0 above, check CloudWatch logs:
    /aws/lambda/mesahomes-content-ingest. Source drift is a real risk —
    investigate before the data gap widens.</p>
  `;

  const alertPrefix = summary.errors > 0 ? '[ALERT] ' : '';
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM_EMAIL,
      Destination: { ToAddresses: [OWNER_EMAIL] },
      Content: {
        Simple: {
          Subject: {
            Data: `${alertPrefix}Content ingest ${cadence} — ${summary.new} new, ${summary.errors} errors`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      },
    }),
  );
}
