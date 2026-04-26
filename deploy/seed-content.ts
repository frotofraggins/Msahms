/**
 * Seed initial content — 6 city pages + 3 foundational blog posts.
 *
 * Run: npx tsx deploy/seed-content.ts
 *
 * Writes to DynamoDB mesahomes-main table using the shared putItem helper.
 * Requires AWS credentials configured (profile Msahms or env vars).
 */

import { putItem } from '../lib/dynamodb.js';
import { generateCityPageKeys, generateBlogPostKeys } from '../lib/models/keys.js';

// ---------------------------------------------------------------------------
// City pages
// ---------------------------------------------------------------------------

const cities = [
  {
    slug: 'mesa',
    name: 'Mesa',
    state: 'AZ',
    medianHomeValue: 448000,
    typicalRent: 1735,
    population: 518012,
    topZips: ['85201', '85203', '85207', '85212', '85213'],
    description: 'Mesa is the third-largest city in Arizona and the heart of the East Valley. With a mix of established neighborhoods, new construction, and a growing downtown arts district, Mesa offers something for every buyer and seller.',
    buyerHighlight: 'Diverse neighborhoods from historic downtown to master-planned communities like Eastmark and Cadence.',
    sellerHighlight: 'Strong demand with median days on market around 60 days. Flat-fee listing saves Mesa sellers thousands.',
  },
  {
    slug: 'gilbert',
    name: 'Gilbert',
    state: 'AZ',
    medianHomeValue: 520000,
    typicalRent: 1950,
    population: 280500,
    topZips: ['85233', '85234', '85295', '85296', '85297'],
    description: 'Gilbert consistently ranks among the safest and most family-friendly cities in Arizona. Known for excellent schools, the Heritage District, and a strong sense of community.',
    buyerHighlight: 'Top-rated schools and family-friendly neighborhoods. Gilbert is one of the fastest-growing cities in the Phoenix metro.',
    sellerHighlight: 'Higher median values and strong buyer demand. Homes in Gilbert sell quickly with the right pricing.',
  },
  {
    slug: 'chandler',
    name: 'Chandler',
    state: 'AZ',
    medianHomeValue: 495000,
    typicalRent: 1850,
    population: 275987,
    topZips: ['85224', '85225', '85226', '85249', '85286'],
    description: 'Chandler is a tech hub with major employers like Intel, PayPal, and Microchip Technology. The city offers a vibrant downtown, excellent dining, and well-maintained neighborhoods.',
    buyerHighlight: 'Strong job market and proximity to tech employers. Downtown Chandler has walkable dining and entertainment.',
    sellerHighlight: 'Tech-driven demand keeps Chandler home values stable. Sellers benefit from a well-educated buyer pool.',
  },
  {
    slug: 'queen-creek',
    name: 'Queen Creek',
    state: 'AZ',
    medianHomeValue: 545000,
    typicalRent: 2100,
    population: 75000,
    topZips: ['85142', '85298'],
    description: 'Queen Creek is one of the fastest-growing communities in the Phoenix metro, known for its rural charm, equestrian properties, and newer master-planned communities.',
    buyerHighlight: 'New construction and larger lots. Queen Creek offers a small-town feel with big-city amenities nearby.',
    sellerHighlight: 'Rising values in a growth market. New construction competition means pricing strategy matters.',
  },
  {
    slug: 'san-tan-valley',
    name: 'San Tan Valley',
    state: 'AZ',
    medianHomeValue: 432000,
    typicalRent: 1650,
    population: 110000,
    topZips: ['85140', '85143'],
    description: 'San Tan Valley is an unincorporated community in Pinal County offering affordable homes, newer construction, and easy access to the East Valley job market.',
    buyerHighlight: 'Most affordable entry point in the Mesa metro. Newer homes with modern floor plans and community amenities.',
    sellerHighlight: 'Growing demand from first-time buyers and families priced out of Maricopa County cities.',
  },
  {
    slug: 'apache-junction',
    name: 'Apache Junction',
    state: 'AZ',
    medianHomeValue: 350000,
    typicalRent: 1400,
    population: 42571,
    topZips: ['85120', '85219'],
    description: 'Apache Junction sits at the base of the Superstition Mountains, offering stunning desert scenery, outdoor recreation, and the most affordable homes in the Mesa metro area.',
    buyerHighlight: 'Lowest entry price in the service area. Ideal for first-time buyers, retirees, and outdoor enthusiasts.',
    sellerHighlight: 'Growing interest from buyers seeking affordability. Unique desert lifestyle is a strong selling point.',
  },
];

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

