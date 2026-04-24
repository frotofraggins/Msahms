/**
 * Property-based test for AI output structural validity.
 *
 * **Property 11: AI Output Structural Validity**
 * **Validates: Requirements 5.1, 6.1, 6.4**
 *
 * For any valid property input → listing output is non-empty, 100-2000 chars,
 * references bed/bath count.
 * For any valid offer input → output is non-empty, contains price and closing
 * date, includes disclaimer.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateListingDescription, generateOfferDraft } from './index.js';
import type { ListingInput, OfferInput } from './index.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const bedroomArb = fc.integer({ min: 1, max: 8 });
const bathroomArb = fc.oneof(
  fc.integer({ min: 1, max: 6 }),
  fc.constantFrom(1.5, 2.5, 3.5),
);
const sqftArb = fc.integer({ min: 500, max: 10000 });
const lotSizeArb = fc.oneof(fc.constant(undefined), fc.integer({ min: 2000, max: 50000 }));
const yearBuiltArb = fc.oneof(fc.constant(undefined), fc.integer({ min: 1950, max: 2026 }));
const neighborhoodArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('Eastmark', 'Las Sendas', 'Superstition Springs', 'Power Ranch'),
);
const upgradesArb = fc.oneof(
  fc.constant(undefined),
  fc.array(
    fc.constantFrom('granite countertops', 'new HVAC', 'pool', 'solar panels', 'smart home'),
    { minLength: 1, maxLength: 3 },
  ),
);

const listingInputArb: fc.Arbitrary<ListingInput> = fc
  .tuple(bedroomArb, bathroomArb, sqftArb, lotSizeArb, yearBuiltArb, neighborhoodArb, upgradesArb)
  .map(([bedrooms, bathrooms, sqft, lotSize, yearBuilt, neighborhood, upgrades]) => ({
    bedrooms,
    bathrooms,
    sqft,
    lotSize,
    yearBuilt,
    neighborhood,
    upgrades,
  }));

const priceArb = fc.integer({ min: 100000, max: 5000000 });
const earnestArb = fc.integer({ min: 1000, max: 100000 });
const financingArb = fc.constantFrom('Conventional', 'FHA', 'VA', 'Cash');
const contingencyArb = fc.array(
  fc.constantFrom('inspection', 'appraisal', 'financing', 'sale of home'),
  { minLength: 0, maxLength: 4 },
);
const closingDateArb = fc
  .tuple(
    fc.integer({ min: 2026, max: 2027 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

const addressArb = fc
  .tuple(
    fc.integer({ min: 100, max: 9999 }),
    fc.constantFrom('Main St', 'Oak Ave', 'Elm Dr', 'Desert Willow Ln'),
    fc.constantFrom('Mesa', 'Gilbert', 'Chandler'),
  )
  .map(([num, street, city]) => `${num} ${street}, ${city}, AZ`);

const offerInputArb: fc.Arbitrary<OfferInput> = fc
  .tuple(addressArb, priceArb, earnestArb, financingArb, contingencyArb, closingDateArb)
  .map(([propertyAddress, offeredPrice, earnestMoney, financingType, contingencies, closingDate]) => ({
    propertyAddress,
    offeredPrice,
    earnestMoney,
    financingType,
    contingencies,
    closingDate,
  }));

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 11: AI Output Structural Validity', () => {
  it('listing description: non-empty, 100-2000 chars, references bed/bath', () => {
    fc.assert(
      fc.property(listingInputArb, (input) => {
        const description = generateListingDescription(input);

        // (a) Non-empty
        expect(description.length).toBeGreaterThan(0);

        // (b) Between 100 and 2000 characters
        expect(description.length).toBeGreaterThanOrEqual(100);
        expect(description.length).toBeLessThanOrEqual(2000);

        // (c) References bedroom and bathroom count
        expect(description).toContain(String(input.bedrooms));
        expect(description).toContain(String(input.bathrooms));
      }),
      { numRuns: 200 },
    );
  });

  it('offer draft: non-empty, contains price and closing date, includes disclaimer', () => {
    fc.assert(
      fc.property(offerInputArb, (input) => {
        const draft = generateOfferDraft(input);

        // (a) Non-empty
        expect(draft.length).toBeGreaterThan(0);

        // (b) Contains the offered price and closing date
        expect(draft).toContain(input.offeredPrice.toLocaleString());
        expect(draft).toContain(input.closingDate);

        // (c) Includes the legal disclaimer
        expect(draft).toContain('DISCLAIMER');
        expect(draft).toContain('informational purposes only');
      }),
      { numRuns: 200 },
    );
  });
});
