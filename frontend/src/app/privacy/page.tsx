import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — MesaHomes',
  description: 'How MesaHomes collects, uses, and protects your personal information.',
  alternates: { canonical: 'https://mesahomes.com/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-charcoal mb-2">
          Privacy Policy
        </h1>
        <p className="text-text-light mb-10">Last updated: April 26, 2026</p>

        <div className="prose prose-lg max-w-none text-charcoal">
          <p className="text-sm text-text-light italic">
            This privacy policy is provided as general information. For
            questions about your personal data, email{' '}
            <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
              sales@mesahomes.com
            </a>.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">1. Who we are</h2>
          <p>
            MesaHomes is operated by Nick Flournoy, a licensed Arizona real
            estate salesperson, doing business as MesaHomes ("we," "us,"
            "our"). Our website is mesahomes.com. For the Flat-Fee MLS and
            Full-Service tiers, MesaHomes operates under a designated
            Arizona broker of record.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">2. Information we collect</h2>
          <p>
            <strong>Information you give us directly:</strong> When you fill
            out a form on our site (lead capture, FSBO intake, home value
            request, contact form, valuation request), we collect the
            information you provide — typically your name, email address,
            phone number, property address, and details about your real
            estate intent.
          </p>
          <p>
            <strong>Automatically collected information:</strong> When you
            visit our site, we collect standard web analytics data including
            your IP address, browser type, device type, pages visited,
            referral source, and UTM parameters. We use this to understand
            how visitors use the site and improve it.
          </p>
          <p>
            <strong>Account information:</strong> If you log into our agent
            dashboard (reserved for MesaHomes team members), we collect and
            store your email and encrypted password via Amazon Cognito.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">3. How we use your information</h2>
          <ul>
            <li>To respond to your inquiry or provide the service you requested</li>
            <li>To connect you with our licensed broker of record when appropriate</li>
            <li>To coordinate with Virtual Home Zone for photography and media services</li>
            <li>To send transactional emails (lead confirmations, listing status updates, password resets)</li>
            <li>To improve our website, tools, and services based on aggregated usage data</li>
            <li>To comply with our legal obligations under Arizona and federal law</li>
          </ul>
          <p>
            We <strong>do not sell your personal information to third parties.</strong>
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">4. Who we share with</h2>
          <p>
            We share information only with service providers who help us
            operate the business:
          </p>
          <ul>
            <li><strong>Amazon Web Services (AWS):</strong> hosting, database, email</li>
            <li><strong>Google:</strong> Google Workspace for email, Google Maps for property visualization, Google Analytics for usage data (if enabled)</li>
            <li><strong>Stripe:</strong> payment processing when you purchase a FSBO package or flat-fee listing service</li>
            <li><strong>Virtual Home Zone:</strong> our professional real estate photography and media services partner</li>
            <li><strong>Our broker of record:</strong> when you purchase a Flat-Fee MLS or Full-Service tier (required for us to legally handle the transaction)</li>
            <li><strong>MLS and syndication portals:</strong> when you list with our Flat-Fee MLS tier, your listing data and photos go to ARMLS, Zillow, Realtor.com, Redfin, Trulia, and Homes.com</li>
          </ul>
          <p>
            We may also share information when required by law, to prevent
            fraud, or to protect our legal rights.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">5. Cookies and tracking</h2>
          <p>
            We use first-party cookies and localStorage to maintain session
            state and remember your preferences. We may use third-party
            analytics cookies (Google Analytics or Plausible) to understand
            aggregate usage. We do not use cookies for advertising or
            behavioral tracking across other websites.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">6. Your rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li><strong>Access:</strong> request a copy of the information we have about you</li>
            <li><strong>Correction:</strong> ask us to fix inaccurate information</li>
            <li><strong>Deletion:</strong> ask us to delete your information (subject to our legal obligation to retain certain real estate transaction records)</li>
            <li><strong>Opt-out:</strong> unsubscribe from marketing emails at any time via the link in those emails, or contact us to stop all non-transactional communications</li>
          </ul>
          <p>
            Arizona residents, California residents (CCPA), and residents of
            states with similar privacy laws have additional rights. To
            exercise any right, email{' '}
            <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
              sales@mesahomes.com
            </a>{' '}
            and we'll respond within 30 days.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">7. Data security</h2>
          <p>
            We store data in AWS (us-west-2 region) with encryption at rest,
            TLS encryption in transit, and access controls. No online service
            is 100% secure, but we take reasonable precautions to protect
            your information.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">8. Data retention</h2>
          <p>
            Lead data is retained for 24 months, or longer if we've started
            an active relationship (e.g., you've purchased a package). Agent
            dashboard accounts are retained as long as the account is active
            plus 90 days after deactivation. Real estate transaction records
            are retained as required by Arizona Department of Real Estate
            (typically 5 years).
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">9. Children</h2>
          <p>
            Our services are not directed to children under 18. We do not
            knowingly collect information from children.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">10. Changes to this policy</h2>
          <p>
            We may update this policy to reflect changes in our practices or
            in the law. The "Last updated" date at the top will change. If
            we make material changes, we'll notify users by email.
          </p>

          <h2 className="font-display text-2xl mt-8 mb-3">11. Contact</h2>
          <p>
            Questions about privacy? Email{' '}
            <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
              sales@mesahomes.com
            </a>.
          </p>

          <p className="text-sm text-text-light mt-12">
            See also: <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
