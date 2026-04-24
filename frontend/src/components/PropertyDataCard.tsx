export interface PropertyData {
  address: string;
  sqft: number | null;
  floors: number | null;
  yearBuilt: number | null;
  lotSize: number | null;
  lotSizeUnit: string | null;
  assessedValue: number | null;
  salePrice: number | null;
  saleDate: string | null;
  subdivision: string | null;
  zipTypicalValue: number | null;
  photoUrl: string | null;
}

export interface PropertyDataCardProps {
  property: PropertyData | null;
  loading?: boolean;
}

/**
 * Street View photo + property details card.
 *
 * Shows skeleton loading state while GIS API responds (~1-2s).
 * Data from POST /api/v1/property/lookup.
 */
export function PropertyDataCard({ property, loading }: PropertyDataCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-surface p-4">
        <div className="flex gap-4">
          <div className="h-32 w-48 rounded-lg bg-gray-300" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-300" />
            <div className="h-3 w-1/2 rounded bg-gray-300" />
            <div className="h-3 w-2/3 rounded bg-gray-300" />
            <div className="h-3 w-1/3 rounded bg-gray-300" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const fmt = (n: number | null) =>
    n != null ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—';

  return (
    <div className="rounded-xl bg-surface p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Photo */}
        <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-200 sm:w-48">
          {property.photoUrl ? (
            <img
              src={property.photoUrl}
              alt={`Street view of ${property.address}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-light">
              No photo available
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 text-sm">
          <h3 className="mb-2 font-semibold text-text">{property.address}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-text-light">
            {property.sqft && <Detail label="Sqft" value={property.sqft.toLocaleString()} />}
            {property.floors && <Detail label="Floors" value={String(property.floors)} />}
            {property.yearBuilt && <Detail label="Built" value={String(property.yearBuilt)} />}
            {property.lotSize && (
              <Detail label="Lot" value={`${property.lotSize} ${property.lotSizeUnit ?? ''}`} />
            )}
            <Detail label="Assessed" value={fmt(property.assessedValue)} />
            {property.salePrice && (
              <Detail label="Last Sale" value={`${fmt(property.salePrice)} (${property.saleDate ?? ''})`} />
            )}
            {property.subdivision && <Detail label="Subdivision" value={property.subdivision} />}
            {property.zipTypicalValue && (
              <Detail label="ZIP Typical" value={fmt(property.zipTypicalValue)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-text-light">{label}: </span>
      <span className="text-xs font-medium text-text">{value}</span>
    </div>
  );
}
