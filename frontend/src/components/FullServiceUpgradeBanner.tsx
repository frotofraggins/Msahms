'use client';

import { useState } from 'react';
import { LeadCaptureModal } from './LeadCaptureModal';

/**
 * Persistent green banner displayed on every page.
 * Opens lead capture modal with tag="full-service-request" on click.
 */
export function FullServiceUpgradeBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-primary px-4 py-3 text-center text-sm text-white">
        <span className="mr-2">Want a licensed agent to handle everything?</span>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-block rounded-md bg-white px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-gray-100"
        >
          Switch to Full Service
        </button>
      </div>

      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="full-service-request"
        tag="full-service-request"
        headline="Get Full-Service Agent Support"
        subtext="A licensed Mesa-area agent will handle everything — listing, showings, negotiations, and closing."
      />
    </>
  );
}
