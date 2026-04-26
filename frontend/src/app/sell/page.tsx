import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { SellHeroLeadCapture, SellSavingsCalculator } from './SellClient';

export const metadata: Metadata = {
  title: 'Sell Your Home — Flat-Fee MLS Listing',
  description:
    'List your home on Zillow, Realtor.com, Redfin, and more for a $999 flat fee. Save thousands compared to traditional agent commissions in Mesa, AZ.',
  alternates: { canonical: 'https://mesahomes.com/sell' },
  openGraph: {
    title: 'Sell Your Home — Flat-Fee MLS Listing | MesaHomes',
    description:
      'Your home on Zillow, Realtor.com, Redfin — for a flat fee. Save thousands selling in Mesa, AZ.',
    url: 'https://mesahomes.com/sell',
  },
};

const toolLinks = [
  { href: '/tools/net-sheet', label: 'Seller Net Sheet', desc: 'See your estimated proceeds' },
  { href: '/tools/home-value', label: 'Home Value Request', desc: 'Get a free valuation' },
  { href: '/tools/listing-generator', label: 'AI Listing Generator', desc: 'Write your MLS description' },
  { href: '/tools/sell-now-or-wait', label: 'Sell Now or Wait?', desc: 'Market timing analysis' },
  { href: '/compare/flat-fee-vs-traditional-agent', label: 'Flat Fee vs Traditional', desc: 'Side-by-side comparison' },
];

const sellerFAQs = [
  {
    question: 'Will my listing appear on Zillow?',
    answer:
      'Yes. Once your listing goes live via our MLS partner, it syndicates to Zillow, Realtor.com, Redfin, Trulia, Homes.com, and hundreds of other portals — the same exposure traditional agents get.',
  },
  {
    question: 'What does the $999 flat fee include?',
    answer:
      'Your flat fee covers full MLS listing, professional photography coordination, syndication to all major portals, and listing management through closing. There is an additional $400 broker transaction fee at closing.',
  },
  {
    question: 'How is this different from a traditional agent?',
    answer:
      'Traditional agents charge 5-6% commission (often $20,000+ on a typical Mesa home). With MesaHomes, you pay a $999 flat fee plus $400 broker fee — saving you thousands while getting the same MLS exposure.',
  },
  {
    question: 'Can I upgrade to full-service later?',
    answer:
      'Absolutely. You can start with flat-fee listing and upgrade to full-service agent support at any time. Our agents handle showings, negotiations, and closing.',
  },
  {
    question: 'How long does it take to get listed?',
    answer:
      'Most listings go live on the MLS within 24-48 hours after you submit your listing details and photos. Portal syndication (Zillow, Redfin, etc.) typically follows within a few hours after MLS activation.',
  },
  {
    question: 'Do I still need to offer buyer agent commission?',
    answer:
      'Following recent NAR policy changes, buyer agent compensation is negotiable. We help you understand your options and set competitive terms for your market.',
  },
];

export default function SellPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero with gradient mesh */}
        <FadeInOnScroll>
          <section className="relative overflow-hidden bg-paper px-4 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(ellipse at 20% 50%, #F5A623 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #1B4D3E 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #707B4C 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <h1
                className="mx-auto mb-4 max-w-3xl font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-hero)' }}
              >
                Your home on Zillow, Realtor.com, Redfin — for a flat fee.
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
                List on the MLS for just $999. Save thousands compared to the typical 5% agent
                commission — your home gets the same exposure on every major portal.
              </p>
              <SellHeroLeadCapture />
            </div>
          </section>
        </FadeInOnScroll>

        {/* Savings Calculator with syndication message */}
        <FadeInOnScroll delay={100}>
          <SellSavingsCalculator />
        </FadeInOnScroll>

        {/* How It Works */}
        <FadeInOnScroll delay={200}>
          <section className="bg-paper px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-8 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                How Flat-Fee Listing Works
              </h2>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-3xl">①</div>
                  <h3 className="mb-2 text-lg font-semibold text-primary">Use Our Free Tools</h3>
                  <p className="text-sm text-text-light">
                    Get your home value, calculate net proceeds, and generate your listing description with AI.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl">②</div>
                  <h3 className="mb-2 text-lg font-semibold text-primary">Submit Your Listing</h3>
                  <p className="text-sm text-text-light">
                    Once your listing goes live via our MLS partner, it appears on Zillow, Redfin, Realtor.com, and more.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl">③</div>
                  <h3 className="mb-2 text-lg font-semibold text-primary">Save Thousands</h3>
                  <p className="text-sm text-text-light">
                    Pay $999 flat fee instead of 5% commission. Upgrade to full-service agent support at any time.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Seller Tools */}
        <FadeInOnScroll>
          <section className="bg-warm-beige px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Free Seller Tools
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {toolLinks.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="rounded-xl bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <h3 className="mb-1 text-sm font-semibold text-charcoal">{tool.label}</h3>
                    <p className="text-xs text-text-light">{tool.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* FAQ */}
        <FadeInOnScroll>
          <FAQSection items={sellerFAQs} title="Seller FAQ" />
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
