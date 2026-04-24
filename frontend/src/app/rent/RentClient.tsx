'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

export function RentLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Get Rental Help
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Renter"
        toolSource="rent-landing"
        tag="renter-landing"
        headline="Find Your Next Rental"
        subtext="Tell us what you're looking for and we'll connect you with available properties."
      />
    </>
  );
}
