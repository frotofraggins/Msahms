/**
 * Photo finder — given article keywords, returns 1-2 photos with
 * proper attribution. Tries Wikimedia Commons first (genuine Mesa
 * photos), falls back to Unsplash (stock).
 *
 * Downloads chosen photos to S3 so we serve from our own CDN (Unsplash
 * API guidelines require this — no hotlinking).
 *
 * See .kiro/specs/content-pipeline-phase-2.md §2B
 *
 * Input: { keywords: string[], draftId: string, count?: number }
 * Output: { photos: Array<{url, attribution, license, sourceUrl}> }
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const sm = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const br = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET ?? 'mesahomes-property-photos';
const UNSPLASH_SECRET = process.env.UNSPLASH_KEY_SECRET ?? 'mesahomes/live/unsplash-access-key';
const PEXELS_SECRET = process.env.PEXELS_KEY_SECRET ?? 'mesahomes/live/pexels-api-key';
const GOOGLE_SECRET = process.env.GOOGLE_MAPS_API_KEY_SECRET ?? 'mesahomes/live/google-maps-api-key';
const CDN_BASE =
  process.env.PHOTOS_CDN_BASE ?? 'https://mesahomes-property-photos.s3.us-west-2.amazonaws.com';
const AI_IMAGE_MODEL_ID = process.env.AI_IMAGE_MODEL_ID ?? 'stability.stable-image-core-v1:1';
const AI_IMAGE_ENABLED = (process.env.AI_IMAGE_ENABLED ?? 'true') !== 'false';

export interface PhotoResult {
  /** Public URL the article embeds */
  url: string;
  /** Human-readable photographer + source */
  attribution: string;
  /** CC / stock license */
  license: string;
  /** Original source URL for click-through */
  sourceUrl: string;
  /** Alt text for accessibility */
  alt: string;
}

interface PhotoFinderEvent {
  keywords: string[];
  draftId: string;
  count?: number;
}

let cachedUnsplashKey: string | null = null;
let cachedPexelsKey: string | null = null;
async function getUnsplashKey(): Promise<string | null> {
  if (cachedUnsplashKey) return cachedUnsplashKey;
  try {
    const resp = await sm.send(new GetSecretValueCommand({ SecretId: UNSPLASH_SECRET }));
    cachedUnsplashKey = resp.SecretString ?? null;
    return cachedUnsplashKey;
  } catch (err) {
    console.warn('[photo-finder] Unsplash key not available:', err);
    return null;
  }
}

async function getPexelsKey(): Promise<string | null> {
  if (cachedPexelsKey) return cachedPexelsKey;
  try {
    const resp = await sm.send(new GetSecretValueCommand({ SecretId: PEXELS_SECRET }));
    cachedPexelsKey = resp.SecretString ?? null;
    return cachedPexelsKey;
  } catch (err) {
    console.warn('[photo-finder] Pexels key not available:', err);
    return null;
  }
}

let cachedGoogleKey: string | null = null;
async function getGoogleKey(): Promise<string | null> {
  if (cachedGoogleKey) return cachedGoogleKey;
  try {
    const resp = await sm.send(new GetSecretValueCommand({ SecretId: GOOGLE_SECRET }));
    cachedGoogleKey = resp.SecretString ?? null;
    return cachedGoogleKey;
  } catch (err) {
    console.warn('[photo-finder] Google Maps key not available:', err);
    return null;
  }
}

/**
 * Extract a street-address-looking string from a bundle's summary/title.
 * Matches patterns like:
 *   - "2038 North Country Club Drive"
 *   - "245 South Power Road"
 *   - "5848 South Hassett"
 * Requires 2+ digit leading street number + directional + street name.
 * Returns null if no address found.
 */
export function extractAddress(text: string): string | null {
  // Street number + optional direction + 1-4 words + street type
  const re =
    /\b(\d{2,5})\s+(North|South|East|West|N|S|E|W)?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s+(Drive|Dr|Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Way|Circle|Cir|Court|Ct|Place|Pl)\b/;
  const m = text.match(re);
  if (!m) return null;
  return m[0];
}

/**
 * Google Street View Static API. When a bundle mentions a specific
 * property address (common in zoning / big-sales bundles), fetch the
 * street-level photo of that address. Much more relevant than a
 * generic stock photo of "Mesa." Costs $0.007/image (first 100k/mo
 * free on most accounts).
 */
