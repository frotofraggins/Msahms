# MesaHomes Data Sources & API Reference

## Overview

All endpoints verified working as of April 24, 2026. All are free, public, no API keys required
(except RentCast backup). The service area spans two counties — route by ZIP code.

- **Maricopa County**: Mesa, Gilbert, Chandler, Scottsdale, Phoenix, Tempe, Apache Junction
- **Pinal County**: San Tan Valley, Queen Creek (partial), Casa Grande, Florence, Coolidge

---

## 1. PINAL COUNTY ASSESSOR (San Tan Valley, Queen Creek)

### Base URL
```
https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
```
**Layer: 3** (not 0) | Method: GET or POST | Format: JSON | Auth: None | SSL: Valid

### All Available Fields (VERIFIED)
```
OBJECTID, PARCELID, BUILDING, UNIT, STATEDAREA, LGLSTARTDT,
CVTTXCD, CVTTXDSCRP, SCHLTXCD, SCHLDSCRP, USECD, USEDSCRP,
NGHBRHDCD, CLASSCD, CLASSDSCRP, SITEADDRESS, PRPRTYDSCRP,
CNVYNAME, OWNERNME1, OWNERNME2, PSTLADDRESS, PSTLCITY,
PSTLSTATE, PSTLZIP5, PSTLZIP4, FLOORCOUNT, BLDGAREA,
RESFLRAREA, RESYRBLT, RESSTRTYP, STRCLASS, CLASSMOD,
LNDVALUE, PRVASSDVAL, CNTASSDVAL, ASSDVALYRCG, ASSDPCNTCG,
PRVTXBLVAL, CNTTXBLVAL, TXBLVALYRCHG, TXBLPCNTCHG,
PRVWNTTXOD, PRVSMRTXOD, TOTPRVTXTOD, CNTWNTTXOD, CNTSMRTXOD,
TOTCNTTXOD, TXODYRCHG, TXODPCNTCHG, LASTUPDATE,
SALEDATE, SALEPRICE, DEFAULTAPPROACH, EA, GROSSSF, GROSSAC,
DEFAULTLEA, VALUEMEASURE, VALUEPER, LEA, ADJUSTMENT,
ATTRIBUTE, REASONTOEXCLUDE, LANDSF, OVERRIDE, RECEPTIONNO
```

### Field Descriptions
| Field | Description | Example |
|---|---|---|
| PARCELID | Parcel ID number | 109282230 |
| SITEADDRESS | Full property address | 39669 N LUKE LN SAN TAN VALLEY, AZ 85140 |
| OWNERNME1 | Primary owner name | FLOURNOY NICHOLAS |
| OWNERNME2 | Secondary owner name | |
| CNVYNAME | Subdivision name | PECAN CREEK NORTH PARCEL 1 |
| RESFLRAREA | Living area (sqft) | 2071.0 |
| RESYRBLT | Year built | 2004.0 |
| RESSTRTYP | Structure type | |
| STATEDAREA | Lot size (acres) | 0.12 |
| GROSSSF | Gross square feet | |
| GROSSAC | Gross acres | |
| LANDSF | Land square feet | |
| FLOORCOUNT | Number of floors | 2 |
| BLDGAREA | Building area (sqft) | 2071.0 |
| STRCLASS | Structure class | |
| LNDVALUE | Land value ($) | 75670.0 |
| CNTASSDVAL | Current assessed value ($) | 291424.0 |
| PRVASSDVAL | Previous assessed value ($) | |
| ASSDVALYRCG | Assessed value YoY change ($) | |
| ASSDPCNTCG | Assessed value % change | |
| CNTTXBLVAL | Current taxable value ($) | 174996.0 |
| PRVTXBLVAL | Previous taxable value ($) | |
| TXBLVALYRCHG | Taxable value YoY change ($) | |
| TXBLPCNTCHG | Taxable value % change | |
| TOTCNTTXOD | Current total tax owed ($) | |
| TOTPRVTXTOD | Previous total tax owed ($) | |
| TXODYRCHG | Tax owed YoY change ($) | |
| TXODPCNTCHG | Tax owed % change | |
| SALEPRICE | Last sale price ($) | 449999.0 |
| SALEDATE | Last sale date | 2026-04-06 |
| RECEPTIONNO | Recording/deed number | |
| CLASSCD | Property class code | |
| CLASSDSCRP | Property class | Owner Occupied Residential |
| USECD | Use code | |
| USEDSCRP | Use description | |
| SCHLTXCD | School district code | |
| SCHLDSCRP | School district name | |
| CVTTXCD | Tax district code | |
| CVTTXDSCRP | Tax district description | |
| NGHBRHDCD | Neighborhood code | |
| PSTLADDRESS | Mailing address | |
| PSTLCITY | Mailing city | |
| PSTLSTATE | Mailing state | |
| PSTLZIP5 | Mailing ZIP | |
| PRPRTYDSCRP | Property legal description | |
| LASTUPDATE | Last data update | |

