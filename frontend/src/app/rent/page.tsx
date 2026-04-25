import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { RentLeadCapture } from './RentClient';
import { Home, Users, FileText, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rent in Mesa, AZ',
  description:
    'Find rentals or list your property in Mesa, Gilbert, Chandler, and Queen Creek. Rental market data, tenant resources, and property management tools.',
  alternates: { canonical: 'https://mesahomes.com/rent' },
  openGraph: {
    title: 'Rent in Mesa, AZ | MesaHomes',
    description: 'Rental resources for tenants and property owners in the Mesa, AZ metro area.',
    url: 'https://mesahomes.com/rent',
  },
};

const renterPaths = [
  {
    icon: Home,
    label: 'Find a Rental',
    desc: 'Browse available rentals in Mesa, Gilbert, Chandler, and Queen Creek.',
    href: '/areas/mesa',
  },
  {
    icon: FileText,
    label: 'Affordability Calculator',
    desc: 'See how much rent you can comfortably afford based on your income.',
    href: '/tools/affordability',
  },
];

const ownerPaths = [
  {
    icon: Users,
    label: 'List Your Rental',
    desc: 'Get your property in front of qualified tenants quickly.',
    href: '/booking',
  },
  {
    icon: TrendingUp,
    label: 'Rental Market Data',
    desc: 'See typical rents, vacancy rates, and trends for your area.',
    href: '/areas/mesa',
  },
];

const rentFAQs = [
  {
    question: 'What is the average rent in Mesa, AZ?',
    answer:
      'The typical rent in Mesa is approximately $1,735/month for a single-family home. Rents vary by neighborhood, size, and condition — ranging from $1,200 for smaller units to $2,500+ for newer 4-bedroom homes.',
  },
  {
    question: 'What do I need to rent a home in Arizona?',
    answer:
      'Most landlords require proof of income (typically 3x monthly rent), a credit check, rental history, and a security deposit (usually equal to one month\'s rent). Arizona law limits security deposits to 1.5x monthly rent.',
  },
  {
    question: 'Should I rent or buy in Mesa?',
    answer:
      'It depends on your timeline and finances. Use our affordability calculator to compare monthly costs of renting vs. buying. Generally, if you plan to stay 3+ years and can afford a down payment, buying may save you money long-term.',
  },
];

export default function RentPage() {
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
                  'radial-gradient(ellipse at 30% 40%, #707B4C 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, #1B4D3E 0%, transparent 50%), radial-gradient(ellipse at 50% 20%, #F5A623 0%, transparent 50%)',
              }}
            />
            <div className="relative">
              <h1
                className="mb-4 font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-hero)' }}
              >
                Rent in Mesa, AZ
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
                Whether you&apos;re looking for a rental or listing your property, MesaHomes
                has the tools and local expertise to help.
              </p>
              <RentLeadCapture />
            </div>
          </section>
        </FadeInOnScroll>

        {/* For Renters */}
        <FadeInOnScroll delay={100}>
          <section className="bg-warm-beige px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                For Renters
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {renterPaths.map((path) => (
                  <Link
                    key={path.href + path.label}
                    href={path.href}
                    className="flex gap-4 rounded-xl bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <path.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-charcoal">{path.label}</h3>
                      <p className="text-xs text-text-light">{path.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* For Property Owners */}
        <FadeInOnScroll delay={200}>
          <section className="bg-paper px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                For Property Owners
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {ownerPaths.map((path) => (
                  <Link
                    key={path.href + path.label}
                    href={path.href}
                    className="flex gap-4 rounded-xl bg-warm-beige p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <path.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-charcoal">{path.label}</h3>
                      <p className="text-xs text-text-light">{path.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* FAQ */}
        <FadeInOnScroll>
          <FAQSection items={rentFAQs} title="Rental FAQ" />
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
