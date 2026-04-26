import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { FAQSection } from '@/components/FAQSection';
import { FadeInOnScroll } from '@/components/FadeInOnScroll';

interface CityData {
  name: string;
  slug: string;
  median: string;
  medianNum: number;
  typicalRent: string;
  dom: string;
  stl: string;
  inventory: string;
  yoyChange: string;
  description: string;
  zips: Array<{ code: string; area: string; median: string; change: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

const cityData: Record<string, CityData> = {
  mesa: {
    name: 'Mesa',
    slug: 'mesa',
    median: '$448K',
    medianNum: 448000,
    typicalRent: '$1,735/mo',
    dom: '60',
    stl: '97.7%',
    inventory: '25,524',
    yoyChange: '-2.4%',
    description:
      'Mesa is the third-largest city in Arizona and the heart of the East Valley. With diverse neighborhoods ranging from historic downtown to master-planned communities, Mesa offers options for every budget.',
    zips: [
      { code: '85201', area: 'Central Mesa', median: '$360K', change: '-1.2%' },
      { code: '85203', area: 'NE Mesa', median: '$449K', change: '-0.8%' },
      { code: '85207', area: 'NE Mesa / Red Mountain', median: '$555K', change: '+0.3%' },
      { code: '85212', area: 'Hawes Crossing', median: '$560K', change: '+0.5%' },
      { code: '85209', area: 'SE Mesa', median: '$480K', change: '-0.5%' },
      { code: '85205', area: 'NE Mesa', median: '$420K', change: '-1.0%' },
    ],
    faqs: [
      { question: 'Is Mesa a good place to live?', answer: 'Mesa offers affordable housing, excellent schools, outdoor recreation at Usery Mountain and Saguaro Lake, and easy access to Phoenix via the US-60 and Loop 202. The city has invested heavily in downtown revitalization and light rail transit.' },
      { question: 'What is the average home price in Mesa?', answer: 'The median home value in Mesa is approximately $448,000 as of the latest data, though prices vary significantly by neighborhood — from $360K in central Mesa to $560K+ in newer east Mesa developments.' },
      { question: 'How are Mesa schools?', answer: 'Mesa is served by Mesa Public Schools (the largest district in Arizona), Gilbert Public Schools (parts of east Mesa), and several charter schools. Top-rated schools include Red Mountain High School, Mountain View High School, and Franklin at Brimhall Elementary.' },
    ],
  },
  gilbert: {
    name: 'Gilbert',
    slug: 'gilbert',
    median: '$520K',
    medianNum: 520000,
    typicalRent: '$2,050/mo',
    dom: '52',
    stl: '98.1%',
    inventory: '8,432',
    yoyChange: '-1.8%',
    description:
      'Gilbert is one of the fastest-growing towns in the U.S. and consistently ranks among the safest cities in Arizona. Known for excellent schools, the Heritage District, and family-friendly neighborhoods.',
    zips: [
      { code: '85233', area: 'West Gilbert', median: '$485K', change: '-1.5%' },
      { code: '85234', area: 'Central Gilbert', median: '$510K', change: '-1.0%' },
      { code: '85295', area: 'South Gilbert', median: '$540K', change: '-0.5%' },
      { code: '85296', area: 'SE Gilbert', median: '$565K', change: '+0.2%' },
      { code: '85297', area: 'Power Ranch', median: '$530K', change: '-0.8%' },
      { code: '85298', area: 'Agritopia / Morrison Ranch', median: '$580K', change: '+0.3%' },
    ],
    faqs: [
      { question: 'Is Gilbert a good place to live?', answer: 'Gilbert consistently ranks as one of the safest and best places to live in Arizona. It offers top-rated schools (Gilbert Public Schools), the vibrant Heritage District with dining and entertainment, and easy freeway access via the Loop 202 and US-60.' },
      { question: 'What is the average home price in Gilbert?', answer: 'The median home value in Gilbert is approximately $520,000. Gilbert tends to be slightly more expensive than Mesa due to its newer housing stock and highly-rated school district.' },
      { question: 'How are Gilbert schools?', answer: 'Gilbert Public Schools is one of the highest-rated districts in Arizona. Notable schools include Gilbert Classical Academy, Highland High School, and Perry High School. The district consistently outperforms state averages in test scores.' },
    ],
  },
  chandler: {
    name: 'Chandler',
    slug: 'chandler',
    median: '$495K',
    medianNum: 495000,
    typicalRent: '$1,950/mo',
    dom: '55',
    stl: '97.9%',
    inventory: '6,218',
    yoyChange: '-1.5%',
    description:
      'Chandler is a major tech hub in the East Valley, home to Intel, PayPal, and numerous tech companies. The city offers a mix of established neighborhoods and newer developments with excellent amenities.',
    zips: [
      { code: '85224', area: 'West Chandler', median: '$440K', change: '-1.8%' },
      { code: '85225', area: 'Central Chandler', median: '$460K', change: '-1.2%' },
      { code: '85226', area: 'West Chandler', median: '$470K', change: '-0.9%' },
      { code: '85249', area: 'South Chandler', median: '$580K', change: '+0.4%' },
      { code: '85248', area: 'Ocotillo', median: '$620K', change: '+0.6%' },
      { code: '85286', area: 'Central Chandler', median: '$490K', change: '-0.5%' },
    ],
    faqs: [
      { question: 'Is Chandler a good place to live?', answer: 'Chandler is a thriving city with a strong job market (Intel, PayPal, Wells Fargo), excellent schools, and a vibrant downtown with dining and entertainment. It offers diverse housing from affordable condos to luxury estates in Ocotillo.' },
      { question: 'What is the average home price in Chandler?', answer: 'The median home value in Chandler is approximately $495,000. Prices range from $440K in west Chandler to $620K+ in the Ocotillo area.' },
      { question: 'What are the best neighborhoods in Chandler?', answer: 'Popular neighborhoods include Ocotillo (master-planned with lakes), Sun Groves (family-friendly), Clemente Ranch (established with mature trees), and downtown Chandler (walkable with restaurants and shops).' },
    ],
  },
  'queen-creek': {
    name: 'Queen Creek',
    slug: 'queen-creek',
    median: '$545K',
    medianNum: 545000,
    typicalRent: '$2,200/mo',
    dom: '48',
    stl: '98.3%',
    inventory: '4,105',
    yoyChange: '-0.8%',
    description:
      'Queen Creek is one of the fastest-growing communities in Arizona, known for its rural charm, newer construction, and family-oriented lifestyle. The town has seen rapid development while maintaining its agricultural heritage.',
    zips: [
      { code: '85142', area: 'Queen Creek', median: '$540K', change: '-0.8%' },
      { code: '85140', area: 'San Tan Valley / QC', median: '$480K', change: '-1.0%' },
    ],
    faqs: [
      { question: 'Is Queen Creek a good place to live?', answer: 'Queen Creek offers newer homes, excellent schools (Queen Creek Unified), a small-town feel with modern amenities, and easy access to outdoor recreation. The Schnepf Farms area hosts popular seasonal events.' },
      { question: 'What is the average home price in Queen Creek?', answer: 'The median home value in Queen Creek is approximately $545,000. Most homes are newer construction (built after 2005) with modern floor plans and energy-efficient features.' },
      { question: 'How far is Queen Creek from Phoenix?', answer: 'Queen Creek is about 35-40 miles southeast of downtown Phoenix, roughly a 40-50 minute drive via the Loop 202 (Santan Freeway). The town has been growing rapidly as the freeway system has improved access.' },
    ],
  },
  'san-tan-valley': {
    name: 'San Tan Valley',
    slug: 'san-tan-valley',
    median: '$432K',
    medianNum: 432000,
    typicalRent: '$1,650/mo',
    dom: '65',
    stl: '97.2%',
    inventory: '3,890',
    yoyChange: '-2.8%',
    description:
      'San Tan Valley is an unincorporated community in Pinal County offering some of the most affordable newer homes in the East Valley. Popular with families and first-time buyers seeking value.',
    zips: [
      { code: '85140', area: 'San Tan Valley', median: '$425K', change: '-2.5%' },
      { code: '85143', area: 'San Tan Valley South', median: '$440K', change: '-3.0%' },
    ],
    faqs: [
      { question: 'Is San Tan Valley a good place to live?', answer: 'San Tan Valley offers affordable newer homes, growing amenities, and a suburban lifestyle. It is popular with families and first-time buyers. The area is served by J.O. Combs Unified School District and Florence Unified School District.' },
      { question: 'What is the average home price in San Tan Valley?', answer: 'The median home value in San Tan Valley is approximately $432,000 — one of the most affordable options in the East Valley for newer construction homes.' },
      { question: 'Is San Tan Valley in Maricopa or Pinal County?', answer: 'San Tan Valley is in Pinal County, which means lower property taxes compared to Maricopa County. However, some services differ from incorporated cities like Mesa or Gilbert.' },
    ],
  },
  'apache-junction': {
    name: 'Apache Junction',
    slug: 'apache-junction',
    median: '$365K',
    medianNum: 365000,
    typicalRent: '$1,450/mo',
    dom: '72',
    stl: '96.8%',
    inventory: '2,340',
    yoyChange: '-3.2%',
    description:
      'Apache Junction sits at the base of the Superstition Mountains and offers the most affordable entry point in the East Valley. Known for its desert scenery, outdoor recreation, and snowbird-friendly communities.',
    zips: [
      { code: '85120', area: 'Apache Junction', median: '$355K', change: '-3.0%' },
      { code: '85119', area: 'Apache Junction East', median: '$375K', change: '-3.5%' },
    ],
    faqs: [
      { question: 'Is Apache Junction a good place to live?', answer: 'Apache Junction offers the most affordable housing in the East Valley with stunning desert scenery and access to the Superstition Mountains, Lost Dutchman State Park, and Canyon Lake. It is popular with retirees and outdoor enthusiasts.' },
      { question: 'What is the average home price in Apache Junction?', answer: 'The median home value in Apache Junction is approximately $365,000 — the most affordable in the East Valley. The market includes a mix of manufactured homes, older single-family homes, and some newer developments.' },
      { question: 'How far is Apache Junction from Mesa?', answer: 'Apache Junction is directly east of Mesa, about 15-20 minutes via the US-60 (Superstition Freeway). Many Apache Junction residents commute to Mesa, Gilbert, or Chandler for work.' },
    ],
  },
};

const validSlugs = Object.keys(cityData);

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = cityData[slug];
  if (!city) return { title: 'City Not Found' };

  return {
    title: `${city.name}, AZ Real Estate — Market Data & Home Values`,
    description: `${city.name} real estate: median home value ${city.median}, ${city.dom} days on market, ${city.inventory} active listings. Free tools and local agent support.`,
    alternates: { canonical: `https://mesahomes.com/areas/${city.slug}` },
    openGraph: {
      title: `${city.name}, AZ Real Estate | MesaHomes`,
      description: `Market data, home values, and real estate tools for ${city.name}, Arizona.`,
      url: `https://mesahomes.com/areas/${city.slug}`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = cityData[slug];
  if (!city) notFound();

  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${city.name}, Arizona`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: 'AZ',
      addressCountry: 'US',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: city.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Hero */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-16 text-center">
            <h1
              className="mb-4 font-heading text-3xl font-bold text-charcoal md:text-4xl"
              style={{ fontSize: 'var(--text-section)' }}
            >
              {city.name}, AZ Real Estate
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-text-light">{city.description}</p>
            <div className="mx-auto flex max-w-md justify-center gap-6">
              <div>
                <div className="text-2xl font-bold tabular-nums text-primary">{city.median}</div>
                <div className="text-xs text-text-light">Median Home Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-primary">{city.typicalRent}</div>
                <div className="text-xs text-text-light">Typical Rent</div>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Market Snapshot */}
        <FadeInOnScroll>
          <section className="bg-warm-beige px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading text-2xl font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                {city.name} Market Snapshot
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <StatCard label="Median Value" value={city.median} />
                <StatCard label="Days on Market" value={city.dom} />
                <StatCard label="Sale-to-List" value={city.stl} />
                <StatCard label="Active Listings" value={city.inventory} />
                <StatCard label="YoY Change" value={city.yoyChange} />
              </div>
              <p className="mt-4 text-center text-xs text-text-light">
                Data from county assessors and Zillow Research — updated monthly.
              </p>
            </div>
          </section>
        </FadeInOnScroll>

        {/* ZIP Code Breakdown */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-12">
            <div className="mx-auto max-w-4xl">
              <h2
                className="mb-6 text-center font-heading text-2xl font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                {city.name} ZIP Code Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-warm-border">
                      <th className="px-3 py-2 font-semibold text-charcoal">ZIP Code</th>
                      <th className="px-3 py-2 font-semibold text-charcoal">Area</th>
                      <th className="px-3 py-2 font-semibold text-charcoal">Median Value</th>
                      <th className="px-3 py-2 font-semibold text-charcoal">YoY Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {city.zips.map((zip) => (
                      <tr key={zip.code} className="border-b border-warm-border/50">
                        <td className="px-3 py-2 font-medium tabular-nums text-primary">{zip.code}</td>
                        <td className="px-3 py-2 text-text-light">{zip.area}</td>
                        <td className="px-3 py-2 tabular-nums text-charcoal">{zip.median}</td>
                        <td className="px-3 py-2 tabular-nums text-text-light">{zip.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Seller CTA */}
        <FadeInOnScroll>
          <section className="bg-warm-beige px-4 py-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="mb-4 font-heading text-2xl font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Thinking of selling in {city.name}?
              </h2>
              <p className="mb-6 text-text-light">
                Save thousands with flat-fee MLS listing. Your home appears on Zillow, Redfin, and all major portals.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/tools/home-value"
                  className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white transition-all duration-100 hover:bg-secondary-dark active:scale-[0.98]"
                >
                  Get Your Home Value
                </Link>
                <Link
                  href="/tools/net-sheet"
                  className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  See Your Net Sheet
                </Link>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* Buyer CTA */}
        <FadeInOnScroll>
          <section className="bg-paper px-4 py-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="mb-4 font-heading text-2xl font-bold text-charcoal"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Looking to buy in {city.name}?
              </h2>
              <p className="mb-6 text-text-light">
                Free tools and local agent support to help you find the right home at the right price.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/tools/affordability"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-100 hover:bg-primary-light active:scale-[0.98]"
                >
                  Check Affordability
                </Link>
                <Link
                  href="/buy/first-time-buyer"
                  className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  First-Time Buyer Guide
                </Link>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* FAQ */}
        <FadeInOnScroll>
          <FAQSection items={city.faqs} title={`${city.name} FAQ`} />
        </FadeInOnScroll>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="text-xl font-bold tabular-nums text-primary">{value}</div>
      <div className="mt-1 text-xs text-text-light">{label}</div>
    </div>
  );
}