### Query: Address Lookup
```
POST https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
  where=SITEADDRESS LIKE '%39669%LUKE%'
  f=json
  outFields=*
  returnGeometry=false
```

### Query: Comps by ZIP (Recently Sold)
**VERIFIED** — Returns actual sale prices and dates
```
POST https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
  where=PSTLZIP5='85140' AND SALEPRICE > 200000
  f=json
  outFields=SITEADDRESS,SALEPRICE,SALEDATE,RESFLRAREA,RESYRBLT,CNVYNAME,CNTASSDVAL,STATEDAREA,FLOORCOUNT,CLASSDSCRP
  returnGeometry=false
  resultRecordCount=50
  orderByFields=SALEDATE DESC
```

### Query: Comps by Subdivision (Best for Neighborhood Comps)
**VERIFIED** — Returns sales in the exact same subdivision
```
POST https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
  where=CNVYNAME='PECAN CREEK NORTH PARCEL 1' AND SALEPRICE>100000
  f=json
  outFields=SITEADDRESS,SALEPRICE,SALEDATE,RESFLRAREA,RESYRBLT,CNTASSDVAL,STATEDAREA,FLOORCOUNT
  returnGeometry=false
  resultRecordCount=20
  orderByFields=SALEDATE DESC
```

### Query: All Properties in a Subdivision (for market analysis)
```
POST https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
  where=CNVYNAME='PECAN CREEK NORTH PARCEL 1'
  f=json
  outFields=SITEADDRESS,CNTASSDVAL,RESFLRAREA,RESYRBLT,SALEPRICE,SALEDATE,FLOORCOUNT,STATEDAREA
  returnGeometry=false
  resultRecordCount=1000
```

### Query: Rental Properties in a ZIP
```
POST https://gis.pinal.gov/mapping/rest/services/TaxParcels/MapServer/3/query
  where=PSTLZIP5='85140' AND CLASSDSCRP='Non-Primary Residence'
  f=json
  outFields=SITEADDRESS,CNTASSDVAL,RESFLRAREA,RESYRBLT,OWNERNME1,CNVYNAME
  returnGeometry=false
  resultRecordCount=100
```

### Verified Comps: Pecan Creek North (your subdivision)
| Address | Sale Price | Sale Date | Sqft |
|---|---|---|---|
| 396 E Maddison St | $447,500 | 2026-04-06 | 2,049 |
| 504 E Anastasia St | $425,000 | 2026-02-01 | 2,049 |
| 315 E Christopher St | $369,000 | 2026-01-01 | 2,342 |
| 340 E Bradstock Way | $390,000 | 2025-12-01 | 2,049 |
| 567 E Bradstock Way | $400,000 | 2025-11-14 | 2,049 |
| 310 E Payton St | $290,000 | 2025-11-01 | 1,155 |
| 357 E Payton St | $365,000 | 2025-10-14 | 1,660 |
| 382 E Maddison St | $385,000 | 2025-10-01 | 1,706 |
| 39567 N Luke Ln | $430,000 | 2024-08-01 | 2,049 |

