'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Calendar, MessageCircle, ArrowUpCircle } from 'lucide-react';
import { LeadCaptureModal } from './LeadCaptureModal';
import { trackEvent } from '@/lib/tracking';

/**
 * Mobile-only sticky bottom bar with quick contact actions.
 * Full Service button opens lead capture modal with tag.
 */
export function StickyContactBar() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="grid grid-cols-4">
          <a
            href="tel:+14805551234"
            onClick={() => trackEvent('call_click', 'sticky-bar')}
            className="flex flex-col items-center gap-1 py-2 text-xs text-text-light hover:text-primary"
          >
            <Phone className="h-5 w-5" />
            Call
          </a>
          <Link
            href="/booking"
            className="flex flex-col items-center gap-1 py-2 text-xs text-text-light hover:text-primary"
          >
            <Calendar className="h-5 w-5" />
            Book
          </Link>
          <Link
            href="/contact"
            className="flex flex-col items-center gap-1 py-2 text-xs text-text-light hover:text-primary"
          >
            <MessageCircle className="h-5 w-5" />
            Chat
          </Link>
          <button
            onClick={() => {
              trackEvent('full_service_click', 'sticky-bar');
              setModalOpen(true);
            }}
            className="flex flex-col items-center gap-1 py-2 text-xs font-medium text-secondary hover:text-secondary-dark"
          >
            <ArrowUpCircle className="h-5 w-5" />
            Full Service
          </button>
        </div>
      </div>

      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="full-service-request"
        tag="full-service-request"
        headline="Get Full-Service Agent Support"
        subtext="A licensed Mesa-area agent will handle everything."
      />
    </>
  );
}
