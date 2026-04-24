/**
 * Shared S3 client module for the MesaHomes platform.
 *
 * Provides a configured S3 client and helper functions for common
 * operations against the mesahomes-data and mesahomes-property-photos buckets.
 *
 * Uses @aws-sdk/client-s3 for core operations and
 * @aws-sdk/s3-request-presigner for presigned URL generation.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandInput,
  type DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** S3 bucket for Zillow CSV archives and PDF exports. */
export const DATA_BUCKET = 'mesahomes-data';

/** S3 bucket for cached Street View property photos. */
export const PHOTOS_BUCKET = 'mesahomes-property-photos';

/** Default presigned URL expiration in seconds (1 hour). */
const DEFAULT_PRESIGN_EXPIRES = 3600;

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

const s3Client = new S3Client({
  region: process.env['AWS_REGION'] ?? 'us-west-2',
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Upload a file to S3.
 *
 * @param bucket - Target bucket name
 * @param key - Object key
 * @param body - File content as Buffer, string, or ReadableStream
 * @param contentType - Optional MIME type (e.g. 'image/jpeg', 'text/csv')
 */
export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | string | ReadableStream,
  contentType?: string,
): Promise<void> {
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ...(contentType && { ContentType: contentType }),
  };

  await s3Client.send(new PutObjectCommand(params));
}

/**
 * Get a file from S3.
 *
 * @param bucket - Source bucket name
 * @param key - Object key
 * @returns File content as Buffer, or undefined if the object does not exist
 */
export async function getFile(
  bucket: string,
  key: string,
): Promise<Buffer | undefined> {
  const params: GetObjectCommandInput = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const result = await s3Client.send(new GetObjectCommand(params));
    if (!result.Body) return undefined;
    const bytes = await result.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (error: unknown) {
    if (isNoSuchKeyError(error)) return undefined;
    throw error;
  }
}

/**
 * Check whether a file exists in S3.
 *
 * @param bucket - Bucket name
 * @param key - Object key
 * @returns true if the object exists, false otherwise
 */
export async function fileExists(
  bucket: string,
  key: string,
): Promise<boolean> {
  const params: HeadObjectCommandInput = {
    Bucket: bucket,
    Key: key,
  };

  try {
    await s3Client.send(new HeadObjectCommand(params));
    return true;
  } catch (error: unknown) {
    if (isNotFoundError(error)) return false;
    throw error;
  }
}

/**
 * Generate a presigned URL for temporary access to an S3 object.
 *
 * @param bucket - Bucket name
 * @param key - Object key
 * @param expiresIn - URL validity in seconds (default: 3600)
 * @returns Presigned URL string
 */
export async function getSignedUrl(
  bucket: string,
  key: string,
  expiresIn?: number,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return awsGetSignedUrl(s3Client, command, {
    expiresIn: expiresIn ?? DEFAULT_PRESIGN_EXPIRES,
  });
}

/**
 * Delete a file from S3.
 *
 * @param bucket - Bucket name
 * @param key - Object key
 */
export async function deleteFile(
  bucket: string,
  key: string,
): Promise<void> {
  const params: DeleteObjectCommandInput = {
    Bucket: bucket,
    Key: key,
  };

  await s3Client.send(new DeleteObjectCommand(params));
}

// ---------------------------------------------------------------------------
// Address / key helpers
// ---------------------------------------------------------------------------

/**
 * Convert an address string to an S3-safe key segment.
 *
 * Lowercases the string, replaces whitespace runs with a single hyphen,
 * strips characters that are not alphanumeric or hyphens, and trims
 * leading/trailing hyphens.
 *
 * @param address - Raw address string (e.g. "39669 N Luke Ln")
 * @returns Normalized key segment (e.g. "39669-n-luke-ln")
 */
export function normalizeAddressForKey(address: string): string {
  return address
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build the S3 cache key for a Street View photo.
 *
 * @param zip - ZIP code
 * @param address - Raw address string
 * @returns S3 key in the format `streetview/{zip}/{normalized-address}.jpg`
 */
export function getStreetViewCacheKey(zip: string, address: string): string {
  return `streetview/${zip}/${normalizeAddressForKey(address)}.jpg`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if an error is an S3 NoSuchKey error (GetObject on missing key).
 */
function isNoSuchKeyError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = (error as { name: string }).name;
    return name === 'NoSuchKey';
  }
  return false;
}

/**
 * Check if an error is an S3 NotFound / 404 error (HeadObject on missing key).
 */
function isNotFoundError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    return err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404;
  }
  return false;
}