### Other Pinal County GIS Services Available
```
Administrative_Floodplains, School_Dist, Fire_Dist, Zoning_2010,
Inc_Cities, PINAL_ZIPCODES, Pools, StructureFootprints,
SiteAddressPoint, Centerlines, DelinquentTaxes, SubPoly,
PinalGeocode (GeocodeServer), LotLines, Sections, Townships
```

---

## 2. MARICOPA COUNTY ASSESSOR (Mesa, Gilbert, Chandler, Tempe, Scottsdale)

### Base URL
```
https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query
```
**Layer: 0** | Method: GET | Format: JSON | Auth: None | SSL: Use -k flag

### All Available Fields (VERIFIED)
```
OBJECTID, APN, FLOOR, BOOK, MAP, ITEM, OWNER_NAME,
MAIL_ADDR1, MAIL_ADDR2, MAIL_CITY, MAIL_STATE, MAIL_ZIP,
PHYSICAL_STREET_NUM, PHYSICAL_STREET_DIR, PHYSICAL_STREET_NAME,
PHYSICAL_STREET_TYPE, PHYSICAL_SUITE, PHYSICAL_CITY, PHYSICAL_ZIP,
APN_DASH, LONGITUDE, LATITUDE, PHYSICAL_ADDRESS, MAIL_ADDRESS,
MAIL_CNTRY, PHYSICAL_STREET_SUFFIX, PHYSICAL_STREET_POSTDIR,
DEED_NUMBER, DEED_DATE, SALE_DATE, SALE_PRICE, MCRNUM,
SUBNAME, LAND_SIZE, LOT_NUM, STR, CONST_YEAR, LIVING_SPACE,
INCAREOF, TAX_YR_CUR, FCV_CUR, LPV_CUR, TAX_YR_PREV,
FCV_PREV, LPV_PREV, PUC, MCR_BOOK, MCR_PAGE, CITY_ZONING,
JURISDICTION, LC_CUR, LC_PREV, BLOCK, TRACT
```

### Field Descriptions
| Field | Description | Example |
|---|---|---|
| APN | Assessor parcel number | 13942035 |
| PHYSICAL_ADDRESS | Full address | 850 S DREW ST MESA 85210 |
| PHYSICAL_STREET_NUM | Street number | 850 |
| PHYSICAL_STREET_DIR | Direction | S |
| PHYSICAL_STREET_NAME | Street name | DREW |
| PHYSICAL_STREET_TYPE | Type | ST |
| PHYSICAL_CITY | City | MESA |
| PHYSICAL_ZIP | ZIP | 85210 |
| OWNER_NAME | Owner | |
| SALE_PRICE | Last sale price ($) | 35000 |
| SALE_DATE | Last sale date | 05/01/2009 |
| DEED_NUMBER | Deed number | |
| DEED_DATE | Deed date | timestamp |
| CONST_YEAR | Year built | 1948 |
| LIVING_SPACE | Living area (sqft) | 759 |
| LAND_SIZE | Lot size (sqft) | 5205 |
| FCV_CUR | Current full cash value ($) | 204,300 |
| FCV_PREV | Previous full cash value ($) | |
| LPV_CUR | Current limited property value ($) | |
| LPV_PREV | Previous limited property value ($) | |
| TAX_YR_CUR | Current tax year | |
| TAX_YR_PREV | Previous tax year | |
| SUBNAME | Subdivision name | STEWARTS SOUTH MESA ADD |
| LOT_NUM | Lot number | 35 |
| STR | Section/Township/Range | 1-1N-5E |
| LATITUDE | Latitude | 33.3942 |
| LONGITUDE | Longitude | -111.8318 |
| CITY_ZONING | Zoning | RS-6 |
| JURISDICTION | Jurisdiction | MESA |
| LC_CUR | Legal class current | |
| PUC | Property use code | |
| MCRNUM | MCR number | |
| BLOCK | Block | |
| TRACT | Tract | |

