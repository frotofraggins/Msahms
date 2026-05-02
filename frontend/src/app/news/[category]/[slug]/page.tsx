import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { BlogLeadCapture } from '../../../blog/[slug]/BlogPostClient';
import publishedBlogs from '@/data/published-blogs.json';
import { classify, getRelated, NEWS_CATEGORIES, type PublishedPost } from '@/lib/content-taxonomy';

const ALL_CLASSIFIED = (publishedBlogs as PublishedPost[]).map(classify);

export function generateStaticParams() {
  const params = ALL_CLASSIFIED
    .filter((p) => p.contentType === 'news')
    .map((p) => ({ category: p.category.slug, slug: p.slug }));
  // Next.js static export requires at least one param for dynamic routes.
  // If no news posts yet, emit a placeholder that notFound()'s at runtime.
  if (params.length === 0) return [{ category: 'mesa', slug: '_' }];
  return params;
}

export async function generateMetadata({
  params,
}: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const post = ALL_CLASSIFIED.find(
    (p) => p.contentType === 'news' && p.category.slug === category && p.slug === slug,
  );
  if (!post) return { title: 'Not Found' };
  return {
    title: `${post.title} | MesaHomes News`,
    description: post.metaDescription,
    alternates: { canonical: `https://mesahomes.com${post.url}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://mesahomes.com${post.url}`,
      images: post.photos?.slice(0, 1).map((ph) => ph.url) ?? [],
      type: 'article',
    },
  };
}

export default async function NewsPost({
  params,
}: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const post = ALL_CLASSIFIED.find(
    (p) => p.contentType === 'news' && p.category.slug === category && p.slug === slug,
  );
  if (!post) notFound();

  const related = getRelated(post, ALL_CLASSIFIED);

  const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    ...(post.photos && post.photos.length > 0 && { image: post.photos.map((p) => p.url) }),
    author: { '@type': 'Organization', name: 'MesaHomes', url: 'https://mesahomes.com' },
    publisher: {
      '@type': 'Organization',
      name: 'MesaHomes',
      url: 'https://mesahomes.com',
      logo: { '@type': 'ImageObject', url: 'https://mesahomes.com/brand/mesahomes-logo-primary.png' },
    },
    mainEntityOfPage: `https://mesahomes.com${post.url}`,
    articleSection: post.category.title,
  };

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }} />
        <article className="bg-paper px-4 py-16">
          <div className="mx-auto" style={{ maxWidth: '65ch' }}>
            <nav className="mb-4 text-sm text-text-light">
              <Link href="/" className="hover:text-primary">Home</Link>
              {' / '}
              <Link href="/news/" className="hover:text-primary">News</Link>
              {' / '}
              <Link href={`/news/${post.category.slug}/`} className="hover:text-primary">
                {post.category.title}
              </Link>
            </nav>
            <time className="text-sm text-text-light">
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
              {post.title}
            </h1>

            {post.photos && post.photos.length > 0 && (
              <figure className="mb-8 -mx-4 sm:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.photos[0].url}
                  alt={post.photos[0].alt}
                  className="w-full rounded-lg object-cover"
                  style={{ maxHeight: '480px' }}
                />
                <figcaption className="mt-2 px-4 text-xs text-text-light sm:px-0">
                  {post.photos[0].attribution}
                </figcaption>
              </figure>
            )}

            <div className="prose prose-sm max-w-none text-text-light">
              {post.bodyMarkdown.split('\n\n').map((paragraph, i) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={i} className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                return <p key={i} className="my-3">{paragraph}</p>;
              })}
            </div>

            {post.citationSources && post.citationSources.length > 0 && (
              <div className="mt-8 rounded-lg border border-warm-border bg-warm-beige/30 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-light">Sources</h3>
                <ul className="space-y-1 text-xs text-text-light">
                  {post.citationSources.slice(0, 10).map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noopener" className="text-primary hover:underline">
                        {c.attribution}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {related.length > 0 && (
              <aside className="mt-12 border-t border-warm-border pt-8">
                <h3 className="mb-4 font-heading text-lg font-bold text-charcoal">Related Stories</h3>
                <ul className="space-y-3">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={r.url} className="text-primary hover:underline">
                        {r.title}
                      </Link>
                      <p className="mt-1 text-xs text-text-light">{r.metaDescription}</p>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <BlogLeadCapture topic={post.topic} />
          </div>
        </article>
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
