'use client';

import { useState } from 'react';
import {
  Check,
  Star,
  Camera,
  Home,
  CalendarClock,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/tracking';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

// ---------------------------------------------------------------------------
// Package data
// ---------------------------------------------------------------------------

export type FsboPackageId = 'starter' | 'standard' | 'pro';

interface FsboPackage {
  id: FsboPackageId;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

const packages: FsboPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    duration: '30 days',
    features: [
      'Professional photos (up to 25)',
      'Floor plan',
      'Yard sign',
      'FSBO listing upload',
      'MesaHomes seller tools',
      'PDF flyer',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 549,
    duration: '60 days',
    popular: true,
    features: [
      'Everything in Starter',
      'Drone aerial photos',
      '3D virtual tour',
      'Twilight photo',
      '60-day listing period',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 899,
    duration: '90 days',
    features: [
      'Everything in Standard',
      'Property video walkthrough',
      'Virtual staging (3 rooms)',
      'Listing consultation',
      'AI listing description',
      '90-day listing period',
    ],
  },
];

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 'package', label: 'Package', icon: Camera },
  { id: 'details', label: 'Property', icon: Home },
  { id: 'photo', label: 'Photography', icon: CalendarClock },
  { id: 'summary', label: 'Payment', icon: CreditCard },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FsboClient() {
  const [step, setStep] = useState<StepId>('package');
  const [selectedPkg, setSelectedPkg] = useState<FsboPackageId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);

  // Property details form state
  const [address, setAddress] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [lot, setLot] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  // Contact info form state for FSBO intake
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);
  const pkg = packages.find((p) => p.id === selectedPkg) ?? null;

  function goNext() {
    const next = STEPS[currentStepIndex + 1];
    if (next) setStep(next.id);
  }

  function goBack() {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev.id);
  }

  async function handleStartFsboListing() {
    if (!pkg) return;
    trackEvent('listing_start', 'fsbo', { package: selectedPkg });
    setSubmitting(true);
    try {
      const result = await api.startFsboListing({
        propertyAddress: address,
        bedrooms: Number(beds) || 0,
        bathrooms: Number(baths) || 0,
        sqft: Number(sqft) || 0,
        packageType: `fsbo-${pkg.id}`,
        email,
        name: contactName,
        phone,
      }) as { listingId: string; leadId: string; handoffUrl?: string; status?: string };

      const launchMode = process.env['NEXT_PUBLIC_FSBO_LAUNCH_MODE'] ?? 'lead-only';

      if (launchMode === 'stripe' && result.handoffUrl) {
        // Stripe mode: redirect to VHZ signed checkout URL
        window.location.href = result.handoffUrl;
      } else {
        // Lead-only mode: show confirmation, no redirect
        setLeadCreated(true);
      }
    } catch {
      // Fallback: still allow user to proceed
      setLeadCreated(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step indicator ──
  const StepIndicator = () => (
    <div className="mb-8 flex items-center justify-center gap-1">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = s.id === step;
        const isPast = i < currentStepIndex;
        return (
          <div key={s.id} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-6 sm:w-10',
                  isPast ? 'bg-primary' : 'bg-gray-300',
                )}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  isPast
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'border-2 border-primary bg-white text-primary'
                      : 'border-2 border-gray-300 bg-white text-gray-400',
                )}
              >
                {isPast ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px]',
                  isActive ? 'font-semibold text-primary' : 'text-text-light',
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Step 1: Package selection ──
  if (step === 'package') {
    return (
      <>
        <StepIndicator />
        <h2 className="mb-4 font-heading text-lg font-bold text-charcoal">Choose Your Package</h2>
        <div className="space-y-4">
          {packages.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPkg(p.id);
                goNext();
              }}
              className={cn(
                'w-full rounded-lg border p-4 text-left transition-colors',
                selectedPkg === p.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{p.name}</span>
                  {p.popular && (
                    <span className="flex items-center gap-0.5 rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                      <Star className="h-3 w-3" /> Popular
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-primary">${p.price}</span>
              </div>
              <ul className="space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-text-light">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-text-light">Listing period: {p.duration}</p>
            </button>
          ))}
        </div>
      </>
    );
  }

  // ── Step 2: Property details ──
  if (step === 'details') {
    const canProceed = address.trim().length > 0 && beds && baths && sqft;

    return (
      <>
        <StepIndicator />
        <h2 className="mb-4 font-heading text-lg font-bold text-charcoal">Property Details</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="fsbo-address" className="mb-1 block text-sm font-medium text-text">
              Property Address *
            </label>
            <AddressAutocomplete
              id="fsbo-address"
              value={address}
              onChange={setAddress}
              placeholder="Start typing your address…"
              required
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="fsbo-beds" className="mb-1 block text-sm font-medium text-text">
                Beds *
              </label>
              <input
                id="fsbo-beds"
                type="number"
                min={0}
                placeholder="3"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="fsbo-baths" className="mb-1 block text-sm font-medium text-text">
                Baths *
              </label>
              <input
                id="fsbo-baths"
                type="number"
                min={0}
                step={0.5}
                placeholder="2"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="fsbo-sqft" className="mb-1 block text-sm font-medium text-text">
                Sqft *
              </label>
              <input
                id="fsbo-sqft"
                type="number"
                min={1}
                placeholder="1800"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fsbo-lot" className="mb-1 block text-sm font-medium text-text">
                Lot Size (sqft)
              </label>
              <input
                id="fsbo-lot"
                type="number"
                min={0}
                placeholder="6500"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="fsbo-year" className="mb-1 block text-sm font-medium text-text">
                Year Built
              </label>
              <input
                id="fsbo-year"
                type="number"
                min={1900}
                max={2030}
                placeholder="2005"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text-light hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={goNext}
            disabled={!canProceed}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold text-white',
              canProceed
                ? 'bg-secondary hover:bg-secondary-dark'
                : 'cursor-not-allowed bg-gray-300',
            )}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }

  // ── Step 3: Photography scheduling ──
  if (step === 'photo') {
    return (
      <>
        <StepIndicator />
        <h2 className="mb-4 font-heading text-lg font-bold text-charcoal">Photography Scheduling</h2>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
          <Camera className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="mb-2 text-sm font-medium text-text">
            A Virtual Home Zone photographer will contact you within 24 hours to
            schedule your shoot.
          </p>
          <p className="mb-4 text-xs text-text-light">
            Professional real estate photography, drone, 3D tours, and more — all
            handled by our photography partner.
          </p>
          <a
            href="https://virtualhomezone.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline hover:no-underline"
          >
            Visit virtualhomezone.com <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text-light hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={goNext}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary py-2 text-sm font-semibold text-white hover:bg-secondary-dark"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }

  // ── Step 4: Payment summary ──
  if (step === 'summary' && pkg) {
    return (
      <>
        <StepIndicator />
        <h2 className="mb-4 font-heading text-lg font-bold text-charcoal">Payment Summary</h2>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-semibold text-text">{pkg.name} Package</p>
              <p className="text-xs text-text-light">FSBO Photography &amp; Marketing</p>
            </div>
            <span className="text-xl font-bold text-primary">${pkg.price}</span>
          </div>

          <h3 className="mb-2 text-sm font-medium text-text">What&apos;s included:</h3>
          <ul className="mb-6 space-y-1.5">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-light">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <p className="mb-4 text-xs text-text-light">
            Listing period: {pkg.duration}. Photography by Virtual Home Zone.
          </p>

          {!leadCreated ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="fsbo-email" className="mb-1 block text-sm font-medium text-text">
                  Email *
                </label>
                <input
                  id="fsbo-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fsbo-name" className="mb-1 block text-sm font-medium text-text">
                    Name
                  </label>
                  <input
                    id="fsbo-name"
                    type="text"
                    placeholder="Jane Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="fsbo-phone" className="mb-1 block text-sm font-medium text-text">
                    Phone
                  </label>
                  <input
                    id="fsbo-phone"
                    type="tel"
                    placeholder="480-555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleStartFsboListing}
                disabled={submitting || !email.trim()}
                className={cn(
                  'w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors',
                  submitting || !email.trim()
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-secondary hover:bg-secondary-dark',
                )}
              >
                {submitting
                  ? 'Saving...'
                  : (process.env['NEXT_PUBLIC_FSBO_LAUNCH_MODE'] ?? 'lead-only') === 'stripe'
                    ? 'Proceed to Payment'
                    : 'Submit Listing Request'}
              </button>
              <p className="text-center text-[10px] text-text-light">
                {(process.env['NEXT_PUBLIC_FSBO_LAUNCH_MODE'] ?? 'lead-only') === 'stripe'
                  ? "You'll be redirected to Virtual Home Zone to complete payment via their existing Stripe checkout."
                  : "We'll follow up within 24 hours to schedule photography and collect payment."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-success">
                ✓ Thanks, your listing is in our queue.
              </p>
              <p className="text-sm text-text-light">
                We&apos;ll email you within 24 hours to schedule your photography session
                with Virtual Home Zone and collect payment for your ${pkg.price} {pkg.name} package.
              </p>
              <p className="text-sm text-text-light">
                Any questions? Reach us at{' '}
                <a href="mailto:hello@mesahomes.com" className="font-medium text-primary underline hover:no-underline">
                  hello@mesahomes.com
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={goBack}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text-light hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </>
    );
  }

  // Fallback — shouldn't reach here
  return null;
}
