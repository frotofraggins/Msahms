import { describe, it, expect } from 'vitest';
import {
  getCounty,
  getAssessorEndpoint,
  PINAL_COUNTY_ZIPS,
  type County,
} from './county-router.js';

// ---------------------------------------------------------------------------
// getCounty
// ---------------------------------------------------------------------------

describe('getCounty', () => {
  it('should return "pinal" for every Pinal County ZIP code', () => {
    const pinalZips = [
      '85120', '85121', '85122', '85123', '85128', '85130', '85131', '85132',
      '85137', '85138', '85139', '85140', '85141', '85142', '85143', '85145',
      '85172', '85173', '85178', '85191', '85192', '85193', '85194',
    ];

    for (const zip of pinalZips) {
      expect(getCounty(zip)).toBe('pinal');
    }
  });

  it('should return "maricopa" for Mesa ZIP codes', () => {
    const mesaZips = ['85201', '85202', '85203', '85204', '85205', '85206',
      '85207', '85208', '85209', '85210', '85212', '85213', '85215'];

    for (const zip of mesaZips) {
      expect(getCounty(zip)).toBe('maricopa');
    }
  });

  it('should return "maricopa" for Gilbert ZIP codes', () => {
    expect(getCounty('85233')).toBe('maricopa');
    expect(getCounty('85234')).toBe('maricopa');
    expect(getCounty('85295')).toBe('maricopa');
    expect(getCounty('85296')).toBe('maricopa');
    expect(getCounty('85297')).toBe('maricopa');
    expect(getCounty('85298')).toBe('maricopa');
  });

  it('should return "maricopa" for Chandler ZIP codes', () => {
    expect(getCounty('85224')).toBe('maricopa');
    expect(getCounty('85225')).toBe('maricopa');
    expect(getCounty('85226')).toBe('maricopa');
    expect(getCounty('85249')).toBe('maricopa');
    expect(getCounty('85286')).toBe('maricopa');
  });

  it('should return "maricopa" for Tempe ZIP codes', () => {
    expect(getCounty('85281')).toBe('maricopa');
    expect(getCounty('85282')).toBe('maricopa');
    expect(getCounty('85283')).toBe('maricopa');
    expect(getCounty('85284')).toBe('maricopa');
  });

  it('should return "maricopa" for Scottsdale ZIP codes', () => {
    expect(getCounty('85250')).toBe('maricopa');
    expect(getCounty('85251')).toBe('maricopa');
    expect(getCounty('85254')).toBe('maricopa');
    expect(getCounty('85260')).toBe('maricopa');
  });

  it('should return "maricopa" for unknown / out-of-area ZIP codes', () => {
    expect(getCounty('90210')).toBe('maricopa');
    expect(getCounty('00000')).toBe('maricopa');
    expect(getCounty('99999')).toBe('maricopa');
  });

  it('should contain exactly 23 Pinal County ZIP codes', () => {
    expect(PINAL_COUNTY_ZIPS.size).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// getAssessorEndpoint — Pinal
// ---------------------------------------------------------------------------

describe('getAssessorEndpoint("pinal")', () => {
  const endpoint = getAssessorEndpoint('pinal');

  it('should return the correct Pinal County GIS base URL (Layer 3)', () => {
    expect(endpoint.url).toBe(
      'https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query',
    );
  });

  it('should map all core fields to the correct Pinal field names', () => {
    expect(endpoint.addressField).toBe('SITEADDRESS');
    expect(endpoint.salePriceField).toBe('SALEPRICE');
    expect(endpoint.saleDateField).toBe('SALEDATE');
    expect(endpoint.sqftField).toBe('RESFLRAREA');
    expect(endpoint.yearBuiltField).toBe('RESYRBLT');
    expect(endpoint.assessedValueField).toBe('CNTASSDVAL');
    expect(endpoint.subdivisionField).toBe('CNVYNAME');
    expect(endpoint.ownerField).toBe('OWNERNME1');
  });

  it('should use acres as the lot size unit', () => {
    expect(endpoint.lotSizeField).toBe('STATEDAREA');
    expect(endpoint.lotSizeUnit).toBe('acres');
  });

  it('should map Pinal-specific fields (floors, land value, tax)', () => {
    expect(endpoint.floorsField).toBe('FLOORCOUNT');
    expect(endpoint.landValueField).toBe('LNDVALUE');
    expect(endpoint.taxableValueField).toBe('CNTTXBLVAL');
    expect(endpoint.classField).toBe('CLASSDSCRP');
    expect(endpoint.schoolDistField).toBe('SCHLDSCRP');
    expect(endpoint.taxDistField).toBe('CVTTXDSCRP');
    expect(endpoint.zipField).toBe('PSTLZIP5');
  });

  it('should not have Maricopa-only fields (lat, lon, zoning, jurisdiction)', () => {
    expect(endpoint.latField).toBeUndefined();
    expect(endpoint.lonField).toBeUndefined();
    expect(endpoint.zoningField).toBeUndefined();
    expect(endpoint.jurisdictionField).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getAssessorEndpoint — Maricopa
// ---------------------------------------------------------------------------

describe('getAssessorEndpoint("maricopa")', () => {
  const endpoint = getAssessorEndpoint('maricopa');

  it('should return the correct Maricopa County GIS base URL (Layer 0)', () => {
    expect(endpoint.url).toBe(
      'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    );
  });

  it('should map all core fields to the correct Maricopa field names', () => {
    expect(endpoint.addressField).toBe('PHYSICAL_ADDRESS');
    expect(endpoint.salePriceField).toBe('SALE_PRICE');
    expect(endpoint.saleDateField).toBe('SALE_DATE');
    expect(endpoint.sqftField).toBe('LIVING_SPACE');
    expect(endpoint.yearBuiltField).toBe('CONST_YEAR');
    expect(endpoint.assessedValueField).toBe('FCV_CUR');
    expect(endpoint.subdivisionField).toBe('SUBNAME');
    expect(endpoint.ownerField).toBe('OWNER_NAME');
  });

  it('should use sqft as the lot size unit', () => {
    expect(endpoint.lotSizeField).toBe('LAND_SIZE');
    expect(endpoint.lotSizeUnit).toBe('sqft');
  });

  it('should map Maricopa-specific fields (lat, lon, zoning, jurisdiction)', () => {
    expect(endpoint.latField).toBe('LATITUDE');
    expect(endpoint.lonField).toBe('LONGITUDE');
    expect(endpoint.zoningField).toBe('CITY_ZONING');
    expect(endpoint.jurisdictionField).toBe('JURISDICTION');
  });

  it('should set Pinal-only fields to null (floors, landValue, class, schoolDist, taxDist)', () => {
    expect(endpoint.floorsField).toBeNull();
    expect(endpoint.landValueField).toBeNull();
    expect(endpoint.classField).toBeNull();
    expect(endpoint.schoolDistField).toBeNull();
    expect(endpoint.taxDistField).toBeNull();
  });

  it('should map taxableValue to LPV_CUR', () => {
    expect(endpoint.taxableValueField).toBe('LPV_CUR');
    expect(endpoint.zipField).toBe('PHYSICAL_ZIP');
  });
});

// ---------------------------------------------------------------------------
// Cross-county assertions
// ---------------------------------------------------------------------------

describe('Both endpoints', () => {
  const counties: County[] = ['pinal', 'maricopa'];

  it.each(counties)('%s endpoint should have a valid HTTPS base URL', (county) => {
    const endpoint = getAssessorEndpoint(county);
    expect(endpoint.url).toMatch(/^https:\/\//);
    expect(endpoint.url).toContain('/query');
  });

  it.each(counties)('%s endpoint should have non-null common fields', (county) => {
    const endpoint = getAssessorEndpoint(county);
    expect(endpoint.addressField).toBeTruthy();
    expect(endpoint.salePriceField).toBeTruthy();
    expect(endpoint.sqftField).toBeTruthy();
    expect(endpoint.yearBuiltField).toBeTruthy();
    expect(endpoint.assessedValueField).toBeTruthy();
    expect(endpoint.subdivisionField).toBeTruthy();
    expect(endpoint.ownerField).toBeTruthy();
  });
});