### Query: Address Lookup
```
GET ...Parcels/MapServer/0/query
  ?where=PHYSICAL_ADDRESS LIKE '%850%DREW%MESA%'
  &f=json&outFields=*&returnGeometry=false
```

### Query: Comps by ZIP (Recently Sold)
**VERIFIED** — Returns sale prices and dates for Mesa properties
```
GET ...Parcels/MapServer/0/query
  ?where=PHYSICAL_ZIP LIKE '85201%' AND SALE_PRICE IS NOT NULL AND SALE_PRICE <> '0'
  &f=json
  &outFields=PHYSICAL_ADDRESS,SALE_PRICE,SALE_DATE,CONST_YEAR,LIVING_SPACE,LAND_SIZE,FCV_CUR,SUBNAME
  &returnGeometry=false
  &resultRecordCount=50
```

### Query: Comps by Subdivision
```
GET ...Parcels/MapServer/0/query
  ?where=SUBNAME='HAWES CROSSING' AND SALE_PRICE IS NOT NULL AND SALE_PRICE <> '0'
  &f=json
  &outFields=PHYSICAL_ADDRESS,SALE_PRICE,SALE_DATE,CONST_YEAR,LIVING_SPACE,LAND_SIZE,FCV_CUR
  &returnGeometry=false
  &resultRecordCount=50
```

### Query: All Properties by City
```
GET ...Parcels/MapServer/0/query
  ?where=PHYSICAL_CITY='MESA'
  &f=json&outFields=*&returnGeometry=false
  &resultRecordCount=10
```

### Query: Properties by Zoning
```
GET ...Parcels/MapServer/0/query
  ?where=PHYSICAL_CITY='MESA' AND CITY_ZONING='RS-6'
  &f=json&outFields=*&returnGeometry=false
  &resultRecordCount=50
```

### Other Maricopa GIS Services
```
AssessorCompositeLocator (GeocodeServer), Basemap, Flood,
MaricopaDynamicQueryService, Parcels, ParcelOutline, ParcelLabel,
Subdivisions, SubdivisionOutline, Streets, Sections, MapIDs
```

---

## 3. ZILLOW RESEARCH CSVs (Market-Level Data)

**Update Schedule:** 16th of each month | Auth: None | Format: CSV
**Base URL:** `https://files.zillowstatic.com/research/public_csvs/`

### All Available Datasets

| # | Dataset | URL Slug | Geo Level | Use Case |
|---|---|---|---|---|
| 1 | Home Values (ZHVI) | `zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | ZIP | Home value teaser by ZIP |
| 2 | Home Values (ZHVI) | `zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | Metro | Metro overview |
| 3 | Home Value Forecast | `zhvf_growth/Metro_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | Metro | "Sell now or wait" |
| 4 | Rent Index (ZORI) | `zori/Metro_zori_uc_sfrcondomfr_sm_month.csv` | Metro | Rent estimates |
| 5 | For-Sale Inventory | `invt_fs/Metro_invt_fs_uc_sfrcondo_sm_month.csv` | Metro | Market supply |
| 6 | Median Sale Price | `median_sale_price/Metro_median_sale_price_uc_sfrcondo_month.csv` | Metro | Comp context |
| 7 | Sales Count | `sales_count_now/Metro_sales_count_now_uc_sfrcondo_month.csv` | Metro | Market volume |
| 8 | Sale-to-List Ratio | `mean_sale_to_list/Metro_mean_sale_to_list_uc_sfrcondo_sm_month.csv` | Metro | Offer strategy |
| 9 | Days to Pending | `mean_doz_pending/Metro_mean_doz_pending_uc_sfrcondo_sm_month.csv` | Metro | Market speed |
| 10 | Price Cuts % | `perc_listings_price_cut/Metro_perc_listings_price_cut_uc_sfrcondo_sm_month.csv` | Metro | Seller timing |
| 11 | Market Heat Index | `market_temp_index/Metro_market_temp_index_uc_sfrcondo_month.csv` | Metro | Buyer/seller balance |
| 12 | New Construction Sales | `new_con_sales_count_raw/Metro_new_con_sales_count_raw_uc_sfrcondo_month.csv` | Metro | New build data |
| 13 | Affordability (Income Needed) | `new_homeowner_income_needed/Metro_new_homeowner_income_needed_downpayment_0.20_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | Metro | Affordability calc |

