'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function OfferGuidanceLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Connect with a Licensed Agent
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Buyer"
        toolSource="offer-guidance"
        tag="offer-guidance"
        headline="Get Expert Contract Help"
        subtext="Connect with a licensed agent or attorney who can review your specific situation."
      />
    </>
  );
}
