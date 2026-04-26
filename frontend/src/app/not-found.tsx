import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-sm uppercase tracking-wider text-text-light mb-4">
          404
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-charcoal mb-6 leading-tight">
          This page took a detour.
        </h1>
        <p className="text-lg text-text-light mb-10 max-w-md mx-auto">
          The link you followed may be out of date, mistyped, or pointing at
          something we haven't built yet.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-primary text-paper font-medium py-3 px-6 rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Back to home
          </Link>
          <Link
            href="/tools/home-value"
            className="inline-block border border-warm-border text-charcoal font-medium py-3 px-6 rounded-lg hover:bg-warm-beige active:scale-[0.98] transition-all"
          >
            Home value tool
          </Link>
          <Link
            href="/contact"
            className="inline-block border border-warm-border text-charcoal font-medium py-3 px-6 rounded-lg hover:bg-warm-beige active:scale-[0.98] transition-all"
          >
            Contact us
          </Link>
        </div>
        <p className="mt-12 text-sm text-text-light">
          If you think this is broken on our end, reply to any email we've sent
          you or reach us at{' '}
          <a href="mailto:sales@mesahomes.com" className="text-primary underline">
            sales@mesahomes.com
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
