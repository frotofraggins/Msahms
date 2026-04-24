import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MesaHomes — Flat-Fee Real Estate for Mesa, AZ',
  description:
    'Save thousands selling your home in Mesa, Gilbert, Chandler, Queen Creek, and San Tan Valley. Free tools, county-verified data, and flat-fee MLS listing for $999.',
  openGraph: {
    title: 'MesaHomes — Flat-Fee Real Estate for Mesa, AZ',
    description:
      'Save thousands selling your home. Free seller net sheet, buyer affordability calculator, AI listing generator, and more.',
    url: 'https://mesahomes.com',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-text antialiased">
        {children}
      </body>
    </html>
  );
}
