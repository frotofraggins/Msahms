/**
 * Core Zillow Research CSV processing logic for the MesaHomes data pipeline.
 *
 * Downloads, parses, and transforms Zillow Research CSV data into DynamoDB
 * items for the mesahomes-main table. This module contains all testable
 * business logic — the Lambda handler in index.ts orchestrates calls to
 * these functions.
 *
 * Uses the built-in fetch API (Node.js 20) for HTTP requests and manual
 * CSV parsing (split by newlines and commas) to keep the Lambda small.
 */

import type { MarketDataZip, MarketDataMetro, TrendDirection } from '../../lib/types/market.js';
import type { DynamoDBItem } from '../../lib/types/dynamodb.js';
import { EntityType } from '../../lib/types/dynamodb.js';
import { generateMarketZipKeys, generateMarketMetroKeys } from '../../lib/models/keys.js';
import { SERVICE_AREA_ZIPS } from '../../lib/county-router.js';

// Re-export for backward compat with existing tests.
export { SERVICE_AREA_ZIPS };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base URL for all Zillow Research public CSV downloads. */
const ZILLOW_BASE_URL = 'https://files.zillowstatic.com/research/public_csvs';

/**
 * Map of all 13 Zillow Research CSV dataset slugs.
 * Keys are short identifiers; values are the URL path segments after the base URL.
 */
export const ZILLOW_CSV_URLS: Record<string, string> = {
  zhvi_zip: `${ZILLOW_BASE_URL}/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`,
  zhvi_metro: `${ZILLOW_BASE_URL}/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`,
  zhvf_metro: `${ZILLOW_BASE_URL}/zhvf_growth/Metro_zhvf_growth_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`,
  zori_metro: `${ZILLOW_BASE_URL}/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv`,
  inventory_metro: `${ZILLOW_BASE_URL}/invt_fs/Metro_invt_fs_uc_sfrcondo_sm_month.csv`,
  sale_price_metro: `${ZILLOW_BASE_URL}/median_sale_price/Metro_median_sale_price_uc_sfrcondo_month.csv`,
  sales_count_metro: `${ZILLOW_BASE_URL}/sales_count_now/Metro_sales_count_now_uc_sfrcondo_month.csv`,
  sale_to_list_metro: `${ZILLOW_BASE_URL}/mean_sale_to_list/Metro_mean_sale_to_list_uc_sfrcondo_sm_month.csv`,
  days_pending_metro: `${ZILLOW_BASE_URL}/mean_doz_pending/Metro_mean_doz_pending_uc_sfrcondo_sm_month.csv`,
  price_cuts_metro: `${ZILLOW_BASE_URL}/perc_listings_price_cut/Metro_perc_listings_price_cut_uc_sfrcondo_sm_month.csv`,
  market_heat_metro: `${ZILLOW_BASE_URL}/market_temp_index/Metro_market_temp_index_uc_sfrcondo_month.csv`,
  new_construction_metro: `${ZILLOW_BASE_URL}/new_con_sales_count_raw/Metro_new_con_sales_count_raw_uc_sfrcondo_month.csv`,
  affordability_metro: `${ZILLOW_BASE_URL}/new_homeowner_income_needed/Metro_new_homeowner_income_needed_downpayment_0.20_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`,
};

/**
 * Metro area name used to filter metro-level CSV rows.
 * Note: MARICOPA_SERVICE_ZIPS and SERVICE_AREA_ZIPS are now defined
 * in lib/county-router.ts to avoid cross-Lambda imports. Each Lambda
 * is packaged separately and can only import from ../../lib, not from
 * other lambdas/ directories.
 */
export const METRO_NAME = 'Phoenix-Mesa-Chandler, AZ';

// ---------------------------------------------------------------------------
// CSV download
// ---------------------------------------------------------------------------

/**
 * Download a CSV file from Zillow Research.
 *
 * Uses the built-in Node.js 20 fetch API. Throws on non-OK responses
 * or network errors.
 *
 * @param url - Full URL to the Zillow Research CSV
 * @returns Raw CSV content as a string
 */
