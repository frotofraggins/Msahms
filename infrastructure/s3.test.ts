import { describe, it, expect } from 'vitest';
import {
  dataBucketDefinition,
  photosBucketDefinition,
  photosBucketPolicy,
  DATA_BUCKET_NAME,
  PHOTOS_BUCKET_NAME,
} from './s3.js';

describe('S3 bucket name constants', () => {
  it('should use the correct data bucket name', () => {
    expect(DATA_BUCKET_NAME).toBe('mesahomes-data');
    expect(dataBucketDefinition.Bucket).toBe('mesahomes-data');
  });

  it('should use the correct photos bucket name', () => {
    expect(PHOTOS_BUCKET_NAME).toBe('mesahomes-property-photos');
    expect(photosBucketDefinition.Bucket).toBe('mesahomes-property-photos');
  });
});

describe('Data bucket definition', () => {
  it('should enable versioning', () => {
    expect(dataBucketDefinition.VersioningConfiguration.Status).toBe('Enabled');
  });

  it('should define a lifecycle rule for zillow-raw/ prefix', () => {
    const rules = dataBucketDefinition.LifecycleConfiguration.Rules;
    expect(rules).toHaveLength(1);

    const rule = rules[0];
    expect(rule.ID).toBe('zillow-raw-lifecycle');
    expect(rule.Status).toBe('Enabled');
    expect(rule.Filter.Prefix).toBe('zillow-raw/');
  });

  it('should transition zillow-raw/ to STANDARD_IA after 90 days', () => {
    const transitions = dataBucketDefinition.LifecycleConfiguration.Rules[0].Transitions;
    expect(transitions).toHaveLength(1);
    expect(transitions[0].Days).toBe(90);
    expect(transitions[0].StorageClass).toBe('STANDARD_IA');
  });

  it('should expire zillow-raw/ objects after 365 days', () => {
    const expiration = dataBucketDefinition.LifecycleConfiguration.Rules[0].Expiration;
    expect(expiration.Days).toBe(365);
  });
});

describe('Photos bucket definition', () => {
  it('should configure CORS allowing GET from mesahomes.com and localhost:3000', () => {
    const corsRules = photosBucketDefinition.CORSConfiguration.CORSRules;
    expect(corsRules).toHaveLength(1);

    const rule = corsRules[0];
    expect(rule.AllowedOrigins).toContain('https://mesahomes.com');
    expect(rule.AllowedOrigins).toContain('http://localhost:3000');
    expect(rule.AllowedMethods).toEqual(['GET']);
    expect(rule.AllowedHeaders).toEqual(['*']);
    expect(rule.MaxAgeSeconds).toBe(3600);
  });

  it('should disable public access block for public read', () => {
    const config = photosBucketDefinition.PublicAccessBlockConfiguration;
    expect(config.BlockPublicAcls).toBe(false);
    expect(config.IgnorePublicAcls).toBe(false);
    expect(config.BlockPublicPolicy).toBe(false);
    expect(config.RestrictPublicBuckets).toBe(false);
  });
});

describe('Photos bucket policy', () => {
  it('should grant public read access to all objects', () => {
    expect(photosBucketPolicy.Version).toBe('2012-10-17');

    const statements = photosBucketPolicy.Statement;
    expect(statements).toHaveLength(1);

    const stmt = statements[0];
    expect(stmt.Effect).toBe('Allow');
    expect(stmt.Principal).toBe('*');
    expect(stmt.Action).toBe('s3:GetObject');
    expect(stmt.Resource).toBe('arn:aws:s3:::mesahomes-property-photos/*');
  });
});
