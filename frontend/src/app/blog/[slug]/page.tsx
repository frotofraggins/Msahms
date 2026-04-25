import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyContactBar } from '@/components/StickyContactBar';
import { FullServiceUpgradeBanner } from '@/components/FullServiceUpgradeBanner';
import { BlogLeadCapture } from './BlogPostClient';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  topic: string;
  body: string;
}

/** Placeholder blog posts — replaced by CMS/API data in production. */
const posts: Record<string, BlogPost> = {
  'mesa-housing-market-2026': {
    slug: 'mesa-housing-market-2026',
    title: 'Mesa Housing Market Update — What to Expect in 2026',
    description: 'Median home values, days on market, and inventory trends for Mesa and the East Valley heading into 2026.',
    date: '2026-04-15',
    topic: 'market-update',
    body: `The Mesa housing market continues to adjust after the rapid appreciation of 2021-2023. Here's what the latest data tells us about where things are headed.

## Current Market Conditions

Mesa's median home value sits at approximately $448,000, down about 2.4% year-over-year. Days on market have increased to 60, giving buyers more negotiating power than they've had in recent years.

## Key Trends to Watch

**Inventory is rising.** With over 25,500 active listings in the Mesa metro area, buyers have significantly more options than during the pandemic-era shortage.

**Sale-to-list ratios are normalizing.** At 97.7%, homes are selling slightly below asking price on average — a healthy sign for a balanced market.

**Interest rates remain a factor.** Mortgage rates continue to influence affordability and buyer demand across the East Valley.

## What This Means for Sellers

If you're considering selling, the market still favors well-priced, well-presented homes. Properties that are competitively priced are selling within 30-45 days, while overpriced listings are sitting longer.

## What This Means for Buyers

This is a good time to buy if you've been waiting on the sidelines. More inventory, less competition, and sellers willing to negotiate on price and closing costs.`,
  },
  'flat-fee-vs-traditional-agent-guide': {
    slug: 'flat-fee-vs-traditional-agent-guide',
    title: 'Flat-Fee vs Traditional Agent: The Complete Guide',
    description: 'How flat-fee MLS listing works, what you get, and how much you can save compared to a traditional 5-6% commission.',
    date: '2026-04-10',
    topic: 'selling',
    body: `Selling your home doesn't have to cost 5-6% in agent commissions. Here's everything you need to know about flat-fee MLS listing and how it compares to the traditional model.

## What Is Flat-Fee MLS Listing?

With flat-fee listing, you pay a fixed amount (typically $999 at MesaHomes) to get your home listed on the MLS — the same database traditional agents use. Your listing then syndicates to Zillow, Realtor.com, Redfin, Trulia, and hundreds of other portals.

## What Do You Get?

- Full MLS listing with professional exposure
- Syndication to all major real estate portals
- Listing management through closing
- Professional photography coordination

## How Much Can You Save?

On a $450,000 home, a traditional 5% commission would cost $22,500. With MesaHomes flat-fee listing at $999 plus a $400 broker fee, your total cost is $1,399 — saving you over $21,000.

## When Should You Choose Full Service?

If you prefer hands-off selling with an agent handling showings, negotiations, and paperwork, full-service may be worth the cost. MesaHomes lets you start with flat-fee and upgrade to full-service at any time.`,
  },
  'first-time-buyer-arizona-2026': {
    slug: 'first-time-buyer-arizona-2026',
    title: 'First-Time Home Buyer Guide for Arizona (2026)',
    description: 'Step-by-step process, down payment assistance programs, and what the NAR settlement means for buyers.',
    date: '2026-04-05',
    topic: 'buying',
    body: `Buying your first home in Arizona? This guide walks you through the entire process, from getting pre-approved to closing day.

## Step 1: Check Your Finances

Before you start looking at homes, understand what you can afford. Use our affordability calculator to get a realistic budget based on your income, debts, and down payment.

## Step 2: Get Pre-Approved

A mortgage pre-approval letter shows sellers you're a serious buyer. Shop at least 3 lenders to compare rates and fees.

## Step 3: Find Your Home

Work with a local agent who knows the East Valley. Focus on neighborhoods that match your budget, commute, and lifestyle needs.

## Arizona Down Payment Assistance

Several programs can help first-time buyers in Arizona:
- **Home Plus Program** — up to 5% DPA as a forgivable loan
- **Pathway to Purchase** — up to 10% DPA for specific ZIP codes
- **FHA loans** — as low as 3.5% down payment

## NAR Settlement Changes

Recent NAR policy changes mean buyer agent compensation is now negotiable. Your agent should explain your options before you sign a buyer-broker agreement.`,
  },
  'best-neighborhoods-mesa-az': {
    slug: 'best-neighborhoods-mesa-az',
    title: 'Best Neighborhoods in Mesa, AZ for Families',
    description: 'From Red Mountain Ranch to Eastmark — a neighborhood-by-neighborhood guide for families moving to Mesa.',
    date: '2026-03-28',
    topic: 'neighborhoods',
    body: `Mesa offers diverse neighborhoods for every family size and budget. Here are the top picks for 2026.

## Red Mountain Ranch (85215)

A master-planned community with a golf course, community center, and top-rated schools. Median home price around $520K.

## Eastmark (85212)

One of the newest and most popular communities in Mesa. Modern homes, great amenities, and Gilbert Public Schools. Median around $560K.

## Las Sendas (85207)

Upscale community at the base of the Usery Mountains. Golf course, hiking trails, and stunning views. Median around $650K.

## Superstition Springs (85209)

Established neighborhood near the Superstition Springs Mall. Good schools, mature landscaping, and median prices around $480K.

## Central Mesa (85201-85204)

The most affordable option with easy access to downtown Mesa, light rail, and the arts district. Median prices from $360K-$450K.`,
  },
  'arizona-closing-costs-explained': {
    slug: 'arizona-closing-costs-explained',
    title: 'Arizona Closing Costs Explained: Buyer & Seller Guide',
    description: 'What to expect at closing in Arizona — title fees, escrow, recording fees, and how to reduce your costs.',
    date: '2026-03-20',
    topic: 'selling',
    body: `Understanding closing costs is essential whether you're buying or selling in Arizona. Here's a breakdown of what to expect.

## Seller Closing Costs

- **Agent commission**: 5-6% (or $999 flat fee with MesaHomes)
- **Title insurance (owner's policy)**: ~$1,000-$2,000
- **Escrow fees**: ~$500-$1,000
- **Recording fees**: ~$50-$100
- **HOA transfer fees**: $200-$500 if applicable

## Buyer Closing Costs

- **Loan origination fee**: 0.5-1% of loan amount
- **Appraisal**: $400-$600
- **Title insurance (lender's policy)**: ~$500-$1,000
- **Escrow fees**: ~$500-$1,000
- **Prepaid items**: Property taxes, insurance, interest

## How to Reduce Closing Costs

1. Shop multiple title companies
2. Negotiate seller concessions
3. Compare lender fees with Loan Estimates
4. Ask about lender credits in exchange for a slightly higher rate`,
  },
  'investing-in-mesa-rental-properties': {
    slug: 'investing-in-mesa-rental-properties',
    title: 'Investing in Mesa Rental Properties: 2026 Guide',
    description: 'Rental yields, best ZIP codes for investors, and landlord-tenant law basics for Mesa, AZ.',
    date: '2026-03-15',
    topic: 'investing',
    body: `Mesa's rental market offers solid opportunities for real estate investors. Here's what you need to know.

## Why Invest in Mesa?

- Strong population growth and rental demand
- Affordable entry points compared to Phoenix
- Diverse tenant pool (families, students, retirees)
- Favorable landlord-tenant laws

## Best ZIP Codes for Investors

- **85201 (Central Mesa)**: Lower purchase prices, higher yields (~5-6%)
- **85210 (South Mesa)**: Affordable with steady rental demand
- **85205 (NE Mesa)**: Good balance of appreciation and cash flow

## Typical Rental Yields

Gross rental yields in Mesa range from 4-6% depending on location and property type. Net yields after expenses typically run 2-4%.

## Landlord-Tenant Law Basics

Arizona's landlord-tenant act requires:
- Security deposits capped at 1.5x monthly rent
- 2-day notice for non-payment of rent
- 10-day notice for lease violations
- Proper habitability standards`,
  },
};

