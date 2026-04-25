import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { FsboFAQ, getFsboFAQJsonLd } from './FsboLandingClient';

export const metadata: Metadata = {
  title: 'Sell Your Home FSBO in Mesa, AZ — Complete Guide',
  description:
    'Everything you need to sell your home For Sale By Owner in Mesa, AZ. FSBO steps, savings calculator, comparison table, FAQ, and professional photography packages.',
  alternates: { canonical: 'https://mesahomes.com/fsbo' },
  openGraph: {
    title: 'Sell Your Home FSBO in Mesa, AZ — Complete Guide | MesaHomes',
    description:
      'Save thousands selling FSBO. Professional photography, MLS listing, and free tools for Mesa-area homeowners.',
    url: 'https://mesahomes.com/fsbo',
  },
};

const timelineSteps = [
  {
    step: 1,
    title: 'Price Your Home Right',
    description:
      'Use our free Home Value tool and Seller Net Sheet to analyze comps, market trends, and calculate your net proceeds. Pricing correctly from day one is the most important factor in a successful FSBO sale.',
  },
  {
    step: 2,
    title: 'Prepare & Stage',
    description:
      'Declutter, deep clean, and make minor repairs. First impressions matter — staged homes sell faster and for more money. Focus on curb appeal, kitchen, and bathrooms.',
  },
  {
    step: 3,
    title: 'Get Professional Photography',
    description:
      'Professional photos are non-negotiable. Our FSBO packages include professional photography, drone aerials, 3D virtual tours, and marketing materials starting at $299.',
  },
  {
    step: 4,
    title: 'List & Market Your Home',
    description:
      'Add flat-fee MLS listing ($999) to get on Zillow, Redfin, Realtor.com, and 500+ portals. Combine with yard signs, social media, and open houses for maximum exposure.',
  },
  {
    step: 5,
    title: 'Handle Showings & Open Houses',
    description:
      'Schedule showings, use a lockbox for buyer agent access, and host open houses. Be flexible with timing and let buyers explore the home at their own pace.',
  },
  {
    step: 6,
    title: 'Negotiate & Accept an Offer',
    description:
      'Review offers carefully — price isn\'t everything. Consider contingencies, closing timeline, and buyer financing. Counter-offer strategically and don\'t let emotions drive decisions.',
  },
  {
    step: 7,
    title: 'Close the Sale',
    description:
      'Work with a title company to handle escrow, title search, and closing documents. Complete required disclosures (SPDS), coordinate inspections, and sign at closing. You\'re done!',
  },
];

const comparisonRows = [
  { feature: 'Listing Commission', fsbo: '$0', flatFee: '$999 + $400 broker', fullService: '2.5–3% ($11K–$13K)' },
  { feature: 'MLS Listing', fsbo: '✗', flatFee: '✓', fullService: '✓' },
  { feature: 'Zillow / Redfin / Realtor.com', fsbo: 'Limited', flatFee: '✓ (via MLS)', fullService: '✓ (via MLS)' },
  { feature: 'Professional Photography', fsbo: 'You arrange', flatFee: 'You arrange', fullService: 'Included' },
  { feature: 'Pricing Strategy', fsbo: 'DIY (use our tools)', flatFee: 'DIY (use our tools)', fullService: 'Agent-guided' },
  { feature: 'Showings', fsbo: 'You handle', flatFee: 'You handle', fullService: 'Agent handles' },
  { feature: 'Negotiations', fsbo: 'You handle', flatFee: 'You handle', fullService: 'Agent handles' },
  { feature: 'Contracts & Paperwork', fsbo: 'You handle', flatFee: 'You handle', fullService: 'Agent handles' },
  { feature: 'Typical Savings on $450K Home', fsbo: '$22,500', flatFee: '$21,100', fullService: '$0 (baseline)' },
  { feature: 'Best For', fsbo: 'Experienced sellers', flatFee: 'DIY sellers wanting exposure', fullService: 'Hands-off sellers' },
];

export default function FsboPage() {
  const faqJsonLd = getFsboFAQJsonLd();

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* FAQ Schema JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Hero with embedded SavingsCalculator */}
        <FadeInOnScroll>
          <section className="relative overflow-hidden bg-paper px-4 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(ellipse at 25% 40%, #F5A623 0%, transparent 50%), radial-gradient(ellipse at 75% 60%, #1B4D3E 0%, transparent 50%), radial-gradient(ellipse at 50% 20%, #707B4C 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <h1
                className="mx-auto mb-4 max-w-4xl font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-hero)' }}
              >
                Sell Your Home FSBO in Mesa, AZ
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
                Everything you need to sell For Sale By Owner — professional photography,
                free pricing tools, and step-by-step guidance. Save thousands in commissions.
              </p>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Savings Calculator */}
        <FadeInOnScroll delay={100}>
          <SavingsCalculator />
        </FadeInOnScroll>

        {/* 7 Steps Timeline */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-16">
            <div className="mx-auto max-w-3xl">
              <h2
                className="mb-10 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                7 Steps to Selling FSBO in Mesa
              </h2>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-warm-border" />

                <div className="space-y-8">
                  {timelineSteps.map((item, i) => (
                    <FadeInOnScroll key={item.step} delay={i * 80}>
                      <div className="relative flex gap-5 pl-2">
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md">
                          {item.step}
                        </div>
                        <div className="pt-1">
                          <h3 className="mb-1 font-heading text-lg font-bold text-charcoal">
                            {item.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-text-light">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </FadeInOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Comparison Table */}
        <FadeInOnScroll>
          <section className="bg-warm-beige px-4 py-16">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-8 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                FSBO vs Flat-Fee vs Full-Service
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-warm-border">
                      <th className="px-3 py-3 font-semibold text-charcoal">Feature</th>
                      <th className="px-3 py-3 text-center font-semibold text-primary">FSBO Only</th>
                      <th className="px-3 py-3 text-center font-semibold text-primary">
                        Flat-Fee MLS
                        <span className="ml-1 rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                          Popular
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-text-light">Full-Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="border-b border-warm-border/50">
                        <td className="px-3 py-2.5 font-medium text-charcoal">{row.feature}</td>
                        <td className="px-3 py-2.5 text-center text-text-light">{row.fsbo}</td>
                        <td className="px-3 py-2.5 text-center font-medium text-charcoal">{row.flatFee}</td>
                        <td className="px-3 py-2.5 text-center text-text-light">{row.fullService}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* FAQ Section */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-16">
            <div className="mx-auto max-w-3xl">
              <h2
                className="mb-8 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                FSBO Frequently Asked Questions
              </h2>
              <FsboFAQ />
            </div>
          </section>
        </FadeInOnScroll>

        {/* CTA */}
        <FadeInOnScroll>
          <section className="bg-warm-beige px-4 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="mb-4 font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Ready to Sell FSBO?
              </h2>
              <p className="mb-8 text-text-light">
                Start with professional photography and marketing. Upgrade to flat-fee MLS
                or full-service agent support at any time.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/listing/fsbo"
                  className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-all duration-100 hover:bg-secondary-dark active:scale-[0.98]"
                >
                  Get Started with FSBO Photography
                </Link>
                <Link
                  href="/tools/home-value"
                  className="rounded-lg border border-primary px-8 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Get Your Home Value First
                </Link>
              </div>
            </div>
          </section>
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
