/**
 * CloudFormation-style S3 bucket definitions for the MesaHomes platform.
 *
 * Buckets:
 * - mesahomes-data: Zillow CSV archives, PDF exports. Versioning enabled,
 *   lifecycle transitions zillow-raw/ to IA after 90 days, expires after 365 days.
 * - mesahomes-property-photos: Street View photo cache with public read access
 *   and CORS configuration for the frontend.
 *
 * This module exports bucket definitions as typed objects that can be used
 * with AWS CDK, CloudFormation, or the AWS SDK CreateBucket API.
 */

/** The data bucket name used across the platform. */
export const DATA_BUCKET_NAME = 'mesahomes-data';

/** The property photos bucket name used across the platform. */
export const PHOTOS_BUCKET_NAME = 'mesahomes-property-photos';

/**
 * Bucket definition for mesahomes-data.
 *
 * Stores Zillow CSV archives and PDF exports.
 * - Versioning enabled for data integrity
 * - Lifecycle rule: zillow-raw/ prefix transitions to IA after 90 days,
 *   expires after 365 days
 */
export const dataBucketDefinition = {
  Bucket: DATA_BUCKET_NAME,

  VersioningConfiguration: {
    Status: 'Enabled' as const,
  },

  LifecycleConfiguration: {
    Rules: [
      {
        ID: 'zillow-raw-lifecycle',
        Status: 'Enabled' as const,
        Filter: {
          Prefix: 'zillow-raw/',
        },
        Transitions: [
          {
            Days: 90,
            StorageClass: 'STANDARD_IA' as const,
          },
        ],
        Expiration: {
          Days: 365,
        },
      },
    ],
  },
};

/**
 * Bucket definition for mesahomes-property-photos.
 *
 * Stores cached Google Street View photos.
 * - Key pattern: streetview/{zip}/{normalized-address}.jpg
 * - CORS allows GET from mesahomes.com and localhost:3000
 * - Public read access for photos displayed on the frontend
 */
export const photosBucketDefinition = {
  Bucket: PHOTOS_BUCKET_NAME,

  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ['https://mesahomes.com', 'http://localhost:3000'],
        AllowedMethods: ['GET' as const],
        AllowedHeaders: ['*'],
        MaxAgeSeconds: 3600,
      },
    ],
  },

  PublicAccessBlockConfiguration: {
    BlockPublicAcls: false,
    IgnorePublicAcls: false,
    BlockPublicPolicy: false,
    RestrictPublicBuckets: false,
  },
};

/**
 * Bucket policy granting public read access to the photos bucket.
 * Apply after bucket creation via PutBucketPolicy.
 */
export const photosBucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${PHOTOS_BUCKET_NAME}/*`,
    },
  ],
};