### Verified Phoenix-Mesa Metro Data (March 2026)
| Metric | Value |
|---|---|
| Typical Home Value (ZHVI) | $448,160 |
| Median Sale Price | $454,000 |
| Monthly Sales Count | 6,867 |
| Sale-to-List Ratio | 0.977 (2.3% below asking avg) |
| Days to Pending | 60 days |
| Price Cuts % | 32.9% of listings |
| For-Sale Inventory | 25,524 active |
| Typical Rent (ZORI) | $1,735/month |

### Verified ZIP-Level Home Values (March 2026)
| ZIP | City | ZHVI |
|---|---|---|
| 85140 | San Tan Valley | $432,201 |
| 85201 | Mesa (Central) | $360,214 |
| 85202 | Mesa (West) | $397,361 |
| 85203 | Mesa (NE) | $449,383 |
| 85204 | Mesa (Central) | $393,510 |
| 85205 | Mesa (East) | $406,392 |
| 85206 | Mesa (SE) | $384,886 |
| 85207 | Mesa (NE) | $555,233 |
| 85208 | Mesa (South) | $379,571 |
| 85209 | Mesa (East) | $446,405 |
| 85210 | Mesa (West) | $361,968 |
| 85212 | Mesa (Hawes Crossing) | $559,871 |
| 85213 | Mesa (NE) | $555,825 |
| 85215 | Mesa (NE) | $505,080 |

### CSV Column Format
```
RegionID, SizeRank, RegionName, RegionType, StateName, State, City, Metro, CountyName, 2000-01-31, ..., 2026-03-31
```

### Download All Script
```bash
BASE="https://files.zillowstatic.com/research/public_csvs"
curl -o zhvi_zip.csv "$BASE/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
curl -o zhvi_metro.csv "$BASE/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
curl -o zhvf_metro.csv "$BASE/zhvf_growth/Metro_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
curl -o zori_metro.csv "$BASE/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv"
curl -o inventory_metro.csv "$BASE/invt_fs/Metro_invt_fs_uc_sfrcondo_sm_month.csv"
curl -o sale_price_metro.csv "$BASE/median_sale_price/Metro_median_sale_price_uc_sfrcondo_month.csv"
curl -o sales_count_metro.csv "$BASE/sales_count_now/Metro_sales_count_now_uc_sfrcondo_month.csv"
curl -o sale_to_list_metro.csv "$BASE/mean_sale_to_list/Metro_mean_sale_to_list_uc_sfrcondo_sm_month.csv"
curl -o days_pending_metro.csv "$BASE/mean_doz_pending/Metro_mean_doz_pending_uc_sfrcondo_sm_month.csv"
curl -o price_cuts_metro.csv "$BASE/perc_listings_price_cut/Metro_perc_listings_price_cut_uc_sfrcondo_sm_month.csv"
curl -o market_heat_metro.csv "$BASE/market_temp_index/Metro_market_temp_index_uc_sfrcondo_month.csv"
curl -o new_construction_metro.csv "$BASE/new_con_sales_count_raw/Metro_new_con_sales_count_raw_uc_sfrcondo_month.csv"
curl -o affordability_metro.csv "$BASE/new_homeowner_income_needed/Metro_new_homeowner_income_needed_downpayment_0.20_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
```

---

## 4. RENTCAST API (Backup — 50 Free Calls/Month)

**Base URL:** `https://api.rentcast.io` | Auth: `X-Api-Key` header
**Docs:** https://developers.rentcast.io | **MCP Server:** https://github.com/RentCast/rentcast-mcp-server

