'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface MetroMetric {
  metric: string;
  value: number;
  month: string;
}

/**
 * Phoenix Metro market context strip.
 *
 * Renders 6 of the 12 Zillow datasets we ingest monthly (spec §3): the ones
 * most decision-useful to a seller or buyer landing on the home-value tool.
 * The rest (ZHVI, affordability, new construction, zori, zhvf growth, market
 * heat) have dedicated surfaces elsewhere or are too long-tail for this card.
 *
 * Shows as "context" around a specific property — so someone looking at a
 * house in 85212 understands Phoenix-wide velocity, price pressure, and
 * supply before deciding what to offer or list at.
 */
export function MarketContextStrip() {
  const [metrics, setMetrics] = useState<Record<string, MetroMetric>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api.marketMetro()) as { metrics?: MetroMetric[] };
        const byName: Record<string, MetroMetric> = {};
        for (const m of data.metrics ?? []) byName[m.metric] = m;
        setMetrics(byName);
      } catch {
        // Fail silent — the card is optional context, not primary content
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded || Object.keys(metrics).length === 0) return null;

  const medianSale = metrics.medianSalePrice?.value;
  const daysPending = metrics.daysPending?.value;
  const saleToList = metrics.saleToList?.value;
  const priceCuts = metrics.priceCuts?.value;
  const inventory = metrics.inventory?.value;
  const salesCount = metrics.salesCount?.value;

  const cards: Array<{ label: string; value: string; hint: string }> = [];

  if (medianSale != null) {
    cards.push({
      label: 'Metro Median Sale',
      value: USD.format(medianSale),
      hint: 'What homes actually sold for last month',
    });
  }
  if (daysPending != null) {
    cards.push({
      label: 'Days to Pending',
      value: `${Math.round(daysPending)} days`,
      hint: 'How long before a typical home goes under contract',
    });
  }
  if (saleToList != null) {
    cards.push({
      label: 'Sale-to-List',
      value: `${(saleToList * 100).toFixed(1)}%`,
      hint:
        saleToList < 1
          ? `Homes selling for ${((1 - saleToList) * 100).toFixed(1)}% below asking`
          : 'Homes selling above asking',
    });
  }
  if (priceCuts != null) {
    cards.push({
      label: 'Price Cuts',
      value: `${Math.round(priceCuts * 100)}%`,
      hint: 'Share of listings reduced before selling',
    });
  }
  if (inventory != null) {
    cards.push({
      label: 'Active Inventory',
      value: inventory.toLocaleString(),
      hint: 'Metro-wide listings on market',
    });
  }
  if (salesCount != null) {
    cards.push({
      label: 'Monthly Sales',
      value: salesCount.toLocaleString(),
      hint: 'Closed transactions last month',
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-warm-border bg-paper p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light">
        Phoenix Metro Market Context
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg bg-warm-beige p-3">
            <div className="text-xs text-text-light">{c.label}</div>
            <div className="text-lg font-bold tabular-nums text-charcoal">{c.value}</div>
            <div className="mt-0.5 text-[11px] leading-tight text-text-light">{c.hint}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-text-light">
        Data from Zillow Research, updated monthly. Covers the entire Phoenix-Mesa metro
        area. Your local ZIP range above is more specific to your neighborhood.
      </p>
    </div>
  );
}
