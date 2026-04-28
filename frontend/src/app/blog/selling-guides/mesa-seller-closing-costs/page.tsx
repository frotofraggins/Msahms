import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';

export const metadata: Metadata = {
  title: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026 | MesaHomes',
  description:
    'Line-by-line breakdown of seller closing costs in Mesa, Arizona. Commission, title, escrow, transfer fees, HOA, prorations. Real dollar amounts on a \$448K home.',
  alternates: {
    canonical: 'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
  },
  openGraph: {
    title: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026',
    description:
      'Every fee a Mesa home seller pays. Specific dollar amounts, not percentages.',
    url: 'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
    type: 'article',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mesa AZ Seller Closing Costs: Real Numbers for 2026',
  description:
    'Line-by-line breakdown of seller closing costs in Mesa, Arizona. Commission, title, escrow, transfer fees, HOA, prorations. Real dollar amounts on a \$448K home.',
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
    'https://mesahomes.com/blog/selling-guides/mesa-seller-closing-costs',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost to sell a \$400,000 home in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With a traditional agent, expect \$26,000 to \$32,000 in total seller costs: roughly \$20,000 to \$24,000 in agent commissions, \$4,000 to \$6,000 in title/escrow/transfer fees, plus prorated taxes and HOA. With flat-fee MLS, total costs drop to \$13,000 to \$16,000 — the savings come from paying \$999 flat instead of \$10,000+ listing commission.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the seller pay the buyer agent commission in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After the August 2024 NAR settlement, no — not automatically. The seller can offer any amount to the buyer agent, including zero. Most Mesa sellers still offer 2 to 3 percent because that is what buyer agents expect to see. Offering less is legal but reduces showings from agent-represented buyers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are typical title and escrow fees in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On a \$448,000 Mesa sale: owner title policy \$1,200-1,800, escrow fee \$600-900, document prep \$150-250, recording \$30-50, notary \$20. Title and escrow are negotiable between buyer and seller; Arizona custom is the seller pays the owner policy and splits escrow.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a real estate transfer tax in Arizona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Arizona does not impose a state or county real estate transfer tax. This is one of the reasons Arizona total closing costs run lower than states like California, Washington, or New York. You may still see a small \$2-5 recording fee per document, but no percentage-based transfer tax.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who pays the HOA transfer fee in Mesa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Varies by HOA. Most Mesa HOAs charge a transfer/capital contribution fee of \$200-500 at closing. The purchase contract specifies who pays (seller, buyer, or split). Read your listing agreement. Newer master-planned communities (Eastmark, Cadence, Union Park) tend to have higher transfer fees (\$500-1,500) than older Mesa subdivisions.',
      },
    },
  ],
};

