'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/tracking';

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        toolSource: 'contact-form',
        notes: form.message,
      } as unknown as Parameters<typeof api.createLead>[0]);
      trackEvent('form_submit', 'contact-page', {});
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <FadeInOnScroll>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-charcoal mb-4">
            Contact MesaHomes
          </h1>
          <p className="text-xl text-text-light mb-12 max-w-2xl">
            Questions about FSBO, flat-fee MLS, or just want to talk through your
            selling options? Reach out.
          </p>
        </FadeInOnScroll>

        <div className="grid md:grid-cols-2 gap-12">
          <FadeInOnScroll>
            <h2 className="font-display text-2xl text-charcoal mb-4">Get in touch</h2>
            <div className="space-y-4 text-text-light">
              <div>
                <div className="font-medium text-charcoal">Email</div>
                <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
                  sales@mesahomes.com
                </a>
              </div>
              <div>
                <div className="font-medium text-charcoal">Service area</div>
                <p>Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Apache Junction</p>
              </div>
              <div>
                <div className="font-medium text-charcoal">Response time</div>
                <p>Within 24 hours, usually same-day during business hours.</p>
              </div>
              <div className="pt-4">
                <p className="text-sm">
                  Looking for answers to common questions? Check our{' '}
                  <Link href="/faq" className="text-primary hover:underline">FAQ page</Link> first.
                </p>
              </div>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll>
            <h2 className="font-display text-2xl text-charcoal mb-4">Send a message</h2>
            {submitted ? (
              <div className="bg-warm-beige border border-warm-border rounded-lg p-6">
                <div className="font-medium text-charcoal mb-2">Thanks, message received.</div>
                <p className="text-sm text-text-light">
                  We'll get back to you within 24 hours at the email address you provided.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-warm-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-warm-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-warm-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-warm-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-paper font-medium py-3 rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </FadeInOnScroll>
        </div>
      </main>
      <Footer />
      <StickyContactBar />
    </div>
  );
}