async function searchStreetView(address: string): Promise<PhotoResult[]> {
  const key = await getGoogleKey();
  if (!key) return [];

  // First check the free metadata endpoint so we don't get billed for
  // "no imagery" hits.
  const metaUrl =
    `https://maps.googleapis.com/maps/api/streetview/metadata?` +
    new URLSearchParams({ location: address + ', Mesa, AZ', key });
  try {
    const metaRes = await fetch(metaUrl);
    if (!metaRes.ok) return [];
    const meta = (await metaRes.json()) as { status: string };
    if (meta.status !== 'OK') {
      console.log(`[photo-finder] street view metadata for "${address}": ${meta.status}`);
      return [];
    }
  } catch (err) {
    console.warn('[photo-finder] street view metadata fetch failed:', err);
    return [];
  }

  // Metadata says we have imagery. Fetch the actual image.
  const imageUrl =
    `https://maps.googleapis.com/maps/api/streetview?` +
    new URLSearchParams({
      location: address + ', Mesa, AZ',
      size: '1200x675',
      fov: '80',
      source: 'outdoor',
      key,
    });

  return [
    {
      url: imageUrl,
      attribution: 'Google Street View',
      license: 'Google Maps Terms of Service',
      sourceUrl: `https://www.google.com/maps?q=${encodeURIComponent(address + ', Mesa, AZ')}`,
      alt: `Google Street View photo of ${address} in Mesa, Arizona`,
    },
  ];
}

/**
 * Pexels search. Free API (200 req/hr), commercial use allowed, no
 * hotlinking restriction. Typically has better hit rate than Unsplash
 * for generic topical queries ("desert neighborhood," "suburban home,"
 * "palm trees"). Lower hit rate for specific-place queries.
 */
async function searchPexels(query: string, count: number): Promise<PhotoResult[]> {
  const key = await getPexelsKey();
  if (!key) return [];

  const url =
    `https://api.pexels.com/v1/search?` +
    new URLSearchParams({
      query,
      per_page: String(count),
      orientation: 'landscape',
    });

  try {
    const res = await fetch(url, {
      headers: { Authorization: key, 'User-Agent': 'MesaHomesBot/1.0' },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      photos?: Array<{
        id: number;
        url: string;
        src: { large: string; large2x?: string };
        alt?: string;
        photographer?: string;
        photographer_url?: string;
      }>;
    };

    return (data.photos ?? []).map((p) => ({
      url: p.src.large2x ?? p.src.large,
      attribution: `${p.photographer ?? 'Pexels contributor'} (Pexels)`,
      license: 'Pexels',
      sourceUrl: p.url,
      alt: (p.alt ?? query).slice(0, 150),
    }));
  } catch (err) {
    console.warn('[photo-finder] Pexels fetch failed:', err);
    return [];
  }
}

/**
 * Wikimedia Commons search. Free, no auth, returns real public-license
 * photos. Hit rate is lower than Unsplash but quality + authenticity
 * is much higher for Mesa-specific queries.
 */
async function searchWikimedia(query: string, count: number): Promise<PhotoResult[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?` +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `${query} filetype:bitmap`,
      gsrlimit: String(count * 3), // pad — filter for real photos after
      gsrnamespace: '6', // file namespace only
      prop: 'imageinfo|pageprops',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '1200',
    });

  const res = await fetch(url, {
    headers: { 'User-Agent': 'MesaHomesBot/1.0 (+https://mesahomes.com)' },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            mime?: string;
            width?: number;
            height?: number;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
              ImageDescription?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  const pages = Object.values(data.query?.pages ?? {});
  const results: PhotoResult[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info?.url || !info.mime?.startsWith('image/')) continue;
    if ((info.width ?? 0) < 800) continue; // skip tiny images
    const artist = stripHtml(info.extmetadata?.Artist?.value ?? 'Unknown');
    const license = info.extmetadata?.LicenseShortName?.value ?? 'unknown';
    const desc = stripHtml(info.extmetadata?.ImageDescription?.value ?? p.title ?? '');
    results.push({
      url: info.thumburl ?? info.url,
      attribution: `${artist} (Wikimedia Commons)`,
      license,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title ?? '')}`,
      alt: desc.slice(0, 150),
    });
    if (results.length >= count) break;
  }
  return results;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Unsplash search. Requires API key. Our key is HTTP-referrer-restricted
 * for the frontend; the photo-finder Lambda uses it via API Client-ID
 * header which Unsplash accepts from any origin.
 */
