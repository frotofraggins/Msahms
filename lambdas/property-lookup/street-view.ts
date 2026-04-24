/**
 * Google Street View photo caching module for the MesaHomes property lookup.
 *
 * Implements a three-tier strategy:
 *   1. Check S3 cache for an existing photo
 *   2. Call the Street View Metadata API (free, unlimited) to check availability
 *   3. If available, fetch the image and cache it in S3
 *
 * API key is retrieved from AWS Secrets Manager at runtime.
 * All Google API calls are logged to CloudWatch for usage tracking.
 */

import { getSecret } from '../../lib/secrets.js';
import {
  fileExists,
  uploadFile,
  getSignedUrl,
  PHOTOS_BUCKET,
  normalizeAddressForKey,
  getStreetViewCacheKey,
} from '../../lib/s3.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Secrets Manager path for the Google Maps API key. */
const GOOGLE_API_KEY_SECRET = 'mesahomes/google-maps-api-key';

/** Street View Static API metadata endpoint. */
const METADATA_URL = 'https://maps.googleapis.com/maps/api/streetview/metadata';

/** Street View Static API image endpoint. */
const IMAGE_URL = 'https://maps.googleapis.com/maps/api/streetview';

/** Default image dimensions. */
const IMAGE_SIZE = '600x400';

/** Placeholder image URL returned when no Street View photo is available. */
const PLACEHOLDER_URL = 'https://mesahomes.com/images/property-placeholder.jpg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of a Street View metadata check. */
export interface StreetViewMetadata {
  /** Status from the API: "OK" means a photo is available. */
  status: string;
  /** Date the photo was captured (may be undefined). */
  date?: string;
}

/** Result of the full photo retrieval flow. */
export interface PropertyPhotoResult {
  /** URL to the property photo (presigned S3 URL or placeholder). */
  url: string;
  /** Source of the photo. */
  source: 'streetview' | 'placeholder';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a property photo, using S3 cache when available.
 *
 * Flow:
 *   1. Check S3 cache for `streetview/{zip}/{normalized-address}.jpg`
 *   2. If cache miss → call Street View Metadata API
 *   3. If photo exists → fetch image, store in S3, return presigned URL
 *   4. If no photo → return placeholder URL
 *
 * @param address - Full property address
 * @param zip     - 5-digit ZIP code
 * @returns Photo URL and source indicator
 */
export async function getPropertyPhoto(
  address: string,
  zip: string,
): Promise<PropertyPhotoResult> {
  const cacheKey = getStreetViewCacheKey(zip, address);

  // Step 1: Check S3 cache
  const cached = await fileExists(PHOTOS_BUCKET, cacheKey);
  if (cached) {
    const url = await getSignedUrl(PHOTOS_BUCKET, cacheKey);
    return { url, source: 'streetview' };
  }

  // Step 2: Check Street View metadata
  const apiKey = await getSecret(GOOGLE_API_KEY_SECRET);
  const locationStr = `${address}, ${zip}`;

  console.log(`[street-view] Checking metadata for: ${locationStr}`);
  const metadata = await checkStreetViewMetadata(locationStr, apiKey);

  if (metadata.status !== 'OK') {
    console.log(`[street-view] No photo available for: ${locationStr} (status: ${metadata.status})`);
    return { url: PLACEHOLDER_URL, source: 'placeholder' };
  }

  // Step 3: Fetch and cache the image
  console.log(`[street-view] Fetching image for: ${locationStr}`);
  const imageBuffer = await fetchStreetViewImage(locationStr, apiKey);

  await uploadFile(PHOTOS_BUCKET, cacheKey, imageBuffer, 'image/jpeg');
  console.log(`[street-view] Cached photo at s3://${PHOTOS_BUCKET}/${cacheKey}`);

  const url = await getSignedUrl(PHOTOS_BUCKET, cacheKey);
  return { url, source: 'streetview' };
}

/**
 * Check the Street View Metadata API for photo availability.
 *
 * This endpoint is free and has no usage limits.
 *
 * @param address - Full address string for the location query
 * @param apiKey  - Google Maps API key
 * @returns Metadata with status and optional capture date
 */
export async function checkStreetViewMetadata(
  address: string,
  apiKey: string,
): Promise<StreetViewMetadata> {
  const params = new URLSearchParams({
    location: address,
    key: apiKey,
  });

  const response = await fetch(`${METADATA_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Street View metadata request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { status: string; date?: string };

  return {
    status: data.status,
    date: data.date,
  };
}

/**
 * Fetch a Street View image as a Buffer.
 *
 * Counts against the 10,000/month free tier.
 *
 * @param address - Full address string for the location query
 * @param apiKey  - Google Maps API key
 * @returns JPEG image data as a Buffer
 */
export async function fetchStreetViewImage(
  address: string,
  apiKey: string,
): Promise<Buffer> {
  const params = new URLSearchParams({
    size: IMAGE_SIZE,
    location: address,
    key: apiKey,
  });

  const response = await fetch(`${IMAGE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Street View image request failed: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
