import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { HomeValueClient } from './HomeValueClient';

export const metadata: Metadata = {
  title: 'Free Home Value Estimate',
  description:
    'Get a free home value estimate for your Mesa, Gilbert, Chandler, or Queen Creek property. County-verified data and recent comps from local agents.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/home-value',
  },
  openGraph: {
    title: 'Free Home Value Estimate',
    description:
      'Get a free home value estimate for your Mesa-area property using county-verified data.',
    url: 'https://mesahomes.com/tools/home-value',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Home Value Estimate',
    description:
      'Get a free home value estimate for your Mesa-area property.',
  },
};

export default function HomeValuePage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <HomeValueClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
