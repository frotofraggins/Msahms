/**
 * Content bundler — groups related CONTENT_INGEST items into topic
 * bundles for the drafter. Runs daily at 7:30am MST (30 min after
 * ingest cron), reads today's new ingest records, clusters by topic
 * and keyword overlap, writes bundles to DynamoDB for the drafter.
 *
 * See .kiro/specs/content-pipeline-phase-2.md for design rationale.
 *
 * Input event: { date?: string }  (defaults to today)
 *
 * Output:
 *   DDB writes under PK=BUNDLE#{topic}#{date}, SK=v{version}
 *   Each bundle has: items[] (source ingest records), priority score,
 *   title hint, keywords[]
 */

import { queryGSI1, putItem } from '../../lib/dynamodb.js';
import { generateCorrelationId } from '../../lib/errors.js';
import { EntityType } from '../../lib/types/dynamodb.js';

interface BundlerEvent {
  date?: string; // YYYY-MM-DD
}

interface IngestRecord {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  topic: string;
  itemId: string;
  title?: string;
  hash: string;
  date: string;
  s3Key: string;
  rawData: Record<string, unknown>;
  citation?: {
    url: string;
    attribution: string;
    license?: string;
  };
}

interface Bundle {
  bundleId: string;
  topic: string;
  date: string;
  titleHint: string;
  priority: number; // 0 = mundane, 5 = breaking
  keywords: string[];
  itemCount: number;
  items: Array<{
    sourceId: string;
    itemId: string;
    title: string;
    citation?: IngestRecord['citation'];
    summary: string;
  }>;
}

// Keywords that boost priority when they appear in an item title.
// Mirrors the scoring in legistar-matters parser.
const PRIORITY_KEYWORDS = [
  'rezone', 'rezoning', 'zoning', 'subdivision', 'apartment', 'apartments',
  'data center', 'development', 'approval', 'site plan', 'PAD', 'mixed use',
  'commercial', 'affordable', 'starter home', 'ADU',
];

// High-volume noise words to strip before clustering
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'at', 'in', 'on', 'for', 'to',
  'by', 'with', 'from', 'is', 'are', 'was', 'be', 'has', 'this', 'that',
  'it', 'as', 'not', 'but', 'will', 'can', 'should', 'would', 'new',
  'mesa', 'arizona', 'az', 'city', 'county',
]);

/**
 * Extract keyword tokens from a title. Used for clustering similar
 * items (e.g., two news sources covering the same zoning case should
 * share 3+ tokens).
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  // Dedup preserving order
  return Array.from(new Set(words));
}

/** Score priority based on title keyword hits. */
function scorePriority(title: string, rawData: Record<string, unknown>): number {
  const haystack = `${title} ${JSON.stringify(rawData).slice(0, 500)}`.toLowerCase();
  let score = PRIORITY_KEYWORDS.filter((kw) => haystack.includes(kw.toLowerCase())).length;
  // Include an existing priorityScore if the parser assigned one
  const existing = typeof rawData.priorityScore === 'number' ? rawData.priorityScore : 0;
  return Math.max(score, existing);
}

/**
 * Cluster items into bundles. Algorithm:
 *   1. Group by topic (primary)
 *   2. Within each topic, greedily merge items that share 2+ keywords
 *   3. Small bundles (<2 items) stay as singletons (some topics don't
 *      cluster naturally — a single luxury sale is worth its own post)
 */
function clusterItems(items: IngestRecord[]): Bundle[] {
  const byTopic = new Map<string, IngestRecord[]>();
  for (const item of items) {
    if (!byTopic.has(item.topic)) byTopic.set(item.topic, []);
    byTopic.get(item.topic)!.push(item);
  }

  const bundles: Bundle[] = [];

  for (const [topic, topicItems] of byTopic) {
    // For each item, compute keyword set
    const enriched = topicItems.map((item) => ({
      item,
      keywords: new Set(extractKeywords(item.title ?? '')),
      priority: scorePriority(item.title ?? '', item.rawData),
    }));

    const used = new Set<number>();
    const date = topicItems[0]?.date ?? new Date().toISOString().slice(0, 10);

    for (let i = 0; i < enriched.length; i++) {
      if (used.has(i)) continue;
      used.add(i);

      const seed = enriched[i];
      const clusterIndices = [i];
      const sharedKeywords = new Set(seed.keywords);

      for (let j = i + 1; j < enriched.length; j++) {
        if (used.has(j)) continue;
        const candidate = enriched[j];
        const overlap = [...candidate.keywords].filter((k) => seed.keywords.has(k));
        if (overlap.length >= 2) {
          clusterIndices.push(j);
          used.add(j);
          overlap.forEach((k) => sharedKeywords.add(k));
        }
      }

      const clusterItems = clusterIndices.map((idx) => enriched[idx]);
      const maxPriority = Math.max(...clusterItems.map((c) => c.priority));
      const allKeywords = Array.from(sharedKeywords).slice(0, 15);

      bundles.push({
        bundleId: `${topic}-${date}-${bundles.length}`,
        topic,
        date,
        titleHint: seed.item.title ?? `${topic} digest ${date}`,
        priority: maxPriority,
        keywords: allKeywords,
        itemCount: clusterItems.length,
        items: clusterItems.map((c) => ({
          sourceId: c.item.sourceId,
          itemId: c.item.itemId,
          title: c.item.title ?? '',
          citation: c.item.citation,
          // Small summary for the drafter — use title + first 200 chars of
          // any text field in rawData. Keeps the prompt compact.
          summary: buildItemSummary(c.item),
        })),
      });
    }
  }

  // Sort bundles by priority desc — drafter picks the top N to generate
  bundles.sort((a, b) => b.priority - a.priority);
  return bundles;
}

