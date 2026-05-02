import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import publishedBlogs from '@/data/published-blogs.json';
import { classify, BLOG_CATEGORIES, type PublishedPost } from '@/lib/content-taxonomy';

const ALL = (publishedBlogs as PublishedPost[]).map(classify).filter((p) => p.contentType === 'blog');

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = BLOG_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: 'Not Found' };
  return {
    title: `${cat.title} — MesaHomes Blog`,
    description: cat.description,
    alternates: { canonical: `https://mesahomes.com/blog/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = BLOG_CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const inCat = ALL.filter((p) => p.category.slug === cat.slug)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <nav className="mb-4 text-sm text-text-light">
              <Link href="/" className="hover:text-primary">Home</Link>
              {' / '}
              <Link href="/blog/" className="hover:text-primary">Blog</Link>
              {' / '}
              <span className="text-charcoal">{cat.title}</span>
            </nav>
            <h1 className="mb-2 text-3xl font-bold text-text">{cat.title}</h1>
            <p className="mb-8 text-text-light">{cat.description}</p>
            {inCat.length === 0 ? (
              <p className="text-text-light">No posts yet. Check back soon.</p>
            ) : (
              <div className="space-y-6">
                {inCat.map((p) => (
                  <article key={p.slug} className="rounded-xl border border-gray-200 p-5 hover:shadow-md">
                    <Link href={p.url}>
                      <time className="text-xs text-text-light">
                        {new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                      <h2 className="mt-1 text-lg font-semibold text-text hover:text-primary">{p.title}</h2>
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
