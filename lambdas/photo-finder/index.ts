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

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
const sm = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'us-west-2' });
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET ?? 'mesahomes-property-photos';
const UNSPLASH_SECRET = process.env.UNSPLASH_KEY_SECRET ?? 'mesahomes/live/unsplash-access-key';
const PEXELS_SECRET = process.env.PEXELS_KEY_SECRET ?? 'mesahomes/live/pexels-api-key';
const CDN_BASE =
  process.env.PHOTOS_CDN_BASE ?? 'https://mesahomes-property-photos.s3.us-west-2.amazonaws.com';

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
): Promise<PhotoResult[]> {
  // Build a query that always biases toward Arizona. Otherwise "mesa"
  // alone matches Spanish-language pages, mesas-the-landform, Mesa VA,
  // Mesa Verde, etc. We want Mesa the Arizona city.
  const baseKeywords = keywords
    .slice(0, 4)
    .filter((k) => k.length > 2)
    .join(' ');
  const query = `${baseKeywords} Mesa Arizona`;
  console.log(`[photo-finder] searching query="${query}" count=${count} draft=${draftId}`);

  // Wikimedia first — free and CC-licensed
  const wikimediaRaw = await searchWikimedia(query, count * 3);
  const wikimediaLocal = wikimediaRaw.filter(isLocalToArizona);
  console.log(
    `[photo-finder] wikimedia: ${wikimediaRaw.length} raw, ${wikimediaLocal.length} locally relevant`,
  );

  let photos: PhotoResult[] = wikimediaLocal.slice(0, count);

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

  // Final fallback: use our curated Mesa hero photos. Better a relevant
  // generic Mesa photo than an irrelevant specific one.
  if (photos.length < count) {
    const needed = count - photos.length;
    console.log(`[photo-finder] using ${needed} curated fallback(s) for "${query}"`);
    photos = [...photos, ...CURATED_FALLBACKS.slice(0, needed)];
  }

  // Download non-curated photos to S3. Curated ones are already on our
  // CDN so we skip re-downloading.
  const downloaded = await Promise.all(
    photos.map((p, idx) => {
      if (p.license === 'Owner-licensed') return Promise.resolve(p);
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
