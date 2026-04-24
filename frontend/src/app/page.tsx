import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { MarketSnapshot } from '@/components/MarketSnapshot';
import { Home, Key, FileText, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Flat-Fee Real Estate for Mesa, AZ',
  description:
    'Save thousands selling your home in Mesa, Gilbert, Chandler, Queen Creek, and San Tan Valley. Free tools, county-verified data, and flat-fee MLS listing for $999.',
  alternates: {
    canonical: 'https://mesahomes.com',
  },
  openGraph: {
    title: 'Flat-Fee Real Estate for Mesa, AZ',
    description:
      'Save thousands selling your home. Free seller net sheet, buyer affordability calculator, AI listing generator, and more.',
    url: 'https://mesahomes.com',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flat-Fee Real Estate for Mesa, AZ',
    description:
      'Save thousands selling your home in Mesa, AZ with flat-fee MLS listing.',
  },
};

const intentCards = [
  { href: '/sell', icon: Home, label: 'Sell', desc: 'Your Home' },
  { href: '/buy', icon: Key, label: 'Buy', desc: 'A Home' },
  { href: '/rent', icon: FileText, label: 'Rent', desc: '' },
  { href: '/invest', icon: DollarSign, label: 'Invest', desc: '' },
];

const quickTools = [
  { href: '/tools/home-value', label: "What's My Home Worth?" },
  { href: '/tools/affordability', label: 'How Much Can I Afford?' },
  { href: '/compare/flat-fee-vs-traditional-agent', label: 'Compare Flat Fee vs Agent' },
  { href: '/booking', label: 'Talk to Agent Now' },
];

const steps = [
  { num: '①', title: 'Use Our Free Tools', desc: 'Net sheet, home value, affordability calculator — real data, no strings attached.' },
  { num: '②', title: 'Get Expert Guidance', desc: 'AI-powered listing help, offer writing, and market analysis for your area.' },
  { num: '③', title: 'Save Thousands', desc: 'Flat-fee MLS listing for $999 or upgrade to full-service agent at any time.' },
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

        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            What do you need help with?
          </h1>
          <div className="mx-auto mb-8 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
            {intentCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <card.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-semibold text-text">{card.label}</span>
                {card.desc && <span className="text-xs text-text-light">{card.desc}</span>}
              </Link>
            ))}
          </div>
          <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
            {quickTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Savings Calculator */}
        <SavingsCalculator />

        {/* How It Works */}
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-text">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.num} className="text-center">
                  <div className="mb-2 text-3xl">{step.num}</div>
                  <h3 className="mb-2 text-lg font-semibold text-primary">{step.title}</h3>
                  <p className="text-sm text-text-light">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tool Cards */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <ToolCard
              title="Seller Net Sheet"
              desc="How much will I walk away with?"
              href="/tools/net-sheet"
              cta="Calculate"
            />
            <ToolCard
              title="Buyer Affordability"
              desc="How much can I afford?"
              href="/tools/affordability"
              cta="Calculate"
            />
            <ToolCard
              title="Market Data"
              desc="Mesa home values and trends"
              href="/areas/mesa"
              cta="View Data"
            />
          </div>
        </section>

        {/* Market Snapshot */}
        <MarketSnapshot />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}

function ToolCard({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-text">{title}</h3>
      <p className="mb-4 text-sm text-text-light">{desc}</p>
      <Link
        href={href}
        className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
      >
        {cta}
      </Link>
    </div>
  );
}
