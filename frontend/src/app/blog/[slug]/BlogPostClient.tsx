'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function BlogLeadCapture({ topic }: { topic: string }) {
  const [modalOpen, setModalOpen] = useState(false);

  const isSelling = topic === 'selling' || topic === 'market-update';
  const leadType = isSelling ? 'Seller' : 'Buyer';
  const headline = isSelling
    ? 'Get Your Free Home Valuation'
    : 'Talk to a Local Agent';
  const subtext = isSelling
    ? 'Find out what your home is worth in today\'s market.'
    : 'Get matched with an agent who knows your target area.';

  return (
    <div className="mt-8 rounded-xl border-2 border-primary bg-surface p-6 text-center">
      <h3 className="mb-2 text-lg font-bold text-text">{headline}</h3>
      <p className="mb-4 text-sm text-text-light">{subtext}</p>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Get Started Free
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType={leadType}
        toolSource={`blog-${topic}`}
        tag={`blog-${topic}`}
        headline={headline}
        subtext={subtext}
      />
    </div>
  );
}
