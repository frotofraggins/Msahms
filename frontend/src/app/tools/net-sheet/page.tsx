import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { NetSheetClient } from './NetSheetClient';

export const metadata: Metadata = {
  title: 'Seller Net Sheet Calculator',
  description:
    'Calculate your net proceeds from selling your Mesa, AZ home. Compare flat-fee vs traditional agent costs with our free seller net sheet calculator.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/net-sheet',
  },
  openGraph: {
    title: 'Seller Net Sheet Calculator',
    description:
      'Calculate your net proceeds from selling your Mesa, AZ home. Compare flat-fee vs traditional agent costs.',
    url: 'https://mesahomes.com/tools/net-sheet',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seller Net Sheet Calculator',
    description:
      'Calculate your net proceeds from selling your Mesa, AZ home.',
  },
};

export default function NetSheetPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <NetSheetClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
