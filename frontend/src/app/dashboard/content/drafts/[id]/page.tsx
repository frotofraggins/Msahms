import type { Metadata } from 'next';
import DraftDetailClient from './DraftDetailClient';

export const metadata: Metadata = {
  title: 'Review Draft — MesaHomes Dashboard',
  robots: { index: false, follow: false },
};

// Static export with catch-all — client reads id from URL
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function DraftDetailPage() {
  return <DraftDetailClient />;
}
