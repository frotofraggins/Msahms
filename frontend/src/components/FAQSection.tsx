'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
}

/**
 * Expandable FAQ accordion with Schema.org FAQPage JSON-LD markup.
 *
 * Outputs structured data for Google rich results.
 */
export function FAQSection({ items, title = 'Frequently Asked Questions' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Schema.org FAQPage structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-text">{title}</h2>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text"
                aria-expanded={openIndex === i}
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
                <div className="border-t border-gray-100 px-4 py-3 text-sm text-text-light">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
