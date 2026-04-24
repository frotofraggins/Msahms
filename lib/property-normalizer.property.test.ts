// Feature: mesahomes-lead-generation, Property 9: Property Data Normalization
//
// For any raw property record from either Pinal County GIS or Maricopa County
// GIS, the normalization function SHALL produce a unified response object
// containing all common fields (address, salePrice, saleDate, sqft, yearBuilt,
// assessedValue, subdivision, ownerName, lotSize, zip) with correct values
// mapped from the county-specific field names, and county-specific fields
// (floors, landValue, zoning, latitude, longitude) populated when available
// or null when not.

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  normalizePropertyRecord,
  toStringOrNull,
  toNumberOrNull,
  type RawRecord,
  type NormalizedProperty,
} from './property-normalizer.js';
import { getAssessorEndpoint, type County } from './county-router.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates a non-empty address string. */
const addressArb = fc
  .tuple(
    fc.integer({ min: 100, max: 99999 }),
    fc.constantFrom('N', 'S', 'E', 'W', ''),
    fc.constantFrom('MAIN', 'OAK', 'DREW', 'LUKE', 'BROADWAY', 'CENTER', 'ELLIOT'),
    fc.constantFrom('ST', 'AVE', 'LN', 'DR', 'RD', 'WAY', 'BLVD'),
    fc.constantFrom('MESA', 'GILBERT', 'CHANDLER', 'SAN TAN VALLEY', 'QUEEN CREEK'),
  )
  .map(([num, dir, name, type, city]) =>
    `${num} ${dir} ${name} ${type} ${city}`.replace(/\s+/g, ' ').trim(),
  );

/** Generates a sale price (positive number). */
const salePriceArb = fc.integer({ min: 10000, max: 5000000 });

