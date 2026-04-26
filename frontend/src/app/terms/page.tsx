import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — MesaHomes',
  description: 'Terms and conditions for using the MesaHomes website and services.',
  alternates: { canonical: 'https://mesahomes.com/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-charcoal mb-2">
          Terms of Service
        </h1>
        <p className="text-text-light mb-10">Last updated: April 26, 2026</p>

        <div className="prose prose-lg max-w-none text-charcoal">
          <p className="text-sm text-text-light italic">
            Please read these terms carefully before using our site or services.
            These terms are provided as general information; they are not legal
            advice. Questions? Email{' '}
            <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
              sales@mesahomes.com
            </a>.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">1. Acceptance of terms</h2>
          <p>
            By accessing mesahomes.com or using any of our services, you
            agree to these Terms of Service. If you do not agree, do not
            use the site.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">2. Who we are</h2>
          <p>
            MesaHomes is a real estate lead generation and service platform
            operated by Nick Flournoy, a licensed Arizona real estate
            salesperson. For services requiring brokerage representation
            (Flat-Fee MLS listing and Full-Service tiers), MesaHomes
            operates under a designated Arizona broker of record per
            Arizona Revised Statutes Title 32, Chapter 20.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">3. Service tiers</h2>
          <p>
            We offer three service tiers:
          </p>
          <ul>
            <li>
              <strong>FSBO (For Sale By Owner) — $299 / $549 / $899</strong>:
              Photography, listing preparation, and marketing tools delivered
              by Virtual Home Zone. No brokerage services are provided; you
              handle your own sale as the owner. No MLS listing included.
            </li>
            <li>
              <strong>Flat-Fee MLS Listing — $999 + $400 at closing</strong>:
              Your home is listed on ARMLS (Arizona Regional MLS) and
              syndicated to major portals (Zillow, Realtor.com, Redfin,
              Trulia, Homes.com) by our designated broker of record.
              This tier is gated until broker partnership is active.
            </li>
            <li>
              <strong>Full-Service Agent — traditional commission</strong>:
              Full representation by our broker of record. Gated until
              broker partnership is active.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-8 mb-3">4. FSBO disclaimer</h2>
          <p>
            The FSBO tier is a self-directed service. MesaHomes and Virtual
            Home Zone provide tools, photography, and marketing materials
            but do NOT provide real estate brokerage services for this tier.
            You are responsible for:
          </p>
          <ul>
            <li>Pricing your home accurately</li>
            <li>Negotiating with buyers</li>
            <li>Completing all required real estate paperwork and disclosures</li>
            <li>Coordinating with a title company and attorney if needed</li>
            <li>Complying with fair housing, disclosure, and transaction laws</li>
          </ul>
          <p>
            Nothing we provide constitutes real estate advice, legal advice,
            or tax advice. We recommend consulting a licensed Arizona real
            estate attorney for transaction guidance.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">5. Tools and data accuracy</h2>
          <p>
            Our tools (Home Value Estimator, Seller Net Sheet, Buyer
            Affordability, AI Listing Generator, Offer Writer, Sell Now or
            Wait, Comparison tool) produce estimates based on publicly
            available data (Zillow market data, county GIS records, FRED
            mortgage rates). <strong>These are estimates, not appraisals or
            professional valuations.</strong> Actual sale prices, tax bills,
            and mortgage terms may vary significantly. Do not rely on our
            tools as the sole basis for financial decisions.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">6. Payments and refunds</h2>
          <p>
            FSBO tier payments are processed by Virtual Home Zone via Stripe.
            Flat-Fee and Full-Service payments are processed by our broker
            of record. All sales are final once services are rendered
            (photography delivered, listing activated, representation
            provided), except as required by Arizona consumer protection law.
          </p>
          <p>
            For the Flat-Fee MLS tier: the $999 activation fee is non-refundable
            once the listing goes live on the MLS. The $400 closing fee is
            only due if the home sells through our listing.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">7. Acceptable use</h2>
          <p>
            You agree not to:
          </p>
          <ul>
            <li>Use the site for any unlawful purpose</li>
            <li>Submit false, misleading, or fraudulent information</li>
            <li>Attempt to reverse engineer, scrape, or bulk-download our content or data</li>
            <li>Impersonate another person or entity</li>
            <li>Interfere with site operation or security</li>
          </ul>

          <h2 className="font-display text-2xl mt-8 mb-3">8. Intellectual property</h2>
          <p>
            All content on mesahomes.com — text, graphics, logos, tool
            algorithms, software — is owned by MesaHomes or licensed to us.
            You may not reproduce or distribute our content without permission,
            except for your own personal use during the sale of your own property.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">9. Third-party links and services</h2>
          <p>
            Our site links to and integrates with third-party services
            (Virtual Home Zone, Stripe, Google Maps, MLS portals, broker
            websites). We're not responsible for the content, policies, or
            practices of those third parties.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by Arizona law, MesaHomes, its
            owner, and its partners are not liable for indirect, incidental,
            consequential, or punitive damages arising from your use of the
            site or services. Our total liability for any claim shall not
            exceed the amount you paid us in the 12 months before the claim,
            or $1,000, whichever is greater.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">11. Disputes and governing law</h2>
          <p>
            These terms are governed by the laws of the State of Arizona,
            without regard to conflict of law principles. Any dispute
            arising from these terms or your use of our services shall be
            resolved by binding arbitration under the rules of the American
            Arbitration Association, conducted in Maricopa County, Arizona.
            You and MesaHomes each waive the right to participate in a
            class action lawsuit.
          </p>
          <p>
            Nothing in this section prevents either party from seeking
            injunctive relief in a court of competent jurisdiction for
            intellectual property or confidentiality violations.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">12. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of
            the site after changes are posted constitutes acceptance. The
            "Last updated" date at the top reflects the latest version.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">13. Contact</h2>
          <p>
            Questions or concerns? Email{' '}
            <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
              sales@mesahomes.com
            </a>.
          </p>

          <p className="text-sm text-text-light mt-12">
            See also: <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
