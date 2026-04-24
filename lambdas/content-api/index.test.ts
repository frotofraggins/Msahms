import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetItem = vi.fn();
const mockQueryGSI1 = vi.fn();

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  queryGSI1: (...args: unknown[]) => mockQueryGSI1(...args),
}));

const { handler } = await import('./index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  path: string,
  method = 'GET',
  pathParameters?: Record<string, string>,
  queryStringParameters?: Record<string, string>,
) {
  return {
    httpMethod: method,
    path,
    body: null,
    headers: {},
    pathParameters: pathParameters ?? null,
    queryStringParameters: queryStringParameters ?? null,
    requestContext: { requestId: 'test-correlation-id' },
  };
}

// ---------------------------------------------------------------------------
// OPTIONS preflight
// ---------------------------------------------------------------------------

describe('handler — OPTIONS', () => {
  it('should handle OPTIONS preflight', async () => {
    const event = makeEvent('/api/v1/content/blog', 'OPTIONS');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/content/city/{slug}
// ---------------------------------------------------------------------------

describe('handler — GET /api/v1/content/city/{slug}', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return 200 with city page data', async () => {
    const cityData = {
      slug: 'mesa',
      cityName: 'Mesa',
      state: 'AZ',
      medianPrice: 430000,
      daysOnMarket: 58,
      saleToListRatio: 0.9782,
      inventory: 1200,
      populationGrowth: 2.5,
      propertyTaxRate: 0.68,
      updatedAt: '2026-03-17T00:00:00Z',
    };

    mockGetItem.mockResolvedValue({ data: cityData });

    const event = makeEvent('/api/v1/content/city/mesa');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.cityName).toBe('Mesa');
    expect(body.medianPrice).toBe(430000);
  });

  it('should support pathParameters for slug extraction', async () => {
    mockGetItem.mockResolvedValue({ data: { slug: 'gilbert' } });

    const event = makeEvent('/api/v1/content/city/gilbert', 'GET', { slug: 'gilbert' });
    await handler(event);

    expect(mockGetItem).toHaveBeenCalledWith('CONTENT#CITY#gilbert', 'CONTENT#CITY#gilbert');
  });

  it('should return 404 when city page not found', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/content/city/nonexistent');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/content/blog
// ---------------------------------------------------------------------------

describe('handler — GET /api/v1/content/blog', () => {
  beforeEach(() => mockQueryGSI1.mockReset());

  it('should return 200 with published blog posts', async () => {
    mockQueryGSI1.mockResolvedValue({
      items: [
        {
          data: {
            slug: 'mesa-market-update',
            title: 'Mesa Market Update',
            status: 'published',
            publishDate: '2026-03-15',
          },
        },
        {
          data: {
            slug: 'draft-post',
            title: 'Draft Post',
            status: 'draft',
            publishDate: '2026-03-10',
          },
        },
        {
          data: {
            slug: 'gilbert-guide',
            title: 'Gilbert Guide',
            status: 'published',
            publishDate: '2026-03-01',
          },
        },
      ],
    });

    const event = makeEvent('/api/v1/content/blog');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.posts).toHaveLength(2); // Only published
    expect(body.count).toBe(2);
    expect(body.posts[0].slug).toBe('mesa-market-update');
  });

  it('should return empty list when no posts exist', async () => {
    mockQueryGSI1.mockResolvedValue({ items: [] });

    const event = makeEvent('/api/v1/content/blog');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.posts).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  it('should query GSI1 with correct parameters', async () => {
    mockQueryGSI1.mockResolvedValue({ items: [] });

    const event = makeEvent('/api/v1/content/blog');
    await handler(event);

    expect(mockQueryGSI1).toHaveBeenCalledWith('CONTENT#BLOG', expect.objectContaining({
      scanForward: false,
    }));
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/content/blog/{slug}
// ---------------------------------------------------------------------------

describe('handler — GET /api/v1/content/blog/{slug}', () => {
  beforeEach(() => mockGetItem.mockReset());

  it('should return 200 with blog post data', async () => {
    const postData = {
      slug: 'mesa-market-update',
      title: 'Mesa Market Update March 2026',
      body: '# Mesa Market Update\n\nThe Mesa housing market...',
      author: 'MesaHomes Team',
      publishDate: '2026-03-15',
      category: 'Market Update',
      city: 'Mesa',
      zips: ['85201', '85202'],
      metaDescription: 'Latest Mesa housing market data and trends.',
      tags: ['mesa', 'market-update'],
      status: 'published',
    };

    mockGetItem.mockResolvedValue({ data: postData });

    const event = makeEvent('/api/v1/content/blog/mesa-market-update');
    const result = await handler(event);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.title).toBe('Mesa Market Update March 2026');
    expect(body.status).toBe('published');
  });

  it('should return 404 when blog post not found', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const event = makeEvent('/api/v1/content/blog/nonexistent-post');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should use correct DynamoDB keys', async () => {
    mockGetItem.mockResolvedValue({ data: { slug: 'test' } });

    const event = makeEvent('/api/v1/content/blog/test-post');
    await handler(event);

    expect(mockGetItem).toHaveBeenCalledWith(
      'CONTENT#BLOG#test-post',
      'CONTENT#BLOG#test-post',
    );
  });
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

describe('handler — misc', () => {
  it('should return 404 for unknown path', async () => {
    const event = makeEvent('/api/v1/content/unknown');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for non-GET method', async () => {
    const event = makeEvent('/api/v1/content/blog', 'POST');
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});
