import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { SellNowClient } from './SellNowClient';

export const metadata: Metadata = {
  title: 'Should I Sell Now or Wait?',
  description:
    'Analyze Mesa, AZ market conditions to decide if now is the right time to sell your home. Free market analysis with local data and expert consultation.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/sell-now-or-wait',
  },
  openGraph: {
    title: 'Should I Sell Now or Wait?',
    description:
      'Analyze Mesa, AZ market conditions to decide if now is the right time to sell.',
    url: 'https://mesahomes.com/tools/sell-now-or-wait',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Should I Sell Now or Wait?',
    description:
      'Analyze Mesa, AZ market conditions to decide if now is the right time to sell.',
  },
};

export default function SellNowOrWaitPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <SellNowClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
