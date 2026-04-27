import type { MetadataRoute } from 'next';
import publishedBlogs from '@/data/published-blogs.json';

export const dynamic = 'force-static';

const BASE_URL = 'https://mesahomes.com';

const citySlugs = [
  'mesa',
  'gilbert',
  'chandler',
  'queen-creek',
  'san-tan-valley',
  'apache-junction',
];

/** Placeholder published blog slugs — in production, fetch from CMS/API. */
const publishedBlogSlugs = [
  'mesa-housing-market-2026',
  'flat-fee-vs-traditional-agent-guide',
  'first-time-buyer-arizona-2026',
  'best-neighborhoods-mesa-az',
  'arizona-closing-costs-explained',
  'investing-in-mesa-rental-properties',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/sell`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/buy`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/rent`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/invest`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/reviews`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/buy/first-time-buyer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/buy/offer-guidance`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = [
    'net-sheet',
    'affordability',
    'home-value',
    'listing-generator',
    'sell-now-or-wait',
    'offer-writer',
  ].map((tool) => ({
    url: `${BASE_URL}/tools/${tool}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Compare pages
  const comparePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/compare/flat-fee-vs-traditional-agent`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // City pages
  const cityPages: MetadataRoute.Sitemap = citySlugs.map((slug) => ({
    url: `${BASE_URL}/areas/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Blog posts — union of hardcoded seeds + AI-drafted published posts from DDB
  const aiSlugs = (publishedBlogs as Array<{ slug: string; publishedAt: string }>).map((p) => ({
    slug: p.slug,
    date: new Date(p.publishedAt),
  }));
  const hardcodedSlugs = publishedBlogSlugs.map((slug) => ({ slug, date: now }));
  const blogMap = new Map<string, Date>();
  for (const b of [...hardcodedSlugs, ...aiSlugs]) blogMap.set(b.slug, b.date);

  const blogPages: MetadataRoute.Sitemap = Array.from(blogMap.entries()).map(([slug, date]) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: date,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...toolPages, ...comparePages, ...cityPages, ...blogPages];
}
