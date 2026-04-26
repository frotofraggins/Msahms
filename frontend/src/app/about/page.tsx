import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';

export const metadata: Metadata = {
  title: 'About MesaHomes — Flat-Fee Real Estate for Mesa, AZ',
  description:
    'MesaHomes helps Mesa-area homeowners save thousands on their sale through flat-fee MLS listings, AI-powered tools, and county-verified market data.',
  alternates: { canonical: 'https://mesahomes.com/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <FadeInOnScroll>
          <h1 className="font-display text-4xl md:text-6xl font-semibold text-charcoal mb-6 leading-tight">
            Real estate, simplified.
            <br />
            <span className="text-primary">Mesa, Arizona.</span>
          </h1>
          <p className="text-xl text-text-light max-w-2xl mb-12">
            MesaHomes is a flat-fee real estate platform serving Mesa, Gilbert,
            Chandler, Queen Creek, San Tan Valley, and Apache Junction —
            helping East Valley homeowners keep thousands of dollars in their
            pockets instead of handing them to traditional agents.
          </p>
        </FadeInOnScroll>

        <FadeInOnScroll>
          <section className="prose prose-lg max-w-none">
            <h2 className="font-display text-3xl text-charcoal mt-12 mb-4">
              Why we built MesaHomes
            </h2>
            <p>
              Traditional real estate agents charge 5-6% commission on every
              sale — which on a $500,000 home in Mesa means $30,000 going to
              agents, not you. For most of our neighbors, that's a year of
              mortgage payments or a big chunk of their retirement.
            </p>
            <p>
              At the same time, modern tools — AI listing writers, county GIS
              data, Zillow market analytics, professional photography —
              make it possible for confident sellers to run their own sale for
              a fraction of the cost.
            </p>
            <p>
              MesaHomes connects East Valley homeowners with these tools in
              one place, with three service tiers to match your comfort level:
              FSBO (you handle the sale), flat-fee MLS listing (we get you on
              Zillow + Realtor.com), or full-service agent representation
              when you want someone else driving.
            </p>

            <h2 className="font-display text-3xl text-charcoal mt-12 mb-4">
              Who runs it
            </h2>
            <p>
              MesaHomes is run by Nick Flournoy, a licensed Arizona real
              estate salesperson (license reactivation in progress, 2026).
            </p>
            <p>
              For the Flat-Fee MLS and Full-Service tiers, MesaHomes partners
              with a designated Arizona broker of record (partnership in
              finalization). The FSBO tier requires no broker — it's a
              self-directed package of photography, listing services, and
              AI-powered tools delivered through our partnership with a
              professional real estate media provider.
            </p>

            <h2 className="font-display text-3xl text-charcoal mt-12 mb-4">
              Our service area
            </h2>
            <p>
              We serve the East Valley of the Phoenix metro, specifically:
            </p>
            <ul>
              <li><Link href="/areas/mesa" className="text-primary hover:underline">Mesa</Link> — median home value $448K</li>
              <li><Link href="/areas/gilbert" className="text-primary hover:underline">Gilbert</Link> — family-focused, top schools</li>
              <li><Link href="/areas/chandler" className="text-primary hover:underline">Chandler</Link> — tech hub, strong employer base</li>
              <li><Link href="/areas/queen-creek" className="text-primary hover:underline">Queen Creek</Link> — fastest-growing, new construction</li>
              <li><Link href="/areas/san-tan-valley" className="text-primary hover:underline">San Tan Valley</Link> — value pricing, growing community</li>
              <li><Link href="/areas/apache-junction" className="text-primary hover:underline">Apache Junction</Link> — Superstition Mountain access</li>
            </ul>

            <h2 className="font-display text-3xl text-charcoal mt-12 mb-4">
              Questions?
            </h2>
            <p>
              Email us at{' '}
              <a href="mailto:sales@mesahomes.com" className="text-primary hover:underline">
                sales@mesahomes.com
              </a>{' '}
              or see our <Link href="/faq" className="text-primary hover:underline">FAQ page</Link>.
              You can also reach us via the{' '}
              <Link href="/contact" className="text-primary hover:underline">contact form</Link>.
            </p>
          </section>
        </FadeInOnScroll>
      </main>
      <Footer />
      <StickyContactBar />
    </div>
  );
}
