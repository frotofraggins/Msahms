'use client';

import { useState, type FormEvent } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertyDataCard, type PropertyData } from '@/components/PropertyDataCard';
import { api, ApiRequestError } from '@/lib/api';

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

export function HomeValueClient() {
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAddress = address.trim().length > 0;

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

      {/* Teaser */}
      {hasAddress && (
        <div className="mb-6 rounded-xl bg-primary/5 p-5 text-center">
          <p className="text-sm text-text-light">Homes in your ZIP typically sell for</p>
          <p className="text-2xl font-bold tabular-nums text-primary">$420,000 – $475,000</p>
          <p className="mt-1 text-xs text-text-light">
            Based on recent sales in your area. Request a personalized estimate below.
          </p>
        </div>
      )}

      {/* Property Data Card */}
      {hasAddress && (
        <div className="mb-6">
          <PropertyDataCard property={placeholderProperty} />
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
