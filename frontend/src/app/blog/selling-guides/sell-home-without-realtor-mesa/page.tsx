import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'Sell a House Without a Realtor in Mesa AZ: Honest 2026 Guide | MesaHomes',
  description:
    'FSBO in Mesa, Arizona — what actually works in 2026. Cash buyer stats, required disclosures, Arizona-specific inspection risks, when FSBO wins and when it bites.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/sell-home-without-realtor-mesa',
  },
  openGraph: {
    title: 'Sell a House Without a Realtor in Mesa AZ: Honest 2026 Guide',
    description:
      'Written by a licensed Arizona Realtor who will tell you honestly when FSBO beats hiring us.',
    url: 'https://mesahomes.com/blog/selling-guides/sell-home-without-realtor-mesa',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Sell a House Without a Realtor in Mesa AZ: Honest 2026 Guide',
  description:
    'FSBO in Mesa, Arizona — what actually works in 2026. Cash buyer stats, required disclosures, Arizona-specific inspection risks, when FSBO wins and when it bites.',
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
    'https://mesahomes.com/blog/selling-guides/sell-home-without-realtor-mesa',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is it legal to sell my Mesa house without a Realtor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, fully legal in Arizona. FSBO (For Sale By Owner) sales are common, especially in the Phoenix metro. You don\'t need a lawyer. Arizona uses title and escrow companies to handle closing paperwork. You do need to complete the Seller Property Disclosure Statement (SPDS) and provide any required disclosures for HOA, lead paint (pre-1978 homes), septic, or solar.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I save money selling FSBO in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You save the listing-agent commission, typically 2.5 to 3 percent of sale price. On a \$448,000 Mesa home that\'s roughly \$11,000 to \$13,500 saved. You still pay the buyer\'s agent (usually 2 to 3 percent) and standard closing costs. The catch: FSBO homes often sell for less than MLS-listed homes because most buyers work through agents who only search MLS. A flat-fee MLS listing (about \$1,400 total) keeps you on MLS while still saving most of the commission.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much of the Mesa market is cash buyers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Roughly 30 to 33 percent of Arizona home sales are cash, one of the highest rates in the country. Mesa and the broader Phoenix metro have strong investor and retiree cash-buyer activity. Cash buyers close faster (often under 21 days) and tend to offer less (typically 5 to 15 percent under MLS-listed comps). FSBO works well with cash buyers because they don\'t require the MLS exposure traditional financed buyers rely on.',
      },
    },
    {
      '@type': 'Question',
      name: 'What disclosures do I need to give a buyer in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Seller Property Disclosure Statement (SPDS) is mandatory — 6+ pages covering roof, HVAC, plumbing, electrical, termites, flood history, settlement, and HOA. Plus: lead-based paint disclosure for pre-1978 homes, HOA Status form if applicable, ADEQ Form 430 for septic systems, solar lease transfer documents, any known insurance claims within the last 5 years. Skip one of these and you risk post-closing litigation. This is where most FSBO deals get into trouble.',
      },
    },
    {
      '@type': 'Question',
      name: 'When should I NOT try FSBO in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Skip FSBO if: your home has major condition issues (AC at end of life, roof over 20 years, stucco cracks, plumbing in older block homes), you live in a rural area with fewer comps, you own a septic or shared-well property with complicated documentation, you have a solar lease that needs transfer paperwork, or you\'re in an HOA with strict rules. In any of these cases, the marketing and paperwork complexity outweighs the commission savings. Consider flat-fee MLS with broker support instead.',
      },
    },
  ],
};

export default function SellHomeWithoutRealtorMesa() {
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
          <span className="text-charcoal">Sell Without a Realtor</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          Sell a House Without a Realtor in Mesa AZ: Honest 2026 Guide
        </h1>

        <p className="mb-6 text-lg text-text-light">
          FSBO (For Sale By Owner) is legal in Arizona, common in the Phoenix
          metro, and saves you real money when it works. It also fails more
          often than most sellers expect. This is an honest breakdown from a
          licensed Arizona Realtor. No sales pitch — when FSBO is the right
          call, we&apos;ll tell you. When it isn&apos;t, we&apos;ll tell you
          that too.
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
