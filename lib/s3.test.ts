import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AWS SDK before importing the module under test
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
  GetObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
  HeadObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com/test'),
}));

// Import after mocks are set up
const mod = await import('./s3.js');
const {
  DATA_BUCKET,
  PHOTOS_BUCKET,
  uploadFile,
  getFile,
  fileExists,
  getSignedUrl,
  deleteFile,
  normalizeAddressForKey,
  getStreetViewCacheKey,
} = mod;

const { getSignedUrl: mockAwsGetSignedUrl } = await import('@aws-sdk/s3-request-presigner');

describe('Bucket constants', () => {
  it('should export the correct data bucket name', () => {
    expect(DATA_BUCKET).toBe('mesahomes-data');
  });

  it('should export the correct photos bucket name', () => {
    expect(PHOTOS_BUCKET).toBe('mesahomes-property-photos');
  });
});

describe('uploadFile', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should send a PutObjectCommand with bucket, key, and body', async () => {
    await uploadFile('mesahomes-data', 'zillow-raw/2026-03/zhvi.csv', Buffer.from('data'));

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.Bucket).toBe('mesahomes-data');
    expect(call.input.Key).toBe('zillow-raw/2026-03/zhvi.csv');
  });

  it('should include content type when provided', async () => {
    await uploadFile('mesahomes-data', 'test.csv', Buffer.from('data'), 'text/csv');

    const call = mockSend.mock.calls[0][0];
    expect(call.input.ContentType).toBe('text/csv');
  });

  it('should not include content type when omitted', async () => {
    await uploadFile('mesahomes-data', 'test.csv', Buffer.from('data'));

    const call = mockSend.mock.calls[0][0];
    expect(call.input.ContentType).toBeUndefined();
  });
});

describe('getFile', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return a Buffer when the object exists', async () => {
    const content = Buffer.from('file content');
    mockSend.mockResolvedValue({
      Body: {
        transformToByteArray: () => Promise.resolve(new Uint8Array(content)),
      },
    });

    const result = await getFile('mesahomes-data', 'test.csv');
    expect(result).toBeInstanceOf(Buffer);
    expect(result?.toString()).toBe('file content');
  });

  it('should return undefined when the object does not exist', async () => {
    const error = new Error('NoSuchKey');
    (error as unknown as { name: string }).name = 'NoSuchKey';
    mockSend.mockRejectedValue(error);

    const result = await getFile('mesahomes-data', 'missing.csv');
    expect(result).toBeUndefined();
  });

  it('should return undefined when Body is null', async () => {
    mockSend.mockResolvedValue({ Body: null });

    const result = await getFile('mesahomes-data', 'empty.csv');
    expect(result).toBeUndefined();
  });

  it('should rethrow non-NoSuchKey errors', async () => {
    const error = new Error('AccessDenied');
    (error as unknown as { name: string }).name = 'AccessDenied';
    mockSend.mockRejectedValue(error);

    await expect(getFile('mesahomes-data', 'test.csv')).rejects.toThrow('AccessDenied');
  });
});

describe('fileExists', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should return true when the object exists', async () => {
    mockSend.mockResolvedValue({});

    const result = await fileExists('mesahomes-property-photos', 'streetview/85140/test.jpg');
    expect(result).toBe(true);
  });

  it('should return false when the object does not exist (NotFound)', async () => {
    const error = new Error('NotFound');
    (error as unknown as { name: string }).name = 'NotFound';
    mockSend.mockRejectedValue(error);

    const result = await fileExists('mesahomes-property-photos', 'streetview/85140/missing.jpg');
    expect(result).toBe(false);
  });

  it('should return false when the object does not exist (404 status)', async () => {
    const error = new Error('Not Found');
    (error as unknown as { name: string; $metadata: { httpStatusCode: number } }).name = 'SomeError';
    (error as unknown as { $metadata: { httpStatusCode: number } }).$metadata = { httpStatusCode: 404 };
    mockSend.mockRejectedValue(error);

    const result = await fileExists('mesahomes-property-photos', 'streetview/85140/missing.jpg');
    expect(result).toBe(false);
  });

  it('should rethrow non-NotFound errors', async () => {
    const error = new Error('AccessDenied');
    (error as unknown as { name: string }).name = 'AccessDenied';
    mockSend.mockRejectedValue(error);

    await expect(
      fileExists('mesahomes-property-photos', 'streetview/85140/test.jpg'),
    ).rejects.toThrow('AccessDenied');
  });
});

describe('getSignedUrl', () => {
  beforeEach(() => {
    vi.mocked(mockAwsGetSignedUrl).mockReset();
    vi.mocked(mockAwsGetSignedUrl).mockResolvedValue('https://presigned-url.example.com/test');
  });

  it('should return a presigned URL', async () => {
    const url = await getSignedUrl('mesahomes-data', 'exports/report.pdf');
    expect(url).toBe('https://presigned-url.example.com/test');
  });

  it('should use default expiration when not specified', async () => {
    await getSignedUrl('mesahomes-data', 'exports/report.pdf');

    expect(mockAwsGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 3600 },
    );
  });

  it('should use custom expiration when provided', async () => {
    await getSignedUrl('mesahomes-data', 'exports/report.pdf', 900);

    expect(mockAwsGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 900 },
    );
  });
});

describe('deleteFile', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it('should send a DeleteObjectCommand with the correct bucket and key', async () => {
    await deleteFile('mesahomes-property-photos', 'streetview/85140/old-photo.jpg');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.Bucket).toBe('mesahomes-property-photos');
    expect(call.input.Key).toBe('streetview/85140/old-photo.jpg');
  });
});

describe('normalizeAddressForKey', () => {
  it('should lowercase and replace spaces with hyphens', () => {
    expect(normalizeAddressForKey('39669 N Luke Ln')).toBe('39669-n-luke-ln');
  });

  it('should remove special characters', () => {
    expect(normalizeAddressForKey('123 Main St. #4')).toBe('123-main-st-4');
  });

  it('should collapse multiple spaces and hyphens', () => {
    expect(normalizeAddressForKey('123   Main   St')).toBe('123-main-st');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(normalizeAddressForKey(' 123 Main St ')).toBe('123-main-st');
  });

  it('should handle empty string', () => {
    expect(normalizeAddressForKey('')).toBe('');
  });

  it('should handle address with commas and periods', () => {
    expect(normalizeAddressForKey('39669 N Luke Ln, San Tan Valley, AZ 85140')).toBe(
      '39669-n-luke-ln-san-tan-valley-az-85140',
    );
  });
});

describe('getStreetViewCacheKey', () => {
  it('should return the correct S3 key pattern', () => {
    const key = getStreetViewCacheKey('85140', '39669 N Luke Ln');
    expect(key).toBe('streetview/85140/39669-n-luke-ln.jpg');
  });

  it('should normalize the address in the key', () => {
    const key = getStreetViewCacheKey('85201', '850 S Drew St.');
    expect(key).toBe('streetview/85201/850-s-drew-st.jpg');
  });
});
