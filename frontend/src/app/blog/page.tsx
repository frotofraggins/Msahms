import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import publishedBlogs from '@/data/published-blogs.json';

export const metadata: Metadata = {
  title: 'Blog — Mesa Real Estate News & Guides',
  description:
    'Real estate tips, market updates, and guides for buying, selling, and investing in Mesa, Gilbert, Chandler, and Queen Creek, AZ.',
  alternates: { canonical: 'https://mesahomes.com/blog' },
  openGraph: {
    title: 'Blog | MesaHomes',
    description: 'Real estate tips, market updates, and guides for the Mesa, AZ metro area.',
    url: 'https://mesahomes.com/blog',
  },
};

/** Placeholder blog posts — replaced by CMS/API data in production. */
const posts = [
  {
    slug: 'mesa-housing-market-2026',
    title: 'Mesa Housing Market Update — What to Expect in 2026',
    excerpt: 'Median home values, days on market, and inventory trends for Mesa and the East Valley heading into 2026.',
    date: '2026-04-15',
    topic: 'market-update',
  },
  {
    slug: 'flat-fee-vs-traditional-agent-guide',
    title: 'Flat-Fee vs Traditional Agent: The Complete Guide',
    excerpt: 'How flat-fee MLS listing works, what you get, and how much you can save compared to a traditional 5-6% commission.',
    date: '2026-04-10',
    topic: 'selling',
  },
  {
    slug: 'first-time-buyer-arizona-2026',
    title: 'First-Time Home Buyer Guide for Arizona (2026)',
    excerpt: 'Step-by-step process, down payment assistance programs, and what the NAR settlement means for buyers.',
    date: '2026-04-05',
    topic: 'buying',
  },
  {
    slug: 'best-neighborhoods-mesa-az',
    title: 'Best Neighborhoods in Mesa, AZ for Families',
    excerpt: 'From Red Mountain Ranch to Eastmark — a neighborhood-by-neighborhood guide for families moving to Mesa.',
    date: '2026-03-28',
    topic: 'neighborhoods',
  },
  {
    slug: 'arizona-closing-costs-explained',
    title: 'Arizona Closing Costs Explained: Buyer & Seller Guide',
    excerpt: 'What to expect at closing in Arizona — title fees, escrow, recording fees, and how to reduce your costs.',
    date: '2026-03-20',
    topic: 'selling',
  },
  {
    slug: 'investing-in-mesa-rental-properties',
    title: 'Investing in Mesa Rental Properties: 2026 Guide',
    excerpt: 'Rental yields, best ZIP codes for investors, and landlord-tenant law basics for Mesa, AZ.',
    date: '2026-03-15',
    topic: 'investing',
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Merge AI-drafted posts (from DDB) with hardcoded seed posts, newest first. */
const aiPosts = (publishedBlogs as Array<{
  slug: string;
  title: string;
  metaDescription: string;
  topic: string;
  publishedAt: string;
}>).map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.metaDescription,
  date: p.publishedAt.slice(0, 10),
  topic: p.topic,
}));

const allPosts = [...aiPosts, ...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

export default function BlogListPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-2 text-3xl font-bold text-text">Blog</h1>
            <p className="mb-8 text-text-light">
              Real estate tips, market updates, and guides for the Mesa, AZ metro area.
            </p>

            <div className="space-y-6">
              {allPosts.map((post) => (
                <article key={post.slug} className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
                  <Link href={`/blog/${post.slug}`}>
                    <time className="text-xs text-text-light">{formatDate(post.date)}</time>
                    <h2 className="mt-1 text-lg font-semibold text-text hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-text-light">{post.excerpt}</p>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination placeholder */}
            <div className="mt-8 flex justify-center gap-2">
              <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">1</span>
              <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-text-light">2</span>
              <span className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-text-light">3</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
