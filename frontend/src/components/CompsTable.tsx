'use client';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface CompRecord {
  address?: string | null;
  salePrice?: number | null;
  saleDate?: string | null;
  sqft?: number | null;
  yearBuilt?: number | null;
}

interface CompsTableProps {
  subdivisionComps: CompRecord[];
  zipComps: CompRecord[];
  subdivision: string | null;
  zip: string;
}

/**
 * Recent comparable sales table.
 *
 * Shows up to 20 most-recent sales, prioritizing same-subdivision over ZIP.
 * This data comes from county GIS (Maricopa/Pinal) per the spec — 20
 * subdivision comps + 50 ZIP comps are fetched on every property lookup.
 * We render the top 20 combined, de-duped by address.
 *
 * Price-per-square-foot is the single most useful comp metric for sellers
 * trying to price a listing. We compute it client-side for display but do
 * not use it for valuation (that's the licensed agent's job, not ours).
 */
export function CompsTable({ subdivisionComps, zipComps, subdivision, zip }: CompsTableProps) {
  // De-duplicate by address, prioritize subdivision comps (tighter match),
  // then take the 20 most recent
  const seen = new Set<string>();
  const all: CompRecord[] = [];
  for (const c of [...subdivisionComps, ...zipComps]) {
    const key = (c.address ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (c.salePrice == null || c.salePrice < 50000) continue;
    seen.add(key);
    all.push(c);
  }

  // Sort by sale date desc
  all.sort((a, b) => {
    const aD = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const bD = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return bD - aD;
  });

  const display = all.slice(0, 20);
  if (display.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-warm-border bg-paper p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-light">
          Recent Sales Nearby
        </h3>
        <span className="text-xs text-text-light">
          Showing {display.length} of {all.length}
          {subdivision ? ` • ${subdivision}` : ` • ZIP ${zip}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-warm-border">
              <th className="py-2 pr-3 text-xs font-semibold text-text-light">Address</th>
              <th className="py-2 pr-3 text-xs font-semibold text-text-light">Sold</th>
              <th className="py-2 pr-3 text-right text-xs font-semibold text-text-light">Price</th>
              <th className="hidden py-2 pr-3 text-right text-xs font-semibold text-text-light sm:table-cell">
                Sqft
              </th>
              <th className="hidden py-2 pr-3 text-right text-xs font-semibold text-text-light sm:table-cell">
                $/Sqft
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((c, i) => {
              const pricePerSqft =
                c.salePrice && c.sqft && c.sqft > 0 ? Math.round(c.salePrice / c.sqft) : null;
              const date = c.saleDate
                ? new Date(c.saleDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';
              return (
                <tr
                  key={`${c.address}-${i}`}
                  className="border-b border-warm-border/50 last:border-0"
                >
                  <td className="py-2 pr-3 text-charcoal">{c.address ?? '—'}</td>
                  <td className="py-2 pr-3 text-text-light">{date}</td>
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums text-charcoal">
                    {c.salePrice != null ? USD.format(c.salePrice) : '—'}
                  </td>
                  <td className="hidden py-2 pr-3 text-right tabular-nums text-text-light sm:table-cell">
                    {c.sqft?.toLocaleString() ?? '—'}
                  </td>
                  <td className="hidden py-2 pr-3 text-right tabular-nums text-text-light sm:table-cell">
                    {pricePerSqft != null ? `$${pricePerSqft}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-text-light">
        From Maricopa and Pinal County Assessor records. Sale prices and dates are
        public record. For a personalized price analysis, request a valuation below.
      </p>
    </div>
  );
}
