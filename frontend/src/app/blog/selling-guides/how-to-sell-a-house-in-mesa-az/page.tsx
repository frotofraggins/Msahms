import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'How to Sell a House in Mesa AZ: Complete 2026 Guide | MesaHomes',
  description:
    'Step-by-step guide to selling your Mesa, Arizona home in 2026. Pricing, three service tiers, Arizona disclosures, closing costs, realistic timelines.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
  },
  openGraph: {
    title: 'How to Sell a House in Mesa AZ: Complete 2026 Guide',
    description:
      'The full process, the three ways to do it, and the numbers. Written by a licensed Arizona Realtor in Mesa.',
    url: 'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Sell a House in Mesa AZ: Complete 2026 Guide',
  description:
    'Step-by-step guide to selling your Mesa, Arizona home in 2026. Pricing strategy, three service tiers, Arizona disclosures, closing costs, realistic timelines.',
  datePublished: '2026-04-28',
  dateModified: '2026-04-28',
  author: { '@type': 'Organization', name: 'MesaHomes', url: 'https://mesahomes.com' },
  publisher: {
    '@type': 'Organization',
    name: 'MesaHomes',
    url: 'https://mesahomes.com',
    logo: { '@type': 'ImageObject', url: 'https://mesahomes.com/brand/mesahomes-logo-primary.png' },
  },
  articleSection: 'Selling Guides',
  mainEntityOfPage:
    'https://mesahomes.com/blog/selling-guides/how-to-sell-a-house-in-mesa-az',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does it take to sell a house in Mesa AZ in 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Median days on market in Mesa is about 60 days as of early 2026. Add 30 to 45 days for the escrow period after a signed offer. Most Mesa sales close 90 to 120 days from first listing to closing day.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best month to list a house in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'February through April sees the strongest buyer activity in Mesa. Out-of-state retirees and snowbird buyers are most active in winter and early spring. Summer gets slower as triple-digit temperatures reduce showings. If you can, list in late February or early March.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are typical seller closing costs in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expect 6 to 8 percent of sale price in total seller costs if you use a traditional agent: 5 to 6 percent commission, 1 percent for title / escrow / transfer fees, plus any buyer concessions. With flat-fee MLS the total drops to roughly 3 to 4 percent because you save about 2.5 percent on the listing side.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to make repairs before listing in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fix anything that is broken, leaking, or will fail an inspection. Skip cosmetic upgrades unless they close a clear gap against comparable listings. Mesa buyers in 2026 generally prefer paying less to inheriting someone else\'s renovation choices. Focus on systems (HVAC, plumbing, roof) and safety (GFCI outlets, smoke detectors, stair rails).',
      },
    },
    {
      '@type': 'Question',
      name: 'What disclosures does Arizona require when selling?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Arizona requires the Seller Property Disclosure Statement (SPDS) for any material fact about the property the seller knows. For homes built before 1978, federal lead-based paint disclosure. If the property is in an HOA, the HOA Status form with current assessments. If on septic, Arizona Department of Environmental Quality Form 430 within 6 months of closing. Missing a required disclosure exposes you to post-closing liability.',
      },
    },
  ],
};

export default function HowToSellHouseMesaAz() {
  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <ArticleBody />
      </main>
      <Footer />
      <StickyContactBar />
    </>
  );
}

function ArticleBody() {
  return (
    <article className="bg-paper px-4 py-16">
      <div className="mx-auto" style={{ maxWidth: '65ch' }}>
        <nav className="mb-4 text-sm text-text-light">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          {' / '}
          <Link href="/blog/selling-guides" className="hover:text-primary">Selling Guides</Link>
          {' / '}
          <span className="text-charcoal">How to Sell a House in Mesa AZ</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          How to Sell a House in Mesa AZ: Complete 2026 Guide
        </h1>

        <p className="mb-6 text-lg text-text-light">
          Selling a house in Mesa in 2026 is different than it was two years ago. Rates are still
          elevated, inventory is up, buyers are pickier. You have three real service options and
          a 90 to 120 day timeline from listing to closing. This guide walks through the full
          process, the real numbers, and the tradeoffs most Mesa sellers miss.
        </p>

        <div className="prose prose-sm max-w-none text-text-light">
          <ArticleSections />
        </div>
      </div>
    </article>
  );
}

