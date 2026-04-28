import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'How to Sell a House in Mesa AZ: Complete 2026 Guide | MesaHomes',
  description:
    'Step-by-step guide to selling your Mesa, Arizona home in 2026. Pricing, three service tiers, Arizona disclosures, closing costs, realistic timelines.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
  },
  openGraph: {
    title: 'How to Sell a House in Mesa AZ: Complete 2026 Guide',
    description:
      'The full process, the three ways to do it, and the numbers. Written by a licensed Arizona Realtor in Mesa.',
    url: 'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Sell a House in Mesa AZ: Complete 2026 Guide',
  description:
    'Step-by-step guide to selling your Mesa, Arizona home in 2026. Pricing strategy, three service tiers, Arizona disclosures, closing costs, realistic timelines.',
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
    'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does it take to sell a house in Mesa AZ in 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Median days on market in Mesa is about 60 days as of early 2026. Add 30 to 45 days for the escrow period after a signed offer. Most Mesa sales close 90 to 120 days from first listing to closing day.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best month to list a house in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'February through April sees the strongest buyer activity in Mesa. Out-of-state retirees and snowbird buyers are most active in winter and early spring. Summer gets slower as triple-digit temperatures reduce showings. If you can, list in late February or early March.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are typical seller closing costs in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expect 6 to 8 percent of sale price in total seller costs if you use a traditional agent: 5 to 6 percent commission, 1 percent for title / escrow / transfer fees, plus any buyer concessions. With flat-fee MLS the total drops to roughly 3 to 4 percent because you save about 2.5 percent on the listing side.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to make repairs before listing in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fix anything that is broken, leaking, or will fail an inspection. Skip cosmetic upgrades unless they close a clear gap against comparable listings. Mesa buyers in 2026 generally prefer paying less to inheriting someone else\'s renovation choices. Focus on systems (HVAC, plumbing, roof) and safety (GFCI outlets, smoke detectors, stair rails).',
      },
    },
    {
      '@type': 'Question',
      name: 'What disclosures does Arizona require when selling?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Arizona requires the Seller Property Disclosure Statement (SPDS) for any material fact about the property the seller knows. For homes built before 1978, federal lead-based paint disclosure. If the property is in an HOA, the HOA Status form with current assessments. If on septic, Arizona Department of Environmental Quality Form 430 within 6 months of closing. Missing a required disclosure exposes you to post-closing liability.',
      },
    },
  ],
};

export default function HowToSellHouseMesaAz() {
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
          <span className="text-charcoal">How to Sell a House in Mesa AZ</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          How to Sell a House in Mesa AZ: Complete 2026 Guide
        </h1>

        <p className="mb-6 text-lg text-text-light">
          Selling a house in Mesa in 2026 is different than it was two years ago. Rates are still
          elevated, inventory is up, buyers are pickier. You have three real service options and
          a 90 to 120 day timeline from listing to closing. This guide walks through the full
          process, the real numbers, and the tradeoffs most Mesa sellers miss.
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
      {/* Body filled in follow-up commit */}
      <p className="my-3">Article body continues in the next commit.</p>
    </>
  );
}
