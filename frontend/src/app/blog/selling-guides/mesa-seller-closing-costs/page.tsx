import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026 | MesaHomes',
  description:
    'Line-by-line breakdown of seller closing costs in Mesa, Arizona. Commission, title, escrow, transfer fees, HOA, prorations. Real dollar amounts on a \$448K home.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
  },
  openGraph: {
    title: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026',
    description:
      'Every fee a Mesa home seller pays. Specific dollar amounts, not percentages.',
    url: 'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026',
  description:
    'Line-by-line breakdown of seller closing costs in Mesa, Arizona. Commission, title, escrow, transfer fees, HOA, prorations. Real dollar amounts on a \$448K home.',
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
    'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost to sell a \$400,000 home in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With a traditional agent, expect \$26,000 to \$32,000 in total seller costs: roughly \$20,000 to \$24,000 in agent commissions, \$4,000 to \$6,000 in title/escrow/transfer fees, plus prorated taxes and HOA. With flat-fee MLS, total costs drop to \$13,000 to \$16,000 — the savings come from paying \$999 flat instead of \$10,000+ listing commission.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the seller pay the buyer agent commission in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After the August 2024 NAR settlement, no — not automatically. The seller can offer any amount to the buyer agent, including zero. Most Mesa sellers still offer 2 to 3 percent because that is what buyer agents expect to see. Offering less is legal but reduces showings from agent-represented buyers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are typical title and escrow fees in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On a \$448,000 Mesa sale: owner title policy \$1,200-1,800, escrow fee \$600-900, document prep \$150-250, recording \$30-50, notary \$20. Title and escrow are negotiable between buyer and seller; Arizona custom is the seller pays the owner policy and splits escrow.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a real estate transfer tax in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Arizona does not impose a state or county real estate transfer tax. This is one of the reasons Arizona total closing costs run lower than states like California, Washington, or New York. You may still see a small \$2-5 recording fee per document, but no percentage-based transfer tax.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who pays the HOA transfer fee in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Varies by HOA. Most Mesa HOAs charge a transfer/capital contribution fee of \$200-500 at closing. The purchase contract specifies who pays (seller, buyer, or split). Read your listing agreement. Newer master-planned communities (Eastmark, Cadence, Union Park) tend to have higher transfer fees (\$500-1,500) than older Mesa subdivisions.',
      },
    },
  ],
};

export default function MesaSellerClosingCosts() {
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
          <span className="text-charcoal">Mesa Seller Closing Costs</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          Mesa AZ Seller Closing Costs: Real Numbers for 2026
        </h1>

        <p className="mb-6 text-lg text-text-light">
          Every Mesa seller asks the same question: what do I actually walk
          away with? This guide breaks down every line item that hits your
          closing statement, with real dollar amounts on a $448,000 home
          (current median). No percentages that don&apos;t translate to
          your situation. No vague ranges.
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
      <p className="my-3">Sections fill in next commit.</p>
    </>
  );
}
