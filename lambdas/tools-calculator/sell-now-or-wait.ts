/**
 * Sell Now or Wait Analysis for the MesaHomes platform.
 *
 * Reads ZIP-level and metro-level market data from DynamoDB and generates
 * a market-informed analysis to help sellers decide on timing.
 *
 * Runtime: DynamoDB reads only — no external API calls.
 */

import { getItem } from '../../lib/dynamodb.js';
import type { MarketDataZip } from '../../lib/types/market.js';
import {
  computeWeightedAnalysis,
  projectThreeMonths,
  type WeightedAnalysis,
  type Projection,
} from '../../lib/market-signals.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for the sell-now-or-wait analysis. */
export interface SellNowOrWaitInput {
  /** 5-digit ZIP code within the service area */
  zip: string;
  /** Estimated current home value in dollars */
  estimatedHomeValue: number;
}

/** Market indicator with value and interpretation. */
export interface MarketIndicator {
  /** Indicator name */
  name: string;
  /** Current value */
  value: number | string;
  /** Human-readable interpretation */
  interpretation: string;
  /** Signal direction: positive (sell now), negative (wait), neutral */
  signal: 'sell-now' | 'wait' | 'neutral';
}

/** Full sell-now-or-wait analysis response. */
export interface SellNowOrWaitResponse {
  /** ZIP code analyzed */
  zip: string;
  /** Estimated home value provided */
  estimatedHomeValue: number;
  /** ZIP-level market data */
  zipData: MarketDataZip | null;
  /** Metro-level market metrics */
  metroData: Record<string, number>;
  /** Individual market indicators with interpretations */
  indicators: MarketIndicator[];
  /** Overall recommendation */
  recommendation: 'sell-now' | 'wait' | 'neutral';
  /** Summary text */
  summary: string;
  /** Weighted scoring breakdown with confidence (differentiator). */
  weighted: WeightedAnalysis;
  /** 3-month counterfactual projection of home value. */
  projection: Projection;
}

// ---------------------------------------------------------------------------
// Metro metrics to fetch
// ---------------------------------------------------------------------------

/** Metro-level metrics to read from DynamoDB. */
export const METRO_METRICS = [
  'medianSalePrice',
  'daysPending',
  'inventory',
  'priceCuts',
  'saleToList',
] as const;

// ---------------------------------------------------------------------------
// Market data readers
// ---------------------------------------------------------------------------

/**
 * Read ZIP-level market data from DynamoDB.
 */
export async function getZipMarketData(zip: string): Promise<MarketDataZip | null> {
  const item = await getItem(`MARKET#ZIP#${zip}`, 'ZHVI#LATEST');
  if (!item?.data) return null;
  return item.data as unknown as MarketDataZip;
}

/**
 * Read metro-level market data from DynamoDB.
 */
