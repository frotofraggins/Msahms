'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const cities = ['Mesa', 'Gilbert', 'Chandler', 'Queen Creek', 'San Tan Valley'];

/** Placeholder market data — replaced by API calls in production. */
const placeholderData: Record<string, { median: string; dom: string; stl: string; inventory: string }> = {
  Mesa: { median: '$448K', dom: '60', stl: '97.7%', inventory: '25,524' },
  Gilbert: { median: '$520K', dom: '52', stl: '98.1%', inventory: '8,432' },
  Chandler: { median: '$495K', dom: '55', stl: '97.9%', inventory: '6,218' },
  'Queen Creek': { median: '$545K', dom: '48', stl: '98.3%', inventory: '4,105' },
  'San Tan Valley': { median: '$432K', dom: '65', stl: '97.2%', inventory: '3,890' },
};

/**
 * Local market snapshot with city tab selector.
 *
 * Displays: Median Home Value, Days on Market, Sale-to-List ratio, Active Inventory.
 * In production, fetches from GET /api/v1/market/zip/{zip} and /api/v1/market/metro.
 */
export function MarketSnapshot() {
  const [activeCity, setActiveCity] = useState('Mesa');
  const data = placeholderData[activeCity] ?? placeholderData.Mesa;

  return (
    <section className="bg-paper px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-charcoal">
          Local Market Snapshot
        </h2>
        <p className="mb-6 text-center text-sm text-text-light">
          Real data from county assessors and Zillow Research — updated monthly.
        </p>

        {/* City tabs */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-100 active:scale-[0.98]',
                activeCity === city
                  ? 'bg-primary text-white'
                  : 'bg-warm-beige text-text-light hover:bg-warm-border',
              )}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Median Value" value={data.median} />
          <StatCard label="Days on Market" value={data.dom} />
          <StatCard label="Sale-to-List" value={data.stl} />
          <StatCard label="Active Listings" value={data.inventory} />
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-warm-beige p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="text-xl font-bold tabular-nums text-primary">{value}</div>
      <div className="mt-1 text-xs text-text-light">{label}</div>
    </div>
  );
}
