import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { InvestLeadCapture } from './InvestClient';
import { TrendingUp, Home, Calculator, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Invest in Mesa, AZ Real Estate',
  description:
    'Real estate investment tools and market data for Mesa, Gilbert, Chandler, and Queen Creek. Rental yields, market trends, and expert guidance for landlords and investors.',
  alternates: { canonical: 'https://mesahomes.com/invest' },
  openGraph: {
    title: 'Invest in Mesa, AZ Real Estate | MesaHomes',
    description: 'Investment tools, rental yields, and market data for Mesa-area real estate investors.',
    url: 'https://mesahomes.com/invest',
  },
};

const investorTools = [
  {
    icon: Calculator,
    href: '/tools/net-sheet',
    label: 'Seller Net Sheet',
    desc: 'Calculate net proceeds on investment property sales.',
  },
  {
    icon: TrendingUp,
    href: '/tools/sell-now-or-wait',
    label: 'Sell Now or Wait?',
    desc: 'Market timing analysis for your investment properties.',
  },
  {
    icon: BarChart3,
    href: '/areas/mesa',
    label: 'Market Data',
    desc: 'Median values, days on market, and trends by city and ZIP.',
  },
  {
    icon: Home,
    href: '/tools/home-value',
    label: 'Property Valuation',
    desc: 'Get current market value for any property in the East Valley.',
  },
];

const investFAQs = [
  {
    question: 'Is Mesa a good market for real estate investment?',
    answer:
      'Mesa and the East Valley have seen steady population growth, strong rental demand, and relatively affordable entry points compared to Phoenix. Median home values around $448K with typical rents of $1,735/month offer competitive rental yields for the metro area.',
  },
  {
    question: 'What are typical rental yields in Mesa?',
    answer:
      'Gross rental yields in Mesa typically range from 4-6% depending on the neighborhood and property type. Areas like central Mesa (85201) offer higher yields due to lower purchase prices, while newer developments in east Mesa command higher rents but at higher purchase prices.',
  },
  {
    question: 'Can I use the flat-fee listing for investment properties?',
    answer:
      'Yes. Our $999 flat-fee MLS listing works for any residential property — primary residences, rentals, and investment properties. Many investors save significantly on commissions when selling multiple properties.',
  },
  {
    question: 'What should I know about Arizona landlord-tenant law?',
    answer:
      'Arizona\'s Residential Landlord and Tenant Act (ARS 33-1301 through 33-1381) governs rental relationships. Key points: security deposits are capped at 1.5x monthly rent, landlords must provide 2-day notice for non-payment, and there are specific requirements for property condition and habitability.',
  },
];

export default function InvestPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            Invest in Mesa, AZ Real Estate
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
            Market data, investment tools, and local expertise for landlords and investors
            in the East Valley. Save on commissions with flat-fee listing when you sell.
          </p>
          <InvestLeadCapture />
        </section>

        {/* Investor Tools */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-text">Investor Tools</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {investorTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex gap-4 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <tool.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-text">{tool.label}</h3>
                    <p className="text-xs text-text-light">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Market Highlights */}
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-text">
              East Valley Market Highlights
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-surface p-4 text-center">
                <div className="text-xl font-bold tabular-nums text-primary">$448K</div>
                <div className="mt-1 text-xs text-text-light">Mesa Median Value</div>
              </div>
              <div className="rounded-lg bg-surface p-4 text-center">
                <div className="text-xl font-bold tabular-nums text-primary">$1,735</div>
                <div className="mt-1 text-xs text-text-light">Typical Monthly Rent</div>
              </div>
              <div className="rounded-lg bg-surface p-4 text-center">
                <div className="text-xl font-bold tabular-nums text-primary">60</div>
                <div className="mt-1 text-xs text-text-light">Days on Market</div>
              </div>
              <div className="rounded-lg bg-surface p-4 text-center">
                <div className="text-xl font-bold tabular-nums text-primary">97.7%</div>
                <div className="mt-1 text-xs text-text-light">Sale-to-List Ratio</div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-text-light">
              Data from county assessors and Zillow Research — updated monthly.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection items={investFAQs} title="Investor FAQ" />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