| Endpoint | Description |
|---|---|
| `/v1/properties` | Property records by address |
| `/v1/avm/value` | Home value estimate (AVM) |
| `/v1/avm/rent/long-term` | Rent estimate |
| `/v1/listings/sale` | Active sale listings |
| `/v1/listings/rental/long-term` | Active rental listings |
| `/v1/markets` | Market statistics by ZIP |

---

## 5. ZIP CODE → COUNTY ROUTING

```javascript
const PINAL_COUNTY_ZIPS = [
  '85120','85121','85122','85123','85128','85130','85131','85132',
  '85137','85138','85139','85140','85141','85142','85143','85145',
  '85172','85173','85178','85191','85192','85193','85194'
];

function getCounty(zip) {
  return PINAL_COUNTY_ZIPS.includes(zip) ? 'pinal' : 'maricopa';
}

function getAssessorEndpoint(county) {
  if (county === 'pinal') {
    return {
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
      taxDistField: 'CVTTXDSCRP'
    };
  }
  return {
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
    floorsField: null, // not available in Maricopa GIS
    landValueField: null,
    taxableValueField: 'LPV_CUR',
    classField: null,
    schoolDistField: null,
    taxDistField: null,
    latField: 'LATITUDE',
    lonField: 'LONGITUDE',
    zoningField: 'CITY_ZONING',
    jurisdictionField: 'JURISDICTION'
  };
}
```

---

## 6. COMPLETE ADDRESS LOOKUP FLOW

```
User types: "39669 N Luke Ln, San Tan Valley, AZ 85140"
  │
  ├─ Parse → streetNum=39669, streetName=LUKE, zip=85140
  │
  ├─ Route → ZIP 85140 → Pinal County
  │
  ├─ Step 1: County Assessor Query
  │   POST gis.pinal.gov/.../TaxParcels/MapServer/3/query
  │     where=SITEADDRESS LIKE '%39669%LUKE%'
  │   Returns: sqft, year built, lot size, assessed value, sale history,
  │            subdivision, owner, floors, tax info, school district
  │
  ├─ Step 2: Subdivision Comps Query
  │   POST gis.pinal.gov/.../TaxParcels/MapServer/3/query
  │     where=CNVYNAME='PECAN CREEK NORTH PARCEL 1' AND SALEPRICE>100000
  │     orderByFields=SALEDATE DESC
  │   Returns: 20 recent sales in same subdivision with prices
  │
  ├─ Step 3: ZIP Comps Query
  │   POST gis.pinal.gov/.../TaxParcels/MapServer/3/query
  │     where=PSTLZIP5='85140' AND SALEPRICE>200000
  │     orderByFields=SALEDATE DESC
  │   Returns: 50 recent sales in ZIP with prices
  │
  ├─ Step 4: Zillow Research ZIP Context
  │   Read from DynamoDB (pre-loaded monthly from CSV)
  │   ZIP 85140 → typical value $432,201, trend: -$1,200/6mo
  │
  └─ Step 5: Zillow Research Metro Context
      Read from DynamoDB (pre-loaded monthly from CSV)
      Phoenix-Mesa → median sale $454K, 60 days on market,
      97.7% sale-to-list, 32.9% price cuts, 25,524 inventory

Combined Response:
{
  property: { address, sqft, yearBuilt, lotSize, floors, assessed, subdivision },
  saleHistory: { lastPrice, lastDate },
  comps: {
    subdivision: [ { address, price, date, sqft } ... ],
    zip: [ { address, price, date, sqft } ... ]
  },
  market: {
    zipTypicalValue: 432201,
    zipTrend: "declining",
    metroMedianSale: 454000,
    metroDaysOnMarket: 60,
    metroSaleToList: 0.977,
    metroPriceCuts: 0.329,
    metroInventory: 25524
  }
}
```

---

## 7. AUTOMATION SCHEDULE

| Source | Frequency | Method | Storage |
|---|---|---|---|
| Zillow Research CSVs | Monthly (17th) | Lambda + EventBridge cron | DynamoDB |
| County Assessor GIS | On-demand per user request | Lambda → ArcGIS REST | DynamoDB cache (24hr TTL) |
| RentCast API | On-demand backup only | Lambda → REST | DynamoDB cache (24hr TTL) |
| Maricopa Bulk Downloads | Monthly (manual) | Browser download → S3 | S3 → DynamoDB |


