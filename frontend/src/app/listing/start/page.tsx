import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { SYNDICATION_PORTALS } from '@mesahomes/lib/brokerage';
import { ListingTierCards, ComparisonTable } from './ListingStartClient';

export const metadata: Metadata = {
  title: 'List Your Home — Choose Your Plan',
  description:
    'Three ways to sell your Mesa-area home: FSBO photography packages starting at $299, flat-fee MLS listing for $999, or full-service agent support. Choose the plan that fits your needs.',
  alternates: { canonical: 'https://mesahomes.com/listing/start' },
  openGraph: {
    title: 'List Your Home — Choose Your Plan | MesaHomes',
    description:
      'FSBO packages from $299, flat-fee MLS for $999, or full-service agent. Sell your Mesa home your way.',
    url: 'https://mesahomes.com/listing/start',
  },
};

const listingFAQs = [
  {
    question: 'What is the difference between FSBO and flat-fee MLS?',
    answer:
      'FSBO (For Sale By Owner) packages give you professional photography and marketing materials to sell on your own. Flat-fee MLS adds full MLS syndication — your listing appears on Zillow, Realtor.com, Redfin, and hundreds of other portals, just like a traditional agent listing.',
  },
  {
    question: 'Who handles the photography?',
    answer:
      'Photography is provided by Virtual Home Zone, our professional real estate photography partner. After you select your package, a photographer will contact you within 24 hours to schedule your shoot.',
  },
  {
    question: 'What portals will my flat-fee listing appear on?',
    answer:
      `Your flat-fee MLS listing syndicates to ${SYNDICATION_PORTALS.join(', ')}, and hundreds of other portals via ARMLS — the same exposure traditional agents get.`,
  },
  {
    question: 'Can I upgrade from FSBO to flat-fee MLS later?',
    answer:
      'Yes. You can start with an FSBO photography package and upgrade to flat-fee MLS listing at any time. Your photos and materials carry over.',
  },
  {
    question: 'What does the full-service agent option include?',
    answer:
      'Full-service means a licensed Mesa-area agent handles everything: pricing strategy, professional photography, MLS listing, showings, negotiations, and closing coordination. Commission-based pricing.',
  },
  {
    question: 'When will flat-fee MLS listings be available?',
    answer:
      'Flat-fee MLS listings are coming soon. Join the waitlist and we\'ll notify you as soon as we\'re live on the MLS. FSBO photography packages are available now.',
  },
];

export default function ListingStartPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mx-auto mb-4 max-w-3xl text-3xl font-bold text-text md:text-4xl">
            List Your Home — Choose Your Plan
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-lg text-text-light">
            Three ways to sell your Mesa-area home. Start with professional photos,
            go flat-fee on the MLS, or let an agent handle everything.
          </p>
        </section>

        {/* Pricing Cards */}
        <ListingTierCards />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* FAQ */}
        <FAQSection items={listingFAQs} title="Listing FAQ" />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
