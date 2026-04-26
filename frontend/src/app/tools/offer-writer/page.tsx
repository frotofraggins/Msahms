import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { OfferWriterClient } from './OfferWriterClient';

export const metadata: Metadata = {
  title: 'AI Offer Writer',
  description:
    'Draft a home purchase offer for Mesa, AZ properties. Free AI-powered offer writer with key terms preview and full-service agent upgrade option.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/offer-writer',
  },
  openGraph: {
    title: 'AI Offer Writer',
    description:
      'Draft a home purchase offer for Mesa, AZ properties with our free AI-powered tool.',
    url: 'https://mesahomes.com/tools/offer-writer',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Offer Writer',
    description:
      'Draft a home purchase offer for Mesa, AZ properties.',
  },
};

export default function OfferWriterPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <OfferWriterClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
