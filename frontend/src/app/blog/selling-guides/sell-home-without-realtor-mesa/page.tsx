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
      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        1. The real commission math for Mesa FSBO
      </h2>
      <p className="my-3">
        Pure FSBO means selling without any agent on either side. The
        savings sound great until you break them down. On a $448,000
        Mesa home (current median):
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Pure FSBO</strong>: $0 listing commission. Buyer is
          unrepresented or uses a transaction-only agent. You save
          roughly $22,000 in total commission but get no MLS exposure.
          Most buyers will never find your listing.
        </li>
        <li>
          <strong>FSBO with buyer agent commission</strong>: You don&apos;t
          pay a listing agent but still offer 2-3% to the buyer&apos;s
          agent to attract buyer traffic. Save about $11,000-13,500.
          You still lack MLS exposure, which is where most agent-driven
          buyers search.
        </li>
        <li>
          <strong>Flat-fee MLS</strong> (our $999 Mesa Listing Service):
          Fully on ARMLS with Zillow/Realtor.com/Redfin syndication.
          You offer buyer agent 2-3% as usual. Total listing cost about
          $1,400. Saves $10,000+ vs traditional listing while keeping
          every ounce of marketing reach.
        </li>
      </ul>
      <p className="my-3">
        Here&apos;s the part most FSBO sellers don&apos;t hear: pure FSBO
        homes in Arizona sell for 5-10% less than MLS-listed comparables,
        on average. On a $448K home that&apos;s $22,000-45,000 less. The
        commission you save often doesn&apos;t close that gap.
      </p>
      <p className="my-3">
        Flat-fee MLS closes the gap because your listing lives in the
        same places buyers look. It&apos;s essentially pure FSBO plus
        the one piece that actually matters for getting full market
        price: being on MLS. See our{' '}
        <Link href="/blog/selling-guides/flat-fee-mls-mesa-az" className="text-primary underline">
          full flat-fee MLS breakdown
        </Link>{' '}
        for the trade-off details.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        2. Where pure FSBO actually works in Mesa
      </h2>
      <p className="my-3">
        Pure FSBO (no agents, no MLS) has specific situations where it
        wins. Be honest about whether you match:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>You already have a buyer</strong>. Family member,
          neighbor, current tenant, coworker. The buyer is already
          committed to your specific house. Agent marketing adds nothing.
          You need contract paperwork and title company coordination,
          not exposure.
        </li>
        <li>
          <strong>You have a cash buyer you trust</strong>. Investor,
          iBuyer, or known cash buyer. They don&apos;t need MLS to
          find you because you found them. About 30-33% of Arizona
          home sales are cash ({' '}
          <a
            href="https://ibuyer.com/blog/how-to-sell-a-house-by-owner-in-arizona/"
            target="_blank"
            rel="noopener"
            className="text-primary underline"
          >
            per iBuyer.com
          </a>
          ), one of the highest rates in the country.
        </li>
        <li>
          <strong>You&apos;re willing to take a 5-10% discount</strong> to
          avoid all commission and skip MLS. Some sellers prioritize
          privacy, speed, or hassle-avoidance over getting top dollar.
          That&apos;s valid. Just be clear-eyed about the trade-off.
        </li>
        <li>
          <strong>Your home is straightforward</strong>. Standard
          subdivision, no HOA complications, no solar lease, newer
          AC/roof, no septic/well, no unusual condition issues. Mesa
          single-family homes built after 2000 in Las Sendas, Leisure
          World, Cadence, or Eastmark often fit this profile when
          well-maintained.
        </li>
      </ul>
      <p className="my-3">
        If two or more of those apply to you, pure FSBO is a reasonable
        path. If none apply, you&apos;re usually better off with flat-fee
        MLS or full-service.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        3. Where FSBO bites Mesa sellers
      </h2>
      <p className="my-3">
        The same iBuyer.com Arizona data that shows FSBO working in
        metro areas also flags where it falls apart. Arizona-specific
        risks that kill FSBO deals:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>AC near end of life</strong>. Arizona AC systems
          run hard. Arizona buyers specifically ask about compressor
          age, refrigerant type, service history. An AC over 12
          years old is a negotiation anchor. FSBO sellers without
          service records lose the argument by default.
        </li>
        <li>
          <strong>Monsoon-era roof wear</strong>. Any shingle roof
          over 15 years old gets scrutinized. Post-monsoon patches
          raise questions. Buyers request credits or new roofs.
          FSBO sellers tend to push back emotionally; agents handle
          it transactionally.
        </li>
        <li>
          <strong>Stucco cracks</strong>. Expansion and contraction
          in desert heat creates cosmetic stucco cracks almost
          universally. Buyers can&apos;t distinguish cosmetic from
          structural. FSBO seller says &quot;it&apos;s nothing&quot;;
          buyer hires an inspector; deal drags.
        </li>
        <li>
          <strong>Solar lease transfer</strong>. If your home has
          leased solar (SunRun, SunPower, Tesla Solar), the lease
          has to transfer to the buyer. Paperwork takes 2-4 weeks
          and buyers routinely back out when they read the monthly
          payment. FSBO sellers almost never price this in.
        </li>
        <li>
          <strong>Septic or shared-well properties</strong>. Outside
          Mesa proper (Queen Creek outskirts, East Mesa rural lots),
          septic inspections and well testing add 30 days to the
          timeline. ADEQ Form 430 required within 6 months of
          closing. First-time FSBO sellers rarely know this.
        </li>
        <li>
          <strong>Appraisal gaps in fast-moving suburbs</strong>.
          Queen Creek, Gilbert, Chandler, and Peoria still see
          appraisal-below-contract-price scenarios in 2026. An
          agent negotiates these; FSBO sellers often walk away from
          the gap, killing the deal.
        </li>
      </ul>
      <p className="my-3">
        Two or more of those apply to your home? Hire someone. Either
        flat-fee MLS for the paperwork support, or full-service agent
        for the full negotiation handling.
      </p>

      {/* Continued in next commit: sections 4-6 + CTA + disclaimer */}
      <p className="my-3 text-sm italic">
        Continued below: the FSBO checklist, Arizona disclosures, and
        what to do next.
      </p>
    </>
  );
}
