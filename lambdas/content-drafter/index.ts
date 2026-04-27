/**
 * Content drafter — reads pending bundles from DDB, calls Bedrock
 * (Nova Micro primary, Claude Haiku 4.5 for high-priority), generates
 * 500-800 word article drafts with citations, writes to
 * CONTENT#DRAFT#{id} / status=pending-review.
 *
 * Runs daily at 8am MST (30 min after bundler). Processes top N
 * bundles by priority — not all of them, to stay cheap.
 *
 * See .kiro/specs/content-pipeline-phase-2.md §2C
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { randomUUID } from 'crypto';
import { queryGSI1, putItem } from '../../lib/dynamodb.js';
import { generateCorrelationId } from '../../lib/errors.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import { findPhotos, type PhotoResult } from '../photo-finder/index.js';

const br = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const ses = new SESv2Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const OWNER = process.env.OWNER_NOTIFICATION_ADDRESS ?? 'sales@mesahomes.com';
const FROM = process.env.NOTIFICATION_FROM_ADDRESS ?? 'notifications@mesahomes.com';

// Nova Micro via cross-region inference profile. Cheap ($0.000035/1K in).
// Override via env to test with Haiku or Claude Sonnet.
const MODEL_ID = process.env.DRAFTER_MODEL_ID ?? 'us.amazon.nova-micro-v1:0';
const MAX_BUNDLES_PER_RUN = parseInt(process.env.MAX_BUNDLES_PER_RUN ?? '5', 10);

interface BundleItem {
  sourceId: string;
  itemId: string;
  title: string;
  citation?: { url: string; attribution: string; license?: string };
  summary: string;
}

interface Bundle {
  bundleId: string;
  topic: string;
  date: string;
  titleHint: string;
  priority: number;
  keywords: string[];
  itemCount: number;
  items: BundleItem[];
}

interface DrafterEvent {
  date?: string;
  bundleId?: string; // manual invocation of a specific bundle
  maxBundles?: number;
}

interface Draft {
  draftId: string;
  bundleId: string;
  topic: string;
  title: string;
  slug: string;
  metaDescription: string;
  bodyMarkdown: string;
  citationSources: Array<{ url: string; attribution: string }>;
  photos: PhotoResult[];
  createdAt: string;
  status: 'pending-review';
  modelUsed: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Build prompt from bundle. Includes anti-AI-tells rules and citation
 * density requirement. Prompts used to start with "You are..." style
 * but Nova Micro responds better to direct instruction + bullet lists.
 */
function buildPrompt(bundle: Bundle): string {
  const sourceList = bundle.items
    .slice(0, 8) // cap item count so prompt stays under 2K tokens
    .map((i, idx) => {
      const url = i.citation?.url ?? '';
      const attrib = i.citation?.attribution ?? i.sourceId;
      return `${idx + 1}. [${attrib}](${url})\n   Title: ${i.title}\n   Summary: ${i.summary}`;
    })
    .join('\n\n');

  const cityKeywords = bundle.keywords
    .filter((k) => ['mesa', 'gilbert', 'chandler', 'queen', 'apache', 'san', 'tan'].some((c) => k.includes(c)))
    .join(', ');

  return `Write a blog post for MesaHomes.com, a hyper-local Mesa, AZ real estate platform.

HARD RULES (break any one and the output is rejected):
- NEVER use em-dashes. Use commas or periods instead.
- NEVER write "whether you're X or Y" pivots.
- NEVER write "that said," "in today's market," or "navigate the landscape."
- NEVER use tripartite lists of adjectives (no "modern, sleek, stylish").
- NEVER use hollow words: leverage, ecosystem, game-changer, unpack.
- DO use short sentences, contractions, active voice.
- DO cite at least one primary source in every paragraph using markdown links.
- DO include specific numbers and place names when the source has them.
- Length: 500-800 words, excluding the disclaimer.

TOPIC: ${bundle.topic}
BUNDLE (${bundle.itemCount} related items, priority ${bundle.priority}):

${sourceList}

${cityKeywords ? `Keywords to include naturally: ${cityKeywords}` : ''}

Output ONLY a valid JSON object with this exact shape, no preamble:
{
  "title": "a compelling title under 70 chars optimized for Mesa SEO",
  "slug": "url-friendly-slug",
  "meta_description": "under 160 chars for Google search results",
  "body_markdown": "the 500-800 word article in markdown with inline [source](url) citations",
  "disclaimer": "this is educational content, not legal advice. Consult a licensed Arizona Realtor for your specific situation."
}`;
}

