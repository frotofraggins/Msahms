/**
 * ZIP-to-county routing module for the MesaHomes platform.
 *
 * The service area spans two counties — Pinal and Maricopa. This module
 * routes property lookups to the correct county assessor ArcGIS endpoint
 * based on the property ZIP code and provides the field-name mappings
 * needed to normalise the response into a unified model.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported county identifiers in the MesaHomes service area. */
export type County = 'pinal' | 'maricopa';

/**
 * Describes a county assessor ArcGIS REST endpoint and the field names
 * used in that county's data layer. Optional fields are `null` when the
 * county does not expose the corresponding attribute.
 */
export interface AssessorEndpoint {
  /** Full query URL including layer path. */
  url: string;
  /** Field containing the property street address. */
  addressField: string;
  /** Field containing the last sale price. */
  salePriceField: string;
  /** Field containing the last sale date. */
  saleDateField: string;
  /** Field containing the living area in square feet. */
  sqftField: string;
  /** Field containing the year the structure was built. */
  yearBuiltField: string;
  /** Field containing the current assessed (full cash) value. */
  assessedValueField: string;
  /** Field containing the subdivision / plat name. */
  subdivisionField: string;
  /** Field containing the primary owner name. */
  ownerField: string;
  /** Field containing the lot size value. */
  lotSizeField: string;
  /** Unit of the lot size value ('acres' for Pinal, 'sqft' for Maricopa). */
  lotSizeUnit: 'acres' | 'sqft';
  /** Field containing the property ZIP code. */
  zipField: string;
  /** Field containing the number of floors (Pinal only). */
  floorsField: string | null;
  /** Field containing the land value (Pinal only). */
  landValueField: string | null;
  /** Field containing the taxable / limited property value. */
  taxableValueField: string | null;
  /** Field containing the property class description (Pinal only). */
  classField: string | null;
  /** Field containing the school district name (Pinal only). */
  schoolDistField: string | null;
  /** Field containing the tax district description (Pinal only). */
  taxDistField: string | null;
  /** Field containing latitude (Maricopa only). */
  latField?: string | null;
  /** Field containing longitude (Maricopa only). */
  lonField?: string | null;
  /** Field containing the city zoning code (Maricopa only). */
  zoningField?: string | null;
  /** Field containing the jurisdiction / city name (Maricopa only). */
  jurisdictionField?: string | null;
}

// ---------------------------------------------------------------------------
// ZIP → County routing
// ---------------------------------------------------------------------------

/**
 * Set of all Pinal County ZIP codes within the MesaHomes service area.
 *
 * Any ZIP not in this set is assumed to be in Maricopa County (the default
 * for the Mesa metro area).
 */
export const PINAL_COUNTY_ZIPS: ReadonlySet<string> = new Set([
  '85120',
  '85121',
  '85122',
  '85123',
  '85128',
  '85130',
  '85131',
  '85132',
  '85137',
  '85138',
  '85139',
  '85140',
  '85141',
  '85142',
  '85143',
  '85145',
  '85172',
  '85173',
  '85178',
  '85191',
  '85192',
  '85193',
  '85194',
]);

/**
 * Set of all Maricopa County ZIP codes in the MesaHomes service area.
 * Mesa + surrounding cities: 85201–85216, plus Gilbert, Chandler, etc.
 */
export const MARICOPA_SERVICE_ZIPS: ReadonlySet<string> = new Set([
  '85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208',
  '85209', '85210', '85211', '85212', '85213', '85214', '85215', '85216',
  '85233', '85234', '85224', '85225', '85226', '85249',
  '85286', '85295', '85296', '85297', '85298',
]);

/**
 * Full MesaHomes service area = Pinal + Maricopa ZIPs.
 * Used by lead-capture and other lambdas that can't depend on
 * data-pipeline Lambda source (each Lambda is packaged separately).
 */
export const SERVICE_AREA_ZIPS: ReadonlySet<string> = new Set([
  ...PINAL_COUNTY_ZIPS,
  ...MARICOPA_SERVICE_ZIPS,
]);

/**
 * Determine which county a ZIP code belongs to.
 *
 * Returns `'pinal'` when the ZIP is in {@link PINAL_COUNTY_ZIPS},
 * otherwise returns `'maricopa'` (the default for the Mesa metro area).
 */
export function getCounty(zip: string): County {
  return PINAL_COUNTY_ZIPS.has(zip) ? 'pinal' : 'maricopa';
}

// ---------------------------------------------------------------------------
// Assessor endpoint configs
// ---------------------------------------------------------------------------

/** Pinal County Assessor ArcGIS endpoint and field mappings (Layer 3). */
const PINAL_ENDPOINT: AssessorEndpoint = {
  url: 'https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query',
  addressField: 'SITEADDRESS',
  salePriceField: 'SALEPRICE',
  saleDateField: 'SALEDATE',
  sqftField: 'RESFLRAREA',
  yearBuiltField: 'RESYRBLT',
  assessedValueField: 'CNTASSDVAL',
  subdivisionField: 'CNVYNAME',
  ownerField: 'OWNERNME1',
  lotSizeField: 'STATEDAREA',
  lotSizeUnit: 'acres',
  zipField: 'PSTLZIP5',
  floorsField: 'FLOORCOUNT',
  landValueField: 'LNDVALUE',
  taxableValueField: 'CNTTXBLVAL',
  classField: 'CLASSDSCRP',
  schoolDistField: 'SCHLDSCRP',
  taxDistField: 'CVTTXDSCRP',
};

/** Maricopa County Assessor ArcGIS endpoint and field mappings (Layer 0). */
const MARICOPA_ENDPOINT: AssessorEndpoint = {
  url: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
  addressField: 'PHYSICAL_ADDRESS',
  salePriceField: 'SALE_PRICE',
  saleDateField: 'SALE_DATE',
  sqftField: 'LIVING_SPACE',
  yearBuiltField: 'CONST_YEAR',
  assessedValueField: 'FCV_CUR',
  subdivisionField: 'SUBNAME',
  ownerField: 'OWNER_NAME',
  lotSizeField: 'LAND_SIZE',
  lotSizeUnit: 'sqft',
  zipField: 'PHYSICAL_ZIP',
  floorsField: null,
  landValueField: null,
  taxableValueField: 'LPV_CUR',
  classField: null,
  schoolDistField: null,
  taxDistField: null,
  latField: 'LATITUDE',
  lonField: 'LONGITUDE',
  zoningField: 'CITY_ZONING',
  jurisdictionField: 'JURISDICTION',
};

/**
 * Return the assessor endpoint configuration for the given county.
 *
 * The returned object contains the base query URL and all field-name
 * mappings required to build ArcGIS REST queries and normalise the
 * response into the unified MesaHomes property model.
 */
export function getAssessorEndpoint(county: County): AssessorEndpoint {
  return county === 'pinal' ? PINAL_ENDPOINT : MARICOPA_ENDPOINT;
}
