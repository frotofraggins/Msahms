'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Shape of a single metric returned by /api/v1/market/metro. */
interface MetroMetric {
  metric: string;
  value: number;
  month: string;
  metroArea?: string;
}

interface MetroResponse {
  metrics?: MetroMetric[];
}

/**
 * Phoenix-MSA market snapshot.
 *
 * Uses real Zillow Research data (Freddie Mac Primary Mortgage Market
 * Survey methodology) for the Phoenix MSA, which covers all our service-
 * area cities. Zillow publishes metro-level aggregates monthly; per-city
 * breakdowns aren't available at the same granularity, so we show the
 * metro number and link out to city pages for ZIP-level detail.
 */
export function MarketSnapshot() {
  const [metrics, setMetrics] = useState<Record<string, MetroMetric>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .marketMetro()
      .then((res) => {
        const list = (res as MetroResponse).metrics ?? [];
        const byMetric: Record<string, MetroMetric> = {};
        for (const m of list) {
          if (m.metric) byMetric[m.metric] = m;
        }
        setMetrics(byMetric);
      })
      .catch(() => {
        // On error, keep metrics empty. Component renders a graceful
        // fallback rather than a broken state.
      })
      .finally(() => setLoading(false));
  }, []);

  // Format helpers
  const zhvi = metrics['zhvi']?.value;
  const inventory = metrics['inventory']?.value;
  const daysPending = metrics['daysPending']?.value;
  const saleToList = metrics['saleToList']?.value;
  const dataMonth = metrics['zhvi']?.month;

  const medianValue = zhvi
    ? `$${Math.round(zhvi / 1000)}K`
    : loading
      ? '—'
      : 'Unavailable';
  const inventoryFmt = inventory
    ? Math.round(inventory).toLocaleString()
    : loading
      ? '—'
      : 'Unavailable';
  const domFmt = daysPending ? `${Math.round(daysPending)}` : loading ? '—' : '—';
  const stlFmt = saleToList ? `${(saleToList * 100).toFixed(1)}%` : loading ? '—' : '—';

  return (
    <section className="bg-paper px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-charcoal">
          Phoenix Metro Market Snapshot
        </h2>
        <p className="mb-6 text-center text-sm text-text-light">
          Real Zillow Research data for the Phoenix-Mesa metro area
          {dataMonth ? `, updated ${formatMonth(dataMonth)}` : ''}. Covers
          all of Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and
          Apache Junction.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Median Home Value (ZHVI)" value={medianValue} />
          <StatCard label="Avg Days Pending" value={domFmt} />
          <StatCard label="Sale-to-List Ratio" value={stlFmt} />
          <StatCard label="Active Listings (Metro)" value={inventoryFmt} />
        </div>

        <p className="mt-4 text-center text-xs text-text-light">
          For ZIP-level medians and neighborhood detail, see our{' '}
          <a href="/areas/mesa" className="text-primary underline">
            city pages
          </a>
          .
        </p>
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

function formatMonth(ym: string): string {
  // Input format: 'YYYY-MM'
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