/** Generates a sale date string. */
const saleDateArb = fc
  .tuple(
    fc.integer({ min: 2000, max: 2026 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generates a living area in sqft. */
const sqftArb = fc.integer({ min: 400, max: 10000 });

/** Generates a year built. */
const yearBuiltArb = fc.integer({ min: 1900, max: 2026 });

/** Generates an assessed value. */
const assessedValueArb = fc.integer({ min: 10000, max: 5000000 });

/** Generates a subdivision name. */
const subdivisionArb = fc.constantFrom(
  'PECAN CREEK NORTH PARCEL 1',
  'HAWES CROSSING',
  'STEWARTS SOUTH MESA ADD',
  'POWER RANCH',
  'SEVILLE GOLF AND COUNTRY CLUB',
  'SUPERSTITION FOOTHILLS',
);

/** Generates an owner name. */
const ownerNameArb = fc
  .tuple(
    fc.constantFrom('SMITH', 'JONES', 'WILLIAMS', 'BROWN', 'DAVIS', 'FLOURNOY'),
    fc.constantFrom('JOHN', 'JANE', 'NICHOLAS', 'MARIA', 'ROBERT', 'SARAH'),
  )
  .map(([last, first]) => `${last} ${first}`);

/** Generates a 5-digit ZIP code string. */
const zipArb = fc.integer({ min: 85100, max: 85299 }).map(String);

/** Generates a Pinal lot size in acres. */
const pinalLotSizeArb = fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true });

/** Generates a Maricopa lot size in sqft. */
const maricopaLotSizeArb = fc.integer({ min: 500, max: 50000 });

/** Generates a floor count. */
const floorsArb = fc.integer({ min: 1, max: 4 });

/** Generates a land value. */
const landValueArb = fc.integer({ min: 5000, max: 500000 });

/** Generates a taxable value. */
const taxableValueArb = fc.integer({ min: 5000, max: 3000000 });

/** Generates a latitude in the Phoenix metro area. */
const latitudeArb = fc.double({ min: 33.0, max: 34.0, noNaN: true, noDefaultInfinity: true });

/** Generates a longitude in the Phoenix metro area. */
const longitudeArb = fc.double({ min: -112.5, max: -111.0, noNaN: true, noDefaultInfinity: true });

/** Generates a zoning code. */
const zoningArb = fc.constantFrom('RS-6', 'RS-9', 'RM-3', 'RM-4', 'C-1', 'C-2', 'I-1');

/** Generates a jurisdiction name. */
const jurisdictionArb = fc.constantFrom('MESA', 'GILBERT', 'CHANDLER', 'TEMPE', 'SCOTTSDALE');

/** Generates a school district name. */
const schoolDistArb = fc.constantFrom('Florence Unified', 'Queen Creek Unified', 'Casa Grande Union');

/** Generates a tax district description. */
const taxDistArb = fc.constantFrom('San Tan Valley Fire District', 'Queen Creek Fire District');

/** Generates a property class description. */
const classArb = fc.constantFrom('Owner Occupied Residential', 'Non-Primary Residence', 'Vacant Land');

// ---------------------------------------------------------------------------
// Raw record generators
// ---------------------------------------------------------------------------

/**
 * Generates a raw Pinal County ArcGIS record with all fields populated.
 * Uses fc.option to randomly include or exclude optional values.
 */
const pinalRawRecordArb: fc.Arbitrary<RawRecord> = fc
  .record({
    SITEADDRESS: addressArb,
    SALEPRICE: fc.option(salePriceArb, { nil: undefined }),
    SALEDATE: fc.option(saleDateArb, { nil: undefined }),
    RESFLRAREA: fc.option(sqftArb, { nil: undefined }),
    RESYRBLT: fc.option(yearBuiltArb, { nil: undefined }),
    CNTASSDVAL: fc.option(assessedValueArb, { nil: undefined }),
    CNVYNAME: fc.option(subdivisionArb, { nil: undefined }),
    OWNERNME1: fc.option(ownerNameArb, { nil: undefined }),
    STATEDAREA: fc.option(pinalLotSizeArb, { nil: undefined }),
    PSTLZIP5: zipArb,
    FLOORCOUNT: fc.option(floorsArb, { nil: undefined }),
    LNDVALUE: fc.option(landValueArb, { nil: undefined }),
    CNTTXBLVAL: fc.option(taxableValueArb, { nil: undefined }),
    CLASSDSCRP: fc.option(classArb, { nil: undefined }),
    SCHLDSCRP: fc.option(schoolDistArb, { nil: undefined }),
    CVTTXDSCRP: fc.option(taxDistArb, { nil: undefined }),
  })
  .map((rec) => {
    // Remove undefined keys to simulate sparse ArcGIS responses
    const result: RawRecord = {};
    for (const [key, value] of Object.entries(rec)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  });

/**
 * Generates a raw Maricopa County ArcGIS record with all fields populated.
 * Uses fc.option to randomly include or exclude optional values.
 */
const maricopaRawRecordArb: fc.Arbitrary<RawRecord> = fc
  .record({
    PHYSICAL_ADDRESS: addressArb,
    SALE_PRICE: fc.option(salePriceArb, { nil: undefined }),
    SALE_DATE: fc.option(saleDateArb, { nil: undefined }),
    LIVING_SPACE: fc.option(sqftArb, { nil: undefined }),
    CONST_YEAR: fc.option(yearBuiltArb, { nil: undefined }),
    FCV_CUR: fc.option(assessedValueArb, { nil: undefined }),
    SUBNAME: fc.option(subdivisionArb, { nil: undefined }),
    OWNER_NAME: fc.option(ownerNameArb, { nil: undefined }),
    LAND_SIZE: fc.option(maricopaLotSizeArb, { nil: undefined }),
    PHYSICAL_ZIP: zipArb,
    LPV_CUR: fc.option(taxableValueArb, { nil: undefined }),
    LATITUDE: fc.option(latitudeArb, { nil: undefined }),
    LONGITUDE: fc.option(longitudeArb, { nil: undefined }),
    CITY_ZONING: fc.option(zoningArb, { nil: undefined }),
    JURISDICTION: fc.option(jurisdictionArb, { nil: undefined }),
  })
  .map((rec) => {
    const result: RawRecord = {};
    for (const [key, value] of Object.entries(rec)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  });

// ---------------------------------------------------------------------------
// Property 9: Property Data Normalization
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 2.1, 3.1**
 *
 * For any raw property record from either Pinal County GIS or Maricopa County
 * GIS, the normalization function SHALL produce a unified response object
 * containing all common fields (address, salePrice, saleDate, sqft, yearBuilt,
 * assessedValue, subdivision, ownerName, lotSize, zip) with correct values
 * mapped from the county-specific field names, and county-specific fields
 * (floors, landValue, zoning, latitude, longitude) populated when available
 * or null when not.
 */
describe('Property 9: Property Data Normalization', () => {
  it('correctly normalizes any Pinal County raw record', () => {
    const pinalEndpoint = getAssessorEndpoint('pinal');

    fc.assert(
      fc.property(pinalRawRecordArb, (rawRecord) => {
        const result = normalizePropertyRecord(rawRecord, 'pinal');

        // Common fields are mapped from Pinal field names
        expect(result.address).toBe(toStringOrNull(rawRecord[pinalEndpoint.addressField]));
        expect(result.salePrice).toBe(toNumberOrNull(rawRecord[pinalEndpoint.salePriceField]));
        expect(result.saleDate).toBe(toStringOrNull(rawRecord[pinalEndpoint.saleDateField]));
        expect(result.sqft).toBe(toNumberOrNull(rawRecord[pinalEndpoint.sqftField]));
        expect(result.yearBuilt).toBe(toNumberOrNull(rawRecord[pinalEndpoint.yearBuiltField]));
        expect(result.assessedValue).toBe(toNumberOrNull(rawRecord[pinalEndpoint.assessedValueField]));
        expect(result.subdivision).toBe(toStringOrNull(rawRecord[pinalEndpoint.subdivisionField]));
        expect(result.ownerName).toBe(toStringOrNull(rawRecord[pinalEndpoint.ownerField]));
        expect(result.lotSize).toBe(toNumberOrNull(rawRecord[pinalEndpoint.lotSizeField]));
        expect(result.zip).toBe(toStringOrNull(rawRecord[pinalEndpoint.zipField]));

        // Lot size unit is always 'acres' for Pinal
        expect(result.lotSizeUnit).toBe('acres');

        // Pinal-specific fields are populated when available
        expect(result.floors).toBe(toNumberOrNull(rawRecord['FLOORCOUNT']));
        expect(result.landValue).toBe(toNumberOrNull(rawRecord['LNDVALUE']));
        expect(result.taxableValue).toBe(toNumberOrNull(rawRecord['CNTTXBLVAL']));
        expect(result.propertyClass).toBe(toStringOrNull(rawRecord['CLASSDSCRP']));
        expect(result.schoolDistrict).toBe(toStringOrNull(rawRecord['SCHLDSCRP']));
        expect(result.taxDistrict).toBe(toStringOrNull(rawRecord['CVTTXDSCRP']));

        // Maricopa-only fields are always null for Pinal
        expect(result.latitude).toBeNull();
        expect(result.longitude).toBeNull();
        expect(result.zoning).toBeNull();
        expect(result.jurisdiction).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('correctly normalizes any Maricopa County raw record', () => {
    const maricopaEndpoint = getAssessorEndpoint('maricopa');

    fc.assert(
      fc.property(maricopaRawRecordArb, (rawRecord) => {
        const result = normalizePropertyRecord(rawRecord, 'maricopa');

        // Common fields are mapped from Maricopa field names
        expect(result.address).toBe(toStringOrNull(rawRecord[maricopaEndpoint.addressField]));
        expect(result.salePrice).toBe(toNumberOrNull(rawRecord[maricopaEndpoint.salePriceField]));
        expect(result.saleDate).toBe(toStringOrNull(rawRecord[maricopaEndpoint.saleDateField]));
        expect(result.sqft).toBe(toNumberOrNull(rawRecord[maricopaEndpoint.sqftField]));
        expect(result.yearBuilt).toBe(toNumberOrNull(rawRecord[maricopaEndpoint.yearBuiltField]));
        expect(result.assessedValue).toBe(toNumberOrNull(rawRecord[maricopaEndpoint.assessedValueField]));
        expect(result.subdivision).toBe(toStringOrNull(rawRecord[maricopaEndpoint.subdivisionField]));
        expect(result.ownerName).toBe(toStringOrNull(rawRecord[maricopaEndpoint.ownerField]));
        expect(result.lotSize).toBe(toNumberOrNull(rawRecord[maricopaEndpoint.lotSizeField]));
        expect(result.zip).toBe(toStringOrNull(rawRecord[maricopaEndpoint.zipField]));

        // Lot size unit is always 'sqft' for Maricopa
        expect(result.lotSizeUnit).toBe('sqft');

        // Maricopa-specific fields are populated when available
        expect(result.latitude).toBe(toNumberOrNull(rawRecord['LATITUDE']));
        expect(result.longitude).toBe(toNumberOrNull(rawRecord['LONGITUDE']));
        expect(result.zoning).toBe(toStringOrNull(rawRecord['CITY_ZONING']));
        expect(result.jurisdiction).toBe(toStringOrNull(rawRecord['JURISDICTION']));
        expect(result.taxableValue).toBe(toNumberOrNull(rawRecord['LPV_CUR']));

        // Pinal-only fields are always null for Maricopa
        expect(result.floors).toBeNull();
        expect(result.landValue).toBeNull();
        expect(result.propertyClass).toBeNull();
        expect(result.schoolDistrict).toBeNull();
        expect(result.taxDistrict).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('produces a structurally valid NormalizedProperty for any county and record', () => {
    const countyArb = fc.constantFrom<County>('pinal', 'maricopa');
    const rawRecordArb = fc.oneof(pinalRawRecordArb, maricopaRawRecordArb);

    fc.assert(
      fc.property(countyArb, rawRecordArb, (county, rawRecord) => {
        const result = normalizePropertyRecord(rawRecord, county);

        // All fields exist on the result (no missing keys)
        const expectedKeys: (keyof NormalizedProperty)[] = [
          'address', 'salePrice', 'saleDate', 'sqft', 'yearBuilt',
          'assessedValue', 'subdivision', 'ownerName', 'lotSize',
          'lotSizeUnit', 'zip', 'floors', 'landValue', 'taxableValue',
          'latitude', 'longitude', 'zoning', 'jurisdiction',
          'schoolDistrict', 'taxDistrict', 'propertyClass',
        ];
        for (const key of expectedKeys) {
          expect(result).toHaveProperty(key);
        }

        // lotSizeUnit is always one of the two valid values
        expect(['acres', 'sqft']).toContain(result.lotSizeUnit);

        // Numeric fields are either null or finite numbers
        const numericFields: (keyof NormalizedProperty)[] = [
          'salePrice', 'sqft', 'yearBuilt', 'assessedValue', 'lotSize',
          'floors', 'landValue', 'taxableValue', 'latitude', 'longitude',
        ];
        for (const field of numericFields) {
          const val = result[field];
          expect(val === null || (typeof val === 'number' && Number.isFinite(val))).toBe(true);
        }

        // String fields are either null or non-empty trimmed strings
        const stringFields: (keyof NormalizedProperty)[] = [
          'address', 'saleDate', 'subdivision', 'ownerName', 'zip',
          'zoning', 'jurisdiction', 'schoolDistrict', 'taxDistrict', 'propertyClass',
        ];
        for (const field of stringFields) {
          const val = result[field];
          if (val !== null) {
            expect(typeof val).toBe('string');
            expect((val as string).length).toBeGreaterThan(0);
            expect(val).toBe((val as string).trim());
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