async function searchUnsplash(query: string, count: number): Promise<PhotoResult[]> {
  const key = await getUnsplashKey();
  if (!key) return [];

  const url =
    `https://api.unsplash.com/search/photos?` +
    new URLSearchParams({ query, per_page: String(count) });
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });
  if (!res.ok) {
    console.warn(`[photo-finder] Unsplash returned ${res.status}`);
    return [];
  }
  const data = (await res.json()) as {
    results?: Array<{
      id: string;
      alt_description?: string | null;
      description?: string | null;
      urls?: { regular?: string };
      links?: { html?: string };
      user?: { name?: string; username?: string };
    }>;
  };

  return (data.results ?? []).slice(0, count).map((p) => ({
    url: p.urls?.regular ?? '',
    attribution: `Photo by ${p.user?.name ?? 'Unknown'} on Unsplash`,
    license: 'Unsplash License',
    sourceUrl: p.links?.html ?? 'https://unsplash.com',
    alt: (p.alt_description ?? p.description ?? '').slice(0, 150),
  }));
}

/**
 * Download a photo to S3 so we serve from our CDN (Unsplash ToS
 * requires no hotlinking for commercial deployments).
 */
/**
 * Bedrock AI image generation.
 *
 * Default model: Stability AI Stable Image Core v1.1
 * (stability.stable-image-core-v1:1). Chosen because:
 *   - Active model in us-west-2 (Amazon-branded Titan + Nova Canvas
 *     both got marked Legacy in our account due to 30-day inactivity)
 *   - Cheapest active Stability tier (~$0.04/image, better quality
 *     than Ultra for our illustrative fallback use case)
 *   - Simpler request schema than Titan (just prompt + optional
 *     negative_prompt)
 *
 * Used as last-resort fallback when none of Wikimedia/Pexels/Unsplash
 * return Arizona-local photos. Produces a topic-relevant AI image that
 * at least matches the article's subject (Mesa sunset, desert
 * neighborhood, etc) instead of shipping a generic MesaHomes logo.
 *
 * Cost: ~$0.04 per image at current Bedrock pricing. Capped by our
 * $5/day Bedrock budget alarm.
 *
 * Caveat: AI-generated images are clearly labeled in alt text +
 * attribution so humans know they're synthetic. License marked
 * 'AI-generated' with disclosure.
 *
 * Stability API schema (differs from Titan/Nova):
 *   Request:  { prompt, negative_prompt?, aspect_ratio?, seed?, output_format? }
 *   Response: { images: [base64], seeds: [n], finish_reasons: [null|reason] }
 */
async function generateAiImage(
  keywords: string[],
  draftId: string,
  idx: number,
): Promise<PhotoResult | null> {
  if (!AI_IMAGE_ENABLED) return null;

  // Build a prompt that biases toward a realistic,
  // location-appropriate Mesa scene.
  const subject = keywords.slice(0, 3).join(', ') || 'residential neighborhood';
  const prompt =
    `Realistic photograph of ${subject} in Mesa, Arizona. ` +
    `Sonoran desert environment, saguaro cacti, palm trees, mountain backdrop, ` +
    `golden-hour lighting, shot on a DSLR, photojournalism style.`;
  const negative_prompt =
    'text, typography, watermark, logo, blurry, distorted, cartoon, illustration, ' +
    'people faces, snow, beach, ocean';

  // Deterministic seed from draftId so re-running the pipeline on the
  // same draft produces the same image (debuggable). Stability range:
  // 0 to 4_294_967_295.
  const seed = Math.abs(hashString(`${draftId}-${idx}`)) % 4_294_967_295;

  try {
    const body = JSON.stringify({
      prompt,
      negative_prompt,
      aspect_ratio: '16:9', // landscape for blog hero images
      seed,
      output_format: 'png',
    });

    const resp = await br.send(
      new InvokeModelCommand({
        modelId: AI_IMAGE_MODEL_ID,
        body,
        contentType: 'application/json',
        accept: 'application/json',
      }),
    );

    const parsed = JSON.parse(new TextDecoder().decode(resp.body)) as {
      images?: string[];
      finish_reasons?: (string | null)[];
      seeds?: number[];
    };

    if (!parsed.images || parsed.images.length === 0) {
      console.warn(
        '[photo-finder] AI image returned no images. finish_reasons=',
        parsed.finish_reasons,
      );
      return null;
    }

    const reason = parsed.finish_reasons?.[0];
    if (reason !== null && reason !== undefined) {
      console.warn(`[photo-finder] AI image filtered: ${reason}`);
      return null;
    }

    const b64 = parsed.images[0];
    const buffer = Buffer.from(b64, 'base64');
    const key = `articles/${draftId}/${idx}-ai.png`;
    await s3.send(
      new PutObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        Metadata: {
          attribution: `AI-generated (${AI_IMAGE_MODEL_ID})`,
          license: 'AI-generated',
          prompt: prompt.slice(0, 500),
        },
      }),
    );

    return {
      url: `${CDN_BASE}/${key}`,
      attribution: `AI-generated illustration (Bedrock Stable Image Core)`,
      license: 'AI-generated',
      sourceUrl: 'https://aws.amazon.com/bedrock/stable-diffusion/',
      alt: `AI-generated image depicting ${subject} in Mesa, Arizona`,
    };
  } catch (err) {
    console.warn('[photo-finder] AI image generation failed:', err);
    return null;
  }
}

