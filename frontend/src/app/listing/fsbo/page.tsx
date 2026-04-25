import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FsboClient } from './FsboClient';

export const metadata: Metadata = {
  title: 'FSBO Photography Packages',
  description:
    'Professional real estate photography packages for FSBO sellers in Mesa, AZ. Starter ($299), Standard ($549), and Pro ($899) packages with photos, drone, 3D tours, and more.',
  alternates: { canonical: 'https://mesahomes.com/listing/fsbo' },
  openGraph: {
    title: 'FSBO Photography Packages | MesaHomes',
    description:
      'Professional photos, drone, 3D tours, and marketing materials for Mesa-area FSBO sellers. Packages from $299.',
    url: 'https://mesahomes.com/listing/fsbo',
  },
};

export default function FsboPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-text">FSBO Photography Packages</h1>
        <p className="mb-8 text-sm text-text-light">
          Professional real estate photography &amp; marketing materials via Virtual Home Zone.
          Complete the steps below to get started.
        </p>
        <FsboClient />
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
