import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { ComparisonClient } from './ComparisonClient';

export const metadata: Metadata = {
  title: 'Flat-Fee vs Traditional Agent Comparison',
  description:
    'Compare flat-fee MLS listing vs traditional real estate agent costs in Mesa, AZ. See exactly how much you save with side-by-side service breakdown.',
  alternates: {
    canonical: 'https://mesahomes.com/compare/flat-fee-vs-traditional-agent',
  },
  openGraph: {
    title: 'Flat-Fee vs Traditional Agent Comparison',
    description:
      'Compare flat-fee MLS listing vs traditional agent costs in Mesa, AZ.',
    url: 'https://mesahomes.com/compare/flat-fee-vs-traditional-agent',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flat-Fee vs Traditional Agent Comparison',
    description:
      'Compare flat-fee MLS listing vs traditional agent costs in Mesa, AZ.',
  },
};

export default function ComparisonPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <ComparisonClient />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
