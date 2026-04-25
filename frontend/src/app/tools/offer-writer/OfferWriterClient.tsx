'use client';

import { useState, useCallback } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { trackEvent } from '@/lib/tracking';
import Link from 'next/link';

const FINANCING_TYPES = ['Conventional', 'FHA', 'VA', 'Cash', 'USDA'];
const CONTINGENCIES = [
  'Inspection',
  'Appraisal',
  'Financing',
  'Sale of Current Home',
  'Title Review',
];

const LEGAL_DISCLAIMER =
  'This is for educational purposes only, not legal advice. This tool generates a draft for informational purposes. Consult a licensed real estate attorney or agent before submitting any offer.';

export function OfferWriterClient() {
  const [address, setAddress] = useState('');
  const [offeredPrice, setOfferedPrice] = useState<number>(425000);
  const [earnestMoney, setEarnestMoney] = useState<number>(5000);
  const [financingType, setFinancingType] = useState('Conventional');
  const [selectedContingencies, setSelectedContingencies] = useState<string[]>([
    'Inspection',
    'Appraisal',
    'Financing',
  ]);
  const [closingDate, setClosingDate] = useState('');
  const [previewed, setPreviewed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePreview = useCallback(() => {
    trackEvent('tool_use', 'offer-writer');
    setPreviewed(true);
  }, []);

  function toggleContingency(c: string) {
    setSelectedContingencies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Legal Disclaimer — always visible */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
        <p className="text-xs text-text-light">{LEGAL_DISCLAIMER}</p>
      </div>

      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          AI Offer Writer
        </h1>
        <p className="text-text-light">
          Draft a purchase offer for your Mesa-area home purchase. Preview key terms instantly.
        </p>
      </div>

      {/* Input Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="property-address" className="mb-1 block text-sm font-medium text-text">
              Property Address
            </label>
            <input
              id="property-address"
              type="text"
              placeholder="123 E Main St, Mesa, AZ 85201"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="offered-price" className="mb-1 block text-sm font-medium text-text">
                Offered Price
              </label>
              <input
                id="offered-price"
                type="number"
                min={0}
                step={1000}
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="earnest-money" className="mb-1 block text-sm font-medium text-text">
                Earnest Money Deposit
              </label>
              <input
                id="earnest-money"
                type="number"
                min={0}
                step={500}
                value={earnestMoney}
                onChange={(e) => setEarnestMoney(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="financing-type" className="mb-1 block text-sm font-medium text-text">
                Financing Type
              </label>
              <select
                id="financing-type"
                value={financingType}
                onChange={(e) => setFinancingType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {FINANCING_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="closing-date" className="mb-1 block text-sm font-medium text-text">
                Desired Closing Date
              </label>
              <input
                id="closing-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-text">Contingencies</span>
            <div className="flex flex-wrap gap-2">
              {CONTINGENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleContingency(c)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedContingencies.includes(c)
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-light hover:bg-gray-200',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePreview}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
          >
            <FileText className="h-4 w-4" />
            Preview Offer Terms
          </button>
        </div>
      </div>

      {/* Preview — key terms without contact info */}
      {previewed && (
        <div className="mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-text">Offer Summary</h2>
            <div className="space-y-3 text-sm">
              <SummaryRow label="Property" value={address || 'Not specified'} />
              <SummaryRow label="Offered Price" value={fmt(offeredPrice)} />
              <SummaryRow label="Earnest Money" value={fmt(earnestMoney)} />
              <SummaryRow label="Financing" value={financingType} />
              <SummaryRow label="Contingencies" value={selectedContingencies.join(', ') || 'None'} />
              <SummaryRow label="Closing Date" value={closingDate || 'Not specified'} />
            </div>
          </div>

          {/* Progressive disclosure for full draft */}
          <div className="mt-6 rounded-xl bg-surface p-6 text-center">
            <p className="mb-2 text-sm font-semibold text-text">
              🔒 Get the full offer draft
            </p>
            <p className="mb-4 text-xs text-text-light">
              Includes complete offer language, addenda, and agent review.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Unlock Full Draft →
            </button>
          </div>

          {/* Full Service Upgrade CTA */}
          <div className="mt-6 rounded-xl border-2 border-primary bg-primary/5 p-6 text-center">
            <h3 className="mb-2 text-lg font-bold text-primary">Want an Agent to Handle Your Offer?</h3>
            <p className="mb-4 text-sm text-text-light">
              A licensed MesaHomes agent can negotiate on your behalf, review contracts, and guide you through closing.
            </p>
            <Link
              href="/booking"
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              Talk to an Agent →
            </Link>
          </div>
        </div>
      )}

      {/* Legal Disclaimer — bottom */}
      <div className="mt-8 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
        <p className="text-xs text-text-light">{LEGAL_DISCLAIMER}</p>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Buyer"
        toolSource="offer-writer"
        headline="Unlock Your Full Offer Draft"
        subtext="Get the complete offer document with legal language and agent review."
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2">
      <span className="font-medium text-text">{label}</span>
      <span className="text-text-light">{value}</span>
    </div>
  );
}
