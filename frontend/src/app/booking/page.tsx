import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { BookingClient } from './BookingClient';

export const metadata: Metadata = {
  title: 'Book a Consultation',
  description:
    'Schedule a free consultation with a MesaHomes real estate expert. Buying, selling, renting, or investing in the Mesa, AZ metro area.',
  alternates: { canonical: 'https://mesahomes.com/booking' },
};

export default function BookingPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="mb-2 text-center text-2xl font-bold text-text">
          Book a Free Consultation
        </h1>
        <p className="mb-8 text-center text-sm text-text-light">
          Tell us what you need and a Mesa-area expert will reach out within 24 hours.
        </p>
        <BookingClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