export default function MesaSellerClosingCosts() {
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
          <span className="text-charcoal">Mesa Seller Closing Costs</span>
        </nav>

        <time className="text-sm text-text-light">April 28, 2026</time>
        <h1 className="mt-2 mb-6 font-heading font-bold text-charcoal" style={{ fontSize: 'var(--text-section)' }}>
          Mesa AZ Seller Closing Costs: Real Numbers for 2026
        </h1>

        <p className="mb-6 text-lg text-text-light">
          Every Mesa seller asks the same question: what do I actually walk
          away with? This guide breaks down every line item that hits your
          closing statement, with real dollar amounts on a $448,000 home
          (current median). No percentages that don&apos;t translate to
          your situation. No vague ranges.
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
        1. The big number: agent commissions
      </h2>
      <p className="my-3">
        Commissions are the single largest line on any Mesa seller&apos;s
        closing statement. Historically, sellers paid 5 to 6 percent total,
        split between the listing agent (2.5-3%) and the buyer&apos;s agent
        (2.5-3%). The August 2024 NAR settlement changed the rules. You
        can still offer a buyer-agent commission, but you are not required
        to.
      </p>
      <p className="my-3">
        <strong>Traditional full-service on a $448,000 home</strong>:
      </p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>Listing commission 2.75%: $12,320</li>
        <li>Buyer-agent offer 2.5%: $11,200</li>
        <li>Total commission: $23,520</li>
      </ul>
      <p className="my-3">
        <strong>Flat-fee MLS on the same home</strong>:
      </p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>Listing fee: $999 up front</li>
        <li>Broker fee at closing: $400</li>
        <li>Buyer-agent offer 2.5%: $11,200</li>
        <li>Total: $12,599</li>
      </ul>
      <p className="my-3">
        Savings of about $10,900 on a single median-priced Mesa transaction.
        That&apos;s the core pitch of flat-fee. See{' '}
        <Link href="/blog/selling-guides/flat-fee-mls-mesa-az" className="text-primary underline">
          our flat-fee MLS guide
        </Link>{' '}
        for the full breakdown of what each path includes.
      </p>
      <p className="my-3">
        <strong>Real NAR-settlement-era question</strong>: should you offer
        less than 2.5% to the buyer agent? You can offer 1.5% or even 0%.
        Here&apos;s the trade-off: every 0.5% you shave saves about $2,240
        on a $448K home, but your listing shows up in buyer-agent searches
        ranked by commission offered. Offering 1% instead of 2.5% typically
        reduces your showing count 40-60% based on early post-settlement
        data. On homes sitting 60+ days already, that&apos;s fatal.
      </p>
      <p className="my-3">
        Most Mesa sellers still offer 2-2.5% to the buyer agent. The math
        says splitting the difference with the agent (offer 2% instead of
        2.5%) often saves real money without killing showings, but test
        the waters with your home&apos;s specific comp set.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        2. Title insurance + escrow fees
      </h2>
      <p className="my-3">
        Arizona custom: seller pays the owner&apos;s title insurance policy
        (protects the buyer&apos;s ownership rights), buyer pays the
        lender&apos;s policy if they&apos;re financing. Escrow fee typically
        splits. On a $448,000 Mesa sale:
      </p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>Owner&apos;s title policy (seller): $1,400-1,800</li>
        <li>Escrow fee split (seller&apos;s half): $300-500</li>
        <li>Document prep: $150-250</li>
        <li>Recording of deed: $30-50</li>
        <li>Notary fee (signing appointment): $20-50</li>
        <li>Wire transfer fee for seller proceeds: $25-35</li>
      </ul>
      <p className="my-3">
        Title insurance rates in Arizona are regulated by the Department of
        Insurance and Financial Institutions. Every title company charges
        roughly the same rate. Where they differ is the escrow fee and
        add-ons (courier, signing fees, reissue credits). Ask for a full
        closing disclosure estimate from 2-3 title companies before closing.
        Easy $200-500 savings.
      </p>
      <p className="my-3">
        <strong>Reissue credit</strong>: if the previous owner&apos;s title
        policy was issued within the last 10 years (you can ask the title
        company to pull it), you may qualify for a reissue rate — 40-50%
        off the standard title premium. Most sellers don&apos;t know to ask.
        Worth $500-900 on a median sale.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        3. Arizona-specific items (no transfer tax, but watch HOA)
      </h2>
      <p className="my-3">
        <strong>Arizona has no state or county real estate transfer tax.</strong>
        This is a real advantage compared to California (up to 1.5% in some
        cities), Washington ($0.60 per $100), or New York (up to 2.625% in
        NYC). Budget zero for this line.
      </p>
      <p className="my-3">
        <strong>HOA transfer fees and prorations</strong> are where Mesa
        sellers get surprised. Almost every Mesa subdivision built after
        1990 has an HOA. Costs at closing:
      </p>
      <ul className="my-3 list-disc space-y-1 pl-6">
        <li>
          HOA transfer / capital contribution fee: $200-1,500. Older
          subdivisions ($200-400), newer master-planned (Eastmark, Cadence,
          Union Park, Verrado) ($500-1,500).
        </li>
        <li>
          Document prep by the HOA management company: $150-300. Required
          for the HOA Status form included in your disclosures.
        </li>
        <li>
          Prorated HOA dues: you pay through your last day of ownership.
          Median Mesa HOA is $80-150/month; larger master-planned
          communities can run $200-400/month.
        </li>
      </ul>
      <p className="my-3">
        <strong>Property tax prorations</strong>. Maricopa County property
        taxes are paid in arrears (current year&apos;s tax is due October
        and March of the following year). At closing, you credit the buyer
        for the portion of the year you owned the home that has not yet
        been billed. On a $448K home with typical Mesa property tax rate
        (~0.63%), that&apos;s ~$2,820/year or ~$235/month. Prorated
        through your closing date.
      </p>
      <p className="my-3">
        <strong>Pool / SRP / utilities</strong>. Final reads at closing,
        pro-rate based on last billing. Usually washes out to under $100
        but worth budgeting for.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        4. Buyer concessions + inspection repairs
      </h2>
      <p className="my-3">
        In a balanced market (which Mesa is in early 2026), buyers
        typically ask for 1-3% in seller concessions. These are
        negotiated after the inspection period and can take any of
        three forms:
      </p>
      <ul className="my-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Credit toward closing costs</strong>. Most common.
          You credit the buyer $3,000-12,000 at closing, reducing
          what they need to bring. No work for you.
        </li>
        <li>
          <strong>Price reduction</strong>. Drop the sale price by
          the concession amount. Same net effect, different paperwork.
        </li>
        <li>
          <strong>Specific repair credits</strong>. Buyer itemizes
          inspection findings (roof, HVAC, water heater, pool pump),
          asks for credit equal to repair cost. You approve, deny, or
          counter each item.
        </li>
      </ul>
      <p className="my-3">
        <strong>Mesa-specific risks</strong>: roof age (most Mesa
        shingle roofs need replacement at year 20-25, repair credits
        are common for roofs 15+ years old), HVAC age (Arizona AC
        systems run hard; 10+ year systems may trigger repair
        requests), sewer scope (older neighborhoods 50+ years have
        cast-iron lines that fail). Pool pumps in homes with older
        pools are also a common ask.
      </p>
      <p className="my-3">
        Budget 1-2% in concessions for a reasonably-priced Mesa home
        in 2026. On a $448K sale, that&apos;s $4,500-9,000. Negotiating
        these is where a full-service agent earns some of their
        commission — flat-fee sellers handle this themselves with
        guidance from the broker.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        Total estimate: what you walk away with
      </h2>
      <p className="my-3">
        Putting it all together. Example: $448,000 Mesa home, current
        market conditions, no major repair items.
      </p>

      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-warm-beige">
              <th className="border border-warm-border p-2 text-left">Line Item</th>
              <th className="border border-warm-border p-2 text-right">Traditional</th>
              <th className="border border-warm-border p-2 text-right">Flat-Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-warm-border p-2">Sale price</td>
              <td className="border border-warm-border p-2 text-right">$448,000</td>
              <td className="border border-warm-border p-2 text-right">$448,000</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Listing commission</td>
              <td className="border border-warm-border p-2 text-right">-$12,320</td>
              <td className="border border-warm-border p-2 text-right">-$1,399</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Buyer-agent commission (2.5%)</td>
              <td className="border border-warm-border p-2 text-right">-$11,200</td>
              <td className="border border-warm-border p-2 text-right">-$11,200</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Owner title policy</td>
              <td className="border border-warm-border p-2 text-right">-$1,600</td>
              <td className="border border-warm-border p-2 text-right">-$1,600</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Escrow + doc prep + recording</td>
              <td className="border border-warm-border p-2 text-right">-$700</td>
              <td className="border border-warm-border p-2 text-right">-$700</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">HOA transfer fee</td>
              <td className="border border-warm-border p-2 text-right">-$400</td>
              <td className="border border-warm-border p-2 text-right">-$400</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Property tax proration</td>
              <td className="border border-warm-border p-2 text-right">-$1,400</td>
              <td className="border border-warm-border p-2 text-right">-$1,400</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2">Buyer concessions (1.5%)</td>
              <td className="border border-warm-border p-2 text-right">-$6,720</td>
              <td className="border border-warm-border p-2 text-right">-$6,720</td>
            </tr>
            <tr className="bg-warm-beige font-semibold">
              <td className="border border-warm-border p-2">Estimated net proceeds</td>
              <td className="border border-warm-border p-2 text-right">$413,660</td>
              <td className="border border-warm-border p-2 text-right">$424,581</td>
            </tr>
            <tr>
              <td className="border border-warm-border p-2 text-xs italic">Savings with flat-fee</td>
              <td className="border border-warm-border p-2 text-right text-xs italic" colSpan={2}>
                +$10,921
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="my-3">
        Your actual situation will vary. Mortgage payoff gets deducted
        from proceeds (not a closing cost per se, but reduces what hits
        your bank). If you&apos;re paying off a HELOC or taking cash
        out of the sale, run the full sheet.
      </p>

      <h2 className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
        What to do next
      </h2>
      <ol className="my-3 list-decimal space-y-2 pl-6">
        <li>
          Run{' '}
          <Link href="/tools/net-sheet" className="text-primary underline">
            the seller net sheet calculator
          </Link>{' '}
          for your specific address and mortgage balance. Takes 3
          minutes, no signup.
        </li>
        <li>
          Compare flat-fee vs full-service side-by-side. Our{' '}
          <Link href="/compare/flat-fee-vs-traditional-agent" className="text-primary underline">
            comparison page
          </Link>{' '}
          runs both scenarios on your numbers.
        </li>
        <li>
          If the flat-fee numbers work,{' '}
          <Link href="/listing/start" className="text-primary underline">
            start your $999 listing
          </Link>
          . If the sale is complicated,{' '}
          <Link href="/booking" className="text-primary underline">
            book a 15-minute consultation
          </Link>
          .
        </li>
      </ol>

      <div className="my-8 rounded-xl border border-primary bg-warm-beige/40 p-6 text-center">
        <h3 className="mb-2 font-heading text-lg font-semibold text-charcoal">
          See your exact numbers in 3 minutes
        </h3>
        <p className="mb-4 text-sm">
          The seller net sheet asks for your address, mortgage balance,
          and a few options. Returns your estimated walkaway for
          flat-fee, FSBO, and full-service side by side.
        </p>
        <Link
          href="/tools/net-sheet"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Try the Net Sheet Calculator →
        </Link>
      </div>

      <hr className="my-8 border-warm-border" />

      <p className="text-xs text-text-light italic">
        This is educational content, not legal or financial advice. For
        specific questions about your property or situation, consult a
        licensed Arizona Realtor. Dollar amounts are estimates based on
        typical 2026 Mesa closings and may not reflect your specific
        case. MesaHomes is licensed in Arizona.
      </p>
    </>
  );
}
