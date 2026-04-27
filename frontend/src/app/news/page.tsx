import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import publishedBlogs from '@/data/published-blogs.json';
import { classify, NEWS_CATEGORIES, type PublishedPost } from '@/lib/content-taxonomy';

export const metadata: Metadata = {
  title: 'News — MesaHomes Mesa AZ Real Estate',
  description: 'Daily Mesa, AZ real estate news: city council, zoning, market updates, safety, and Arizona statewide coverage.',
  alternates: { canonical: 'https://mesahomes.com/news' },
};

const ALL_NEWS = (publishedBlogs as PublishedPost[])
  .map(classify)
  .filter((p) => p.contentType === 'news')
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export default function NewsIndex() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-2 text-3xl font-bold text-text">News</h1>
            <p className="mb-6 text-text-light">
              Daily Mesa-area real estate and community news. Looking for guides?{' '}
              <Link href="/blog/" className="text-primary hover:underline">See the Blog section.</Link>
            </p>

            <nav className="mb-8 flex flex-wrap gap-2" aria-label="News categories">
              {NEWS_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/news/${cat.slug}/`}
                  className="rounded-full border border-gray-200 bg-warm-beige px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white"
                >
                  {cat.title}
                </Link>
              ))}
            </nav>

            {ALL_NEWS.length === 0 ? (
              <p className="text-text-light">No news yet. Our daily pipeline publishes fresh posts every morning.</p>
            ) : (
              <div className="space-y-6">
                {ALL_NEWS.map((p) => (
                  <article key={p.slug} className="rounded-xl border border-gray-200 p-5 hover:shadow-md">
                    <Link href={p.url}>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-warm-beige px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-primary">
                          {p.category.title}
                        </span>
                        <time className="text-xs text-text-light">
                          {new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold text-text hover:text-primary">{p.title}</h2>
                      <p className="mt-2 text-sm text-text-light">{p.metaDescription}</p>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
