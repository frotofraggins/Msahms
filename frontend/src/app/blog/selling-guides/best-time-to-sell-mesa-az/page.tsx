import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'Best Time to Sell a House in Mesa AZ: 2026 Market Reality | MesaHomes',
  description:
    'Forget "list in May." In the 2026 Mesa market, pricing-to-market beats seasonality by 74 days. Real ARMLS data + an honest seasonal breakdown.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/best-time-to-sell-mesa-az',
  },
  openGraph: {
    title: 'Best Time to Sell a House in Mesa AZ: 2026 Market Reality',
    description:
      'What the data actually says about when to list a Mesa home in 2026.',
    url: 'https://mesahomes.com/blog/selling-guides/best-time-to-sell-mesa-az',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best Time to Sell a House in Mesa AZ: 2026 Market Reality',
  description:
    'Forget "list in May." In the 2026 Mesa market, pricing-to-market beats seasonality by 74 days. Real ARMLS data + an honest seasonal breakdown.',
  datePublished: '2026-04-28',
  dateModified: '2026-04-28',
  author: { '@type': 'Organization', name: 'MesaHomes', url: 'https://mesahomes.com' },
  publisher: {
    '@type': 'Organization',
    name: 'MesaHomes',
    url: 'https://mesahomes.com',
    logo: { '@type': 'ImageObject', url: 'https://mesahomes.com/brand/mesahomes-logo-primary.png' },
  },
  articleSection: 'Selling Guides',
  mainEntityOfPage:
    'https://mesahomes.com/blog/selling-guides/best-time-to-sell-mesa-az',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best month to sell a house in Mesa Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Historically February through May, with May producing the strongest sale-price premiums and September seeing the highest list prices. But in the 2026 market, pricing strategy matters more than month. ARMLS data shows homes priced correctly sell in a median 32 days regardless of month; homes priced for "neighbor sold in 2023" prices sit 106 days on average. The 74-day gap dwarfs any seasonal advantage.',
      },
    },
    {
      '@type': 'Question',
      name: 'What month gets the highest sale price in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Historically May commands the highest sale-to-list ratios in Phoenix metro due to peak spring buyer activity. September sees the highest list prices from sellers. In 2026, however, Phoenix metro median listing price has dropped 6% year-over-year, and nearly 30% of all active listings have at least one price cut. "Peak price month" matters less in a buyer\'s market.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is April a good time to list a home in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. April sits in the strong February-May window: mild Mesa weather, snowbirds still in town, out-of-state relocators looking before summer school transitions. 2026 specifics: metro Phoenix sold 88 homes in a recent Maricopa ARMLS reporting window vs 137 last year, so volume is down 36%. Price-correct homes still move in roughly 32 days. Overpriced homes sit 106 days.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should I wait to sell my Mesa home?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depends on your specific situation. Rates at 6.39% are compressing the buyer pool and show no near-term signs of dropping per the Federal Reserve. Waiting for rates to drop has cost sellers more than it has saved over the last 18 months. If you need to sell within 12-24 months, the answer is generally now rather than later — with a price set to current market, not prior-peak comps.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the day of the week I list on MLS matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, though less than pricing. Thursday evening listings typically get the most weekend visibility because buyer alerts push the listing into inboxes before Saturday and Sunday tours. Mondays and Tuesdays are the worst listing days because activity peaks over the weekend — listing Monday means your home is "old" by the time buyers look seriously.',
      },
    },
  ],
};

export default function BestTimeToSellMesaAz() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <ArticleBody />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}

function ArticleBody() {
  return (
    <article className="bg-paper px-4 py-16">
      <div className="mx-auto" style={{ maxWidth: '65ch' }}>
        <nav className="mb-4 text-sm text-text-light">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          {' / '}
          <Link href="/blog/selling-guides" className="hover:text-primary">Selling Guides</Link>
          {' / '}
          <span className="text-charcoal">Best Time to Sell</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          Best Time to Sell a House in Mesa AZ: 2026 Market Reality
        </h1>

        <p className="mb-6 text-lg text-text-light">
          Every generic real estate article says list in May. In 2026, that
          advice is incomplete. ARMLS data from April 2026 shows correctly-
          priced Mesa homes sell in 32 days while overpriced homes sit 106
          days. That 74-day gap is bigger than any seasonal premium. The
          right month still matters, but the right number matters more.
        </p>

        <div className="prose prose-sm max-w-none text-text-light">
          <ArticleSections />
        </div>
      </div>
    </article>
  );
}

function ArticleSections() {
  return (
    <>
      <p className="my-3">Body continues in next commit.</p>
    </>
  );
}