export async function downloadCsv(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download CSV from ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

/**
 * Parse a single CSV line, handling quoted fields that may contain commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse CSV content into an array of header names and an array of row arrays.
 */
function parseCsvContent(csvContent: string): { headers: string[]; rows: string[][] } {
  const lines = csvContent.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]!);
  const rows = lines.slice(1).map(parseCsvLine);

  return { headers, rows };
}

/**
 * Find the index of a column header by name.
 */
function findColumnIndex(headers: string[], name: string): number {
  return headers.findIndex((h) => h === name);
}

/**
 * Extract the latest date column header from the CSV headers.
 * Zillow date columns are in YYYY-MM-DD format and appear after the
 * metadata columns.
 */
function getDateColumns(headers: string[]): string[] {
  return headers.filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h));
}

/**
 * Convert a Zillow date column header (YYYY-MM-DD) to a YYYY-MM month string.
 */
function dateToMonth(dateColumn: string): string {
  return dateColumn.substring(0, 7);
}

/**
 * Determine trend direction based on 6-month value change.
 *
 * - Rising: change > 0
 * - Declining: change < 0
 * - Stable: change === 0
 */
export function getTrendDirection(change6Mo: number): TrendDirection {
  if (change6Mo > 0) return 'rising';
  if (change6Mo < 0) return 'declining';
  return 'stable';
}

// ---------------------------------------------------------------------------
// ZIP-level ZHVI parsing
// ---------------------------------------------------------------------------

/**
 * Parse the ZIP-level ZHVI CSV and extract data for service area ZIPs.
 *
 * Filters rows where RegionName matches SERVICE_AREA_ZIPS, extracts the
 * latest month value, previous month value, and 6-month-ago value, then
 * calculates the trend direction.
 *
 * @param csvContent - Raw CSV content from the ZHVI ZIP-level file
 * @returns Array of MarketDataZip objects for service area ZIPs
 */