function buildItemSummary(item: IngestRecord): string {
  const raw = item.rawData;
  // Pull description/MatterTitle/text from wherever it lives
  const candidates = [
    raw.description,
    raw.MatterTitle,
    raw.MatterName,
    raw.EventComment,
    raw.note,
    raw.desc1,
  ];
  const desc = candidates.find((v) => typeof v === 'string' && v.length > 10);
  const title = item.title ?? '';
  return typeof desc === 'string'
    ? `${title} — ${desc.slice(0, 250)}`
    : title;
}

/**
 * Read ingest records for a given date from all topics.
 */
async function readIngestItems(date: string): Promise<IngestRecord[]> {
  const topics = ['zoning', 'market', 'hoa', 'housing-law', 'news', 'safety', 'schools', 'civic'];
  const all: IngestRecord[] = [];
  for (const topic of topics) {
    const res = await queryGSI1(`TOPIC#${topic}`, {
      skCondition: {
        operator: 'begins_with',
        value: `SEEN#${date}`,
      },
      limit: 500,
    });
    for (const item of res.items ?? []) {
      const data = (item as unknown as { data?: IngestRecord }).data;
      if (data && typeof data === 'object') all.push(data);
    }
  }
  return all;
}

/**
 * Lambda handler.
 */
/**
 * Read the last 7 days of published posts and return the set of
 * topics we should skip bundling today. Prevents the drafter from
 * regenerating the same topic over and over when a hot topic keeps
 * dominating ingested items (e.g. a week of zoning cases).
 *
 * Never fatal — if the lookup fails, we proceed without the filter.
 */
async function readCooldownTopics(): Promise<Set<string>> {
  try {
    const res = await queryGSI1('BLOG#PUBLISHED', {
      scanForward: false,
      limit: 50,
    });
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const topics = new Set<string>();
    for (const item of res.items ?? []) {
      const d = (item as unknown as { data?: Record<string, unknown> }).data ?? {};
      const publishedAt = String(d['publishedAt'] ?? '');
      const topic = String(d['topic'] ?? '');
      if (!publishedAt || !topic) continue;
      if (new Date(publishedAt).getTime() >= cutoff) {
        topics.add(topic);
      }
    }
    return topics;
  } catch (err) {
    console.warn('[content-bundler] readCooldownTopics failed (continuing without cooldown):', err);
    return new Set();
  }
}

export async function handler(event: BundlerEvent): Promise<{
  statusCode: number;
  date: string;
  bundles: number;
  itemsBundled: number;
}> {
  const correlationId = generateCorrelationId();
  const date = event.date ?? new Date().toISOString().slice(0, 10);

  console.log(`[content-bundler] start date=${date} cid=${correlationId}`);

  const items = await readIngestItems(date);
  console.log(`[content-bundler] read ${items.length} items for ${date}`);

  const cooldownTopics = await readCooldownTopics();
  if (cooldownTopics.size > 0) {
    console.log(
      `[content-bundler] topic cooldown active for: ${Array.from(cooldownTopics).join(', ')}`,
    );
  }

  const allBundles = clusterItems(items);
  const bundles = allBundles.filter((b) => !cooldownTopics.has(b.topic));
  const skipped = allBundles.length - bundles.length;
  if (skipped > 0) {
    console.log(`[content-bundler] skipped ${skipped} bundles due to topic cooldown`);
  }
  console.log(`[content-bundler] clustered into ${bundles.length} bundles (from ${allBundles.length} raw)`);

  // Write bundles to DDB
  const now = new Date().toISOString();
  for (const bundle of bundles) {
    await putItem({
      PK: `BUNDLE#${bundle.topic}#${bundle.date}`,
      SK: `v1#${bundle.bundleId}`,
      GSI1PK: 'BUNDLE#PENDING',
      GSI1SK: `${bundle.priority.toString().padStart(2, '0')}#${bundle.date}#${bundle.bundleId}`,
      entityType: EntityType.CONTENT_INGEST, // reuse; specific bundle type tracked via data.kind
      data: {
        kind: 'bundle',
        ...bundle,
        correlationId,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(
    `[content-bundler] complete bundles=${bundles.length} items=${items.length} cid=${correlationId}`,
  );

  return {
    statusCode: 200,
    date,
    bundles: bundles.length,
    itemsBundled: items.length,
  };
}
