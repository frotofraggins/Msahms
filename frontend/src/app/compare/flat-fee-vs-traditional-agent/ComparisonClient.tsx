'use client';

import { useState } from 'react';
import { DollarSign, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

const FLAT_FEE = 999;
const BROKER_FEE = 400;
const TRADITIONAL_RATE = 0.05;

interface ServiceFeature {
  feature: string;
  flatFee: boolean | string;
  traditional: boolean | string;
}

const serviceFeatures: ServiceFeature[] = [
  { feature: 'MLS Listing', flatFee: true, traditional: true },
  { feature: 'Professional Photos', flatFee: 'Add-on', traditional: true },
  { feature: 'Yard Sign & Lockbox', flatFee: true, traditional: true },
  { feature: 'Showing Scheduling', flatFee: 'Self-managed', traditional: true },
  { feature: 'Offer Negotiation', flatFee: 'AI-assisted', traditional: true },
  { feature: 'Contract Review', flatFee: 'Add-on', traditional: true },
  { feature: 'Closing Coordination', flatFee: 'Add-on', traditional: true },
  { feature: 'Open Houses', flatFee: false, traditional: true },
  { feature: 'Dedicated Agent', flatFee: 'Upgrade available', traditional: true },
  { feature: 'Price', flatFee: '$999 flat', traditional: '5% commission' },
];

export function ComparisonClient() {
  const [salePrice, setSalePrice] = useState<number>(450000);
  const [modalOpen, setModalOpen] = useState(false);

  const traditionalCost = Math.round(salePrice * TRADITIONAL_RATE);
  const flatFeeCost = FLAT_FEE + BROKER_FEE;
  const savings = traditionalCost - flatFeeCost;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          Flat-Fee vs Traditional Agent
        </h1>
        <p className="text-text-light">
          See exactly how much you save with MesaHomes flat-fee listing compared to a traditional agent.
        </p>
      </div>

      {/* Sale Price Input */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="compare-price" className="mb-2 block text-sm font-medium text-text">
          Enter your estimated sale price
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
          <input
            id="compare-price"
            type="number"
            min={50000}
            step={5000}
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 text-center">
          <div className="text-xs font-medium uppercase text-primary">MesaHomes Flat Fee</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-primary">{fmt(flatFeeCost)}</div>
          <div className="mt-1 text-xs text-text-light">${FLAT_FEE} listing + ${BROKER_FEE} broker</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <div className="text-xs font-medium uppercase text-text-light">Traditional Agent</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-error">{fmt(traditionalCost)}</div>
          <div className="mt-1 text-xs text-text-light">5% of sale price</div>
        </div>
        <div className="rounded-xl border-2 border-success bg-success/5 p-5 text-center">
          <div className="text-xs font-medium uppercase text-success">You Save</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-success">
            {savings > 0 ? fmt(savings) : '$0'}
          </div>
          <div className="mt-1 text-xs text-text-light">with flat-fee listing</div>
        </div>
      </div>

      {/* Service Tier Breakdown */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-3 border-b border-gray-200 bg-surface px-4 py-3">
          <div className="text-sm font-semibold text-text">Feature</div>
          <div className="text-center text-sm font-semibold text-primary">Flat Fee</div>
          <div className="text-center text-sm font-semibold text-text-light">Traditional</div>
        </div>
        {serviceFeatures.map((row) => (
          <div
            key={row.feature}
            className="grid grid-cols-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
          >
            <div className="text-sm text-text">{row.feature}</div>
            <div className="flex justify-center">
              <FeatureValue value={row.flatFee} />
            </div>
            <div className="flex justify-center">
              <FeatureValue value={row.traditional} />
            </div>
          </div>
        ))}
      </div>

      {/* Dollar Savings Highlight */}
      {savings > 0 && (
        <div className="mb-8 rounded-xl border-2 border-success bg-success/5 p-6 text-center">
          <p className="text-sm text-text-light">
            On a {fmt(salePrice)} home, you save
          </p>
          <p className="text-3xl font-bold tabular-nums text-success">{fmt(savings)}</p>
          <p className="mt-1 text-sm text-text-light">
            That&apos;s money back in your pocket at closing.
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/listing/start"
          className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
        >
          Start Flat-Fee Listing →
        </Link>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Request Full-Service Consultation
        </button>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="comparison"
        tag="full-service-request"
        headline="Get Full-Service Agent Support"
        subtext="A licensed Mesa-area agent will handle everything — listing, showings, negotiations, and closing."
      />
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-success" />;
  }
  if (value === false) {
    return <X className="h-4 w-4 text-gray-300" />;
  }
  return <span className="text-xs text-text-light">{value}</span>;
}
