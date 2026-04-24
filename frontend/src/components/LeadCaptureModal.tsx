'use client';

import { useState, type FormEvent } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Props for the LeadCaptureModal. */
export interface LeadCaptureModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when the modal should close. */
  onClose: () => void;
  /** Pre-filled lead type (Buyer, Seller, etc.). */
  leadType?: string;
  /** Which tool triggered this modal. */
  toolSource?: string;
  /** Headline shown above the form. */
  headline?: string;
  /** Subtext below the headline. */
  subtext?: string;
}

const timeframeOptions = [
  { value: 'now', label: 'Ready Now' },
  { value: '30d', label: 'Within 30 Days' },
  { value: '3mo', label: 'Within 3 Months' },
  { value: '6mo+', label: '6+ Months' },
];

/**
 * Reusable progressive disclosure lead capture modal.
 *
 * Pre-fills leadType and toolSource based on calling context.
 * Submits to POST /api/v1/leads.
 */
export function LeadCaptureModal({
  open,
  onClose,
  leadType = 'Buyer',
  toolSource = 'direct-consult',
  headline = 'Unlock Your Full Report',
  subtext = 'Enter your info to get the complete analysis with downloadable PDF.',
}: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [timeframe, setTimeframe] = useState('now');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          city: 'Mesa',
          zip: '85201',
          timeframe,
          leadType,
          toolSource,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-text-light hover:text-text"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
            <h3 className="mb-2 text-lg font-bold text-text">You&apos;re all set!</h3>
            <p className="mb-4 text-sm text-text-light">
              Your full report is ready. An agent will follow up within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="mb-1 text-lg font-bold text-text">{headline}</h3>
            <p className="mb-4 text-sm text-text-light">{subtext}</p>

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
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {timeframeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {error && (
                <p className="text-xs text-error">{error}</p>
              )}

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
                {submitting ? 'Submitting...' : 'Unlock Full Report →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
