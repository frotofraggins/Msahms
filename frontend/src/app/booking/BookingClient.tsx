'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';
import { trackEvent } from '@/lib/tracking';

const intentOptions = [
  { value: 'buying', label: 'Buying a home' },
  { value: 'selling', label: 'Selling a home' },
  { value: 'renting', label: 'Renting / Property management' },
  { value: 'investing', label: 'Real estate investing' },
];

export function BookingClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intent, setIntent] = useState('buying');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.booking({ name, email, phone, intent });
      trackEvent('booking_submit', 'booking-page', { intent });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Something went wrong.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="py-12 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
        <h2 className="mb-2 text-lg font-bold text-text">Consultation Booked!</h2>
        <p className="text-sm text-text-light">
          A MesaHomes expert will contact you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="booking-name" className="mb-1 block text-sm font-medium text-text">Name</label>
        <input id="booking-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Full Name" />
      </div>
      <div>
        <label htmlFor="booking-email" className="mb-1 block text-sm font-medium text-text">Email</label>
        <input id="booking-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="booking-phone" className="mb-1 block text-sm font-medium text-text">Phone</label>
        <input id="booking-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="(480) 555-1234" />
      </div>
      <div>
        <label htmlFor="booking-intent" className="mb-1 block text-sm font-medium text-text">I&apos;m interested in</label>
        <select id="booking-intent" value={intent} onChange={(e) => setIntent(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          {intentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <button type="submit" disabled={submitting}
        className={cn(
          'w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors',
          submitting ? 'cursor-not-allowed bg-gray-400' : 'bg-secondary hover:bg-secondary-dark',
        )}>
        {submitting ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Booking...</> : 'Book Consultation'}
      </button>
    </form>
  );
}