---

## 8. GOOGLE STREET VIEW & AERIAL VIEW (Property Photos)

**Free Tier (per month):**
| SKU | Free Cap | After Free |
|---|---|---|
| Static Street View (exterior photo) | 10,000/month | $7 per 1,000 |
| Street View Metadata (check availability) | Unlimited | Free |
| Aerial View (3D drone-style video) | 5,000/month | $16 per 1,000 |
| Static Maps (satellite/map image) | 10,000/month | $2 per 1,000 |

**Auth:** Google Cloud API key (stored in AWS Secrets Manager, NEVER hardcoded)
**Key Restrictions:** Restrict to Street View Static API + mesahomes.com domain only

### API Key Management
```
- Store in AWS Secrets Manager: mesahomes/google-maps-api-key
- Lambda reads key at runtime via Secrets Manager SDK
- NEVER commit key to git, chat, or code comments
- Rotate key if exposed
- Set usage alerts in Google Cloud Console at 8,000 requests/month (80% of free tier)
```

### Street View Photo Lookup
```
Step 1: Check if photo exists (FREE, unlimited)
GET https://maps.googleapis.com/maps/api/streetview/metadata
  ?location=39669+N+Luke+Ln,San+Tan+Valley,AZ+85140
  &key={GOOGLE_API_KEY}

Response: { "status": "OK" } means photo exists

Step 2: Fetch the photo (FREE up to 10K/month)
GET https://maps.googleapis.com/maps/api/streetview
  ?size=600x400
  &location=39669+N+Luke+Ln,San+Tan+Valley,AZ+85140
  &key={GOOGLE_API_KEY}

Returns: JPEG image of the property exterior

Step 3: Cache in S3
  Bucket: mesahomes-property-photos
  Key: streetview/{zip}/{normalized-address}.jpg
  TTL: 1 year (street view images don't change often)
```

### Aerial View (3D Drone Video)
```
GET https://aerialview.googleapis.com/v1/videos:lookupVideo
  ?key={GOOGLE_API_KEY}
  &address=39669+N+Luke+Ln,San+Tan+Valley,AZ+85140

Returns: Video URL for photorealistic 3D flyover (US addresses only)
Free: 5,000/month
```

### Photo Caching Strategy
```
User requests property → Lambda checks S3 cache
  ├── Cache HIT → serve from S3 (free, instant)
  └── Cache MISS → check Street View metadata (free)
       ├── Photo exists → fetch image → store in S3 → serve
       └── No photo → return placeholder image with map view
```

### Usage Tracking
```
- Log every Google API call to CloudWatch with address and timestamp
- Set CloudWatch alarm at 8,000 Street View requests/month
- Set CloudWatch alarm at 4,000 Aerial View requests/month
- Monthly report: total requests, cache hit rate, cost
- Target: >90% cache hit rate after first 3 months
```

---

## 9. API KEY & SECRET MANAGEMENT

All API keys and secrets for MesaHomes are stored in AWS Secrets Manager.
NEVER hardcode keys in source code, environment variables in code, chat, or git.

| Secret | Secrets Manager Path | Service |
|---|---|---|
| Google Maps API Key | `mesahomes/google-maps-api-key` | Street View, Aerial View |
| Stripe Secret Key | `mesahomes/stripe-secret-key` | Payments |
| Stripe Webhook Secret | `mesahomes/stripe-webhook-secret` | Payment webhooks |
| RentCast API Key | `mesahomes/rentcast-api-key` | Property data backup |
| Cognito Client Secret | `mesahomes/cognito-client-secret` | Auth |
| SES SMTP Credentials | `mesahomes/ses-smtp-credentials` | Email |

Lambda functions retrieve secrets at runtime:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const client = new SecretsManagerClient({ region: 'us-west-2' });

async function getSecret(secretName) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString;
}
```
