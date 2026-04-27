import type { Metadata } from 'next';
import DraftsClient from './DraftsClient';

export const metadata: Metadata = {
  title: 'Content Drafts — MesaHomes Dashboard',
  robots: { index: false, follow: false },
};

export default function DraftsPage() {
  return <DraftsClient />;
}