export function parseZhviZipCsv(csvContent: string): MarketDataZip[] {
  const { headers, rows } = parseCsvContent(csvContent);

  if (headers.length === 0 || rows.length === 0) {
    return [];
  }

  const regionNameIdx = findColumnIndex(headers, 'RegionName');
  const cityIdx = findColumnIndex(headers, 'City');

  if (regionNameIdx === -1) {
    return [];
  }

  const dateColumns = getDateColumns(headers);
  if (dateColumns.length === 0) {
    return [];
  }

  const latestDateCol = dateColumns[dateColumns.length - 1]!;
  const prevMonthCol = dateColumns.length >= 2 ? dateColumns[dateColumns.length - 2]! : null;
  const sixMonthAgoCol = dateColumns.length >= 7 ? dateColumns[dateColumns.length - 7]! : null;

  const latestIdx = findColumnIndex(headers, latestDateCol);
  const prevIdx = prevMonthCol ? findColumnIndex(headers, prevMonthCol) : -1;
  const sixMoIdx = sixMonthAgoCol ? findColumnIndex(headers, sixMonthAgoCol) : -1;

  const now = new Date().toISOString();
  const results: MarketDataZip[] = [];

  for (const row of rows) {
    const zip = row[regionNameIdx]?.trim() ?? '';

    if (!SERVICE_AREA_ZIPS.has(zip)) {
      continue;
    }

    const city = cityIdx !== -1 ? (row[cityIdx]?.trim() ?? '') : '';
    const latestValue = parseFloat(row[latestIdx] ?? '');
    const prevValue = prevIdx !== -1 ? parseFloat(row[prevIdx] ?? '') : NaN;
    const sixMoValue = sixMoIdx !== -1 ? parseFloat(row[sixMoIdx] ?? '') : NaN;

    if (isNaN(latestValue)) {
      continue;
    }

    const zhviPrevMonth = isNaN(prevValue) ? latestValue : prevValue;
    const zhviChange6Mo = isNaN(sixMoValue) ? 0 : latestValue - sixMoValue;

    results.push({
      zip,
      city,
      zhvi: latestValue,
      zhviPrevMonth,
      zhviChange6Mo,
      trendDirection: getTrendDirection(zhviChange6Mo),
      month: dateToMonth(latestDateCol),
      updatedAt: now,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Metro-level CSV parsing
// ---------------------------------------------------------------------------

/**
 * Parse a metro-level Zillow Research CSV and extract the Phoenix-Mesa row.
 *
 * Filters rows where RegionName matches METRO_NAME and extracts the latest
 * month value.
 *
 * @param csvContent - Raw CSV content from a metro-level Zillow file
 * @param metricName - Name for this metric (e.g. "medianSalePrice")
 * @returns MarketDataMetro object, or null if the metro row is not found
 */
export function parseMetroCsv(csvContent: string, metricName: string): MarketDataMetro | null {
  const { headers, rows } = parseCsvContent(csvContent);

  if (headers.length === 0 || rows.length === 0) {
    return null;
  }

  const regionNameIdx = findColumnIndex(headers, 'RegionName');
  if (regionNameIdx === -1) {
    return null;
  }

  const dateColumns = getDateColumns(headers);
  if (dateColumns.length === 0) {
    return null;
  }

  const latestDateCol = dateColumns[dateColumns.length - 1]!;
  const latestIdx = findColumnIndex(headers, latestDateCol);

  for (const row of rows) {
    const regionName = row[regionNameIdx]?.trim() ?? '';

    if (regionName !== METRO_NAME) {
      continue;
    }

    const value = parseFloat(row[latestIdx] ?? '');
    if (isNaN(value)) {
      return null;
    }

    return {
      metro: METRO_NAME,
      metric: metricName,
      value,
      month: dateToMonth(latestDateCol),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// DynamoDB item generation
// ---------------------------------------------------------------------------

/**
 * Convert parsed market data into DynamoDB items with correct PK/SK patterns.
 *
 * Generates:
 * - One dated record per ZIP (PK: MARKET#ZIP#{zip}, SK: ZHVI#{month})
 * - One LATEST pointer per ZIP (PK: MARKET#ZIP#{zip}, SK: ZHVI#LATEST)
 * - One dated record per metro metric (PK: MARKET#METRO#phoenix-mesa, SK: {metric}#{month})
 * - One LATEST pointer per metro metric (PK: MARKET#METRO#phoenix-mesa, SK: {metric}#LATEST)
 *
 * @param zipData - Parsed ZIP-level ZHVI records
 * @param metroData - Parsed metro-level metric records
 * @returns Array of DynamoDB items ready for BatchWrite
 */
export function generateDynamoDBItems(
  zipData: MarketDataZip[],
  metroData: MarketDataMetro[],
): DynamoDBItem[] {
  const now = new Date().toISOString();
  const items: DynamoDBItem[] = [];

  // ZIP-level records: dated + LATEST pointer
  for (const zip of zipData) {
    const datedKeys = generateMarketZipKeys(zip.zip, zip.month);
    const latestKeys = generateMarketZipKeys(zip.zip, 'LATEST');

    const data: Record<string, unknown> = {
      zip: zip.zip,
      city: zip.city,
      zhvi: zip.zhvi,
      zhviPrevMonth: zip.zhviPrevMonth,
      zhviChange6Mo: zip.zhviChange6Mo,
      trendDirection: zip.trendDirection,
      month: zip.month,
      updatedAt: zip.updatedAt,
    };

    // Dated record
    items.push({
      ...datedKeys,
      entityType: EntityType.MARKET,
      data,
      createdAt: now,
      updatedAt: now,
    });

    // LATEST pointer (same data, different SK)
    items.push({
      ...latestKeys,
      entityType: EntityType.MARKET,
      data,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Metro-level records: dated + LATEST pointer
  for (const metro of metroData) {
    const datedKeys = generateMarketMetroKeys(metro.metric, metro.month);
    const latestKeys = generateMarketMetroKeys(metro.metric, 'LATEST');

    const data: Record<string, unknown> = {
      metro: metro.metro,
      metric: metro.metric,
      value: metro.value,
      month: metro.month,
      updatedAt: metro.updatedAt,
    };

    // Dated record
    items.push({
      ...datedKeys,
      entityType: EntityType.MARKET,
      data,
      createdAt: now,
      updatedAt: now,
    });

    // LATEST pointer
    items.push({
      ...latestKeys,
      entityType: EntityType.MARKET,
      data,
      createdAt: now,
      updatedAt: now,
    });
  }

  return items;
}