/**
 * Stable hash of a string to a 32-bit integer, for deterministic
 * seeding without requiring crypto.
 */
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

async function downloadToS3(
  photo: PhotoResult,
  draftId: string,
  idx: number,
): Promise<PhotoResult> {
  try {
    const res = await fetch(photo.url, {
      headers: { 'User-Agent': 'MesaHomesBot/1.0 (+https://mesahomes.com)' },
    });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg';
    const body = Buffer.from(await res.arrayBuffer());
    const key = `articles/${draftId}/${idx}.${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
        Metadata: {
          'x-attribution': photo.attribution.slice(0, 1024),
          'x-license': photo.license.slice(0, 100),
          'x-source-url': photo.sourceUrl.slice(0, 1024),
        },
      }),
    );
    return {
      ...photo,
      url: `${CDN_BASE}/${key}`,
    };
  } catch (err) {
    console.warn(`[photo-finder] download failed for ${photo.url}:`, err);
    // Return with original URL — graceful degradation. Article still
    // has a photo, attribution still correct, only difference is it
    // hot-links from Wikimedia/Unsplash. Not ideal but not broken.
    return photo;
  }
}

/**
 * Find photos: Wikimedia first, then Unsplash to fill remaining slots.
 */
/**
 * True if a photo's description/alt text references Arizona, Mesa, Phoenix,
 * or any East Valley city we care about. Used to filter out irrelevant
 * geography. A "Brooklyn apartment building" result is worse than no photo.
 */
function isLocalToArizona(photo: PhotoResult): boolean {
  const haystack = `${photo.alt} ${photo.attribution}`.toLowerCase();
  const local = [
    'arizona',
    'mesa',
    'phoenix',
    'gilbert',
    'chandler',
    'queen creek',
    'san tan',
    'apache junction',
    'east valley',
    'sonoran',
    'maricopa',
    'pinal',
  ];
  return local.some((kw) => haystack.includes(kw));
}

/**
 * Curated fallback photos. When Wikimedia + Unsplash return nothing
 * locally relevant, we use one of these so articles never ship with
 * a completely irrelevant image. These are served from the mesahomes.com
 * S3 bucket and are owner-licensed.
 *
 * NOTE: verify these paths exist before enabling fallback. Missing =
 * skip fallback and return fewer photos.
 */
const CURATED_FALLBACKS: PhotoResult[] = [
  {
    url: 'https://mesahomes.com/brand/mesahomes-logo-emblem.png',
    attribution: 'MesaHomes',
    license: 'Owner-licensed',
    sourceUrl: 'https://mesahomes.com',
    alt: 'MesaHomes — Mesa AZ real estate',
  },
];

export async function findPhotos(
  keywords: string[],
  draftId: string,
  count: number = 1,
  context?: string, // optional free-text (bundle summary) for address extraction
): Promise<PhotoResult[]> {
  // Tier 0: Street View for address-specific bundles.
  // If the bundle context mentions a concrete street address, that photo
  // is more relevant than any generic Mesa photo we could find elsewhere.
  let photos: PhotoResult[] = [];
  const address = context ? extractAddress(context) : null;
  if (address) {
    console.log(`[photo-finder] extracted address from context: "${address}"`);
    const streetView = await searchStreetView(address);
    if (streetView.length > 0) {
      console.log(`[photo-finder] got ${streetView.length} street view photo(s)`);
      photos = streetView.slice(0, count);
    }
  }

  // Build a query that always biases toward Arizona. Otherwise "mesa"
  // alone matches Spanish-language pages, mesas-the-landform, Mesa VA,
  // Mesa Verde, etc. We want Mesa the Arizona city.
  const baseKeywords = keywords
    .slice(0, 4)
    .filter((k) => k.length > 2)
    .join(' ');
  const query = `${baseKeywords} Mesa Arizona`;
  console.log(`[photo-finder] searching query="${query}" count=${count} draft=${draftId}`);

  // Wikimedia next — free and CC-licensed
  if (photos.length < count) {
    const wikimediaRaw = await searchWikimedia(query, count * 3);
    const wikimediaLocal = wikimediaRaw.filter(isLocalToArizona);
    console.log(
      `[photo-finder] wikimedia: ${wikimediaRaw.length} raw, ${wikimediaLocal.length} locally relevant`,
    );
    const needed = count - photos.length;
    photos = [...photos, ...wikimediaLocal.slice(0, needed)];
  }

  // Pexels fallback. Free tier, generous hit rate for generic topical
  // queries. Still apply the Arizona filter to reject irrelevant hits.
  if (photos.length < count) {
    const needed = count - photos.length;
    const pexelsRaw = await searchPexels(query, needed * 3);
    const pexelsLocal = pexelsRaw.filter(isLocalToArizona);
    console.log(
      `[photo-finder] pexels: ${pexelsRaw.length} raw, ${pexelsLocal.length} locally relevant`,
    );
    photos = [...photos, ...pexelsLocal.slice(0, needed)];
  }

  // Unsplash fallback if Wikimedia + Pexels didn't return enough local
  // matches. Unsplash is less strict about location tags so we still filter.
  if (photos.length < count) {
    const needed = count - photos.length;
    const unsplashRaw = await searchUnsplash(query, needed * 3);
    const unsplashLocal = unsplashRaw.filter(isLocalToArizona);
    console.log(
      `[photo-finder] unsplash: ${unsplashRaw.length} raw, ${unsplashLocal.length} locally relevant`,
    );
    photos = [...photos, ...unsplashLocal.slice(0, needed)];
  }

  // AI-generated fallback via Bedrock Nova Canvas (was Titan). Used
  // when nothing else returned locally-relevant photos. At least the
  // AI image is topic- and location-appropriate, not a generic logo.
  if (photos.length < count) {
    const needed = count - photos.length;
    for (let i = 0; i < needed; i++) {
      console.log(`[photo-finder] falling back to AI image for slot ${i + photos.length}`);
      const aiImage = await generateAiImage(keywords, draftId, photos.length + i);
      if (aiImage) photos.push(aiImage);
      else break; // don't keep trying if one fails
    }
  }

  // Final fallback: MesaHomes logo emblem. Only reached if AI image
  // gen is disabled or failed. Guarantees an article never ships
  // without any photo.
  if (photos.length < count) {
    const needed = count - photos.length;
    console.log(`[photo-finder] using ${needed} curated fallback(s) for "${query}"`);
    photos = [...photos, ...CURATED_FALLBACKS.slice(0, needed)];
  }

  // Download non-curated photos to S3. Curated ones are already on our
  // CDN so we skip re-downloading. AI images are already uploaded to
  // S3 in generateAiImage.
  const downloaded = await Promise.all(
    photos.map((p, idx) => {
      if (p.license === 'Owner-licensed' || p.license === 'AI-generated') return Promise.resolve(p);
      return downloadToS3(p, draftId, idx);
    }),
  );
  return downloaded;
}

/** Lambda handler — invokable directly for test. */
export async function handler(event: PhotoFinderEvent): Promise<{
  statusCode: number;
  photos: PhotoResult[];
}> {
  const photos = await findPhotos(event.keywords, event.draftId, event.count ?? 1);
  return { statusCode: 200, photos };
}