export async function getMetroMarketData(): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  for (const metric of METRO_METRICS) {
    const item = await getItem(`MARKET#METRO#phoenix-mesa`, `${metric}#LATEST`);
    if (item?.data && typeof item.data['value'] === 'number') {
      result[metric] = item.data['value'] as number;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Analysis logic
// ---------------------------------------------------------------------------

/**
 * Analyze market indicators and produce signals.
 */
export function analyzeMarketIndicators(
  zipData: MarketDataZip | null,
  metroData: Record<string, number>,
  estimatedHomeValue: number,
): MarketIndicator[] {
  const indicators: MarketIndicator[] = [];

  // ZIP-level ZHVI trend
  if (zipData) {
    const trendSignal: 'sell-now' | 'wait' | 'neutral' =
      zipData.trendDirection === 'rising' ? 'wait' :
      zipData.trendDirection === 'declining' ? 'sell-now' : 'neutral';

    indicators.push({
      name: 'Home Value Trend (6 months)',
      value: zipData.trendDirection,
      interpretation: zipData.trendDirection === 'rising'
        ? `Home values in ${zipData.zip} are rising. Waiting could yield a higher sale price.`
        : zipData.trendDirection === 'declining'
        ? `Home values in ${zipData.zip} are declining. Selling sooner may preserve more equity.`
        : `Home values in ${zipData.zip} are stable. Timing is flexible.`,
      signal: trendSignal,
    });

    indicators.push({
      name: 'Zillow Home Value Index (ZHVI)',
      value: zipData.zhvi,
      interpretation: estimatedHomeValue > zipData.zhvi
        ? `Your estimate ($${estimatedHomeValue.toLocaleString()}) is above the ZIP median ($${zipData.zhvi.toLocaleString()}). Strong position to sell.`
        : `Your estimate ($${estimatedHomeValue.toLocaleString()}) is at or below the ZIP median ($${zipData.zhvi.toLocaleString()}).`,
      signal: estimatedHomeValue > zipData.zhvi ? 'sell-now' : 'neutral',
    });

    indicators.push({
      name: '6-Month Value Change',
      value: zipData.zhviChange6Mo,
      interpretation: zipData.zhviChange6Mo > 0
        ? `Values increased by $${zipData.zhviChange6Mo.toLocaleString()} over 6 months.`
        : zipData.zhviChange6Mo < 0
        ? `Values decreased by $${Math.abs(zipData.zhviChange6Mo).toLocaleString()} over 6 months.`
        : 'Values unchanged over 6 months.',
      signal: zipData.zhviChange6Mo < 0 ? 'sell-now' : zipData.zhviChange6Mo > 0 ? 'wait' : 'neutral',
    });
  }

  // Metro-level indicators
  if (metroData['medianSalePrice'] !== undefined) {
    indicators.push({
      name: 'Metro Median Sale Price',
      value: metroData['medianSalePrice'],
      interpretation: `Phoenix-Mesa metro median sale price is $${metroData['medianSalePrice'].toLocaleString()}.`,
      signal: 'neutral',
    });
  }

  if (metroData['daysPending'] !== undefined) {
    const days = metroData['daysPending'];
    indicators.push({
      name: 'Days on Market',
      value: days,
      interpretation: days < 30
        ? `Homes are selling quickly (${days} days). Strong seller's market.`
        : days < 60
        ? `Average time on market is ${days} days. Balanced market.`
        : `Homes are taking ${days} days to sell. Buyer's market conditions.`,
      signal: days < 30 ? 'sell-now' : days > 60 ? 'wait' : 'neutral',
    });
  }

  if (metroData['inventory'] !== undefined) {
    const inv = metroData['inventory'];
    indicators.push({
      name: 'Active Inventory',
      value: inv,
      interpretation: `${inv.toLocaleString()} active listings in the metro area.`,
      signal: 'neutral',
    });
  }

  if (metroData['priceCuts'] !== undefined) {
    const cuts = metroData['priceCuts'];
    indicators.push({
      name: 'Price Cuts Percentage',
      value: cuts,
      interpretation: cuts > 30
        ? `${cuts}% of listings have price cuts. Sellers are competing on price.`
        : `${cuts}% of listings have price cuts. Moderate pricing pressure.`,
      signal: cuts > 30 ? 'sell-now' : 'neutral',
    });
  }

  if (metroData['saleToList'] !== undefined) {
    const ratio = metroData['saleToList'];
    indicators.push({
      name: 'Sale-to-List Ratio',
      value: ratio,
      interpretation: ratio >= 100
        ? `Homes are selling at or above list price (${ratio}%). Strong seller position.`
        : ratio >= 97
        ? `Homes are selling close to list price (${ratio}%). Healthy market.`
        : `Homes are selling below list price (${ratio}%). Consider pricing carefully.`,
      signal: ratio >= 100 ? 'sell-now' : ratio < 97 ? 'wait' : 'neutral',
    });
  }

  return indicators;
}

/**
 * Determine overall recommendation from indicator signals.
 */
export function determineRecommendation(
  indicators: MarketIndicator[],
): 'sell-now' | 'wait' | 'neutral' {
  let sellNowCount = 0;
  let waitCount = 0;

  for (const indicator of indicators) {
    if (indicator.signal === 'sell-now') sellNowCount++;
    if (indicator.signal === 'wait') waitCount++;
  }

  if (sellNowCount > waitCount) return 'sell-now';
  if (waitCount > sellNowCount) return 'wait';
  return 'neutral';
}

/**
 * Generate summary text based on recommendation.
 *
 * When `weighted` and `projection` are supplied, the summary includes a
 * confidence percentage and a 3-month projected-value line. Legacy callers
 * that omit them get the original shorter summary.
 */
export function generateSummary(
  recommendation: 'sell-now' | 'wait' | 'neutral',
  zip: string,
  estimatedHomeValue: number,
  weighted?: WeightedAnalysis,
  projection?: Projection,
): string {
  const base = (() => {
    switch (recommendation) {
      case 'sell-now':
        return `Based on current market conditions in ${zip}, the indicators suggest selling sooner rather than later. Your estimated home value of $${estimatedHomeValue.toLocaleString()} positions you well in the current market. Contact us for a personalized consultation.`;
      case 'wait':
        return `Market conditions in ${zip} suggest that waiting may be beneficial. Home values are trending upward and market dynamics favor patience. Your estimated value of $${estimatedHomeValue.toLocaleString()} could increase. We recommend monitoring the market and consulting with an agent.`;
      case 'neutral':
        return `Market conditions in ${zip} are balanced. Your estimated home value of $${estimatedHomeValue.toLocaleString()} is competitive. The decision to sell now or wait depends on your personal circumstances. Schedule a consultation to discuss your specific situation.`;
    }
  })();

  const extras: string[] = [];
  if (weighted) {
    const pct = Math.round(weighted.confidence * 100);
    extras.push(`Confidence: ${pct}% (based on ${weighted.signals.filter(s => s.observed).length} of ${weighted.signals.length} market signals).`);
  }
  if (projection && projection.delta3Mo !== 0) {
    const dir = projection.delta3Mo > 0 ? 'gain' : 'lose';
    const abs = Math.abs(projection.delta3Mo);
    extras.push(`At current trend, your home could ${dir} ~$${abs.toLocaleString()} over the next 3 months (projected value ~$${projection.projectedValue3Mo.toLocaleString()}).`);
  }
  return extras.length > 0 ? `${base} ${extras.join(' ')}` : base;
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Perform the sell-now-or-wait analysis.
 *
 * @throws {Error} if zip is empty or estimatedHomeValue <= 0
 */
export async function analyzeSellNowOrWait(
  input: SellNowOrWaitInput,
): Promise<SellNowOrWaitResponse> {
  const { zip, estimatedHomeValue } = input;

  if (!zip || zip.trim().length === 0) {
    throw new Error('zip is required');
  }
  if (estimatedHomeValue <= 0) {
    throw new Error('estimatedHomeValue must be greater than 0');
  }

  // Read market data from DynamoDB
  const [zipData, metroData] = await Promise.all([
    getZipMarketData(zip),
    getMetroMarketData(),
  ]);

  // Analyze indicators (legacy simple-majority, kept for UI detail rows)
  const indicators = analyzeMarketIndicators(zipData, metroData, estimatedHomeValue);

  // Weighted analysis with confidence (differentiator)
  const weighted = computeWeightedAnalysis(zipData, metroData, estimatedHomeValue);

  // Prefer the weighted recommendation when confidence is sufficient;
  // fall back to the legacy majority vote otherwise.
  const recommendation = weighted.confidence >= 0.4
    ? weighted.recommendation
    : determineRecommendation(indicators);

  // 3-month counterfactual projection
  const projection = projectThreeMonths(zipData, estimatedHomeValue);

  // Generate summary (now confidence + projection aware)
  const summary = generateSummary(recommendation, zip, estimatedHomeValue, weighted, projection);

  return {
    zip,
    estimatedHomeValue,
    zipData,
    metroData,
    indicators,
    recommendation,
    summary,
    weighted,
    projection,
  };
}
