import type { MetadataRoute } from 'next';
import publishedBlogs from '@/data/published-blogs.json';
import { classify, BLOG_CATEGORIES, NEWS_CATEGORIES, type PublishedPost } from '@/lib/content-taxonomy';

export const dynamic = 'force-static';

const BASE_URL = 'https://mesahomes.com';

const citySlugs = ['mesa', 'gilbert', 'chandler', 'queen-creek', 'san-tan-valley', 'apache-junction'];

/** Hardcoded legacy blog slugs (no category in URL, still shipping). */
const legacyBlogSlugs = [
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
    { url: `${BASE_URL}/buy/first-time-buyer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/buy/offer-guidance`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Tools (slow-changing utilities)
  const toolPages: MetadataRoute.Sitemap = [
    'net-sheet', 'affordability', 'home-value', 'listing-generator', 'sell-now-or-wait', 'offer-writer',
  ].map((tool) => ({
    url: `${BASE_URL}/tools/${tool}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Comparison pages
  const comparePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/compare/flat-fee-vs-traditional-agent`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Area pages (weekly because market data updates)
  const cityPages: MetadataRoute.Sitemap = citySlugs.map((slug) => ({
    url: `${BASE_URL}/areas/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // --- Blog ---
  const classified = (publishedBlogs as PublishedPost[]).map(classify);
  const aiBlog = classified.filter((p) => p.contentType === 'blog');
  const aiNews = classified.filter((p) => p.contentType === 'news');

  // Blog index + category indexes
  const blogIndexes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...BLOG_CATEGORIES.map((c) => ({
      url: `${BASE_URL}/blog/${c.slug}`,
      lastModified: now,
      changeFrequency: c.changeFrequency,
      priority: 0.7,
    })),
  ];

  // Legacy hardcoded blog posts
  const legacyPosts: MetadataRoute.Sitemap = legacyBlogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // AI-drafted blog posts (evergreen — monthly)
  const aiBlogPages: MetadataRoute.Sitemap = aiBlog.map((p) => ({
    url: `${BASE_URL}${p.url}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // --- News ---
  const newsIndexes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...NEWS_CATEGORIES.map((c) => ({
      url: `${BASE_URL}/news/${c.slug}`,
      lastModified: now,
      changeFrequency: c.changeFrequency,
      priority: 0.7,
    })),
  ];

  // AI-drafted news posts (time-sensitive — daily changefreq, decays to weekly after 7 days)
  const aiNewsPages: MetadataRoute.Sitemap = aiNews.map((p) => {
    const ageDays = (Date.now() - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    return {
      url: `${BASE_URL}${p.url}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: (ageDays < 7 ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: 0.7,
    };
  });

  return [
    ...staticPages,
    ...toolPages,
    ...comparePages,
    ...cityPages,
    ...blogIndexes,
    ...legacyPosts,
    ...aiBlogPages,
    ...newsIndexes,
    ...aiNewsPages,
  ];
}
