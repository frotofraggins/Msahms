import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | MesaHomes',
    default: 'MesaHomes — Flat-Fee Real Estate for Mesa, AZ',
  },
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-paper text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
