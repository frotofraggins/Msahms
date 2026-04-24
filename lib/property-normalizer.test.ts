import { describe, it, expect } from 'vitest';
import {
  normalizePropertyRecord,
  toStringOrNull,
  toNumberOrNull,
  type NormalizedProperty,
} from './property-normalizer.js';

// ---------------------------------------------------------------------------
// toStringOrNull
// ---------------------------------------------------------------------------

describe('toStringOrNull', () => {
  it('returns trimmed string for a non-empty string', () => {
    expect(toStringOrNull('  hello  ')).toBe('hello');
  });

  it('returns null for null', () => {
    expect(toStringOrNull(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toStringOrNull(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toStringOrNull('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(toStringOrNull('   ')).toBeNull();
  });

  it('converts numbers to strings', () => {
    expect(toStringOrNull(42)).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// toNumberOrNull
// ---------------------------------------------------------------------------

describe('toNumberOrNull', () => {
  it('returns the number for a finite number', () => {
    expect(toNumberOrNull(42)).toBe(42);
    expect(toNumberOrNull(3.14)).toBe(3.14);
    expect(toNumberOrNull(0)).toBe(0);
  });

  it('returns null for null', () => {
    expect(toNumberOrNull(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toNumberOrNull('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(toNumberOrNull('   ')).toBeNull();
  });

  it('parses numeric strings', () => {
    expect(toNumberOrNull('42')).toBe(42);
    expect(toNumberOrNull(' 3.14 ')).toBe(3.14);
    expect(toNumberOrNull('0')).toBe(0);
  });

  it('returns null for non-numeric strings', () => {
    expect(toNumberOrNull('abc')).toBeNull();
    expect(toNumberOrNull('12abc')).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(toNumberOrNull(NaN)).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(toNumberOrNull(Infinity)).toBeNull();
    expect(toNumberOrNull(-Infinity)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// normalizePropertyRecord — Pinal County
// ---------------------------------------------------------------------------

describe('normalizePropertyRecord (Pinal)', () => {
  const pinalRecord = {
    SITEADDRESS: '39669 N LUKE LN SAN TAN VALLEY, AZ 85140',
    SALEPRICE: 449999,
    SALEDATE: '2026-04-06',
    RESFLRAREA: 2071.0,
    RESYRBLT: 2004,
    CNTASSDVAL: 291424.0,
    CNVYNAME: 'PECAN CREEK NORTH PARCEL 1',
    OWNERNME1: 'FLOURNOY NICHOLAS',
    STATEDAREA: 0.12,
    PSTLZIP5: '85140',
    FLOORCOUNT: 2,
    LNDVALUE: 75670.0,
    CNTTXBLVAL: 174996.0,
    CLASSDSCRP: 'Owner Occupied Residential',
    SCHLDSCRP: 'Florence Unified',
    CVTTXDSCRP: 'San Tan Valley Fire District',
  };

  it('maps all common fields correctly', () => {
    const result = normalizePropertyRecord(pinalRecord, 'pinal');

    expect(result.address).toBe('39669 N LUKE LN SAN TAN VALLEY, AZ 85140');
    expect(result.salePrice).toBe(449999);
    expect(result.saleDate).toBe('2026-04-06');
    expect(result.sqft).toBe(2071.0);
    expect(result.yearBuilt).toBe(2004);
    expect(result.assessedValue).toBe(291424.0);
    expect(result.subdivision).toBe('PECAN CREEK NORTH PARCEL 1');
    expect(result.ownerName).toBe('FLOURNOY NICHOLAS');
    expect(result.lotSize).toBe(0.12);
    expect(result.lotSizeUnit).toBe('acres');
    expect(result.zip).toBe('85140');
  });

  it('maps Pinal-specific fields (floors, landValue, taxableValue, class, school, tax district)', () => {
    const result = normalizePropertyRecord(pinalRecord, 'pinal');

    expect(result.floors).toBe(2);
    expect(result.landValue).toBe(75670.0);
    expect(result.taxableValue).toBe(174996.0);
    expect(result.propertyClass).toBe('Owner Occupied Residential');
    expect(result.schoolDistrict).toBe('Florence Unified');
    expect(result.taxDistrict).toBe('San Tan Valley Fire District');
  });

  it('sets Maricopa-only fields to null for Pinal records', () => {
    const result = normalizePropertyRecord(pinalRecord, 'pinal');

    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.zoning).toBeNull();
    expect(result.jurisdiction).toBeNull();
  });

  it('handles null/undefined fields gracefully', () => {
    const sparseRecord = {
      SITEADDRESS: '123 MAIN ST',
      PSTLZIP5: '85140',
    };
    const result = normalizePropertyRecord(sparseRecord, 'pinal');

    expect(result.address).toBe('123 MAIN ST');
    expect(result.zip).toBe('85140');
    expect(result.salePrice).toBeNull();
    expect(result.saleDate).toBeNull();
    expect(result.sqft).toBeNull();
    expect(result.yearBuilt).toBeNull();
    expect(result.assessedValue).toBeNull();
    expect(result.subdivision).toBeNull();
    expect(result.ownerName).toBeNull();
    expect(result.lotSize).toBeNull();
    expect(result.floors).toBeNull();
    expect(result.landValue).toBeNull();
  });

  it('handles string numbers by converting them', () => {
    const stringRecord = {
      SITEADDRESS: '456 OAK AVE',
      SALEPRICE: '350000',
      RESFLRAREA: '1800',
      RESYRBLT: '2010',
      CNTASSDVAL: '250000',
      STATEDAREA: '0.15',
      PSTLZIP5: '85143',
      FLOORCOUNT: '1',
      LNDVALUE: '60000',
      CNTTXBLVAL: '150000',
    };
    const result = normalizePropertyRecord(stringRecord, 'pinal');

    expect(result.salePrice).toBe(350000);
    expect(result.sqft).toBe(1800);
    expect(result.yearBuilt).toBe(2010);
    expect(result.assessedValue).toBe(250000);
    expect(result.lotSize).toBe(0.15);
    expect(result.floors).toBe(1);
    expect(result.landValue).toBe(60000);
    expect(result.taxableValue).toBe(150000);
  });
});

// ---------------------------------------------------------------------------
// normalizePropertyRecord — Maricopa County
// ---------------------------------------------------------------------------

describe('normalizePropertyRecord (Maricopa)', () => {
  const maricopaRecord = {
    PHYSICAL_ADDRESS: '850 S DREW ST MESA 85210',
    SALE_PRICE: 35000,
    SALE_DATE: '05/01/2009',
    LIVING_SPACE: 759,
    CONST_YEAR: 1948,
    FCV_CUR: 204300,
    SUBNAME: 'STEWARTS SOUTH MESA ADD',
    OWNER_NAME: 'SMITH JOHN',
    LAND_SIZE: 5205,
    PHYSICAL_ZIP: '85210',
    LPV_CUR: 180000,
    LATITUDE: 33.3942,
    LONGITUDE: -111.8318,
    CITY_ZONING: 'RS-6',
    JURISDICTION: 'MESA',
  };

  it('maps all common fields correctly', () => {
    const result = normalizePropertyRecord(maricopaRecord, 'maricopa');

    expect(result.address).toBe('850 S DREW ST MESA 85210');
    expect(result.salePrice).toBe(35000);
    expect(result.saleDate).toBe('05/01/2009');
    expect(result.sqft).toBe(759);
    expect(result.yearBuilt).toBe(1948);
    expect(result.assessedValue).toBe(204300);
    expect(result.subdivision).toBe('STEWARTS SOUTH MESA ADD');
    expect(result.ownerName).toBe('SMITH JOHN');
    expect(result.lotSize).toBe(5205);
    expect(result.lotSizeUnit).toBe('sqft');
    expect(result.zip).toBe('85210');
  });

  it('maps Maricopa-specific fields (lat, lon, zoning, jurisdiction, taxableValue)', () => {
    const result = normalizePropertyRecord(maricopaRecord, 'maricopa');

    expect(result.latitude).toBe(33.3942);
    expect(result.longitude).toBe(-111.8318);
    expect(result.zoning).toBe('RS-6');
    expect(result.jurisdiction).toBe('MESA');
    expect(result.taxableValue).toBe(180000);
  });

  it('sets Pinal-only fields to null for Maricopa records', () => {
    const result = normalizePropertyRecord(maricopaRecord, 'maricopa');

    expect(result.floors).toBeNull();
    expect(result.landValue).toBeNull();
    expect(result.propertyClass).toBeNull();
    expect(result.schoolDistrict).toBeNull();
    expect(result.taxDistrict).toBeNull();
  });

  it('handles null/undefined fields gracefully', () => {
    const sparseRecord = {
      PHYSICAL_ADDRESS: '100 E MAIN ST MESA',
      PHYSICAL_ZIP: '85201',
    };
    const result = normalizePropertyRecord(sparseRecord, 'maricopa');

    expect(result.address).toBe('100 E MAIN ST MESA');
    expect(result.zip).toBe('85201');
    expect(result.salePrice).toBeNull();
    expect(result.sqft).toBeNull();
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.zoning).toBeNull();
  });

  it('handles whitespace in string fields by trimming', () => {
    const paddedRecord = {
      PHYSICAL_ADDRESS: '  850 S DREW ST  ',
      OWNER_NAME: '  SMITH JOHN  ',
      SUBNAME: '  STEWARTS ADD  ',
      PHYSICAL_ZIP: ' 85210 ',
      CITY_ZONING: ' RS-6 ',
      JURISDICTION: ' MESA ',
    };
    const result = normalizePropertyRecord(paddedRecord, 'maricopa');

    expect(result.address).toBe('850 S DREW ST');
    expect(result.ownerName).toBe('SMITH JOHN');
    expect(result.subdivision).toBe('STEWARTS ADD');
    expect(result.zip).toBe('85210');
    expect(result.zoning).toBe('RS-6');
    expect(result.jurisdiction).toBe('MESA');
  });

  it('handles an empty record without throwing', () => {
    const result = normalizePropertyRecord({}, 'maricopa');

    expect(result.address).toBeNull();
    expect(result.salePrice).toBeNull();
    expect(result.zip).toBeNull();
    expect(result.lotSizeUnit).toBe('sqft');
  });
});