const blogPosts = [
  {
    slug: 'flat-fee-vs-traditional-agent-mesa-az',
    title: 'Flat-Fee vs Traditional Agent: What Mesa Sellers Need to Know in 2026',
    author: 'MesaHomes Team',
    publishDate: '2026-04-20',
    category: 'Selling',
    city: 'Mesa',
    zips: ['85201', '85203', '85207'],
    metaDescription: 'Compare flat-fee MLS listing vs traditional real estate agent costs for Mesa, AZ home sellers. See how much you can save with MesaHomes.',
    tags: ['flat-fee', 'selling', 'mesa', 'savings'],
    status: 'published',
    body: `# Flat-Fee vs Traditional Agent: What Mesa Sellers Need to Know in 2026

If you're selling a home in Mesa, AZ, you have more options than ever. The traditional 5-6% agent commission model is no longer the only path to a successful sale.

## What is a flat-fee MLS listing?

A flat-fee listing puts your home on the MLS (Multiple Listing Service) — the same database that feeds Zillow, Realtor.com, Redfin, and every other major portal — for a fixed price instead of a percentage of your sale price.

With MesaHomes, that's $999 plus a $400 broker transaction fee. Compare that to a traditional 5% commission on a $450,000 Mesa home: $22,500.

## The math is simple

| | Flat-Fee (MesaHomes) | Traditional (5%) |
|---|---|---|
| Commission | $1,399 | $22,500 |
| MLS Listing | ✅ | ✅ |
| Zillow/Redfin/Realtor.com | ✅ | ✅ |
| You Save | **$21,101** | — |

## When does flat-fee make sense?

Flat-fee works best when you're comfortable handling showings and basic negotiations, or when you want to start with flat-fee and upgrade to full-service if needed. MesaHomes lets you switch at any time.

Use our [Seller Net Sheet Calculator](/tools/net-sheet) to see your exact savings.`,
  },
  {
    slug: 'first-time-buyer-guide-mesa-az-2026',
    title: 'First-Time Home Buyer Guide: Mesa, AZ (2026 Edition)',
    author: 'MesaHomes Team',
    publishDate: '2026-04-18',
    category: 'Buying',
    city: 'Mesa',
    zips: ['85201', '85203', '85207', '85212'],
    metaDescription: 'Step-by-step guide for first-time home buyers in Mesa, AZ. Pre-approval, down payment assistance, and what to expect in 2026.',
    tags: ['first-time-buyer', 'buying', 'mesa', 'guide'],
    status: 'published',
    body: `# First-Time Home Buyer Guide: Mesa, AZ (2026 Edition)

Buying your first home in Mesa is exciting — and a little overwhelming. This guide walks you through every step, from pre-approval to closing day.

## Step 1: Check your affordability

Before you start looking at homes, know your budget. Use our [Affordability Calculator](/tools/affordability) to see how much home you can afford based on your income, debts, and down payment.

## Step 2: Get pre-approved

A pre-approval letter from a lender shows sellers you're serious. It also locks in your interest rate for 60-90 days.

## Step 3: Arizona down payment assistance

Arizona offers several programs for first-time buyers:
- **Arizona Home Plus**: Up to 5% down payment assistance
- **Pathway to Purchase**: Maricopa County assistance program
- **Home in Five Advantage**: Up to 5% for Maricopa County homes

## Step 4: Start your home search

Mesa's median home value is around $448,000 in 2026. Popular neighborhoods include Eastmark, Superstition Springs, and the historic downtown area.

## Step 5: Make an offer

Use our [AI Offer Writer](/tools/offer-writer) to draft your offer, then work with an agent to finalize the terms.

Ready to get started? [Check your affordability](/tools/affordability) or [book a consultation](/booking).`,
  },
  {
    slug: 'mesa-az-real-estate-market-update-april-2026',
    title: 'Mesa, AZ Real Estate Market Update — April 2026',
    author: 'MesaHomes Team',
    publishDate: '2026-04-15',
    category: 'Market Update',
    city: 'Mesa',
    zips: ['85201', '85203', '85207', '85212', '85213'],
    metaDescription: 'Mesa, AZ real estate market update for April 2026. Median home values, days on market, inventory levels, and what it means for buyers and sellers.',
    tags: ['market-update', 'mesa', 'data', 'trends'],
    status: 'published',
    body: `# Mesa, AZ Real Estate Market Update — April 2026

Here's what's happening in the Mesa real estate market this month, based on county-verified data and Zillow Research.

## Key metrics

| Metric | Value | Trend |
|--------|-------|-------|
| Median Home Value | $448,000 | ↓ 2.4% from last year |
| Days on Market | 60 | ↑ from 55 last month |
| Sale-to-List Ratio | 97.7% | Stable |
| Active Inventory | 25,524 | ↑ 8% from last year |

## What this means for sellers

The market is shifting slightly toward buyers with more inventory and longer days on market. Pricing strategy matters more than ever. Use our [Sell Now or Wait](/tools/sell-now-or-wait) tool to analyze your timing.

## What this means for buyers

More inventory means more choices and slightly more negotiating power. The sale-to-list ratio of 97.7% means most homes are selling close to asking price, but there's room to negotiate.

## ZIP code breakdown

- **85201** (Central Mesa): $360K, ↓1.2%
- **85203** (NE Mesa): $449K, ↓0.8%
- **85207** (NE Mesa): $555K, ↑0.3%
- **85212** (Hawes Crossing): $560K, ↑0.5%

Check your specific area on our [Mesa city page](/areas/mesa).

*Data sources: Maricopa County Assessor, Zillow Research (March 2026 release).*`,
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding city pages...');
  for (const city of cities) {
    const keys = generateCityPageKeys(city.slug);
    await putItem({
      ...keys,
      entityType: 'CONTENT' as any,
      data: city,
    });
    console.log(`  ✓ ${city.name}`);
  }

  console.log('Seeding blog posts...');
  for (const post of blogPosts) {
    const keys = generateBlogPostKeys(post.slug, post.publishDate);
    await putItem({
      ...keys,
      entityType: 'CONTENT' as any,
      data: post,
    });
    console.log(`  ✓ ${post.title}`);
  }

  console.log('Done! 6 city pages + 3 blog posts seeded.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
