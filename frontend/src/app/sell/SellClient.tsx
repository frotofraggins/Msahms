'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

const SYNDICATION_PORTALS = ['Zillow', 'Realtor.com', 'Redfin', 'Trulia', 'Homes.com'];

/** Flat fee amount. */
const FLAT_FEE = 999;
/** Broker transaction fee. */
const BROKER_FEE = 400;
/** Traditional agent commission rate. */
const TRADITIONAL_RATE = 0.05;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function SellHeroLeadCapture() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-lg bg-secondary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
      >
        Get Started — List for $999
      </button>
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="sell-landing"
        tag="seller-landing"
        headline="Start Your Flat-Fee Listing"
        subtext="Tell us about your home and a local agent will reach out within 24 hours."
      />
    </>
  );
}

export function SellSavingsCalculator() {
  const [price, setPrice] = useState<number>(450000);

  const traditionalCost = Math.round(price * TRADITIONAL_RATE);
  const flatFeeCost = FLAT_FEE + BROKER_FEE;
  const savings = traditionalCost - flatFeeCost;

  return (
    <section className="bg-surface px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-2 text-2xl font-bold text-text">
          See how much you&apos;d save
        </h2>
        <p className="mb-6 text-text-light">
          Enter your estimated sale price to compare costs instantly.
        </p>

        <div className="mb-6">
          <label htmlFor="sell-price" className="sr-only">
            Estimated sale price
          </label>
          <input
            id="sell-price"
            type="range"
            min={100000}
            max={1500000}
            step={10000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-2 text-lg font-semibold tabular-nums text-primary">
            {fmt(price)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-text-light">Traditional Agent</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-error">{fmt(traditionalCost)}</div>
            <div className="text-xs text-text-light">5% commission</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-text-light">MesaHomes Flat Fee</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-primary">{fmt(flatFeeCost)}</div>
            <div className="text-xs text-text-light">${FLAT_FEE} + ${BROKER_FEE} broker</div>
          </div>
          <div className="rounded-lg border-2 border-success bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase text-success">You Save</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-success">
              {savings > 0 ? fmt(savings) : '$0'}
            </div>
          </div>
        </div>

        {/* Portal syndication message */}
        <p className="mt-6 text-sm text-text-light">
          Your listing appears on the same portals as traditional agent listings:{' '}
          <span className="font-medium text-text">
            {SYNDICATION_PORTALS.join(' · ')}
          </span>
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/listing/start"
            className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
          >
            Start Your Flat-Fee Listing
          </Link>
          <Link
            href="/compare/flat-fee-vs-traditional-agent"
            className="text-sm font-medium text-primary underline hover:no-underline"
          >
            See Full Comparison
          </Link>
        </div>
      </div>
    </section>
  );
}
