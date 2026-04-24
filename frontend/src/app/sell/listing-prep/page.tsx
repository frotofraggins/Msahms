import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { StickyContactBar } from '@/components/StickyContactBar';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Listing Prep Checklist',
  description:
    'Get your Mesa, AZ home ready to sell with our customized listing prep checklist. Staging, repairs, photography, and documentation — everything you need before listing.',
  alternates: { canonical: 'https://mesahomes.com/sell/listing-prep' },
  openGraph: {
    title: 'Listing Prep Checklist',
    description: 'Get your Mesa home ready to sell with our customized checklist.',
    url: 'https://mesahomes.com/sell/listing-prep',
    siteName: 'MesaHomes',
    locale: 'en_US',
    type: 'website',
  },
};

const categories = [
  {
    title: 'Staging & Curb Appeal',
    items: [
      'Declutter all rooms — remove personal photos and excess furniture',
      'Deep clean entire home including windows, carpets, and grout',
      'Touch up interior paint — neutral colors sell faster',
      'Pressure wash driveway, walkways, and patio',
      'Trim landscaping and add fresh mulch or gravel (desert-friendly)',
      'Replace burned-out light bulbs and update dated fixtures',
    ],
  },
  {
    title: 'Repairs & Maintenance',
    items: [
      'Fix leaky faucets, running toilets, and dripping showerheads',
      'Repair or replace damaged window screens',
      'Check HVAC — replace filters, schedule service if needed',
      'Test all smoke and CO detectors',
      'Fix any cracked tiles, loose doorknobs, or sticky doors',
      'Address any known roof issues (Arizona sun is hard on roofs)',
    ],
  },
  {
    title: 'Photography & Marketing',
    items: [
      'Schedule professional photography (MesaHomes can recommend photographers)',
      'Consider virtual staging for vacant properties',
      'Write or generate listing description (use our AI Listing Generator)',
      'Gather HOA documents if applicable',
      'Note recent upgrades and improvements for the listing',
    ],
  },
  {
    title: 'Documentation',
    items: [
      'Locate your property deed and title insurance policy',
      'Gather recent utility bills (buyers often ask)',
      'Prepare Seller Property Disclosure Statement (SPDS)',
      'Collect warranty information for appliances and systems',
      'Note any known material defects (required by Arizona law)',
    ],
  },
];

export default function ListingPrepPage() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-text">Listing Prep Checklist</h1>
        <p className="mb-8 text-text-light">
          Get your home ready to sell. This checklist covers everything from staging to
          documentation — customized for Mesa, AZ metro sellers.
        </p>

        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.title}>
              <h2 className="mb-3 text-xl font-semibold text-primary">{cat.title}</h2>
              <ul className="space-y-2">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-light">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-surface p-6 text-center">
          <h2 className="mb-2 text-lg font-bold text-text">Ready to list?</h2>
          <p className="mb-4 text-sm text-text-light">
            Start your flat-fee MLS listing for $999 + $400 broker fee.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/listing/start"
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-secondary-dark"
            >
              Start Your Flat-Fee Listing
            </Link>
            <Link
              href="/tools/listing-generator"
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Generate Your Listing Description First
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}
