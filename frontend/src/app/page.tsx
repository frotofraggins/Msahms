import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MarketSnapshot } from '@/components/MarketSnapshot';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { Home, Key, FileText, DollarSign, TrendingUp, Calculator, BarChart3, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mesa, AZ Real Estate, Market Data & Neighborhood Insights',
  description:
    'Your local source for Mesa, Arizona real estate. Live market data, home values, neighborhood news, HOA updates, city meetings, and flat-fee MLS listings. Covering Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction.',
  alternates: {
    canonical: 'https://mesahomes.com',
  },
  openGraph: {
    title: 'MesaHomes — Mesa, AZ Real Estate & Community Hub',
    description:
      'Hyper-local home values, market trends, HOA news, and flat-fee listings for the East Valley. Know your neighborhood before you buy or sell.',
    url: 'https://mesahomes.com',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MesaHomes — Mesa, AZ Real Estate & Community Hub',
    description:
      'Hyper-local real estate data, neighborhood news, and flat-fee listings for Mesa and the East Valley.',
  },
};

const intentCards = [
  { href: '/sell', icon: Home, label: 'Sell', desc: 'Your Home' },
  { href: '/buy', icon: Key, label: 'Buy', desc: 'A Home' },
  { href: '/rent', icon: FileText, label: 'Rent', desc: '' },
  { href: '/invest', icon: DollarSign, label: 'Invest', desc: '' },
];

const bentoTools = [
  {
    href: '/tools/home-value',
    icon: TrendingUp,
    label: 'Home Value Estimator',
    desc: 'County-verified data meets Zillow trends. Know your home\'s real worth before you list.',
    span: 'md:col-span-2' as const,
    accent: true,
  },
  {
    href: '/tools/net-sheet',
    icon: Calculator,
    label: 'Seller Net Sheet',
    desc: 'See exactly what you\'ll walk away with after fees, taxes, and commissions.',
    span: '' as const,
    accent: false,
  },
  {
    href: '/tools/affordability',
    icon: BarChart3,
    label: 'Buyer Affordability',
    desc: 'Find out how much home you can afford with current Mesa-area rates.',
    span: '' as const,
    accent: false,
  },
  {
    href: '/tools/listing-generator',
    icon: Sparkles,
    label: 'AI Listing Generator',
    desc: 'Professional MLS descriptions in seconds, powered by AI.',
    span: '' as const,
    accent: false,
  },
  {
    href: '/compare/flat-fee-vs-traditional-agent',
    icon: DollarSign,
    label: 'Flat Fee vs Agent',
    desc: 'Side-by-side cost comparison so you can decide with confidence.',
    span: '' as const,
    accent: false,
  },
];

const steps = [
  { num: '01', title: 'Use Our Free Tools', desc: 'Net sheet, home value, affordability calculator — real data, no strings attached.' },
  { num: '02', title: 'Get Expert Guidance', desc: 'AI-powered listing help, offer writing, and market analysis for your area.' },
  { num: '03', title: 'Save Thousands', desc: 'Flat-fee MLS listing for $999 or upgrade to full-service agent at any time.' },
];

const socialProof = [
  { quote: 'Saved over $18,000 selling our Gilbert home. The tools made it easy.', name: 'Sarah M.', city: 'Gilbert, AZ' },
  { quote: 'The AI listing generator wrote a better description than our last agent.', name: 'David R.', city: 'Mesa, AZ' },
  { quote: 'Flat-fee listing got us on Zillow, Realtor.com, and Redfin in 24 hours.', name: 'Maria L.', city: 'Queen Creek, AZ' },
];

