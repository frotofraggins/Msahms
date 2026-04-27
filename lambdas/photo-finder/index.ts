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
export async function findPhotos(
  keywords: string[],
  draftId: string,
  count: number = 1,
): Promise<PhotoResult[]> {
  const query = keywords.slice(0, 4).join(' ');
  console.log(`[photo-finder] searching query="${query}" count=${count} draft=${draftId}`);

  const wikimedia = await searchWikimedia(query, count);
  let photos = wikimedia.slice(0, count);

  if (photos.length < count) {
    const needed = count - photos.length;
    const unsplash = await searchUnsplash(query, needed);
    photos = [...photos, ...unsplash];
  }

  if (photos.length === 0) {
    console.warn(`[photo-finder] no photos found for "${query}"`);
    return [];
  }

  // Download all to S3 in parallel
  const downloaded = await Promise.all(photos.map((p, idx) => downloadToS3(p, draftId, idx)));
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