/**
 * Call Bedrock with the prompt. Nova Micro uses a different request
 * shape than Claude — wrap both formats here.
 */
async function invokeDrafter(
  prompt: string,
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  const isNova = MODEL_ID.includes('nova');
  const isClaude = MODEL_ID.includes('claude') || MODEL_ID.includes('anthropic');

  let body: string;
  if (isNova) {
    body = JSON.stringify({
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2000, temperature: 0.7 },
    });
  } else if (isClaude) {
    body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });
  } else {
    throw new Error(`Unsupported model: ${MODEL_ID}`);
  }

  const response = await br.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      body,
      contentType: 'application/json',
      accept: 'application/json',
    }),
  );

  const parsed = JSON.parse(new TextDecoder().decode(response.body));
  let text: string;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  if (isNova) {
    text = parsed.output?.message?.content?.[0]?.text ?? '';
    inputTokens = parsed.usage?.inputTokens;
    outputTokens = parsed.usage?.outputTokens;
  } else {
    text = parsed.content?.[0]?.text ?? '';
    inputTokens = parsed.usage?.input_tokens;
    outputTokens = parsed.usage?.output_tokens;
  }

  return { text, inputTokens, outputTokens };
}

/** Strip leading/trailing non-JSON (models sometimes wrap in ```json). */
function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Find first { and last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error(`No JSON object found in model response: ${text.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(start, end + 1));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function draftOneBundle(bundle: Bundle, correlationId: string): Promise<Draft | null> {
  const prompt = buildPrompt(bundle);

  console.log(
    `[drafter] drafting bundle=${bundle.bundleId} topic=${bundle.topic} priority=${bundle.priority} items=${bundle.itemCount} cid=${correlationId}`,
  );

  const { text, inputTokens, outputTokens } = await invokeDrafter(prompt);
  const draftData = extractJson(text);

  const title = String(draftData.title ?? bundle.titleHint);
  const slug = String(draftData.slug ?? slugify(title));
  const metaDescription = String(draftData.meta_description ?? '').slice(0, 160);
  const bodyMarkdown = String(draftData.body_markdown ?? '');
  const disclaimer = String(draftData.disclaimer ?? '');

  if (bodyMarkdown.length < 200) {
    console.warn(`[drafter] body too short (${bodyMarkdown.length} chars) — rejecting bundle ${bundle.bundleId}`);
    return null;
  }

  // Compliance: body must cite at least 1 URL that appears in the
  // bundle's source citations. Prevents hallucinated links.
  const validSourceUrls = new Set(
    bundle.items.map((i) => i.citation?.url).filter((u): u is string => !!u),
  );
  const citedUrls = (bodyMarkdown.match(/https?:\/\/[^\s)\]]+/g) ?? []).map((u) => u.replace(/[.,;)]+$/, ''));
  const validCites = citedUrls.filter((u) =>
    Array.from(validSourceUrls).some((sv) => sv.includes(u) || u.includes(sv)),
  );
  if (validCites.length === 0 && validSourceUrls.size > 0) {
    console.warn(
      `[drafter] no valid citations in body (${citedUrls.length} links found but none match bundle sources) — rejecting bundle ${bundle.bundleId}`,
    );
    return null;
  }

  const citationSources = bundle.items
    .map((i) => i.citation)
    .filter((c): c is NonNullable<typeof c> => !!c?.url)
    .map((c) => ({ url: c.url, attribution: c.attribution }));

  const draftId = randomUUID();

  // Find photos in parallel with the rest of draft assembly. If this
  // fails we still ship the draft with no photos — better than
  // blocking everything.
  let photos: PhotoResult[] = [];
  try {
    photos = await findPhotos(bundle.keywords, draftId, 1);
  } catch (err) {
    console.warn(`[drafter] photo-finder failed for draft ${draftId}:`, err);
  }

  const draft: Draft = {
    draftId,
    bundleId: bundle.bundleId,
    topic: bundle.topic,
    title,
    slug,
    metaDescription,
    bodyMarkdown: `${bodyMarkdown}\n\n---\n\n_${disclaimer}_`,
    citationSources,
    photos,
    createdAt: new Date().toISOString(),
    status: 'pending-review',
    modelUsed: MODEL_ID,
    inputTokens,
    outputTokens,
  };

  await putItem({
    PK: `CONTENT#DRAFT#${draft.draftId}`,
    SK: 'v1',
    GSI1PK: 'DRAFT#PENDING',
    GSI1SK: `${bundle.priority.toString().padStart(2, '0')}#${draft.createdAt}#${draft.draftId}`,
    entityType: EntityType.CONTENT,
    data: draft as unknown as Record<string, unknown>,
    createdAt: draft.createdAt,
    updatedAt: draft.createdAt,
  });

  return draft;
}

