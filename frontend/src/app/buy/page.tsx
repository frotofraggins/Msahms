import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { BuyLeadCapture } from './BuyClient';
import { Calculator, BookOpen, FileText, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Buy a Home in Mesa, AZ',
  description:
    'Find your next home in Mesa, Gilbert, Chandler, or Queen Creek. Free affordability calculator, first-time buyer guide, and expert agent support.',
  alternates: { canonical: 'https://mesahomes.com/buy' },
  openGraph: {
    title: 'Buy a Home in Mesa, AZ | MesaHomes',
    description:
      'Free affordability calculator, first-time buyer guide, and expert agent support for Mesa-area home buyers.',
    url: 'https://mesahomes.com/buy',
  },
};

const buyerPaths = [
  {
    icon: Calculator,
    href: '/tools/affordability',
    label: 'Affordability Calculator',
    desc: 'Find out how much home you can afford based on your income, debts, and down payment.',
  },
  {
    icon: BookOpen,
    href: '/buy/first-time-buyer',
    label: 'First-Time Buyer Guide',
    desc: 'Step-by-step Arizona home buying process, DPA programs, and NAR policy changes explained.',
  },
  {
    icon: FileText,
    href: '/buy/offer-guidance',
    label: 'Offer & Contract Education',
    desc: 'Understand purchase contracts, SPDS, BINSR, and buyer-broker agreements.',
  },
  {
    icon: Users,
    href: '/booking',
    label: 'Schedule a Consultation',
    desc: 'Talk to a local buyer\'s agent who knows Mesa, Gilbert, Chandler, and Queen Creek.',
  },
];

const additionalLinks = [
  { href: '/tools/offer-writer', label: 'AI Offer Writer' },
  { href: '/buy/first-time-buyer', label: 'First-Time Buyer Guide' },
  { href: '/buy/offer-guidance', label: 'Offer Guidance' },
];

const mortgageFAQs = [
  {
    question: 'What are lender costs?',
    answer:
      'Lender costs include origination fees (typically 0.5-1% of the loan), appraisal fees ($400-$600), credit report fees, underwriting fees, and other processing charges. These are separate from your down payment and are due at closing. Ask each lender for a Loan Estimate within 3 days of applying so you can compare costs side by side.',
  },
  {
    question: 'Can I negotiate closing costs?',
    answer:
      'Yes. You can negotiate lender fees, ask the seller to contribute toward closing costs (common in buyer\'s markets), and shop title/escrow companies for better rates. In Arizona, buyers typically pay 2-3% of the purchase price in closing costs. Getting multiple Loan Estimates is the best way to negotiate — lenders will often match or beat competitors.',
  },
  {
    question: "What's the difference between origination fee and discount points?",
    answer:
      'An origination fee is what the lender charges to process your loan — typically 0.5-1% of the loan amount. Discount points are optional upfront payments to lower your interest rate — each point costs 1% of the loan and typically reduces your rate by 0.25%. Points make sense if you plan to stay in the home long enough to recoup the upfront cost through lower monthly payments.',
  },
];

export default function BuyPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero with lead capture */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            Buy a Home in Mesa, AZ
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
            Free tools, expert guidance, and local agents who know the East Valley.
            Whether you&apos;re a first-time buyer or experienced investor, we&apos;ll help you
            find the right home at the right price.
          </p>
          <BuyLeadCapture />
        </section>

        {/* Buyer Paths */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-text">
              Where Would You Like to Start?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {buyerPaths.map((path) => (
                <Link
                  key={path.href}
                  href={path.href}
                  className="flex gap-4 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <path.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-text">{path.label}</h3>
                    <p className="text-xs text-text-light">{path.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Links */}
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-text">Buyer Resources</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {additionalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/buy/shopping-lenders"
                className="rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Shopping for Lenders
              </Link>
              <Link
                href="/buy/lender-costs-explained"
                className="rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Lender Costs Explained
              </Link>
            </div>
          </div>
        </section>

        {/* Mortgage FAQ */}
        <FAQSection items={mortgageFAQs} title="Mortgage & Closing Cost FAQ" />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
