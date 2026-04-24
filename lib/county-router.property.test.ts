// Feature: mesahomes-lead-generation, Property 8: Service Area ZIP Routing
//
// For any property address with a ZIP code, the county routing function SHALL
// return "pinal" if the ZIP is in the Pinal County ZIP set, and "maricopa"
// otherwise, and the returned assessor endpoint configuration SHALL contain
// the correct base URL, field mappings, and query parameters for that county.

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getCounty,
  getAssessorEndpoint,
  PINAL_COUNTY_ZIPS,
  type County,
  type AssessorEndpoint,
} from './county-router.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** All Pinal County ZIPs as an array for sampling. */
const PINAL_ZIPS_ARRAY = [...PINAL_COUNTY_ZIPS];

/** Generates a random ZIP from the Pinal County set. */
const pinalZipArb: fc.Arbitrary<string> = fc.constantFrom(...PINAL_ZIPS_ARRAY);

/** Generates a random 5-digit ZIP string that is NOT in the Pinal set. */
const nonPinalZipArb: fc.Arbitrary<string> = fc
  .integer({ min: 10000, max: 99999 })
  .map(String)
  .filter((zip) => !PINAL_COUNTY_ZIPS.has(zip));

/** Generates any random 5-digit string (may or may not be in Pinal set). */
const anyFiveDigitZipArb: fc.Arbitrary<string> = fc
  .integer({ min: 10000, max: 99999 })
  .map(String);

// ---------------------------------------------------------------------------
// Endpoint validation helpers
// ---------------------------------------------------------------------------

function assertValidEndpoint(endpoint: AssessorEndpoint): void {
  // Must have a valid HTTPS URL ending in /query
  expect(endpoint.url).toMatch(/^https:\/\/.+\/query$/);

  // All common fields must be non-empty strings
  expect(endpoint.addressField).toBeTruthy();
  expect(endpoint.salePriceField).toBeTruthy();
  expect(endpoint.saleDateField).toBeTruthy();
  expect(endpoint.sqftField).toBeTruthy();
  expect(endpoint.yearBuiltField).toBeTruthy();
  expect(endpoint.assessedValueField).toBeTruthy();
  expect(endpoint.subdivisionField).toBeTruthy();
  expect(endpoint.ownerField).toBeTruthy();
  expect(endpoint.lotSizeField).toBeTruthy();
  expect(endpoint.zipField).toBeTruthy();

  // Lot size unit must be one of the two valid values
  expect(['acres', 'sqft']).toContain(endpoint.lotSizeUnit);
}

function assertPinalEndpoint(endpoint: AssessorEndpoint): void {
  expect(endpoint.url).toBe(
    'https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query',
  );
  expect(endpoint.addressField).toBe('SITEADDRESS');
  expect(endpoint.salePriceField).toBe('SALEPRICE');
  expect(endpoint.saleDateField).toBe('SALEDATE');
  expect(endpoint.sqftField).toBe('RESFLRAREA');
  expect(endpoint.yearBuiltField).toBe('RESYRBLT');
  expect(endpoint.assessedValueField).toBe('CNTASSDVAL');
  expect(endpoint.subdivisionField).toBe('CNVYNAME');
  expect(endpoint.ownerField).toBe('OWNERNME1');
  expect(endpoint.lotSizeField).toBe('STATEDAREA');
  expect(endpoint.lotSizeUnit).toBe('acres');
  expect(endpoint.zipField).toBe('PSTLZIP5');
  expect(endpoint.floorsField).toBe('FLOORCOUNT');
  expect(endpoint.landValueField).toBe('LNDVALUE');
}

function assertMaricopaEndpoint(endpoint: AssessorEndpoint): void {
  expect(endpoint.url).toBe(
    'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
  );
  expect(endpoint.addressField).toBe('PHYSICAL_ADDRESS');
  expect(endpoint.salePriceField).toBe('SALE_PRICE');
  expect(endpoint.saleDateField).toBe('SALE_DATE');
  expect(endpoint.sqftField).toBe('LIVING_SPACE');
  expect(endpoint.yearBuiltField).toBe('CONST_YEAR');
  expect(endpoint.assessedValueField).toBe('FCV_CUR');
  expect(endpoint.subdivisionField).toBe('SUBNAME');
  expect(endpoint.ownerField).toBe('OWNER_NAME');
  expect(endpoint.lotSizeField).toBe('LAND_SIZE');
  expect(endpoint.lotSizeUnit).toBe('sqft');
  expect(endpoint.zipField).toBe('PHYSICAL_ZIP');
  expect(endpoint.floorsField).toBeNull();
  expect(endpoint.landValueField).toBeNull();
}

// ---------------------------------------------------------------------------
// Property 8: Service Area ZIP Routing
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 3.1**
 *
 * For any property address with a ZIP code, the county routing function SHALL
 * return "pinal" if the ZIP is in the Pinal County ZIP set, and "maricopa"
 * otherwise, and the returned assessor endpoint configuration SHALL contain
 * the correct base URL, field mappings, and query parameters for that county.
 */
describe('Property 8: Service Area ZIP Routing', () => {
  it('routes any Pinal County ZIP to "pinal" with correct endpoint config', () => {
    fc.assert(
      fc.property(pinalZipArb, (zip) => {
        const county = getCounty(zip);
        expect(county).toBe('pinal');

        const endpoint = getAssessorEndpoint(county);
        assertValidEndpoint(endpoint);
        assertPinalEndpoint(endpoint);
      }),
      { numRuns: 100 },
    );
  });

  it('routes any non-Pinal ZIP to "maricopa" with correct endpoint config', () => {
    fc.assert(
      fc.property(nonPinalZipArb, (zip) => {
        const county = getCounty(zip);
        expect(county).toBe('maricopa');

        const endpoint = getAssessorEndpoint(county);
        assertValidEndpoint(endpoint);
        assertMaricopaEndpoint(endpoint);
      }),
      { numRuns: 100 },
    );
  });

  it('always returns a valid county and endpoint for any 5-digit ZIP', () => {
    fc.assert(
      fc.property(anyFiveDigitZipArb, (zip) => {
        const county = getCounty(zip);

        // Must be one of the two valid counties
        expect(['pinal', 'maricopa']).toContain(county);

        // County must be consistent with the ZIP set membership
        if (PINAL_COUNTY_ZIPS.has(zip)) {
          expect(county).toBe('pinal');
        } else {
          expect(county).toBe('maricopa');
        }

        // Endpoint must be structurally valid
        const endpoint = getAssessorEndpoint(county);
        assertValidEndpoint(endpoint);

        // Endpoint must match the county
        if (county === 'pinal') {
          assertPinalEndpoint(endpoint);
        } else {
          assertMaricopaEndpoint(endpoint);
        }
      }),
      { numRuns: 100 },
    );
  });
});
