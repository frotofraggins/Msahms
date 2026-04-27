'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertyDataCard, type PropertyData } from '@/components/PropertyDataCard';
import { api, ApiRequestError } from '@/lib/api';
import { trackEvent } from '@/lib/tracking';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * Extract a 5-digit ZIP from a free-form address.
 * Returns null if none found — we need the ZIP to query market/zip.
 */
function extractZip(address: string): string | null {
  const m = address.match(/\b(85\d{3})\b/);
  return m ? m[1] : null;
}

export function HomeValueClient() {
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live data — populated after user types an address with a recognizable ZIP
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [zipRange, setZipRange] = useState<{ low: number; high: number; median: number } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const hasAddress = address.trim().length > 0;
  const zip = extractZip(address);

  // Debounced lookup — fires when user pauses typing AND we detect a ZIP
  useEffect(() => {
    if (!zip) {
      setProperty(null);
      setZipRange(null);
      setLookupError(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLookingUp(true);
      setLookupError(null);
      try {
        // Fire both in parallel — ZIP range is fast, property lookup may be slower
        const [zipData, propertyData] = await Promise.allSettled([
          api.marketZip(zip),
          api.propertyLookup({ address: address.trim(), zip }),
        ]);

        if (zipData.status === 'fulfilled') {
          const d = zipData.value as { zhvi?: number };
          if (d.zhvi) {
            const median = Math.round(d.zhvi);
            setZipRange({
              low: Math.round(median * 0.93),
              high: Math.round(median * 1.07),
              median,
            });
          }
        }

        if (propertyData.status === 'fulfilled') {
          const p = propertyData.value as {
            property?: PropertyData;
          } & PropertyData;
          // API may wrap in {property: {...}} or return flat — handle both
          const data = (p.property ?? p) as PropertyData;
          setProperty(data);
        } else {
          // 404 is expected for many addresses we don't have county data for.
          // Keep the ZIP range shown; just say we couldn't find the specific property.
          setProperty(null);
          const rejectReason = propertyData.reason;
          if (rejectReason instanceof ApiRequestError && rejectReason.status !== 404) {
            setLookupError('Could not look up property details. You can still request an estimate below.');
          }
        }
      } catch {
        // Fail-open — user can still submit the lead form
        setLookupError('Could not look up live data. Submit below for a personal estimate.');
      } finally {
        setLookingUp(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [address, zip]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.valuationRequest({
        name,
        email,
        phone,
        address,
        leadType: 'Seller',
        toolSource: 'home-value',
      });
      trackEvent('valuation_request', 'home-value', { address });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Something went wrong. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">
          What&apos;s Your Home Worth?
        </h1>
        <p className="text-text-light">
          Get a free home value estimate for your Mesa-area property.
        </p>
        <p className="mt-1 text-xs text-text-light">
          Service area: Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction
        </p>
      </div>

      {/* Address Input */}
      <div className="mb-6">
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-text">
          Property Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
          <input
            id="address"
            type="text"
            placeholder="123 E Main St, Mesa, AZ 85201"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Teaser — live ZIP-based range, real data from Zillow metro feed */}
      {hasAddress && !zip && (
        <div className="mb-6 rounded-xl bg-warm-beige p-5 text-center text-sm text-text-light">
          Add your 5-digit ZIP to see what homes in your area typically sell for.
        </div>
      )}
      {zip && lookingUp && !zipRange && (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-warm-beige p-5 text-sm text-text-light">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking up live data for ZIP {zip}…
        </div>
      )}
      {zipRange && (
        <div className="mb-6 rounded-xl bg-primary/5 p-5 text-center">
          <p className="text-sm text-text-light">Homes in {zip} typically sell for</p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            {USD.format(zipRange.low)} – {USD.format(zipRange.high)}
          </p>
          <p className="mt-1 text-xs text-text-light">
            Median {USD.format(zipRange.median)} based on current Zillow data. Request a personalized estimate below.
          </p>
        </div>
      )}

      {/* Property Data Card — only renders when we actually found real county data */}
      {property && (
        <div className="mb-6">
          <PropertyDataCard property={property} />
        </div>
      )}

      {lookupError && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-center text-xs text-text-light">
          {lookupError}
        </div>
      )}

      {/* Lead Capture Form */}
      {success ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
          <h2 className="mb-2 text-lg font-bold text-text">Request Received!</h2>
          <p className="text-sm text-text-light">
            A local agent will prepare your personalized home value report and follow up within 24 hours.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-text">Get Your Personalized Estimate</h2>
          <p className="mb-4 text-sm text-text-light">
            Our local agents use county-verified data and recent comps to provide an accurate valuation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Phone (480) 555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {!hasAddress && (
              <input
                type="text"
                placeholder="Property Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}

            {error && <p className="text-xs text-error">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors',
                submitting
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-secondary hover:bg-secondary-dark',
              )}
            >
              {submitting ? 'Submitting...' : 'Get My Free Home Value →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
