'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Home,
  Users,
  Check,
  Star,
  Sparkles,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { SYNDICATION_PORTALS } from '@mesahomes/lib/brokerage';

// ---------------------------------------------------------------------------
// Feature flag — read at render time from NEXT_PUBLIC_ env
// ---------------------------------------------------------------------------

const LISTINGS_PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED === 'true';

// ---------------------------------------------------------------------------
// FSBO package data
// ---------------------------------------------------------------------------

const fsboPackages = [
  {
    name: 'Starter',
    price: 299,
    features: [
      'Professional photos (up to 25)',
      'Floor plan',
      'Yard sign',
      'FSBO listing upload',
      'MesaHomes seller tools',
      'PDF flyer',
    ],
    duration: '30 days',
  },
  {
    name: 'Standard',
    price: 549,
    features: [
      'Everything in Starter',
      'Drone aerial photos',
      '3D virtual tour',
      'Twilight photo',
      '60-day listing period',
    ],
    duration: '60 days',
    popular: true,
  },
  {
    name: 'Pro',
    price: 899,
    features: [
      'Everything in Standard',
      'Property video walkthrough',
      'Virtual staging (3 rooms)',
      'Listing consultation',
      'AI listing description',
      '90-day listing period',
    ],
    duration: '90 days',
  },
];

// ---------------------------------------------------------------------------
// Comparison table data
// ---------------------------------------------------------------------------

const comparisonRows = [
  { feature: 'Professional photography', fsbo: true, flatFee: true, fullService: true },
  { feature: 'Floor plan', fsbo: true, flatFee: true, fullService: true },
  { feature: 'Yard sign', fsbo: true, flatFee: true, fullService: true },
  { feature: 'PDF flyer', fsbo: true, flatFee: true, fullService: true },
  { feature: 'MesaHomes seller tools', fsbo: true, flatFee: true, fullService: true },
  { feature: 'Drone aerial photos', fsbo: 'Standard+', flatFee: true, fullService: true },
  { feature: '3D virtual tour', fsbo: 'Standard+', flatFee: true, fullService: true },
  { feature: 'Virtual staging', fsbo: 'Pro only', flatFee: false, fullService: true },
  { feature: 'Property video', fsbo: 'Pro only', flatFee: false, fullService: true },
  { feature: 'AI listing description', fsbo: 'Pro only', flatFee: true, fullService: true },
  { feature: 'Full MLS syndication', fsbo: false, flatFee: true, fullService: true },
  { feature: 'Zillow / Realtor.com / Redfin', fsbo: false, flatFee: true, fullService: true },
  { feature: 'Agent-managed showings', fsbo: false, flatFee: false, fullService: true },
  { feature: 'Offer negotiation', fsbo: false, flatFee: false, fullService: true },
  { feature: 'Closing coordination', fsbo: false, flatFee: false, fullService: true },
];

// ---------------------------------------------------------------------------
// ListingTierCards
// ---------------------------------------------------------------------------

