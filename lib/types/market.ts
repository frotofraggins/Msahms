/**
 * Market data type definitions for the MesaHomes Zillow data pipeline.
 *
 * Covers ZIP-level home value data (ZHVI) and metro-level market metrics
 * stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** Direction of the home value trend over the past 6 months. */
export type TrendDirection = 'rising' | 'declining' | 'stable';

// ---------------------------------------------------------------------------
// Market data records
// ---------------------------------------------------------------------------

/** ZIP-level Zillow Home Value Index (ZHVI) record. */
export interface MarketDataZip {
  /** 5-digit ZIP code */
  zip: string;
  /** City name for this ZIP */
  city: string;
  /** Current ZHVI value (dollars) */
  zhvi: number;
  /** Previous month ZHVI value (dollars) */
  zhviPrevMonth: number;
  /** ZHVI change over the past 6 months (dollars, can be negative) */
  zhviChange6Mo: number;
  /** Trend direction over the past 6 months */
  trendDirection: TrendDirection;
  /** Data month in YYYY-MM format */
  month: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/** Metro-level market metric record. */
export interface MarketDataMetro {
  /** Metro area name (e.g. "Phoenix, AZ") */
  metro: string;
  /** Metric name (e.g. "medianSalePrice", "daysOnMarket") */
  metric: string;
  /** Metric value */
  value: number;
  /** Data month in YYYY-MM format */
  month: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}
