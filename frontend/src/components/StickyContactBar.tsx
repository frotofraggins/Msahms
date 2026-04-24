'use client';

import Link from 'next/link';
import { Phone, Calendar, MessageCircle, ArrowUpCircle } from 'lucide-react';

/**
 * Mobile-only sticky bottom bar with quick contact actions.
 * Visible on screens < 768px (md breakpoint).
 */
export function StickyContactBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
      <div className="grid grid-cols-4">
        <a
          href="tel:+14805551234"
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
        <Link
          href="/sell"
          className="flex flex-col items-center gap-1 py-2 text-xs font-medium text-secondary hover:text-secondary-dark"
        >
          <ArrowUpCircle className="h-5 w-5" />
          Full Service
        </Link>
      </div>
    </div>
  );
}
