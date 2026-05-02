/**
 * Content taxonomy for MesaHomes.
 *
 * Maps AI-draft "topic" field (from content-drafter) to either:
 *   - /blog/... (evergreen, how-to, long-form)
 *   - /news/... (time-sensitive, daily, short-form)
 *
 * Each content type has categories that produce index pages with their own
 * SEO metadata + changeFrequency hints for sitemap.
 */

export type ContentType = 'blog' | 'news';

export interface CategoryConfig {
  slug: string;
  title: string;
  description: string;
  topics: string[]; // matches AI draft `topic` field
  changeFrequency: 'daily' | 'weekly' | 'monthly';
}

export const BLOG_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'market-updates',
    title: 'Market Updates',
    description: 'Mesa and East Valley real estate market analysis, price trends, and forecasts.',
    topics: ['market-update', 'market'],
    changeFrequency: 'weekly',
  },
  {
    slug: 'buying-guides',
    title: 'Buying Guides',
    description: 'Step-by-step guides for buying a home in Mesa, Gilbert, Chandler, and the East Valley.',
    topics: ['buying', 'mortgage-news', 'mortgage'],
    changeFrequency: 'monthly',
  },
  {
    slug: 'selling-guides',
    title: 'Selling Guides',
    description: 'How to sell your home in Arizona: flat-fee MLS, FSBO, pricing, staging, and more.',
    topics: ['selling', 'listing'],
    changeFrequency: 'monthly',
  },
  {
    slug: 'neighborhoods',
    title: 'Neighborhood Guides',
    description: 'Deep dives on Mesa-area neighborhoods: schools, amenities, HOA fees, home prices.',
    topics: ['neighborhood', 'hoa'],
    changeFrequency: 'monthly',
  },
  {
    slug: 'legal-and-regulatory',
    title: 'Legal & Regulatory',
    description: 'Arizona real estate law, HUD/CFPB/ADRE updates, and regulatory changes that affect homebuyers and sellers.',
    topics: ['legal', 'regulatory'],
    changeFrequency: 'monthly',
  },
];

export const NEWS_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'mesa',
    title: 'Mesa News',
    description: 'Daily Mesa, AZ news: city council, zoning, permits, community events.',
    topics: ['mesa-news', 'zoning'],
    changeFrequency: 'daily',
  },
  {
    slug: 'market',
    title: 'Market News',
    description: 'Daily real estate market news for the Phoenix metro and Arizona.',
    topics: ['market-update', 'market', 'mortgage-news'],
    changeFrequency: 'daily',
  },
  {
    slug: 'safety',
    title: 'Safety & Community',
    description: 'Mesa safety updates, weather alerts, and community news.',
    topics: ['crime-safety', 'weather'],
    changeFrequency: 'daily',
  },
  {
    slug: 'arizona',
    title: 'Arizona News',
    description: 'Statewide Arizona news affecting real estate and housing policy.',
    topics: ['az-news'],
    changeFrequency: 'daily',
  },
];

export interface PublishedPost {
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  topic: string;
  publishedAt: string;
  photos?: { url: string; attribution: string; alt: string }[];
  citationSources?: { url: string; attribution: string }[];
}

export interface ClassifiedPost extends PublishedPost {
  contentType: ContentType;
  category: CategoryConfig;
  url: string;
}

/**
 * Classify a post by topic.
 *
 * Rules:
 * 1. If the topic is in a NEWS category AND the post is < 30 days old, it's news.
 * 2. Otherwise it's blog (evergreen).
 * 3. Posts whose topic doesn't match any category fall into blog > "legal-and-regulatory"
 *    as a safe default (catch-all).
 */
export function classify(post: PublishedPost): ClassifiedPost {
  const ageMs = Date.now() - new Date(post.publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const isFresh = ageDays < 30;

  if (isFresh) {
    const newsCat = NEWS_CATEGORIES.find((c) => c.topics.includes(post.topic));
    if (newsCat) {
      return {
        ...post,
        contentType: 'news',
        category: newsCat,
        url: `/news/${newsCat.slug}/${post.slug}`,
      };
    }
  }

  const blogCat =
    BLOG_CATEGORIES.find((c) => c.topics.includes(post.topic)) ??
    BLOG_CATEGORIES.find((c) => c.slug === 'legal-and-regulatory')!;
  return {
    ...post,
    contentType: 'blog',
    category: blogCat,
    url: `/blog/${blogCat.slug}/${post.slug}`,
  };
}

/**
 * Get top-N related posts by shared category.
 * Prefers same-category posts; fills remainder with same contentType.
 */
export function getRelated(target: ClassifiedPost, all: ClassifiedPost[], limit = 3): ClassifiedPost[] {
  const others = all.filter((p) => p.slug !== target.slug);
  const sameCategory = others.filter((p) => p.category.slug === target.category.slug);
  const sameType = others.filter(
    (p) => p.contentType === target.contentType && p.category.slug !== target.category.slug,
  );
  return [...sameCategory, ...sameType].slice(0, limit);
}

/**
 * Find posts mentioning a specific city slug in the body.
 * Used for /areas/{city} "Latest posts" blocks.
 */
export function postsMentioningCity(city: string, all: ClassifiedPost[], limit = 5): ClassifiedPost[] {
  const cityName = city.replace(/-/g, ' ').toLowerCase();
  return all
    .filter((p) => p.bodyMarkdown.toLowerCase().includes(cityName) || p.title.toLowerCase().includes(cityName))
    .slice(0, limit);
}
