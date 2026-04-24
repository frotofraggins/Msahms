import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockFileExists = vi.fn();
const mockUploadFile = vi.fn();
const mockGetSignedUrl = vi.fn();

vi.mock('../../lib/s3.js', () => ({
  fileExists: (...args: unknown[]) => mockFileExists(...args),
  uploadFile: (...args: unknown[]) => mockUploadFile(...args),
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
  PHOTOS_BUCKET: 'mesahomes-property-photos',
  normalizeAddressForKey: (address: string) =>
    address
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
  getStreetViewCacheKey: (zip: string, address: string) => {
    const normalized = address
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `streetview/${zip}/${normalized}.jpg`;
  },
}));

const mockGetSecret = vi.fn();

vi.mock('../../lib/secrets.js', () => ({
  getSecret: (...args: unknown[]) => mockGetSecret(...args),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks
const {
  getPropertyPhoto,
  checkStreetViewMetadata,
  fetchStreetViewImage,
} = await import('./street-view.js');

// ---------------------------------------------------------------------------
// checkStreetViewMetadata
// ---------------------------------------------------------------------------

describe('checkStreetViewMetadata', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return OK status when photo is available', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'OK', date: '2023-06' }),
    });

    const result = await checkStreetViewMetadata('39669 N Luke Ln, 85140', 'test-api-key');

    expect(result.status).toBe('OK');
    expect(result.date).toBe('2023-06');

    // Verify the URL includes the correct parameters
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('maps.googleapis.com/maps/api/streetview/metadata');
    expect(url).toContain('location=');
    expect(url).toContain('key=test-api-key');
  });

  it('should return ZERO_RESULTS when no photo is available', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ZERO_RESULTS' }),
    });

    const result = await checkStreetViewMetadata('123 Unknown Rd', 'test-api-key');

    expect(result.status).toBe('ZERO_RESULTS');
    expect(result.date).toBeUndefined();
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    await expect(
      checkStreetViewMetadata('test', 'bad-key'),
    ).rejects.toThrow('Street View metadata request failed: HTTP 403');
  });
});

// ---------------------------------------------------------------------------
// fetchStreetViewImage
// ---------------------------------------------------------------------------

describe('fetchStreetViewImage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return image data as Buffer', async () => {
    const imageData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer;
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageData),
    });

    const result = await fetchStreetViewImage('39669 N Luke Ln, 85140', 'test-api-key');

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(4);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('maps.googleapis.com/maps/api/streetview');
    expect(url).toContain('size=600x400');
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(
      fetchStreetViewImage('test', 'bad-key'),
    ).rejects.toThrow('Street View image request failed: HTTP 500');
  });
});

// ---------------------------------------------------------------------------
// getPropertyPhoto
// ---------------------------------------------------------------------------

describe('getPropertyPhoto', () => {
  beforeEach(() => {
    mockFileExists.mockReset();
    mockUploadFile.mockReset();
    mockGetSignedUrl.mockReset();
    mockGetSecret.mockReset();
    mockFetch.mockReset();
  });

  it('should return cached photo from S3 when available', async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetSignedUrl.mockResolvedValue('https://s3.example.com/cached-photo.jpg');

    const result = await getPropertyPhoto('39669 N Luke Ln', '85140');

    expect(result.source).toBe('streetview');
    expect(result.url).toBe('https://s3.example.com/cached-photo.jpg');

    // Should not call Google API or secrets
    expect(mockGetSecret).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch and cache photo when S3 cache misses and photo exists', async () => {
    mockFileExists.mockResolvedValue(false);
    mockGetSecret.mockResolvedValue('test-api-key');

    // First fetch: metadata check
    const metadataResponse = {
      ok: true,
      json: () => Promise.resolve({ status: 'OK', date: '2023-06' }),
    };

    // Second fetch: image fetch
    const imageData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer;
    const imageResponse = {
      ok: true,
      arrayBuffer: () => Promise.resolve(imageData),
    };

    mockFetch
      .mockResolvedValueOnce(metadataResponse)
      .mockResolvedValueOnce(imageResponse);

    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue('https://s3.example.com/new-photo.jpg');

    const result = await getPropertyPhoto('39669 N Luke Ln', '85140');

    expect(result.source).toBe('streetview');
    expect(result.url).toBe('https://s3.example.com/new-photo.jpg');

    // Verify S3 upload was called
    expect(mockUploadFile).toHaveBeenCalledWith(
      'mesahomes-property-photos',
      'streetview/85140/39669-n-luke-ln.jpg',
      expect.any(Buffer),
      'image/jpeg',
    );
  });

  it('should return placeholder when no Street View photo exists', async () => {
    mockFileExists.mockResolvedValue(false);
    mockGetSecret.mockResolvedValue('test-api-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ZERO_RESULTS' }),
    });

    const result = await getPropertyPhoto('123 Unknown Rd', '85140');

    expect(result.source).toBe('placeholder');
    expect(result.url).toBe('https://mesahomes.com/images/property-placeholder.jpg');

    // Should not attempt to fetch image or upload
    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it('should check the correct S3 cache key', async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetSignedUrl.mockResolvedValue('https://s3.example.com/photo.jpg');

    await getPropertyPhoto('850 S Drew St', '85210');

    expect(mockFileExists).toHaveBeenCalledWith(
      'mesahomes-property-photos',
      'streetview/85210/850-s-drew-st.jpg',
    );
  });
});
