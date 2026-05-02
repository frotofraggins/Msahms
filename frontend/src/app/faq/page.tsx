import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { FAQSection } from '@/components/FAQSection';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about buying, selling, flat-fee listing, FSBO, and real estate costs in Mesa, AZ.',
  alternates: { canonical: 'https://mesahomes.com/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | MesaHomes',
    description:
      'Everything you need to know about buying, selling, and flat-fee real estate in Mesa, AZ.',
    url: 'https://mesahomes.com/faq',
  },
};

const generalFAQs = [
  {
    question: 'What is MesaHomes?',
    answer:
      'MesaHomes is a hyper-local Mesa real estate platform serving Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction. We offer free seller and buyer tools, Mesa Listing Service (our $999 flat-fee MLS option), FSBO photography packages, and full-service agent support.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We serve the East Valley of the Phoenix metro area including Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction. Our agents are licensed in Arizona and specialize in these communities.',
  },
  {
    question: 'Are your tools really free?',
    answer:
      'Yes. Our seller net sheet, affordability calculator, home value estimates, AI listing generator, and market data tools are completely free to use. No credit card or commitment required.',
  },
  {
    question: 'How do I contact MesaHomes?',
    answer:
      'You can schedule a free consultation through our booking page, use any of our tools to connect with an agent, or call us directly. We respond to all inquiries within 24 hours.',
  },
];

const sellerFAQs = [
  {
    question: 'How does flat-fee MLS listing work?',
    answer:
      'You pay a $999 flat fee to list your home on the MLS (Multiple Listing Service). Your listing then syndicates to Zillow, Realtor.com, Redfin, Trulia, Homes.com, and hundreds of other portals — the same exposure traditional agents provide. There is an additional $400 broker transaction fee at closing.',
  },
  {
    question: 'What is the difference between flat-fee and FSBO?',
    answer:
      'FSBO (For Sale By Owner) means selling without any agent involvement. Flat-fee MLS listing puts your home on the MLS for a fixed price instead of a percentage commission. You can combine both — sell FSBO with flat-fee MLS listing for maximum exposure at minimum cost.',
  },
  {
    question: 'Can I upgrade from flat-fee to full-service?',
    answer:
      'Yes. You can start with flat-fee listing and upgrade to full-service agent support at any time. Our agents handle showings, negotiations, contracts, and closing coordination.',
  },
  {
    question: 'What disclosures do I need to provide as a seller?',
    answer:
      'Arizona requires a Seller Property Disclosure Statement (SPDS) covering known material facts about the property. Homes built before 1978 also require a lead-based paint disclosure. Your agent or our resources can guide you through the process.',
  },
];

const buyerFAQs = [
  {
    question: 'Do I need a buyer\'s agent?',
    answer:
      'While not legally required, a buyer\'s agent provides valuable guidance on pricing, negotiations, inspections, and contracts. Following recent NAR policy changes, buyer agent compensation is negotiable and must be agreed upon before touring homes.',
  },
  {
    question: 'What is a buyer-broker agreement?',
    answer:
      'A buyer-broker agreement is a contract between you and your agent that outlines the services they will provide and how they will be compensated. Since the 2024 NAR settlement, these agreements are required before an agent can show you homes.',
  },
  {
    question: 'How much do I need for a down payment?',
    answer:
      'Down payment requirements vary by loan type: Conventional loans require 3-20%, FHA loans require 3.5%, VA loans require 0%, and USDA loans require 0%. Arizona also offers down payment assistance programs like Home Plus (up to 5%) and Pathway to Purchase.',
  },
  {
    question: 'What are closing costs for buyers in Arizona?',
    answer:
      'Buyers in Arizona typically pay 2-3% of the purchase price in closing costs, including loan origination fees, appraisal, title insurance, escrow fees, and prepaid items (taxes, insurance). You can negotiate seller concessions to help cover these costs.',
  },
];

const flatFeeFAQs = [
  {
    question: 'What does the $999 flat fee include?',
    answer:
      'The flat fee covers full MLS listing, syndication to all major portals (Zillow, Redfin, Realtor.com, etc.), listing management through closing, and professional photography coordination. There is an additional $400 broker transaction fee at closing.',
  },
  {
    question: 'How much can I save with flat-fee listing?',
    answer:
      'On a $450,000 home, a traditional 5% commission would cost $22,500. With Mesa Listing Service ($999 + $400 broker fee), your total listing cost is $1,399 — saving you over $21,000.',
  },
  {
    question: 'Will my home appear on Zillow and Redfin?',
    answer:
      'Yes. Once listed on the MLS, your home automatically syndicates to Zillow, Redfin, Realtor.com, Trulia, Homes.com, and hundreds of other real estate portals within hours.',
  },
  {
    question: 'Do I still need to offer buyer agent compensation?',
    answer:
      'Following the 2024 NAR settlement, buyer agent compensation is no longer required on the MLS. However, offering competitive compensation can attract more buyer agents and potentially sell your home faster. We help you understand your options.',
  },
];

const legalCostFAQs = [
  {
    question: 'What is the Arizona excise tax?',
    answer:
      'Arizona charges an excise tax (also called a transfer tax) of $2 per $1,000 of the sale price. On a $450,000 home, this would be $900. This is typically paid by the seller at closing.',
  },
  {
    question: 'Do I need a real estate attorney in Arizona?',
    answer:
      'Arizona does not require a real estate attorney for residential transactions. Title companies handle escrow, title search, and closing. However, consulting an attorney is recommended for complex situations like estate sales, divorces, or unusual contract terms.',
  },
  {
    question: 'What is title insurance and do I need it?',
    answer:
      'Title insurance protects against claims on the property\'s title (liens, ownership disputes, etc.). In Arizona, the seller typically pays for the owner\'s title policy, and the buyer pays for the lender\'s policy. It is a one-time fee paid at closing.',
  },
  {
    question: 'How are property taxes handled at closing?',
    answer:
      'Property taxes in Arizona are prorated at closing. The seller pays taxes for the portion of the year they owned the home, and the buyer pays for the remainder. Maricopa County property taxes are typically 0.6-0.8% of assessed value annually.',
  },
];

const allFAQs = [
  ...generalFAQs,
  ...sellerFAQs,
  ...buyerFAQs,
  ...flatFeeFAQs,
  ...legalCostFAQs,
];

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFAQs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

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

        {/* Hero */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-16 text-center">
            <h1
              className="mb-4 font-heading font-bold text-charcoal"
              style={{ fontSize: 'var(--text-hero)' }}
            >
              Frequently Asked Questions
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-light">
              Everything you need to know about buying, selling, and flat-fee real estate
              in the Mesa, AZ metro area.
            </p>
          </section>
        </FadeInOnScroll>

        {/* General */}
        <FadeInOnScroll>
          <FAQSection items={generalFAQs} title="General" />
        </FadeInOnScroll>

        {/* Sellers */}
        <FadeInOnScroll delay={100}>
          <FAQSection items={sellerFAQs} title="Sellers" />
        </FadeInOnScroll>

        {/* Buyers */}
        <FadeInOnScroll delay={200}>
          <FAQSection items={buyerFAQs} title="Buyers" />
        </FadeInOnScroll>

        {/* Flat-Fee */}
        <FadeInOnScroll delay={300}>
          <FAQSection items={flatFeeFAQs} title="Flat-Fee Listing" />
        </FadeInOnScroll>

        {/* Legal & Costs */}
        <FadeInOnScroll delay={400}>
          <FAQSection items={legalCostFAQs} title="Legal & Costs" />
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
