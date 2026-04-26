'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function BuyLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Schedule a Free Consultation
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Buyer"
        toolSource="buy-landing"
        tag="buyer-landing"
        headline="Talk to a Buyer's Agent"
        subtext="Get matched with a local Mesa-area agent who knows your target neighborhoods."
      />
    </>
  );
}