const validSlugs = Object.keys(posts);

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://mesahomes.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://mesahomes.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'MesaHomes',
      url: 'https://mesahomes.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MesaHomes',
      url: 'https://mesahomes.com',
    },
    mainEntityOfPage: `https://mesahomes.com/blog/${post.slug}`,
  };

  return (
    <>
      <Header />
      <FullServiceUpgradeBanner />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <article className="bg-paper px-4 py-16">
          <div className="mx-auto" style={{ maxWidth: '65ch' }}>
            <time className="text-sm text-text-light">{formatDate(post.date)}</time>
            <h1
              className="mt-2 mb-6 font-heading font-bold text-charcoal"
              style={{ fontSize: 'var(--text-section)' }}
            >
              {post.title}
            </h1>

            {/* Rendered markdown body (placeholder — plain text paragraphs) */}
            <div className="prose prose-sm max-w-none text-text-light">
              {post.body.split('\n\n').map((paragraph, i) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={i} className="mt-8 mb-3 font-heading text-xl font-bold text-charcoal">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('- **')) {
                  const items = paragraph.split('\n').filter(Boolean);
                  return (
                    <ul key={i} className="my-3 list-disc space-y-1 pl-5">
                      {items.map((item, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith('1. ')) {
                  const items = paragraph.split('\n').filter(Boolean);
                  return (
                    <ol key={i} className="my-3 list-decimal space-y-1 pl-5">
                      {items.map((item, j) => (
                        <li key={j}>{item.replace(/^\d+\. /, '')}</li>
                      ))}
                    </ol>
                  );
                }
                return <p key={i} className="my-3">{paragraph}</p>;
              })}
            </div>

            {/* Contextual lead capture */}
            <BlogLeadCapture topic={post.topic} />
          </div>
        </article>
      </main>

      <Footer />
      <StickyContactBar />
    </>
  );
}
