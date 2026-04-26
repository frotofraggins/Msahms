'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function FirstTimeBuyerLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Talk to a Buyer&apos;s Agent
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Buyer"
        toolSource="first-time-buyer"
        tag="first-time-buyer"
        headline="Get First-Time Buyer Help"
        subtext="Connect with a local agent who specializes in helping first-time buyers in the Mesa area."
      />
    </>
  );
}
