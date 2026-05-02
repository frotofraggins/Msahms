'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';
import { trackEvent } from '@/lib/tracking';

/** Props for the LeadCaptureModal. */
export interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
  leadType?: string;
  toolSource?: string;
  /** Optional tag attached to the lead (e.g. "full-service-request"). */
  tag?: string;
  /** Pre-filled city from tool context. */
  city?: string;
  /** Pre-filled ZIP from tool context. */
  zip?: string;
  headline?: string;
  subtext?: string;
}

const timeframeOptions = [
  { value: 'now', label: 'Ready Now' },
  { value: '30d', label: 'Within 30 Days' },
  { value: '3mo', label: 'Within 3 Months' },
  { value: '6mo+', label: '6+ Months' },
];

const PHONE_REGEX = /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

/**
 * Reusable progressive disclosure lead capture modal.
 *
 * Accessible: role="dialog", aria-modal, focus trap, Escape to close,
 * backdrop click to close. Uses the shared api client for submissions.
 */
export function LeadCaptureModal({
  open,
  onClose,
  leadType = 'Buyer',
  toolSource = 'direct-consult',
  tag,
  city,
  zip,
  headline = 'Unlock Your Full Report',
  subtext = 'Enter your info to get the complete analysis with downloadable PDF.',
}: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formCity, setFormCity] = useState(city ?? '');
  const [formZip, setFormZip] = useState(zip ?? '');
  const [timeframe, setTimeframe] = useState('now');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const headlineId = 'lead-modal-headline';

  // Focus first input on open
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Update city/zip when props change
  useEffect(() => { if (city) setFormCity(city); }, [city]);
  useEffect(() => { if (zip) setFormZip(zip); }, [zip]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side phone validation
    if (phone && !PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number, e.g. (480) 555-1234');
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone,
        city: formCity || 'Mesa',
        zip: formZip || '85201',
        timeframe,
        leadType,
        toolSource,
      };
      if (tag) {
        payload.tags = [tag];
      }

      await api.createLead(payload);
      trackEvent('lead_capture', toolSource, { leadType, timeframe });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const detail = err.apiError?.details?.[0];
        const detailMsg = detail ? `${detail.field}: ${detail.message}` : null;
        setError(detailMsg ?? err.apiError?.message ?? `Request failed (${err.status}). Please try again.`);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[LeadCaptureModal] submission failed:', err);
        setError(`Could not reach the server. ${msg}. If this keeps happening, email sales@mesahomes.com.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop — click to close */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headlineId}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
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
            <h3 id={headlineId} className="mb-1 text-lg font-bold text-text">{headline}</h3>
            <p className="mb-4 text-sm text-text-light">{subtext}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={firstInputRef}
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

              {/* City/ZIP — shown if not pre-filled by tool context */}
              {!city && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

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

              {error && <p className="text-xs text-error">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-100',
                  submitting
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-secondary hover:bg-secondary-dark active:scale-[0.98]',
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
