'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';

interface MarketIndicator {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

const placeholderIndicators: MarketIndicator[] = [
  {
    label: 'Median Home Value',
    value: '$448,000',
    trend: 'down',
    description: 'Down 2.4% year-over-year in Mesa',
  },
  {
    label: 'Days on Market',
    value: '60 days',
    trend: 'up',
    description: 'Up from 55 days last quarter',
  },
  {
    label: 'Sale-to-List Ratio',
    value: '97.7%',
    trend: 'down',
    description: 'Sellers getting slightly less than asking',
  },
  {
    label: 'Active Inventory',
    value: '25,524',
    trend: 'up',
    description: 'More homes available for buyers',
  },
  {
    label: 'Mortgage Rates',
    value: '6.5%',
    trend: 'neutral',
    description: 'Holding steady, may decrease later this year',
  },
  {
    label: 'New Listings',
    value: '3,200/mo',
    trend: 'up',
    description: 'More sellers entering the market',
  },
];

export function SellNowClient() {
  const [zip, setZip] = useState('');
  const [homeValue, setHomeValue] = useState<number>(450000);
  const [analyzed, setAnalyzed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAnalyze = useCallback(() => {
    setAnalyzed(true);
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          Should I Sell Now or Wait?
        </h1>
        <p className="text-text-light">
          Analyze current market conditions for your Mesa-area ZIP code.
        </p>
      </div>

      {/* Input Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="zip" className="mb-1 block text-sm font-medium text-text">
                ZIP Code
              </label>
              <input
                id="zip"
                type="text"
                placeholder="85201"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="home-value" className="mb-1 block text-sm font-medium text-text">
                Estimated Home Value
              </label>
              <input
                id="home-value"
                type="number"
                min={0}
                step={5000}
                value={homeValue}
                onChange={(e) => setHomeValue(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
          >
            <BarChart3 className="h-4 w-4" />
            Analyze Market Conditions
          </button>
        </div>
      </div>

      {/* Analysis Display */}
      {analyzed && (
        <div className="mb-8">
          {/* Summary */}
          <div className="mb-6 rounded-xl bg-primary/5 p-6 text-center">
            <p className="text-sm font-medium text-primary">Market Analysis for ZIP {zip || '85201'}</p>
            <p className="mt-2 text-lg font-bold text-text">
              Current conditions suggest a <span className="text-primary">balanced market</span>
            </p>
            <p className="mt-1 text-sm text-text-light">
              Your estimated home value of {fmt(homeValue)} is in line with recent sales in this area.
            </p>
          </div>

          {/* Market Indicators */}
          <h2 className="mb-4 text-lg font-bold text-text">Market Indicators</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {placeholderIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-text-light">
                    {indicator.label}
                  </span>
                  {indicator.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                  {indicator.trend === 'down' && <TrendingDown className="h-4 w-4 text-error" />}
                  {indicator.trend === 'neutral' && <Clock className="h-4 w-4 text-text-light" />}
                </div>
                <div className="text-xl font-bold tabular-nums text-primary">
                  {indicator.value}
                </div>
                <p className="mt-1 text-xs text-text-light">{indicator.description}</p>
              </div>
            ))}
          </div>

          {/* CTA: Request personalized consultation */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center">
            <h3 className="mb-2 text-lg font-bold text-text">
              Want a Personalized Market Consultation?
            </h3>
            <p className="mb-4 text-sm text-text-light">
              A local MesaHomes agent can analyze your specific situation, neighborhood trends, and timing strategy.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
            >
              Request Free Consultation →
            </button>
          </div>
        </div>
      )}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leadType="Seller"
        toolSource="sell-now-or-wait"
        zip={zip || '85201'}
        headline="Get a Personalized Market Consultation"
        subtext="A local agent will review your specific situation and provide timing recommendations."
      />
    </div>
  );
}