function ArticleSections() {
  return (
    <>
      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        1. Pick your service tier before anything else
      </h2>
      <p className="my-3">
        The first real decision isn&apos;t pricing, photos, or staging. It&apos;s how much
        help you need. Three paths matter in Mesa right now:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>FSBO (For Sale By Owner)</strong>. You handle everything. No MLS
          exposure. Saves the listing commission but costs you buyer volume.
          Only works if you already have a buyer lined up (family, neighbor,
          current tenant).
        </li>
        <li>
          <strong>Mesa Listing Service ($999 flat-fee MLS + $400 at closing)</strong>. You
          get on ARMLS, syndicates to Zillow / Realtor.com / Redfin / Trulia /
          Homes.com automatically. A licensed broker handles paperwork and
          compliance. You handle showings and offers.{' '}
          <Link href="/blog/selling-guides/flat-fee-mls-mesa-az" className="text-primary underline">
            Full breakdown of what flat-fee covers
          </Link>
          .
        </li>
        <li>
          <strong>Full-service agent representation</strong> at 2.5-3% listing commission.
          Agent does pricing, photography, showings, negotiations, paperwork.
          Worth it when the sale is complicated or you can&apos;t be hands-on.
        </li>
      </ul>
      <p className="my-3">
        On a $448,000 Mesa home (the current median), the numbers break down
        roughly like this for listing-side costs:
      </p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>FSBO: $0 listing, $0 MLS exposure. Highest risk of a low sale price.</li>
        <li>Flat-fee MLS: about $1,400 total. Full MLS exposure.</li>
        <li>Full-service: about $11,000 to $13,500 in commission. Full service.</li>
      </ul>
      <p className="my-3">
        You still pay a buyer&apos;s agent 2 to 3 percent on top of all three
        (post-NAR-settlement you can offer any amount, but most Mesa buyers
        are represented). The question is really, &quot;what does the
        $10,000 difference between flat-fee and full-service buy me?&quot;
        The honest answer: less work on your end, and expert negotiation
        if the sale gets complicated.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        2. Price the home against current comps, not last year&apos;s peak
      </h2>
      <p className="my-3">
        Mesa prices peaked in mid-2022 and have adjusted down about 8 percent
        since. The median in early 2026 is roughly $448,000. If you bought in
        2021 or earlier, you&apos;re still up. If you bought near the peak,
        price expectations need a reset. Pulling the wrong comps is the
        single biggest mistake Mesa sellers make right now.
      </p>
      <p className="my-3">What actually works:</p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Use sales from the last 90 days</strong>. Not 12 months.
          The market moves fast enough that year-old comps misprice your
          home by 3 to 5 percent.
        </li>
        <li>
          <strong>Match the ZIP and subdivision</strong>. 85201 (West Mesa)
          and 85213 (Northeast Mesa) are different markets. Houses in Las
          Sendas comp to other Las Sendas homes, not to generic Mesa.
        </li>
        <li>
          <strong>Adjust for obvious differences</strong>. Pool adds $15-25K,
          no pool subtracts the same. 3-car garage vs 2-car is worth $8-12K.
          Finished basement is rare in Mesa; price it carefully.
        </li>
        <li>
          <strong>Listen to what hasn&apos;t sold</strong>. Houses sitting
          60+ days at current price are telling you the ceiling for your
          neighborhood.
        </li>
      </ul>
      <p className="my-3">
        Our{' '}
        <Link href="/tools/home-value" className="text-primary underline">
          free home value estimator
        </Link>{' '}
        pulls from the same ARMLS comp data Realtors use. It&apos;s a good
        starting point. For a sharper number, have a full-service agent
        walk the property (free for consultations) or get a pre-listing
        appraisal ($400-500).
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        3. Arizona disclosures — what&apos;s required, what trips people up
      </h2>
      <p className="my-3">
        Arizona has some of the most detailed seller-disclosure requirements
        in the country. Most sellers who get in trouble post-closing get
        sued over disclosure, not over the sale itself. The required
        documents:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>SPDS (Seller Property Disclosure Statement)</strong> — the
          big one. 6+ pages of yes/no questions about everything from
          roof leaks to HOA disputes. Answer honestly even if it seems
          minor. &quot;I don&apos;t know&quot; is fine; guessing is not.
        </li>
        <li>
          <strong>Lead-based paint disclosure</strong> (homes built before
          1978). Federal requirement.
        </li>
        <li>
          <strong>HOA Status form + current assessments</strong> if the
          property is in an HOA. Most Mesa subdivisions built after 1990
          have HOAs. Check if yours does before you list.
        </li>
        <li>
          <strong>ADEQ Form 430</strong> if on septic. Inspection required
          within 6 months of closing.
        </li>
        <li>
          <strong>Insurance claims history</strong> (not legally required but
          strongly advised). Share any water damage, fire, roof, or HVAC
          claims from the last 5 years. Hiding this is the #1 cause of
          post-sale litigation in Arizona.
        </li>
      </ul>
      <p className="my-3">
        If you&apos;re selling through our Mesa Listing Service, our broker
        reviews all disclosures before they go out. If you&apos;re FSBO,
        get an Arizona real estate attorney to review your SPDS before you
        hand it to a buyer — $200-400 of legal review saves $20,000+ in
        post-closing liability.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        4. Pre-listing prep that actually pays back
      </h2>
      <p className="my-3">
        Mesa buyers in 2026 aren&apos;t paying for your flip-style kitchen
        upgrade. They&apos;re paying for a house that doesn&apos;t feel
        neglected. The things worth doing:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Deep clean + declutter</strong>. Every surface, every
          closet. If the house looks cared-for, buyers assume the
          mechanicals are too. Biggest ROI on any pre-listing dollar.
        </li>
        <li>
          <strong>HVAC tune-up + filter change</strong>. Arizona buyers
          ask about AC age and service history during showings.
          $150 service call + a printed receipt changes the conversation.
        </li>
        <li>
          <strong>Professional photos</strong>. Nothing kills a listing
          faster than dark phone photos. Flat-fee packages include photos;
          FSBO sellers should budget $200-400 for a local pro.
        </li>
        <li>
          <strong>Fix obvious stuff</strong>. Broken outlets, torn screens,
          peeling weatherstripping, running toilets, scuffed baseboards.
          Individually small. Collectively they make the inspector (and
          the buyer) nervous.
        </li>
      </ul>
      <p className="my-3">Skip these unless your comps require them:</p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>Kitchen remodel (6-month delay, rarely recovers cost)</li>
        <li>Bathroom remodel (same)</li>
        <li>New flooring throughout (buyers prefer to pick their own)</li>
        <li>Landscape overhaul (Mesa desert landscaping holds value as-is)</li>
        <li>Pool resurfacing (unless visibly failing)</li>
      </ul>
      <p className="my-3">
        Strong rule of thumb: if the repair is about aesthetics, the
        buyer probably wants to do it their way. If the repair is about
        function or safety, do it yourself before listing.
      </p>

      {/* Article continues in next commit: sections 5-7 + CTA + FAQ + disclaimer */}
      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        5. When to list — seasonal timing in Mesa
      </h2>
      <p className="my-3">
        Mesa has a distinct real estate season driven by weather and snowbird
        migration. Not every week of the year is equal.
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Late February through April</strong>: peak buyer traffic.
          Out-of-state retirees are house-hunting during their Arizona
          winters. Snowbirds with a 6-month budget window close fast.
          If you can list in this window, do it.
        </li>
        <li>
          <strong>May through September</strong>: slower. Triple-digit days
          reduce showing traffic. Families with kids relocating for a July
          or August school start still drive demand, but tours drop.
          Price aggressively if you must list in summer.
        </li>
        <li>
          <strong>October through early December</strong>: recovering. Buyers
          returning to Arizona as temperatures drop. Good time to list if
          you missed spring and need to close before year-end.
        </li>
        <li>
          <strong>Mid-December through January</strong>: dead. Holidays and
          pre-tax-year buyer caution. Most sellers wait for February.
        </li>
      </ul>
      <p className="my-3">
        Current 2026 context: inventory is up about 15% year-over-year,
        which means buyers have more choice and less urgency. A February
        listing in 2026 still beats a June listing, but by a smaller
        margin than in a tight market.{' '}
        <Link href="/tools/sell-now-or-wait" className="text-primary underline">
          Our sell-now-or-wait tool
        </Link>{' '}
        runs the math for your specific situation.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        6. The 90 to 120 day timeline
      </h2>
      <p className="my-3">Typical Mesa sale, start to finish:</p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Week 1</strong>: Pre-listing prep. Sign listing agreement,
          shoot photos, draft MLS description, complete SPDS and HOA
          disclosures. If you&apos;re flat-fee, this is 2-3 days.
        </li>
        <li>
          <strong>Week 1-8</strong>: Active on MLS. Median Mesa days-to-offer
          is about 45 right now. Expect 4-10 showings in the first week if
          priced correctly. If you&apos;ve gone 2+ weeks with no offers, the
          price is the problem — not the photos or the marketing.
        </li>
        <li>
          <strong>Week 8-10</strong>: Offer + negotiation. Budget 3-7 days
          for counter-offers and addendum negotiation. Most Mesa deals
          settle within two rounds.
        </li>
        <li>
          <strong>Week 10-12</strong>: Inspection period (10 days standard
          under the AAR Purchase Contract). Buyer inspects; you negotiate
          any inspection findings. This is where 30% of deals die.
          Common killers: roof, HVAC, sewer scope, pool.
        </li>
        <li>
          <strong>Week 12-15</strong>: Financing + appraisal. Usually 21-30
          days. The big risks: low appraisal (buyer demands price reduction)
          or loan issues (back to market with a &quot;back on market&quot;
          stigma).
        </li>
        <li>
          <strong>Week 15-17</strong>: Final walkthrough + closing. 3-5
          days. Mesa title companies handle escrow; you sign documents
          at the title company or via mobile notary.
        </li>
      </ul>
      <p className="my-3">
        Fastest Mesa sales close in 30-45 days (cash buyer, no inspection,
        no financing). Slowest common cases run 150 days (VA loan, major
        inspection repairs, multiple contingencies). Plan for 90-120 days
        and be pleasantly surprised if it&apos;s faster.
      </p>

      {/* Continued in final commit: section 7 + CTA + FAQ + disclaimer */}
      <p className="my-3 text-sm italic">
        Final section + next-steps CTA continues below.
      </p>
    </>
  );
}