async function readTopBundles(date: string, limit: number): Promise<Bundle[]> {
  // GSI1: BUNDLE#PENDING sorted desc by priority
  const res = await queryGSI1('BUNDLE#PENDING', {
    scanForward: false,
    limit: limit * 3, // pad since some may be already drafted or low-priority
  });

  const bundles: Bundle[] = [];
  for (const item of res.items ?? []) {
    const d = (item as unknown as { data?: { kind?: string } & Bundle }).data;
    if (d?.kind === 'bundle' && d.date === date) {
      bundles.push(d);
      if (bundles.length >= limit) break;
    }
  }
  return bundles;
}

async function emailSummary(drafts: Draft[]): Promise<void> {
  if (drafts.length === 0) return;
  const rows = drafts
    .map(
      (d) =>
        `<tr><td>[${d.topic}]</td><td>${d.title}</td><td>${d.citationSources.length} cites</td><td>${d.inputTokens ?? '?'}/${d.outputTokens ?? '?'} tok</td></tr>`,
    )
    .join('');
  const html = `
    <h3>MesaHomes drafter — ${drafts.length} drafts pending review</h3>
    <p>Review and approve at: <a href="https://mesahomes.com/dashboard/content/drafts">/dashboard/content/drafts</a></p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
      <thead><tr><th>Topic</th><th>Title</th><th>Citations</th><th>Tokens</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#666">Model: ${MODEL_ID}</p>
  `;

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [OWNER] },
      Content: {
        Simple: {
          Subject: {
            Data: `${drafts.length} content drafts ready for review`,
            Charset: 'UTF-8',
          },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    }),
  );
}

export async function handler(event: DrafterEvent): Promise<{
  statusCode: number;
  drafts: number;
  errors: number;
}> {
  const correlationId = generateCorrelationId();
  const date = event.date ?? new Date().toISOString().slice(0, 10);
  const maxBundles = event.maxBundles ?? MAX_BUNDLES_PER_RUN;

  console.log(`[drafter] start date=${date} max=${maxBundles} model=${MODEL_ID} cid=${correlationId}`);

  const bundles = await readTopBundles(date, maxBundles);
  console.log(`[drafter] processing ${bundles.length} bundles`);

  const drafts: Draft[] = [];
  let errors = 0;

  for (const bundle of bundles) {
    try {
      const draft = await draftOneBundle(bundle, correlationId);
      if (draft) drafts.push(draft);
    } catch (err) {
      console.error(`[drafter] bundle=${bundle.bundleId} failed:`, err);
      errors += 1;
    }
  }

  console.log(`[drafter] complete drafts=${drafts.length} errors=${errors}`);

  await emailSummary(drafts).catch((err) => console.error('[drafter] email failed:', err));

  return { statusCode: 200, drafts: drafts.length, errors };
}
