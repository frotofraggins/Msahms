import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { FirstTimeBuyerLeadCapture } from './FirstTimeBuyerClient';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'First-Time Home Buyer Guide — Arizona',
  description:
    'Step-by-step Arizona home buying process for first-time buyers. Down payment assistance programs, NAR policy changes, and expert guidance for Mesa-area buyers.',
  alternates: { canonical: 'https://mesahomes.com/buy/first-time-buyer' },
  openGraph: {
    title: 'First-Time Home Buyer Guide — Arizona | MesaHomes',
    description: 'Everything first-time buyers need to know about buying a home in Arizona.',
    url: 'https://mesahomes.com/buy/first-time-buyer',
  },
};

const steps = [
  {
    num: 1,
    title: 'Check Your Finances',
    desc: 'Review your credit score, savings, and monthly budget. Most lenders want a credit score of 620+ for conventional loans, or 580+ for FHA loans.',
  },
  {
    num: 2,
    title: 'Get Pre-Approved',
    desc: 'Shop at least 3 lenders to compare rates and fees. A pre-approval letter shows sellers you\'re a serious, qualified buyer.',
  },
  {
    num: 3,
    title: 'Find a Buyer\'s Agent',
    desc: 'Work with a local agent who knows the East Valley. Under new NAR rules, you\'ll sign a buyer-broker agreement before touring homes.',
  },
  {
    num: 4,
    title: 'Search for Homes',
    desc: 'Focus on neighborhoods that match your budget, commute, and lifestyle. Your agent will set up MLS alerts for new listings.',
  },
  {
    num: 5,
    title: 'Make an Offer',
    desc: 'Your agent will help you write a competitive offer using the Arizona Association of Realtors purchase contract.',
  },
  {
    num: 6,
    title: 'Inspection & Due Diligence',
    desc: 'Order a home inspection, review the Seller Property Disclosure Statement (SPDS), and complete your Buyer Inspection Notice (BINSR).',
  },
  {
    num: 7,
    title: 'Appraisal & Loan Processing',
    desc: 'Your lender orders an appraisal and processes your loan. Stay in close contact with your loan officer during this period.',
  },
  {
    num: 8,
    title: 'Close & Get Your Keys',
    desc: 'Sign closing documents at the title company, wire your funds, and receive the keys to your new home. Typical closing takes 30-45 days from accepted offer.',
  },
];

const dpaPrograms = [
  {
    name: 'Home Plus Program',
    desc: 'Up to 5% of the loan amount as a forgivable second mortgage. Available to first-time and repeat buyers with qualifying income.',
  },
  {
    name: 'Pathway to Purchase',
    desc: 'Up to 10% DPA for specific ZIP codes in targeted areas. Income limits apply. Forgivable after 3 years of occupancy.',
  },
  {
    name: 'FHA Loans',
    desc: 'As low as 3.5% down payment with credit scores of 580+. Popular with first-time buyers for lower down payment requirements.',
  },
  {
    name: 'VA Loans',
    desc: '0% down payment for eligible veterans and active-duty military. No private mortgage insurance (PMI) required.',
  },
  {
    name: 'USDA Loans',
    desc: '0% down payment for eligible rural areas. Parts of San Tan Valley, Apache Junction, and Queen Creek may qualify.',
  },
];

const faqs = [
  {
    question: 'How much do I need for a down payment in Arizona?',
    answer: 'It depends on your loan type. Conventional loans require 3-20% down, FHA loans require 3.5%, and VA/USDA loans offer 0% down. Arizona also has DPA programs that can cover part or all of your down payment.',
  },
  {
    question: 'What are the new NAR rules for buyers?',
    answer: 'Following the 2024 NAR settlement, buyers must sign a written buyer-broker agreement before touring homes. Buyer agent compensation is now negotiable and no longer automatically offered through the MLS. Your agent should explain your options and costs upfront.',
  },
  {
    question: 'How much are closing costs for buyers in Arizona?',
    answer: 'Buyer closing costs in Arizona typically run 2-3% of the purchase price. On a $450,000 home, expect $9,000-$13,500 in closing costs including lender fees, title insurance, escrow, and prepaid items.',
  },
];

export default function FirstTimeBuyerPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            First-Time Home Buyer Guide — Arizona
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-light">
            Everything you need to know about buying your first home in the Mesa, AZ metro area.
            Step-by-step process, down payment assistance, and expert guidance.
          </p>
          <FirstTimeBuyerLeadCapture />
        </section>

        {/* Step-by-Step Process */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-text">
              Arizona Home Buying Process
            </h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-text">{step.title}</h3>
                    <p className="text-xs text-text-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NAR Policy Changes */}
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold text-text">
              What the NAR Settlement Means for Buyers
            </h2>
            <p className="mb-4 text-sm text-text-light">
              The 2024 National Association of Realtors (NAR) settlement introduced significant
              changes to how buyer agent compensation works. Here&apos;s what first-time buyers
              need to know:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-text-light">
                  <strong className="text-text">Buyer-broker agreements are now required</strong> before
                  touring homes. This written agreement outlines your agent&apos;s services and compensation.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-text-light">
                  <strong className="text-text">Buyer agent compensation is negotiable.</strong> It&apos;s
                  no longer automatically offered through the MLS. You can negotiate who pays and how much.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-text-light">
                  <strong className="text-text">Sellers may still offer buyer agent compensation</strong> as
                  part of their listing strategy. Your agent can help you understand what&apos;s being offered.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-text-light">
                  <strong className="text-text">You can ask the seller to cover your agent&apos;s fee</strong> as
                  part of your offer. This is a common negotiation strategy, especially in buyer&apos;s markets.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* DPA Programs */}
        <section className="bg-surface px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-text">
              Arizona Down Payment Assistance Programs
            </h2>
            <div className="space-y-4">
              {dpaPrograms.map((program) => (
                <div key={program.name} className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-sm font-semibold text-text">{program.name}</h3>
                  <p className="text-xs text-text-light">{program.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-text-light">
              Program availability and terms change frequently. Verify current eligibility with your lender.
            </p>
          </div>
        </section>

        {/* CTAs */}
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-2xl font-bold text-text">Ready to Take the Next Step?</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/tools/affordability"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
              >
                Affordability Calculator
              </Link>
              <Link
                href="/booking"
                className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
              >
                Schedule a Consultation
              </Link>
              <Link
                href="/tools/offer-writer"
                className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                AI Offer Writer
              </Link>
            </div>
            <p className="mt-4 text-xs text-text-light">
              Also see:{' '}
              <Link href="/buy/lender-costs-explained" className="text-primary underline hover:no-underline">
                Lender Costs Explained
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection items={faqs} title="First-Time Buyer FAQ" />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
