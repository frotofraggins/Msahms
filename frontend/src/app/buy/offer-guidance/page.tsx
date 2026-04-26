import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { OfferGuidanceLeadCapture } from './OfferGuidanceClient';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offer Guidance & Contract Education',
  description:
    'Educational guides for Arizona real estate contracts: Purchase Contract, SPDS, BINSR, and buyer-broker agreements. Not legal advice.',
  alternates: { canonical: 'https://mesahomes.com/buy/offer-guidance' },
  openGraph: {
    title: 'Offer Guidance & Contract Education | MesaHomes',
    description: 'Understand Arizona real estate contracts — purchase agreements, SPDS, BINSR, and more.',
    url: 'https://mesahomes.com/buy/offer-guidance',
  },
};

function LegalDisclaimer() {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-warning bg-yellow-50 p-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <p className="text-xs text-text-light">
        <strong className="text-text">Disclaimer:</strong> This is for educational purposes only,
        not legal advice. Consult a licensed real estate agent or attorney for guidance on your
        specific situation.
      </p>
    </div>
  );
}

const sections = [
  {
    id: 'purchase-contract',
    title: 'Arizona Purchase Contract',
    content: [
      {
        heading: 'What Is It?',
        text: 'The Arizona Association of Realtors (AAR) Residential Resale Real Estate Purchase Contract is the standard form used for most home purchases in Arizona. It outlines the terms of the sale including price, financing, contingencies, and timelines.',
      },
      {
        heading: 'Key Sections to Understand',
        items: [
          'Purchase price and earnest money deposit amount',
          'Financing contingency — your right to cancel if you can\'t get a loan',
          'Inspection period — typically 10 days to complete inspections',
          'Close of escrow date — when the sale is finalized',
          'Seller concessions — credits toward your closing costs',
          'Personal property inclusions/exclusions (appliances, fixtures)',
        ],
      },
      {
        heading: 'Common Mistakes',
        text: 'Waiving the inspection contingency to make your offer more competitive can be risky. Missing deadlines in the contract can cause you to lose your earnest money. Always track your contract timelines carefully.',
      },
    ],
  },
  {
    id: 'spds',
    title: 'Seller Property Disclosure Statement (SPDS)',
    content: [
      {
        heading: 'What Is It?',
        text: 'The SPDS is a detailed questionnaire that sellers complete to disclose known issues with the property. Arizona law requires sellers to disclose material facts that could affect the property\'s value or desirability.',
      },
      {
        heading: 'What to Look For',
        items: [
          'Previous water damage, flooding, or mold issues',
          'Roof age and any known leaks',
          'HVAC system age and condition',
          'Pest history (termites are common in Arizona)',
          'HOA violations or pending assessments',
          'Neighborhood nuisances or planned developments',
          'Previous insurance claims',
        ],
      },
      {
        heading: 'Red Flags',
        text: 'Pay attention to vague answers like "unknown" on items the seller should reasonably know about. If the SPDS reveals significant issues, discuss them with your agent and inspector before proceeding.',
      },
    ],
  },
  {
    id: 'binsr',
    title: 'Buyer Inspection Notice and Seller Response (BINSR)',
    content: [
      {
        heading: 'What Is It?',
        text: 'The BINSR is the formal document you use to request repairs or credits after your home inspection. It\'s one of the most important negotiation tools in the Arizona home buying process.',
      },
      {
        heading: 'Your Options',
        items: [
          'Accept the property in its current condition (no repairs requested)',
          'Request specific repairs be completed before closing',
          'Request a credit toward closing costs in lieu of repairs',
          'Cancel the contract within the inspection period (with earnest money returned)',
        ],
      },
      {
        heading: 'Strategy Tips',
        text: 'Focus on significant issues — structural, safety, and major systems (roof, HVAC, plumbing, electrical). Cosmetic issues are generally not worth negotiating. Your agent can help you prioritize what to request.',
      },
    ],
  },
  {
    id: 'buyer-broker',
    title: 'Buyer-Broker Agreement',
    content: [
      {
        heading: 'What Is It?',
        text: 'Following the 2024 NAR settlement, buyers must sign a written buyer-broker agreement before touring homes with an agent. This agreement outlines the agent\'s services, compensation, and the duration of the relationship.',
      },
      {
        heading: 'Key Terms to Understand',
        items: [
          'Duration — how long the agreement lasts (negotiate a shorter term if unsure)',
          'Compensation — how much the agent will be paid and by whom',
          'Exclusivity — whether you can work with other agents simultaneously',
          'Termination — how either party can end the agreement',
          'Services provided — what the agent will do for you',
        ],
      },
      {
        heading: 'What Changed with NAR Settlement',
        text: 'Previously, buyer agent compensation was typically offered by the seller through the MLS. Now, compensation must be negotiated directly. You can still ask the seller to cover your agent\'s fee as part of your offer, but it\'s no longer automatic.',
      },
    ],
  },
];

export default function OfferGuidancePage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* Hero */}
        <section className="bg-white px-4 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-text md:text-4xl">
            Offer Guidance & Contract Education
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-text-light">
            Understand the key documents in an Arizona real estate transaction.
            Section-by-section guides for purchase contracts, disclosures, and more.
          </p>
          <LegalDisclaimer />
        </section>

        {/* Contract Sections */}
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="border-t border-gray-100 bg-white px-4 py-12"
          >
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold text-text">{section.title}</h2>

              <LegalDisclaimer />

              {section.content.map((block, i) => (
                <div key={i} className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold text-text">{block.heading}</h3>
                  {block.text && (
                    <p className="text-sm text-text-light">{block.text}</p>
                  )}
                  {block.items && (
                    <ul className="mt-2 space-y-1 pl-5">
                      {block.items.map((item, j) => (
                        <li key={j} className="list-disc text-sm text-text-light">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* CTA on every section */}
              <div className="mt-6 rounded-xl bg-surface p-5 text-center">
                <p className="mb-3 text-sm text-text-light">
                  Need help with your specific situation?
                </p>
                <OfferGuidanceLeadCapture />
              </div>
            </div>
          </section>
        ))}
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
