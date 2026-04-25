'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const fsboFAQs: FAQItem[] = [
  {
    question: 'What does FSBO mean?',
    answer:
      'FSBO stands for "For Sale By Owner." It means you sell your home without hiring a traditional listing agent, saving thousands in commission fees. You still work with a title company and can offer buyer agent compensation if you choose.',
  },
  {
    question: 'Is selling FSBO legal in Arizona?',
    answer:
      'Yes. Arizona law allows homeowners to sell their property without a real estate agent. You are responsible for disclosures (SPDS), contracts, and compliance with state and federal fair housing laws. MesaHomes provides tools and guidance to help you through the process.',
  },
  {
    question: 'How much can I save selling FSBO?',
    answer:
      'On a $450,000 home, a traditional 5% listing commission would cost $22,500. With FSBO photography and marketing through MesaHomes starting at $299, you could save over $20,000. You may still choose to offer buyer agent compensation (typically 2-3%).',
  },
  {
    question: 'Do I need professional photos for FSBO?',
    answer:
      'Professional photography is the single most impactful investment for FSBO sellers. Listings with professional photos sell 32% faster and for up to 5% more than those with amateur photos. Our FSBO packages include professional photography, drone shots, and virtual tours.',
  },
  {
    question: 'How do I price my FSBO home correctly?',
    answer:
      'Use our free Home Value tool and Seller Net Sheet to get data-driven pricing. Look at recent comparable sales (comps) in your neighborhood, consider days on market trends, and price competitively. Overpricing is the #1 mistake FSBO sellers make.',
  },
  {
    question: 'What disclosures are required in Arizona?',
    answer:
      'Arizona requires sellers to complete a Seller Property Disclosure Statement (SPDS) covering known material facts about the property. You must also provide a lead-based paint disclosure for homes built before 1978. Failure to disclose known defects can result in legal liability.',
  },
  {
    question: 'Can I list on the MLS as a FSBO seller?',
    answer:
      'Yes. MesaHomes offers flat-fee MLS listing for $999 that puts your home on the MLS and syndicates to Zillow, Redfin, Realtor.com, and hundreds of other portals. This gives you the same exposure as a traditional agent listing.',
  },
  {
    question: 'What if I need help with negotiations or contracts?',
    answer:
      'You can upgrade to full-service agent support at any time. MesaHomes offers a flexible model — start with FSBO photography, add flat-fee MLS listing, or upgrade to full-service representation whenever you need it.',
  },
  {
    question: 'How do I handle showings as a FSBO seller?',
    answer:
      'You can schedule and conduct showings yourself, use a lockbox for buyer agent access, or hire a showing service. Tips: keep the home clean and staged, be flexible with scheduling, and let buyers explore without hovering.',
  },
  {
    question: 'What are the risks of selling FSBO?',
    answer:
      'The main risks are pricing incorrectly, inadequate marketing exposure, legal mistakes with contracts/disclosures, and emotional negotiation. MesaHomes tools help mitigate these risks with data-driven pricing, professional marketing, and educational resources.',
  },
];

export function FsboFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {fsboFAQs.map((item, i) => {
        const panelId = `fsbo-faq-panel-${i}`;
        const buttonId = `fsbo-faq-button-${i}`;
        return (
          <div key={i} className="rounded-lg border border-warm-border bg-paper">
            <button
              id={buttonId}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-charcoal"
              aria-expanded={openIndex === i}
              aria-controls={panelId}
            >
              {item.question}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-text-light transition-transform',
                  openIndex === i && 'rotate-180',
                )}
              />
            </button>
            {openIndex === i && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-warm-border/50 px-4 py-3 text-sm text-text-light"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getFsboFAQJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: fsboFAQs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
