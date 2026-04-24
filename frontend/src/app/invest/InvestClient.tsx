'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function InvestLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Talk to an Investment Specialist
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Investor"
        toolSource="invest-landing"
        tag="investor-landing"
        headline="Explore Investment Opportunities"
        subtext="Connect with a local agent who specializes in Mesa-area investment properties."
      />
    </>
  );
}
