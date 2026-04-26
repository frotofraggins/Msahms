'use client';

import { useState, useCallback } from 'react';
import { Calculator, DollarSign, Home, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { PropertyDataCard, type PropertyData } from '@/components/PropertyDataCard';
import { NearbyComps, type CompRecord } from '@/components/NearbyComps';
import { ProgressIndicator, type PathStep } from '@/components/ProgressIndicator';
import { WhatsNextCard } from '@/components/WhatsNextCard';
import { FAQSection, type FAQItem } from '@/components/FAQSection';
import { trackEvent } from '@/lib/tracking';

const FLAT_FEE = 999;
const BROKER_FEE = 400;
const TRADITIONAL_RATE = 0.05;
const TITLE_ESCROW_RATE = 0.01;
const AZ_EXCISE_TAX_RATE = 0.0002;

const sellerSteps: PathStep[] = [
  { id: 'home-value', label: 'Home Value', href: '/tools/home-value' },
  { id: 'net-sheet', label: 'Net Sheet', href: '/tools/net-sheet' },
  { id: 'sell-now', label: 'Sell Now?', href: '/tools/sell-now-or-wait' },
  { id: 'listing-prep', label: 'Listing Prep', href: '/tools/listing-generator' },
  { id: 'list-or-upgrade', label: 'List or Upgrade', href: '/compare/flat-fee-vs-traditional-agent' },
];

const faqItems: FAQItem[] = [
  {
    question: 'What is a seller net sheet?',
    answer:
      'A seller net sheet is an estimate of how much money you will receive after all costs of selling your home are deducted from the sale price. It includes commissions, closing costs, title fees, and your remaining mortgage balance.',
  },
  {
    question: 'How much does it cost to sell a house in Arizona?',
    answer:
      'Typical costs include agent commissions (5-6% traditional or flat-fee), title and escrow fees (~1% of sale price), Arizona excise tax ($2 per $1,000), and any outstanding mortgage balance. With MesaHomes flat-fee listing, you can save thousands on commissions.',
  },
  {
    question: "What's the difference between flat fee and traditional?",
    answer:
      'A traditional agent charges 5-6% of the sale price as commission. MesaHomes flat-fee listing is $999 for MLS listing plus a $400 broker fee, potentially saving you tens of thousands of dollars. You can upgrade to full-service at any time.',
  },
  {
    question: 'How are closing costs calculated?',
    answer:
      'Closing costs in Arizona typically include title insurance, escrow fees, recording fees, and the Arizona excise tax. Our net sheet calculator uses county-verified rates to give you an accurate estimate for your specific property.',
  },
];

/** Placeholder property data shown when an address is entered. */
const placeholderProperty: PropertyData = {
  address: '1234 E Main St, Mesa, AZ 85201',
  sqft: 1850,
  floors: 1,
  yearBuilt: 2005,
  lotSize: 0.15,
  lotSizeUnit: 'acres',
  assessedValue: 385000,
  salePrice: 365000,
  saleDate: 'Jun 2022',
  subdivision: 'Sunland Village',
  zipTypicalValue: 448000,
  photoUrl: null,
};

const placeholderComps: CompRecord[] = [
  { address: '1250 E Main St', salePrice: 442000, saleDate: 'Mar 2026', sqft: 1920 },
  { address: '1310 E Main St', salePrice: 435000, saleDate: 'Feb 2026', sqft: 1850 },
  { address: '1198 E Main St', salePrice: 428000, saleDate: 'Jan 2026', sqft: 1780 },
];

export function NetSheetClient() {
  const [address, setAddress] = useState('');
  const [salePrice, setSalePrice] = useState<number>(450000);
  const [mortgage, setMortgage] = useState<number>(200000);
  const [serviceType, setServiceType] = useState<'flat-fee' | 'traditional'>('flat-fee');
  const [calculated, setCalculated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCalculate = useCallback(() => {
    setCalculated(true);
    trackEvent('tool_use', 'net-sheet', { salePrice, mortgage });
  }, [salePrice, mortgage]);

  // Calculations
  const flatFeeCommission = FLAT_FEE + BROKER_FEE;
  const traditionalCommission = Math.round(salePrice * TRADITIONAL_RATE);
  const titleEscrow = Math.round(salePrice * TITLE_ESCROW_RATE);
  const exciseTax = Math.round(salePrice * AZ_EXCISE_TAX_RATE);

  const flatFeeTotal = flatFeeCommission + titleEscrow + exciseTax;
  const traditionalTotal = traditionalCommission + titleEscrow + exciseTax;

  const flatFeeNet = salePrice - mortgage - flatFeeTotal;
  const traditionalNet = salePrice - mortgage - traditionalTotal;
  const savings = traditionalTotal - flatFeeTotal;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const hasAddress = address.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          steps={sellerSteps}
          currentStepId="net-sheet"
          completedStepIds={['home-value']}
        />
      </div>

      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          How Much Will You Walk Away With?
        </h1>
        <p className="text-text-light">
          Calculate your net proceeds from selling your Mesa-area home.
        </p>
      </div>

      {/* Calculator Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-text">
              Property Address
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
              <input
                id="address"
                type="text"
                placeholder="123 E Main St, Mesa, AZ 85201"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sale-price" className="mb-1 block text-sm font-medium text-text">
                Estimated Sale Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="sale-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="mortgage" className="mb-1 block text-sm font-medium text-text">
                Outstanding Mortgage
              </label>
              <div className="relative">
                <TrendingDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                <input
                  id="mortgage"
                  type="number"
                  min={0}
                  step={1000}
                  value={mortgage}
                  onChange={(e) => setMortgage(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-text">Service Type</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="serviceType"
                  value="flat-fee"
                  checked={serviceType === 'flat-fee'}
                  onChange={() => setServiceType('flat-fee')}
                  className="accent-primary"
                />
                Flat Fee ($999)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="serviceType"
                  value="traditional"
                  checked={serviceType === 'traditional'}
                  onChange={() => setServiceType('traditional')}
                  className="accent-primary"
                />
                Traditional Agent (5%)
              </label>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-all duration-100 hover:bg-secondary-dark active:scale-[0.98]"
          >
            <Calculator className="h-4 w-4" />
            Calculate My Net Proceeds
          </button>
        </div>
      </div>

      {/* Teaser Results */}
      {calculated && (
        <div className="mb-8">
          <h2 className="mb-4 text-center text-xl font-bold text-text">
            Your Estimated Net Proceeds
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Flat Fee Column */}
            <div
              className={cn(
                'rounded-xl border-2 p-5',
                serviceType === 'flat-fee' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white',
              )}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-primary">
                Flat Fee (MesaHomes)
              </h3>
              <div className="space-y-2 text-sm">
                <LineItem label="Sale Price" value={fmt(salePrice)} />
                <LineItem label="Mortgage Payoff" value={`-${fmt(mortgage)}`} negative />
                <LineItem label="Commission" value={`-${fmt(flatFeeCommission)}`} negative />
                <LineItem label="Title & Escrow" value={`-${fmt(titleEscrow)}`} negative />
                <LineItem label="AZ Excise Tax" value={`-${fmt(exciseTax)}`} negative />
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-text">Net Proceeds</span>
                    <span className="tabular-nums text-primary">{fmt(flatFeeNet)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traditional Column */}
            <div
              className={cn(
                'rounded-xl border-2 p-5',
                serviceType === 'traditional' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white',
              )}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-text-light">
                Traditional Agent
              </h3>
              <div className="space-y-2 text-sm">
                <LineItem label="Sale Price" value={fmt(salePrice)} />
                <LineItem label="Mortgage Payoff" value={`-${fmt(mortgage)}`} negative />
                <LineItem label="Commission (5%)" value={`-${fmt(traditionalCommission)}`} negative />
                <LineItem label="Title & Escrow" value={`-${fmt(titleEscrow)}`} negative />
                <LineItem label="AZ Excise Tax" value={`-${fmt(exciseTax)}`} negative />
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-text">Net Proceeds</span>
                    <span className="tabular-nums text-text">{fmt(traditionalNet)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings highlight */}
          {savings > 0 && (
            <div className="mt-4 rounded-lg border-2 border-success bg-success/5 p-4 text-center">
              <p className="text-sm text-text-light">With MesaHomes flat-fee listing, you save</p>
              <p className="text-2xl font-bold tabular-nums text-success">{fmt(savings)}</p>
            </div>
          )}

          {/* Progressive disclosure gate */}
          <div className="mt-6 rounded-xl bg-surface p-6 text-center">
            <p className="mb-2 text-sm font-semibold text-text">
              🔒 Get your full net sheet with downloadable PDF
            </p>
            <p className="mb-4 text-xs text-text-light">
              Includes detailed closing cost breakdown, title company estimates, and personalized recommendations.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Unlock Full Report →
            </button>
          </div>
        </div>
      )}

      {/* Property Data Card (placeholder when address entered) */}
      {hasAddress && (
        <div className="mb-6 space-y-4">
          <PropertyDataCard property={placeholderProperty} />
          <NearbyComps comps={placeholderComps} subdivision="Sunland Village" />
        </div>
      )}

      {/* What's Next */}
      {calculated && (
        <div className="mb-8">
          <WhatsNextCard
            title="Should I Sell Now or Wait?"
            explanation="Based on your net proceeds, see if current market conditions favor selling now or waiting for a better time."
            href="/tools/sell-now-or-wait"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection items={faqItems} title="Net Sheet FAQ" />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="net-sheet"
        headline="Unlock Your Full Net Sheet"
        subtext="Get a detailed breakdown with downloadable PDF and personalized agent recommendations."
      />
    </div>
  );
}

function LineItem({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-text-light">{label}</span>
      <span className={cn('tabular-nums', negative ? 'text-error' : 'text-text')}>{value}</span>
    </div>
  );
}