/** JSON-LD structured data for RealEstateAgent / LocalBusiness. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['RealEstateAgent', 'LocalBusiness'],
  name: 'MesaHomes',
  description:
    'Flat-fee real estate services for Mesa, Gilbert, Chandler, Queen Creek, and San Tan Valley, AZ. Save thousands with $999 MLS listing.',
  url: 'https://mesahomes.com',
  telephone: '+14805551234',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mesa',
    addressRegion: 'AZ',
    postalCode: '85201',
    addressCountry: 'US',
  },
  areaServed: [
    { '@type': 'City', name: 'Mesa', containedInPlace: { '@type': 'State', name: 'Arizona' } },
    { '@type': 'City', name: 'Gilbert', containedInPlace: { '@type': 'State', name: 'Arizona' } },
    { '@type': 'City', name: 'Chandler', containedInPlace: { '@type': 'State', name: 'Arizona' } },
    { '@type': 'City', name: 'Queen Creek', containedInPlace: { '@type': 'State', name: 'Arizona' } },
    { '@type': 'City', name: 'San Tan Valley', containedInPlace: { '@type': 'State', name: 'Arizona' } },
  ],
  priceRange: '$999 flat-fee MLS listing',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '18:00',
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden px-4 py-20 md:py-32"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(253,252,249,0.88) 0%, rgba(245,242,236,0.82) 40%, rgba(217,211,198,0.74) 100%), url(/photos/mesa-desert-golden-hour.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Decorative mesh circles — purely visual */}
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #1B4D3E 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #707B4C 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-5xl text-center">
            <FadeInOnScroll>
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-olive">
                Mesa &middot; Gilbert &middot; Chandler &middot; Queen Creek
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={100}>
              <h1
                className="mx-auto mb-6 max-w-4xl font-heading font-bold leading-[1.05] tracking-tight text-charcoal"
                style={{ fontSize: 'var(--text-hero)' }}
              >
                Sell smarter.
                <br />
                <span className="text-primary">Keep more.</span>
              </h1>
            </FadeInOnScroll>

            <FadeInOnScroll delay={200}>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-text-light md:text-xl">
                Flat-fee MLS listing for <strong className="text-charcoal">$999</strong>. Free tools, county-verified data,
                and expert guidance — so you save thousands without sacrificing service.
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={300}>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/listing/start"
                  className="rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary-light hover:shadow-xl active:scale-[0.98]"
                >
                  List Your Home — $999
                </Link>
                <Link
                  href="/tools/home-value"
                  className="rounded-xl border-2 border-warm-border bg-paper/80 px-8 py-4 text-base font-semibold text-charcoal backdrop-blur-sm transition-all duration-200 hover:border-primary hover:shadow-lg active:scale-[0.98]"
                >
                  What&apos;s My Home Worth?
                </Link>
              </div>
            </FadeInOnScroll>

            {/* Intent cards */}
            <FadeInOnScroll delay={400}>
              <div className="mx-auto mt-16 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
                {intentCards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="flex flex-col items-center gap-2 rounded-xl border border-warm-border bg-paper/80 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg active:scale-[0.98]"
                  >
                    <card.icon className="h-8 w-8 text-primary" />
                    <span className="text-sm font-semibold text-charcoal">{card.label}</span>
                    {card.desc && <span className="text-xs text-text-light">{card.desc}</span>}
                  </Link>
                ))}
              </div>
            </FadeInOnScroll>
          </div>
        </section>

        {/* ── Savings Calculator ── */}
        <SavingsCalculator />

        {/* ── Bento Grid Tools ── */}
        <section className="bg-paper px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <FadeInOnScroll>
              <h2
                className="mb-3 text-center font-heading font-bold tracking-tight text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Free tools. Real data.
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-center text-text-light">
                Everything you need to make confident real estate decisions — no sign-up required.
              </p>
            </FadeInOnScroll>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
              {bentoTools.map((tool, i) => (
                <FadeInOnScroll key={tool.href} delay={i * 80} className={tool.span}>
                  <BentoCard {...tool} />
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-warm-beige px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <FadeInOnScroll>
              <h2
                className="mb-10 text-center font-heading font-bold tracking-tight text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                How it works
              </h2>
            </FadeInOnScroll>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <FadeInOnScroll key={step.num} delay={i * 120}>
                  <div className="text-center">
                    <div className="mb-3 font-heading text-4xl font-bold text-primary/20">{step.num}</div>
                    <h3 className="mb-2 text-lg font-semibold text-charcoal">{step.title}</h3>
                    <p className="text-sm text-text-light">{step.desc}</p>
                  </div>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── Market Snapshot ── */}
        <MarketSnapshot />

        {/* ── Social Proof ── */}
        <section className="bg-warm-beige px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <FadeInOnScroll>
              <h2
                className="mb-10 text-center font-heading font-bold tracking-tight text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                What homeowners say
              </h2>
            </FadeInOnScroll>
            <div className="grid gap-6 md:grid-cols-3">
              {socialProof.map((item, i) => (
                <FadeInOnScroll key={item.name} delay={i * 100}>
                  <div className="rounded-xl border border-warm-border bg-paper p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <p className="mb-4 text-sm italic text-text-light">&ldquo;{item.quote}&rdquo;</p>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{item.name}</p>
                      <p className="text-xs text-text-light">{item.city}</p>
                    </div>
                  </div>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-paper px-4 py-16 text-center">
          <FadeInOnScroll>
            <h2
              className="mb-4 font-heading font-bold tracking-tight text-charcoal"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Ready to save thousands?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-text-light">
              Start with a free tool or list your home today. No pressure, no obligation.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/listing/start"
                className="rounded-xl bg-secondary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-secondary-dark hover:shadow-xl active:scale-[0.98]"
              >
                Start Your Flat-Fee Listing
              </Link>
              <Link
                href="/booking"
                className="rounded-xl border-2 border-primary px-8 py-4 text-base font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-[0.98]"
              >
                Talk to an Agent
              </Link>
            </div>
          </FadeInOnScroll>
        </section>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}

/** Bento grid tool card. Hero card spans 2 columns on desktop. */
function BentoCard({
  href,
  icon: Icon,
  label,
  desc,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  span: string;
  accent: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${
        accent
          ? 'border-primary/20 bg-primary/5'
          : 'border-warm-border bg-paper'
      }`}
    >
      <div>
        <div className={`mb-4 inline-flex rounded-xl p-3 ${accent ? 'bg-primary/10' : 'bg-warm-beige'}`}>
          <Icon className={`h-6 w-6 ${accent ? 'text-primary' : 'text-olive'}`} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-charcoal">{label}</h3>
        <p className="text-sm text-text-light">{desc}</p>
      </div>
      <div className="mt-4">
        <span className="text-sm font-medium text-primary transition-colors group-hover:text-primary-light">
          Try it free →
        </span>
      </div>
    </Link>
  );
}
