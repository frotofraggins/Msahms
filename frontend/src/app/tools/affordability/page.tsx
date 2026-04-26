import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { AffordabilityClient } from './AffordabilityClient';

export const metadata: Metadata = {
  title: 'Buyer Affordability Calculator',
  description:
    'Calculate how much home you can afford in Mesa, AZ. Free buyer affordability calculator with mortgage scenarios and Arizona down payment assistance programs.',
  alternates: {
    canonical: 'https://mesahomes.com/tools/affordability',
  },
  openGraph: {
    title: 'Buyer Affordability Calculator',
    description:
      'Calculate how much home you can afford in Mesa, AZ with our free affordability calculator.',
    url: 'https://mesahomes.com/tools/affordability',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buyer Affordability Calculator',
    description:
      'Calculate how much home you can afford in Mesa, AZ.',
  },
};

export default function AffordabilityPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <AffordabilityClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
