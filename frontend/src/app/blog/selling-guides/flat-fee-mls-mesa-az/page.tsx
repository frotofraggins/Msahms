import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'Flat Fee MLS Mesa AZ: What $999 Actually Gets You | MesaHomes',
  description:
    'Honest breakdown of flat-fee MLS listings in Mesa, Arizona. What the $999 covers, what it doesn\'t, how the $400 broker fee at closing works, and when it beats a traditional agent.',
  alternates: { canonical: 'https://mesahomes.com/blog/selling-guides/flat-fee-mls-mesa-az' },
  openGraph: {
    title: 'Flat Fee MLS Mesa AZ: What $999 Actually Gets You',
    description:
      'The real math on flat-fee MLS in Mesa, AZ. No upsells, no fluff.',
    url: 'https://mesahomes.com/blog/selling-guides/flat-fee-mls-mesa-az',
    type: 'article',
  },
};

export default function FlatFeeMlsMesaAz() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Flat Fee MLS Mesa AZ: What $999 Actually Gets You',
    description:
      'Honest breakdown of flat-fee MLS listings in Mesa, Arizona. What the $999 covers, the $400 broker fee at closing, and when it beats a traditional agent.',
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
    mainEntityOfPage: 'https://mesahomes.com/blog/selling-guides/flat-fee-mls-mesa-az',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is flat-fee MLS legal in Arizona?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Arizona law (ARS § 32-2155) only requires that a licensed Arizona real estate broker hold your listing. Flat-fee companies satisfy that by having a broker of record on staff. The broker lists your home on ARMLS for a flat fee instead of a commission percentage.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will my home still show up on Zillow and Realtor.com?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. ARMLS (Arizona Regional MLS) syndicates every listing to Zillow, Realtor.com, Redfin, Trulia, Homes.com, and around 100 other sites automatically. There is no difference in exposure between a flat-fee listing and a traditional agent listing at the portal level.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does the $400 broker fee at closing cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The $400 covers the broker-of-record service: paperwork review, escrow coordination, required state and federal disclosures, and the legal responsibility for your listing. It is paid from proceeds at closing, so you only owe it if the sale actually closes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I still have to pay the buyer\'s agent commission?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This depends on your offer. After the 2024 NAR settlement, you are not required to offer a buyer\'s agent commission. Most Mesa sellers still offer 2 to 3 percent because the majority of buyers are represented by an agent. You set the number. Offering less reduces your cost but can slow showings.',
        },
      },
      {
        '@type': 'Question',
        name: 'How fast can a flat-fee listing go live on MLS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Typically 24 to 48 hours after you sign the listing agreement, upload photos, and complete the property details. Syndication to Zillow and Realtor.com follows within another 24 hours. Start to full market exposure is about 2 to 3 business days.',
        },
      },
    ],
  };

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <article className="bg-paper px-4 py-16">
          <div className="mx-auto" style={{ maxWidth: '65ch' }}>
            {/* Breadcrumb */}
            <nav className="mb-4 text-sm text-text-light">
              <Link href="/" className="hover:text-primary">Home</Link>
              {' / '}
              <Link href="/blog" className="hover:text-primary">Blog</Link>
              {' / '}
              <Link href="/blog/selling-guides" className="hover:text-primary">Selling Guides</Link>
              {' / '}
              <span className="text-charcoal">Flat Fee MLS Mesa AZ</span>
            </nav>

            <time className="text-sm text-text-light">April 28, 2026</time>
            <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
              Flat Fee MLS Mesa AZ: What $999 Actually Gets You
            </h1>

            <p className="mb-6 text-lg text-text-light">
              If you&apos;re selling a house in Mesa, you have three real options. A traditional agent at
              5 to 6 percent commission. For-sale-by-owner with zero MLS exposure. Or a flat-fee
              MLS listing that puts your home on Zillow, Realtor.com, and Redfin for under $1,500 total.
              Here&apos;s what the flat-fee path actually costs, what it covers, and when it beats the
              other two.
            </p>

            <div className="prose prose-sm max-w-none text-text-light">
              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                The actual numbers for a Mesa flat-fee listing
              </h2>
              <p className="my-3">
                At MesaHomes, a flat-fee MLS listing is $999 up front plus $400 at closing. Total: $1,399
                if the house sells. On a typical Mesa sale at the current median of about $448,000, that&apos;s
                roughly 0.31 percent of the sale price. A traditional listing agent takes 2.5 to 3 percent
                on the same sale. That&apos;s the difference between paying about $1,400 and paying roughly
                $11,000 to $13,500 just for the listing side.
              </p>
              <p className="my-3">
                You still pay the buyer&apos;s agent their commission separately. Most Mesa sellers offer
                2 to 3 percent. So your real all-in seller cost with flat-fee looks like this:
              </p>
              <ul className="my-3 list-disc space-y-1 pl-6">
                <li>$999 up-front listing fee</li>
                <li>$400 broker fee at closing</li>
                <li>2 to 3 percent buyer-agent commission (if offered)</li>
                <li>Standard Arizona closing costs (escrow, title, transfer tax)</li>
              </ul>
              <p className="my-3">
                Compare that to traditional: 5 to 6 percent total commission split between listing
                and buyer agents, same closing costs. On a $448,000 home, flat-fee saves roughly
                $9,000 to $11,000.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                What the $999 covers
              </h2>
              <p className="my-3">
                The core job of any listing agent is to put your property on ARMLS, the Arizona
                Regional Multiple Listing Service. Once it&apos;s on ARMLS, it syndicates automatically
                to about 100 sites including Zillow, Realtor.com, Redfin, Trulia, and Homes.com.
                That syndication is what generates showings. The $999 buys you:
              </p>
              <ul className="my-3 list-disc space-y-1 pl-6">
                <li>Full ARMLS listing active for 6 months (renewable)</li>
                <li>Automatic syndication to Zillow, Realtor.com, Redfin, Trulia, Homes.com, and 100+ other portals</li>
                <li>Up to 25 photos on the listing</li>
                <li>A Supra lockbox so licensed agents can show your home</li>
                <li>Yard sign with our phone number</li>
                <li>Licensed broker-of-record handling the listing paperwork and compliance</li>
              </ul>
              <p className="my-3">
                That last point matters. Arizona law requires a licensed broker on every listing.
                Companies that offer flat-fee MLS satisfy that by having a broker on staff who
                legally represents you for the purpose of the ARMLS listing. You are hiring them
                as your broker, just with a flat fee instead of a percentage.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                What the $400 broker fee at closing covers
              </h2>
              <p className="my-3">
                The $400 at closing is separate from the up-front $999 because of how the math
                works for everyone. You don&apos;t owe it unless the house actually closes. It covers
                the work that only happens around the closing itself:
              </p>
              <ul className="my-3 list-disc space-y-1 pl-6">
                <li>Reviewing the purchase contract before you sign</li>
                <li>Coordinating with escrow, title, and the buyer&apos;s agent</li>
                <li>Required state disclosures (SPDS, lead paint, HOA if applicable)</li>
                <li>Federal disclosures (RESPA, TRID timelines)</li>
                <li>Broker&apos;s legal responsibility for the transaction under Arizona licensing law</li>
              </ul>
              <p className="my-3">
                This is real work and real liability. The $400 is structured this way so you pay
                for services you actually receive, not a flat number whether or not the deal closes.
              </p>

              <div className="my-8 rounded-xl border border-primary bg-warm-beige/40 p-6 text-center">
                <h3 className="mb-2 font-heading text-lg font-semibold text-charcoal">
                  Ready to list for $999?
                </h3>
                <p className="mb-4 text-sm">
                  Start your flat-fee listing. On ARMLS in 24-48 hours, syndicated to Zillow and
                  Realtor.com automatically.
                </p>
                <Link
                  href="/listing/start"
                  className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Start Your Listing →
                </Link>
              </div>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                When flat-fee MLS wins
              </h2>
              <p className="my-3">
                Flat-fee works best when three things are true. First, your home is priced reasonably
                for current market conditions. Mesa&apos;s market as of early 2026 is balanced, with
                homes sitting about 60 days on market on average. If your price is right, it sells.
                Second, you&apos;re willing to handle showings yourself or with a licensed agent
                showing through the Supra lockbox. Third, you&apos;re comfortable reviewing offers
                with light support from our broker rather than a full-service agent walking you
                through every decision.
              </p>
              <p className="my-3">
                A lot of Mesa sellers fit this profile. People who&apos;ve sold before. Investors.
                People who&apos;ve been watching the market on Zillow for years and already know
                their neighborhood comps cold. For those sellers, a traditional agent&apos;s 2.5
                to 3 percent just doesn&apos;t match the work involved.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                When traditional full-service is worth the commission
              </h2>
              <p className="my-3">
                Don&apos;t use flat-fee if you&apos;re in any of these situations:
              </p>
              <ul className="my-3 list-disc space-y-1 pl-6">
                <li>
                  <strong>Your home is complicated.</strong> Unusual floor plan, unpermitted work,
                  title issues, tenant in place, estate sale with multiple heirs. These take real
                  brokerage work and benefit from having one person quarterback it.
                </li>
                <li>
                  <strong>You&apos;re pricing aggressively.</strong> If you&apos;re trying to hit
                  the high end of the comps, a full-service agent&apos;s marketing budget and
                  negotiation skill can justify their commission.
                </li>
                <li>
                  <strong>You can&apos;t be there for showings.</strong> Out-of-state owner, demanding
                  job, frequent travel. Full-service agents coordinate everything. With flat-fee
                  you&apos;re the point of contact.
                </li>
                <li>
                  <strong>You hate negotiation.</strong> If the idea of reviewing a low offer and
                  counter-offering makes your stomach hurt, pay the commission and let someone else
                  handle it.
                </li>
              </ul>
              <p className="my-3">
                We offer full-service representation too (tier 3). It&apos;s not a bad fit for the
                right situation, just a different trade-off. The rule: match the service tier to
                the actual complexity of the sale. Overpaying for unused service is waste. Underpaying
                for a complicated situation is false economy.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                FSBO (for sale by owner) — why we usually don&apos;t recommend it
              </h2>
              <p className="my-3">
                Without an MLS listing, your home is invisible to the 90+ percent of buyers who
                work through agents. Buyer&apos;s agents search ARMLS, not Craigslist or Zillow
                FSBO-only pages. You&apos;ll get fewer showings, more lowball offers from investors,
                and a longer time on market. The $999 flat-fee path gets you on ARMLS with one of
                the lowest total costs of any sale option. FSBO only makes sense if you have a
                known buyer already (family member, neighbor, current tenant) and you just need
                the paperwork handled. For that use case we offer the FSBO package covering
                photos, yard sign, and paperwork separately from the listing service. Most
                sellers who start thinking FSBO end up better off with the flat-fee listing.
                See our{' '}
                <Link href="/blog/selling-guides/sell-home-without-realtor-mesa" className="text-primary underline">
                  guide to selling without a realtor in Mesa
                </Link>{' '}
                for the full comparison.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                The 2026 NAR settlement and what changed for flat-fee sellers
              </h2>
              <p className="my-3">
                The August 2024 NAR settlement changed how buyer-agent commissions work. Before:
                sellers effectively always paid the buyer&apos;s agent. Now: you can offer any
                amount you want, including zero. For flat-fee sellers this is a big deal.
                You&apos;re already saving roughly 3 percent on the listing side. You can experiment
                with a lower buyer-agent offer (1.5 to 2 percent) and see how showings respond.
              </p>
              <p className="my-3">
                Honest take: for most Mesa homes under $600,000, we still recommend offering
                2 to 2.5 percent to the buyer&apos;s agent. The math: if offering 0.5 percent
                less costs you 30 extra days on market, your holding costs (mortgage, utilities,
                property tax) probably exceed the savings. On higher-priced homes where
                commission dollars are larger, the calculation changes. This is a conversation
                worth having with us when you list.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                Common questions from Mesa sellers
              </h2>

              <h3 className="mt-6 mb-2 font-heading font-semibold text-charcoal">
                Will my neighbors know I&apos;m using a flat-fee service?
              </h3>
              <p className="my-3">
                No. The MLS listing looks identical to a traditional agent listing. Your broker
                of record is on the listing by name. Buyers, agents, and your neighbors see a
                normal listing on Zillow and Realtor.com.
              </p>

              <h3 className="mt-6 mb-2 font-heading font-semibold text-charcoal">
                Can I cancel if it isn&apos;t working?
              </h3>
              <p className="my-3">
                Yes, subject to the listing agreement terms. Our agreement allows cancellation
                with no penalty if the home hasn&apos;t had a signed offer yet. If you&apos;ve already
                accepted an offer you can&apos;t cancel and take the property off market without
                breach issues. This is identical to how traditional listings work.
              </p>

              <h3 className="mt-6 mb-2 font-heading font-semibold text-charcoal">
                What if I need to change the price?
              </h3>
              <p className="my-3">
                Free and unlimited. Log in and update the price on ARMLS. The change syndicates
                to Zillow and Realtor.com within hours. Pricing support is included.
              </p>

              <h3 className="mt-6 mb-2 font-heading font-semibold text-charcoal">
                What about Mesa neighborhoods with strong HOAs like Las Sendas or Dobson Ranch?
              </h3>
              <p className="my-3">
                Mesa HOAs require specific disclosures (HOA Status, Community Assessments).
                These are included in our paperwork. If your HOA has restrictions on showings
                or signage, we&apos;ll coordinate with them. See our neighborhood guides for{' '}
                <Link href="/areas/mesa" className="text-primary underline">
                  Mesa
                </Link>{' '}
                and{' '}
                <Link href="/areas/gilbert" className="text-primary underline">
                  Gilbert
                </Link>{' '}
                if you&apos;re in a major master-planned community.
              </p>

              <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                What to do next
              </h2>
              <p className="my-3">
                Three quick steps to figure out whether flat-fee MLS is right for your sale:
              </p>
              <ol className="my-3 list-decimal space-y-2 pl-6">
                <li>
                  <Link href="/tools/home-value" className="text-primary underline">
                    Get a free home value estimate
                  </Link>{' '}
                  so you know your realistic list price before you commit to a strategy.
                </li>
                <li>
                  <Link href="/tools/net-sheet" className="text-primary underline">
                    Run a net sheet
                  </Link>{' '}
                  showing what you actually walk away with after all costs. Compare flat-fee,
                  FSBO, and traditional side by side.
                </li>
                <li>
                  If the numbers work for you,{' '}
                  <Link href="/listing/start" className="text-primary underline">
                    start your flat-fee listing
                  </Link>
                  . We can have you on ARMLS in 24 to 48 hours.
                </li>
              </ol>
              <p className="my-3">
                Questions before you commit? Call or text (480) 269-0502 or email
                sales@mesahomes.com. No high-pressure sales. We&apos;ll tell you honestly if
                flat-fee isn&apos;t right for your situation.
              </p>

              <div className="my-8 rounded-xl border border-primary bg-warm-beige/40 p-6 text-center">
                <h3 className="mb-2 font-heading text-lg font-semibold text-charcoal">
                  Run the numbers first
                </h3>
                <p className="mb-4 text-sm">
                  Our free seller net sheet shows exactly what you&apos;ll walk away with at
                  flat-fee vs traditional commission. Takes 2 minutes.
                </p>
                <Link
                  href="/tools/net-sheet"
                  className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Try the Net Sheet Calculator →
                </Link>
              </div>

              <hr className="my-8 border-warm-border" />

              <p className="text-xs text-text-light italic">
                This is educational content, not legal or financial advice. For specific
                questions about your property or situation, consult a licensed Arizona
                Realtor. MesaHomes is licensed in Arizona.
              </p>
            </div>
          </div>
        </article>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
