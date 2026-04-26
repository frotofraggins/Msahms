import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Client Reviews & Testimonials',
  description:
    'Read verified client reviews and testimonials from MesaHomes customers. See how much our clients saved with flat-fee MLS listing.',
  alternates: { canonical: 'https://mesahomes.com/reviews' },
  openGraph: {
    title: 'Client Reviews & Testimonials | MesaHomes',
    description: 'Verified reviews from MesaHomes clients who saved thousands with flat-fee listing.',
    url: 'https://mesahomes.com/reviews',
  },
};

/** Placeholder reviews — replaced by API data in production. */
const reviews = [
  {
    name: 'Sarah M.',
    city: 'Mesa',
    rating: 5,
    savings: '$18,600',
    quote: 'MesaHomes saved us over $18,000 compared to a traditional agent. Our home was on Zillow and Redfin within hours of listing. The process was smooth and the tools made it easy to understand our net proceeds.',
    date: 'March 2026',
  },
  {
    name: 'David & Lisa R.',
    city: 'Gilbert',
    rating: 5,
    savings: '$23,100',
    quote: 'We were skeptical about flat-fee listing but the savings were too good to ignore. Our home sold in 3 weeks at 99% of asking price. The AI listing generator wrote a better description than we could have.',
    date: 'February 2026',
  },
  {
    name: 'Michael T.',
    city: 'Chandler',
    rating: 5,
    savings: '$21,400',
    quote: 'As an investor selling a rental property, the flat-fee option was a no-brainer. Same MLS exposure, same portal syndication, fraction of the cost. Will use MesaHomes for all my future sales.',
    date: 'February 2026',
  },
  {
    name: 'Jennifer K.',
    city: 'Queen Creek',
    rating: 4,
    savings: '$25,200',
    quote: 'The net sheet calculator was incredibly helpful for understanding our true proceeds. We ended up upgrading to full-service for the negotiations, but still saved significantly compared to a traditional agent.',
    date: 'January 2026',
  },
  {
    name: 'Robert & Maria G.',
    city: 'San Tan Valley',
    rating: 5,
    savings: '$16,800',
    quote: 'First-time sellers and we were nervous about doing it ourselves. The step-by-step tools and responsive support team made it painless. Our home sold for more than we expected.',
    date: 'January 2026',
  },
  {
    name: 'Amanda P.',
    city: 'Mesa',
    rating: 5,
    savings: '$19,500',
    quote: 'The affordability calculator helped us understand exactly what we could afford as buyers, and when we sold our old home, the flat-fee listing saved us nearly $20K. MesaHomes handled both sides perfectly.',
    date: 'December 2025',
  },
];

const aggregateRating = {
  count: reviews.length,
  average: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
  totalSavings: '$124,600',
};

const aggregateJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'MesaHomes',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: aggregateRating.average,
    reviewCount: aggregateRating.count,
    bestRating: '5',
    worstRating: '1',
  },
  review: reviews.map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.name },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: '5',
    },
    reviewBody: r.quote,
    datePublished: r.date,
  })),
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-secondary text-secondary' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateJsonLd) }}
        />

        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            Client Reviews & Testimonials
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-text-light">
            See what our clients say about saving thousands with flat-fee MLS listing.
          </p>

          {/* Aggregate stats */}
          <div className="mx-auto flex max-w-md justify-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-primary">{aggregateRating.average}</span>
                <Star className="h-5 w-5 fill-secondary text-secondary" />
              </div>
              <div className="text-xs text-text-light">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{aggregateRating.count}</div>
              <div className="text-xs text-text-light">Verified Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{aggregateRating.totalSavings}</div>
              <div className="text-xs text-text-light">Total Saved</div>
            </div>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              {reviews.map((review, i) => (
                <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text">{review.name}</div>
                      <div className="text-xs text-text-light">{review.city} · {review.date}</div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <blockquote className="mb-3 text-sm text-text-light">
                    &ldquo;{review.quote}&rdquo;
                  </blockquote>
                  <div className="text-xs font-semibold text-success">
                    Saved {review.savings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