export function ListingTierCards() {
  const [flatFeeModalOpen, setFlatFeeModalOpen] = useState(false);
  const [fullServiceModalOpen, setFullServiceModalOpen] = useState(false);

  return (
    <section className="bg-surface px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        {/* ── FSBO Tier ── */}
        <div className="relative flex flex-col rounded-xl border-2 border-primary bg-white p-6 shadow-sm">
          <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
            Available Now
          </span>
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text">List on Your Own (FSBO)</h2>
          </div>
          <p className="mb-4 text-sm text-text-light">
            Professional photography &amp; marketing materials via Virtual Home Zone.
            You handle the sale — we make your home look amazing.
          </p>

          {/* Sub-packages */}
          <div className="mb-6 space-y-4">
            {fsboPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={cn(
                  'rounded-lg border p-4',
                  pkg.popular
                    ? 'border-secondary bg-secondary/5'
                    : 'border-gray-200',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{pkg.name}</span>
                    {pkg.popular && (
                      <span className="flex items-center gap-0.5 rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                        <Star className="h-3 w-3" /> Popular
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-primary">${pkg.price}</span>
                </div>
                <ul className="space-y-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-text-light">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-text-light">Listing period: {pkg.duration}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <Link
              href="/listing/fsbo"
              className="block w-full rounded-lg bg-secondary py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* ── Flat-Fee MLS Tier ── */}
        <div className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span
            className={cn(
              'absolute -top-3 left-4 rounded-full px-3 py-0.5 text-xs font-semibold text-white',
              LISTINGS_PAYMENT_ENABLED ? 'bg-primary' : 'bg-gray-400',
            )}
          >
            {LISTINGS_PAYMENT_ENABLED ? 'Available Now' : 'Coming Soon'}
          </span>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text">Flat-Fee MLS Listing</h2>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">$999</span>
            <span className="ml-1 text-sm text-text-light">+ $400 broker fee</span>
          </div>
          <p className="mb-4 text-sm text-text-light">
            Full MLS syndication — your listing appears on{' '}
            {SYNDICATION_PORTALS.join(', ')}, and hundreds more. Same exposure as
            traditional agent listings.
          </p>
          <ul className="mb-6 space-y-2">
            {[
              'Full ARMLS MLS listing',
              'Syndication to all major portals',
              'Professional photography coordination',
              'Listing management through closing',
              'MesaHomes seller tools & support',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-light">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            {LISTINGS_PAYMENT_ENABLED ? (
              <Link
                href="/listing/start"
                className="block w-full rounded-lg bg-secondary py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
              >
                Start Flat-Fee Listing
              </Link>
            ) : (
              <button
                onClick={() => setFlatFeeModalOpen(true)}
                className="w-full rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
              >
                Join the Waitlist
              </button>
            )}
          </div>
        </div>

        {/* ── Full-Service Agent Tier ── */}
        <div className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="absolute -top-3 left-4 rounded-full bg-gray-400 px-3 py-0.5 text-xs font-semibold text-white">
            Coming Soon
          </span>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text">Full-Service Agent</h2>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">Commission</span>
            <span className="ml-1 text-sm text-text-light">based</span>
          </div>
          <p className="mb-4 text-sm text-text-light">
            A licensed Mesa-area agent handles everything — pricing, photography,
            MLS listing, showings, negotiations, and closing.
          </p>
          <ul className="mb-6 space-y-2">
            {[
              'Everything in Flat-Fee MLS',
              'Dedicated licensed agent',
              'Pricing strategy & CMA',
              'Showing coordination',
              'Offer negotiation & closing',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-light">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <button
              onClick={() => setFullServiceModalOpen(true)}
              className="w-full rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Request Full-Service Info
            </button>
          </div>
        </div>
      </div>

      {/* Lead capture modals */}
      <LeadCaptureModal
        open={flatFeeModalOpen}
        onClose={() => setFlatFeeModalOpen(false)}
        leadType="Seller"
        toolSource="flat-fee-listing"
        tag="flat-fee-waitlist"
        headline="Join the Flat-Fee MLS Waitlist"
        subtext="We'll notify you as soon as flat-fee MLS listings go live. No commitment."
      />
      <LeadCaptureModal
        open={fullServiceModalOpen}
        onClose={() => setFullServiceModalOpen(false)}
        leadType="Seller"
        toolSource="full-service-request"
        tag="full-service-request"
        headline="Get Full-Service Agent Support"
        subtext="A licensed Mesa-area agent will handle everything — listing, showings, negotiations, and closing."
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// ComparisonTable
// ---------------------------------------------------------------------------

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" />;
  }
  if (value === false) {
    return <span className="text-gray-300" aria-label="Not included">—</span>;
  }
  return <span className="text-xs text-text-light">{value}</span>;
}

export function ComparisonTable() {
  return (
    <section className="bg-white px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-text">
          Compare Plans
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4 text-left font-medium text-text">Feature</th>
                <th className="px-4 py-3 text-center font-medium text-text">
                  <div className="flex flex-col items-center">
                    <Camera className="mb-1 h-4 w-4 text-primary" />
                    FSBO
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-medium text-text">
                  <div className="flex flex-col items-center">
                    <Building2 className="mb-1 h-4 w-4 text-primary" />
                    Flat-Fee MLS
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-medium text-text">
                  <div className="flex flex-col items-center">
                    <Users className="mb-1 h-4 w-4 text-primary" />
                    Full-Service
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-text-light">{row.feature}</td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.fsbo} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.flatFee} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.fullService} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-text-light">
          FSBO features vary by package (Starter / Standard / Pro).
          Flat-fee and full-service tiers include professional photography.
        </p>
      </div>
    </section>
  );
}
