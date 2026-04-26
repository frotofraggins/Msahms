import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
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
        {/* Hero with gradient mesh + lead capture */}
        <FadeInOnScroll>
          <section className="relative overflow-hidden bg-paper px-4 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(ellipse at 20% 50%, #1B4D3E 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #F5A623 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #707B4C 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <h1
                className="mb-4 font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-hero)' }}
              >
                Buy a Home in Mesa, AZ
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
                Free tools, expert guidance, and local agents who know the East Valley.
                Whether you&apos;re a first-time buyer or experienced investor, we&apos;ll help you
                find the right home at the right price.
              </p>
              <BuyLeadCapture />
            </div>
          </section>
        </FadeInOnScroll>

        {/* Buyer Paths */}
        <FadeInOnScroll delay={100}>
          <section className="bg-warm-beige px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Where Would You Like to Start?
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {buyerPaths.map((path, i) => (
                  <FadeInOnScroll key={path.href} delay={i * 100}>
                    <Link
                      href={path.href}
                      className="flex gap-4 rounded-xl bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <path.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                      <div>
                        <h3 className="mb-1 text-sm font-semibold text-charcoal">{path.label}</h3>
                        <p className="text-xs text-text-light">{path.desc}</p>
                      </div>
                    </Link>
                  </FadeInOnScroll>
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Additional Links */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Buyer Resources
              </h2>
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
        </FadeInOnScroll>

        {/* Mortgage FAQ */}
        <FadeInOnScroll>
          <FAQSection items={mortgageFAQs} title="Mortgage & Closing Cost FAQ" />
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
