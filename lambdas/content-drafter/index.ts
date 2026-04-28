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

/**
 * Strip a trailing disclaimer block if the model already appended one
 * to the body. Models sometimes repeat the `disclaimer` JSON field at
 * the end of `body_markdown` despite being told not to.
 */
function stripTrailingDisclaimer(body: string): string {
  let trimmed = body.trimEnd();
  const patterns = [
    /\n+---\s*\n+_[^_]*educational content[^_]*_\s*$/i,
    /\n+_[^_]*educational content[^_]*_\s*$/i,
    /\n+#\s*disclaimer:[^\n]*$/i,
    /\n+[^\n]*educational content,\s*not legal advice[^\n]*$/i,
  ];
  for (const p of patterns) {
    trimmed = trimmed.replace(p, '');
  }
  return trimmed.trimEnd();
}

function buildPrompt(bundle: Bundle, recentPublished: PublishedRef[] = []): string {
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

  return `You are writing for MesaHomes.com, a hyper-local Mesa, AZ real estate site run by a licensed Arizona Realtor who actually lives and works in the East Valley. Your job is to write like a knowledgeable local, not like ChatGPT.

CRITICAL CITATION RULE (output is rejected if you violate this):
Every article MUST cite at least 2 primary sources from the bundle
below, using markdown link syntax like [source name](URL). The URLs
MUST be copied exactly from the bundle source list. Do NOT invent,
modify, or guess URLs. If a URL in the bundle contains a case ID or
query string, include it exactly as given. Inline citations anywhere
in the body count.

Example of a correctly cited paragraph:
"Mesa approved the Destination at Gateway CSP zoning permit
([Mesa Legistar case ADJ 26012](https://mesa.legistar.com/LegislationDetail.aspx?ID=23548))
covering 125 acres at Williams Field and Signal Butte."

VOICE (this is the main thing — get this right):
- Open with the most important thing. Not "Zoning changes often stir up questions." Open with what actually happened and why a Mesa homeowner should care.
- Pick ONE angle and commit. If 6 zoning changes happened, one of them matters more than the others. Say which and why.
- Use specific local knowledge. Name the cross streets, the corridor, the neighboring subdivisions, the nearby schools if relevant. A local knows "Signal Butte and Williams Field" is the Gateway Airport corridor where every big development is landing right now.
- Take a position. Is this good for property values? Bad? Too early to tell? Say what you think. A human writer has opinions. Hedge where honest: "too early to say for sure, but..." beats no stance.
- Write like you're explaining this to a neighbor over coffee, not giving a corporate press briefing.

HARD BANS (reject output that does any of these):
- No em-dashes anywhere. Use commas or periods.
- No "whether you're X or Y" pivots.
- No "that said," "in today's market," "navigate the landscape," "ever-evolving," "dynamic," "vibrant," "thriving."
- No tripartite adjective lists ("modern, sleek, stylish").
- No hollow business words: leverage, ecosystem, game-changer, unpack, ensure, utilize, streamline, enhance.
- No paragraphs that all start the same way ("This change / This permit / This move"). Vary your sentence starters.
- No "Staying informed helps homeowners..." style empty closers. End with a concrete takeaway or a specific question.
- No repeating the topic name 10 times for SEO. Google caught on to that 15 years ago.

STRUCTURE:
- Start with ONE sentence that states what happened or what matters. Then a second sentence of context. Then build.
- Use H2 headings (##) to break up sections. Mix short punchy sections with longer ones.
- Include at least one "What this means for [Mesa homeowners / buyers / sellers]" passage with specifics, not platitudes.
- MUST end with a "## What to do next" section with 2-4 CONCRETE action items. Each action must be either (a) a MesaHomes URL the reader should visit (see CTA TARGETS below), (b) a primary source URL they should read, or (c) a specific measurable action like "check Maricopa County parcel records for case ADJ 26012." Never end the article with a rhetorical question to the reader. Never ask "what neighborhood are you targeting?" or "what do you think?" — that is for chat, not articles.

CTA TARGETS (include at least one in the "What to do next" section):
- /tools/home-value — free ZIP-level home value estimate (for seller-oriented articles)
- /tools/net-sheet — seller net sheet calculator (for closing cost / price articles)
- /tools/affordability — mortgage affordability calculator (for buyer articles)
- /tools/offer-writer — AI offer draft (for buyer articles)
- /listing/start — start a \$999 flat-fee MLS listing (for seller articles)
- /blog/selling-guides/flat-fee-mls-mesa-az — the flat-fee pillar guide
- /areas/mesa , /areas/gilbert , /areas/chandler , /areas/queen-creek , /areas/san-tan-valley , /areas/apache-junction — neighborhood guides with market data
- /booking — book a 15-min consultation with a licensed Arizona Realtor

CITATIONS:
- Every factual claim (numbers, case IDs, addresses, dates) must cite a source via markdown link.
- If the source uses an ID or case number, include it. Don't paraphrase around the specifics.

LENGTH: 800-1200 words excluding disclaimer. Shorter is fine if the topic is narrow. Longer is fine if there's real substance. Do not pad.

TOPIC: ${bundle.topic}
BUNDLE (${bundle.itemCount} related items, priority ${bundle.priority}):

${sourceList}

${cityKeywords ? `Place names the article should reference where relevant: ${cityKeywords}` : ''}

${
  recentPublished.length > 0
    ? `DO NOT DUPLICATE — the following posts already exist on the site.
If your draft would cover the same angle as one of these, pick a new
angle (different ZIP, different time frame, different sub-topic, or
reject this bundle):
${recentPublished
  .slice(0, 30)
  .map((p) => `- "${p.title}" (${p.topic}, published ${p.publishedAt.slice(0, 10)}, /${p.slug})`)
  .join('\n')}
`
    : ''
}

Output ONLY a valid JSON object with this exact shape, no preamble, no markdown code fences:
{
  "title": "a compelling title under 70 chars. Specific, not generic. Not 'Zoning Changes in Mesa' — try 'Mesa's Gateway Corridor Just Got 125 Acres Closer to Build-Out' or similar.",
  "slug": "url-friendly-slug",
  "meta_description": "under 160 chars. Tell the reader what they'll learn, not what the article is about.",
  "body_markdown": "the 800-1200 word article in markdown with ## section headings and inline [source](url) citations",
  "disclaimer": "This is educational content, not legal advice. Consult a licensed Arizona Realtor for your specific situation."
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
      inferenceConfig: { maxTokens: 3500, temperature: 0.7 },
    });
  } else if (isClaude) {
    body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 3500,
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

async function draftOneBundle(
  bundle: Bundle,
  correlationId: string,
  recentPublished: PublishedRef[] = [],
): Promise<Draft | null> {
  const prompt = buildPrompt(bundle, recentPublished);

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
    // Strip any trailing disclaimer the model may have already appended,
    // then add ours once. Models sometimes repeat the disclaimer field at
    // the end of the body despite our prompt telling them not to.
    bodyMarkdown: `${stripTrailingDisclaimer(bodyMarkdown)}\n\n---\n\n_${disclaimer}_`,
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

interface PublishedRef {
  title: string;
  slug: string;
  topic: string;
  publishedAt: string;
}

/**
 * Read recently-published blog posts so the drafter can avoid writing
 * near-duplicates. Limited to 50 most recent — more than that and the
 * prompt gets too large without much additional dedup signal.
 */
async function readRecentPublished(): Promise<PublishedRef[]> {
  try {
    const res = await queryGSI1('BLOG#PUBLISHED', {
      scanForward: false,
      limit: 50,
    });
    return (res.items ?? [])
      .map((item) => {
        const d = (item as unknown as { data?: Record<string, unknown> }).data ?? {};
        return {
          title: String(d['title'] ?? ''),
          slug: String(d['slug'] ?? ''),
          topic: String(d['topic'] ?? ''),
          publishedAt: String(d['publishedAt'] ?? ''),
        };
      })
      .filter((p) => p.slug && p.title);
  } catch (err) {
    console.warn(`[drafter] readRecentPublished failed (continuing without dedup list):`, err);
    return [];
  }
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
  const recentPublished = await readRecentPublished();
  console.log(`[drafter] processing ${bundles.length} bundles (${recentPublished.length} published posts loaded for dedup)`);

  const drafts: Draft[] = [];
  let errors = 0;

  for (const bundle of bundles) {
    try {
      const draft = await draftOneBundle(bundle, correlationId, recentPublished);
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
