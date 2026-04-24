import Link from 'next/link';

export interface CompRecord {
  address: string;
  salePrice: number;
  saleDate: string;
  sqft: number;
}

export interface NearbyCompsProps {
  comps: CompRecord[];
  subdivision?: string;
}

/**
 * Recent sales in the subdivision from county GIS data.
 */
export function NearbyComps({ comps, subdivision }: NearbyCompsProps) {
  if (comps.length === 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text">
        Recent Sales{subdivision ? ` in ${subdivision}` : ''}
      </h3>
      <div className="space-y-2">
        {comps.slice(0, 5).map((comp, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs"
          >
            <span className="text-text-light">{comp.address}</span>
            <span className="tabular-nums font-medium text-primary">{fmt(comp.salePrice)}</span>
            <span className="text-text-light">{comp.saleDate}</span>
            <span className="text-text-light">{comp.sqft.toLocaleString()} sqft</span>
          </div>
        ))}
      </div>
      {comps.length > 5 && (
        <Link
          href="/tools/home-value"
          className="mt-2 block text-center text-xs font-medium text-primary hover:underline"
        >
          View More Comps →
        </Link>
      )}
    </div>
  );
}
