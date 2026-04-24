/**
 * Property data normalization module for the MesaHomes platform.
 *
 * Maps raw ArcGIS response records from Pinal County and Maricopa County
 * into a unified `NormalizedProperty` model. Handles field-name differences,
 * type conversions, and county-specific optional fields.
 */

import type { County, AssessorEndpoint } from './county-router.js';
import { getAssessorEndpoint } from './county-router.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A raw record from an ArcGIS REST query response.
 * Field names vary by county — values may be strings, numbers, or null.
 */
export type RawRecord = Record<string, unknown>;

/**
 * Unified property data model that normalizes field differences between
 * Pinal County and Maricopa County assessor data.
 */
export interface NormalizedProperty {
  /** Full property street address. */
  address: string | null;
  /** Last sale price in dollars. */
  salePrice: number | null;
  /** Last sale date as a string (format varies by county). */
  saleDate: string | null;
  /** Living area in square feet. */
  sqft: number | null;
  /** Year the structure was built. */
  yearBuilt: number | null;
  /** Current assessed (full cash) value in dollars. */
  assessedValue: number | null;
  /** Subdivision or plat name. */
  subdivision: string | null;
  /** Primary owner name. */
  ownerName: string | null;
  /** Lot size value (in the unit specified by `lotSizeUnit`). */
  lotSize: number | null;
  /** Unit of the lot size value. */
  lotSizeUnit: 'acres' | 'sqft';
  /** Property ZIP code. */
  zip: string | null;

  // County-specific optional fields ----------------------------------------

  /** Number of floors (Pinal only). */
  floors: number | null;
  /** Land value in dollars (Pinal only). */
  landValue: number | null;
  /** Taxable / limited property value in dollars. */
  taxableValue: number | null;
  /** Latitude (Maricopa only). */
  latitude: number | null;
  /** Longitude (Maricopa only). */
  longitude: number | null;
  /** City zoning code (Maricopa only). */
  zoning: string | null;
  /** Jurisdiction / city name (Maricopa only). */
  jurisdiction: string | null;
  /** School district name (Pinal only). */
  schoolDistrict: string | null;
  /** Tax district description (Pinal only). */
  taxDistrict: string | null;
  /** Property class description (Pinal only). */
  propertyClass: string | null;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/**
 * Safely extract a trimmed string from a raw field value.
 * Returns `null` for null, undefined, or empty/whitespace-only strings.
 */
export function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Safely convert a raw field value to a number.
 * Returns `null` for null, undefined, empty strings, or non-numeric values.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const str = String(value).trim();
  if (str.length === 0) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw ArcGIS response record into the unified property model.
 *
 * @param rawRecord - A single feature's `attributes` object from an ArcGIS
 *   REST query response.
 * @param county - Which county the record came from (`'pinal'` or `'maricopa'`).
 * @returns A `NormalizedProperty` with all fields mapped and converted.
 */
export function normalizePropertyRecord(
  rawRecord: RawRecord,
  county: County,
): NormalizedProperty {
  const endpoint: AssessorEndpoint = getAssessorEndpoint(county);

  // Common fields present in both counties
  const address = toStringOrNull(rawRecord[endpoint.addressField]);
  const salePrice = toNumberOrNull(rawRecord[endpoint.salePriceField]);
  const saleDate = toStringOrNull(rawRecord[endpoint.saleDateField]);
  const sqft = toNumberOrNull(rawRecord[endpoint.sqftField]);
  const yearBuilt = toNumberOrNull(rawRecord[endpoint.yearBuiltField]);
  const assessedValue = toNumberOrNull(rawRecord[endpoint.assessedValueField]);
  const subdivision = toStringOrNull(rawRecord[endpoint.subdivisionField]);
  const ownerName = toStringOrNull(rawRecord[endpoint.ownerField]);
  const lotSize = toNumberOrNull(rawRecord[endpoint.lotSizeField]);
  const lotSizeUnit = endpoint.lotSizeUnit;
  const zip = toStringOrNull(rawRecord[endpoint.zipField]);

  // County-specific optional fields
  const floors = endpoint.floorsField
    ? toNumberOrNull(rawRecord[endpoint.floorsField])
    : null;

  const landValue = endpoint.landValueField
    ? toNumberOrNull(rawRecord[endpoint.landValueField])
    : null;

  const taxableValue = endpoint.taxableValueField
    ? toNumberOrNull(rawRecord[endpoint.taxableValueField])
    : null;

  const latitude = endpoint.latField
    ? toNumberOrNull(rawRecord[endpoint.latField])
    : null;

  const longitude = endpoint.lonField
    ? toNumberOrNull(rawRecord[endpoint.lonField])
    : null;

  const zoning = endpoint.zoningField
    ? toStringOrNull(rawRecord[endpoint.zoningField])
    : null;

  const jurisdiction = endpoint.jurisdictionField
    ? toStringOrNull(rawRecord[endpoint.jurisdictionField])
    : null;

  const schoolDistrict = endpoint.schoolDistField
    ? toStringOrNull(rawRecord[endpoint.schoolDistField])
    : null;

  const taxDistrict = endpoint.taxDistField
    ? toStringOrNull(rawRecord[endpoint.taxDistField])
    : null;

  const propertyClass = endpoint.classField
    ? toStringOrNull(rawRecord[endpoint.classField])
    : null;

  return {
    address,
    salePrice,
    saleDate,
    sqft,
    yearBuilt,
    assessedValue,
    subdivision,
    ownerName,
    lotSize,
    lotSizeUnit,
    zip,
    floors,
    landValue,
    taxableValue,
    latitude,
    longitude,
    zoning,
    jurisdiction,
    schoolDistrict,
    taxDistrict,
    propertyClass,
  };
}
