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
    default: 'MesaHomes — Mesa, AZ Real Estate, Market Data & Neighborhood Insights',
  },
  description:
    'Your local source for Mesa, Arizona real estate. Live market data, home values, neighborhood news, HOA updates, city meetings, and flat-fee MLS listings. Covering Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, and Apache Junction.',
  openGraph: {
    title: 'MesaHomes — Mesa, AZ Real Estate & Community Hub',
    description:
      'The hyper-local source for Mesa-area home values, market trends, HOA news, and flat-fee listings. Know your neighborhood before you buy or sell.',
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
