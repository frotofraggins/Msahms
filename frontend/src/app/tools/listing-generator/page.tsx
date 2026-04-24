import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { ListingGeneratorClient } from './ListingGeneratorClient';

export const metadata: Metadata = {
  title: 'AI Listing Description Generator',
  description:
    'Generate a professional MLS listing description for your Mesa, AZ property in seconds. Free AI-powered tool for home sellers.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/listing-generator',
  },
  openGraph: {
    title: 'AI Listing Description Generator',
    description:
      'Generate a professional MLS listing description for your Mesa, AZ property in seconds.',
    url: 'https://mesahomes.com/tools/listing-generator',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Listing Description Generator',
    description:
      'Generate a professional MLS listing description for your property.',
  },
};

export default function ListingGeneratorPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <ListingGeneratorClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
