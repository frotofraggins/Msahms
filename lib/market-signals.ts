/**
 * Market signal scoring for Sell-Now-or-Wait analysis.
 *
 * Pure functions — no I/O, no AWS SDK.
 *
 * Methodology:
 * Aligned with Zillow's Market Heat Index convention (0-100 scale, with
 * published buckets: 70+ strong seller, 55-69 seller, 44-55 neutral, 28-44
 * buyer, <28 strong buyer). See
 * https://www.zillow.com/research/market-heat-index-methodology-34057/
 *
 * Zillow's public index uses three inputs: buyer engagement, share of
 * price-cut listings, and share of listings pending in 21 days. We extend
 * that with county-data signals unique to our platform (ZHVI trend, 6-month
 * change, sale-to-list ratio, inventory, your-home-vs-ZHVI, seasonal bias).
 * Weights sum to 1 and are calibrated against leading-vs-lagging indicator
 * practice: trend signals get the most weight, inventory least.
 *
 * Confidence reflects *data coverage*, not statistical confidence —
 * if only 3 of 7 signals have data, the score could still be accurate,
 * but we surface the partial observation to the user.
 */

import type { MarketDataZip } from './types/market.js';

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

/**
 * Weights per signal. Must sum to 1. Calibrated from publicly documented
 * seller-timing research — higher for leading indicators (trend, price cuts)
 * and lower for lagging ones (inventory, metro median).
 */
export const SIGNAL_WEIGHTS = {
  zipTrend: 0.25,        // leading — ZHVI direction
  zhviChange6Mo: 0.20,   // leading — magnitude of recent move
  saleToList: 0.15,      // concurrent — buyer demand strength
  daysPending: 0.15,     // concurrent — absorption rate
  priceCuts: 0.10,       // concurrent — seller concessions
  valueVsZhvi: 0.10,     // position — your home's percentile
  inventory: 0.05,       // lagging — supply pressure
} as const;

/** Sum of all weights (must be 1). */
export const TOTAL_WEIGHT = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single weighted signal contribution to the overall score. */
export interface WeightedSignal {
  /** Signal key matching SIGNAL_WEIGHTS */
  key: keyof typeof SIGNAL_WEIGHTS;
  /** Raw signal value in [-1, 1]: -1 strongly wait, +1 strongly sell-now */
  rawScore: number;
  /** Weight applied to this signal */
  weight: number;
  /** Contribution to the final score (rawScore * weight) */
  contribution: number;
  /** Whether this signal had data (false → excluded from confidence) */
  observed: boolean;
}

/** Weighted analysis result. */
export interface WeightedAnalysis {
  /** Overall score in [-1, 1]. Positive = sell-now, negative = wait. */
  score: number;
  /**
   * Market heat index mapped to the 0-100 scale used by Zillow's Market
   * Heat Index. 100 = maximum seller-favoring, 0 = maximum buyer-favoring.
   * Linear transform of `score`: heat = 50 + score * 50.
   */
  heatIndex: number;
  /**
   * Market bucket label aligned with Zillow's published thresholds:
   *   >= 70  strong-seller
   *   55-69  seller
   *   44-54  neutral
   *   28-43  buyer
   *   < 28   strong-buyer
   */
  marketBucket: 'strong-seller' | 'seller' | 'neutral' | 'buyer' | 'strong-buyer';
  /** Confidence in [0, 1] based on observed signal coverage. */
  confidence: number;
  /** Per-signal breakdown. */
  signals: WeightedSignal[];
  /** Seasonal adjustment applied (+ favors selling, - favors waiting). */
  seasonalBias: number;
  /**
   * Recommendation mapped from score + confidence.
   * Simpler than the 5-bucket market classification above — meant for the
   * user's direct question ("should I sell now or wait?").
   */
  recommendation: 'sell-now' | 'wait' | 'neutral';
}

/** 3-month counterfactual projection. */
export interface Projection {
  /** Projected home value 3 months from now if trend continues. */
  projectedValue3Mo: number;
  /** Dollar delta vs current estimated value. */
  delta3Mo: number;
  /** Monthly rate of change used for the projection. */
  monthlyRate: number;
}

// ---------------------------------------------------------------------------
// Seasonal bias (Phoenix-Mesa metro)
// ---------------------------------------------------------------------------

/**
 * Monthly seasonal bias for the Phoenix-Mesa metro, 0-indexed by month
 * (Jan=0). Positive favors selling now (prime buyer season), negative
 * favors waiting.
 *
 * Source: Phoenix-Mesa historical sale-to-list ratio and days-on-market
 * seasonality — spring/early summer are strongest, winter softest.
 * Magnitude capped at ±0.15 so it never dominates real market signals.
 */
const SEASONAL_BIAS_BY_MONTH = [
  -0.05, // Jan — slow
   0.00, // Feb — warming
   0.10, // Mar — strong
   0.15, // Apr — peak spring
   0.15, // May — peak
   0.10, // Jun — still strong
   0.00, // Jul — heat slows buyers
  -0.05, // Aug — slowest summer
   0.00, // Sep — recovering
   0.05, // Oct — secondary peak
  -0.05, // Nov — slowing
  -0.10, // Dec — holidays
];

/** Get seasonal bias for a given date (defaults to now). */
export function getSeasonalBias(date: Date = new Date()): number {
  return SEASONAL_BIAS_BY_MONTH[date.getMonth()] ?? 0;
}

// ---------------------------------------------------------------------------
// Signal normalizers — each returns value in [-1, 1], or null if unobserved
// ---------------------------------------------------------------------------

function scoreZipTrend(direction?: string): number | null {
  if (!direction) return null;
  if (direction === 'rising') return -0.7;     // wait-leaning
  if (direction === 'declining') return 0.7;   // sell-leaning
  return 0;                                    // stable
}

function scoreZhviChange6Mo(change: number | null | undefined, currentValue: number): number | null {
  if (change === null || change === undefined || currentValue <= 0) return null;
  // ±10% over 6 months is a strong signal; clamp to [-1, 1]
  const pct = change / currentValue;
  return Math.max(-1, Math.min(1, -(pct / 0.1))); // rising pct → wait (negative score)
}

function scoreSaleToList(ratio: number | undefined): number | null {
  if (ratio === undefined) return null;
  // 100% = neutral, 103%+ = strong sell, 95%- = strong wait
  return Math.max(-1, Math.min(1, (ratio - 100) / 3));
}

function scoreDaysPending(days: number | undefined): number | null {
  if (days === undefined) return null;
  // 30 days = neutral, <20 strong sell, >60 strong wait
  return Math.max(-1, Math.min(1, (30 - days) / 30));
}

function scorePriceCuts(pct: number | undefined): number | null {
  if (pct === undefined) return null;
  // 20% = neutral. Higher = sellers concession-heavy = weaker market = sell-now-before-it-worsens
  // But very high (>40%) means buyer-market, so cap upside at 30
  if (pct > 40) return 0.3;
  return Math.max(-1, Math.min(1, (pct - 20) / 20));
}

function scoreValueVsZhvi(homeValue: number, zhvi: number | undefined): number | null {
  if (zhvi === undefined || zhvi <= 0) return null;
  // +10% above ZHVI = premium position (sell). -10% below = underpriced (wait to appreciate).
  const pct = (homeValue - zhvi) / zhvi;
  return Math.max(-1, Math.min(1, pct / 0.1));
}

function scoreInventory(inventory: number | undefined): number | null {
  if (inventory === undefined) return null;
  // Heuristic: 8000 listings is Phoenix-Mesa baseline. Higher = more competition = wait less good.
  // Low inventory favors sellers.
  return Math.max(-1, Math.min(1, (8000 - inventory) / 8000));
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * Compute a weighted sell-now-or-wait score with confidence.
 *
 * @param zipData ZIP market data (may be null if unavailable)
 * @param metroData Metro-level metrics map
 * @param estimatedHomeValue User's current home value estimate
 * @param now Evaluation date (defaults to current time)
 */
export function computeWeightedAnalysis(
  zipData: MarketDataZip | null,
  metroData: Record<string, number>,
  estimatedHomeValue: number,
  now: Date = new Date(),
): WeightedAnalysis {
  const raw: Partial<Record<keyof typeof SIGNAL_WEIGHTS, number | null>> = {
    zipTrend: zipData ? scoreZipTrend(zipData.trendDirection) : null,
    zhviChange6Mo: zipData ? scoreZhviChange6Mo(zipData.zhviChange6Mo, zipData.zhvi) : null,
    saleToList: scoreSaleToList(metroData['saleToList']),
    daysPending: scoreDaysPending(metroData['daysPending']),
    priceCuts: scorePriceCuts(metroData['priceCuts']),
    valueVsZhvi: zipData ? scoreValueVsZhvi(estimatedHomeValue, zipData.zhvi) : null,
    inventory: scoreInventory(metroData['inventory']),
  };

  const signals: WeightedSignal[] = (Object.keys(SIGNAL_WEIGHTS) as (keyof typeof SIGNAL_WEIGHTS)[]).map((key) => {
    const rawScore = raw[key];
    const weight = SIGNAL_WEIGHTS[key];
    const observed = rawScore !== null && rawScore !== undefined;
    return {
      key,
      rawScore: observed ? (rawScore as number) : 0,
      weight,
      contribution: observed ? (rawScore as number) * weight : 0,
      observed,
    };
  });

  const observedWeight = signals.filter(s => s.observed).reduce((acc, s) => acc + s.weight, 0);
  const confidence = observedWeight; // 0..1 since weights sum to 1

  // Re-normalize score so missing signals don't dilute. Score is the
  // observed-weighted average in [-1, 1].
  const rawScore = observedWeight > 0
    ? signals.reduce((acc, s) => acc + s.contribution, 0) / observedWeight
    : 0;

  const seasonalBias = getSeasonalBias(now);
  // Blend seasonal bias in at 20% weight — enough to nudge, not dominate.
  const score = Math.max(-1, Math.min(1, rawScore * 0.8 + seasonalBias * 0.2));

  // Map to Zillow's 0-100 heat index convention.
  const heatIndex = 50 + score * 50;
  const marketBucket: WeightedAnalysis['marketBucket'] =
    heatIndex >= 70 ? 'strong-seller' :
    heatIndex >= 55 ? 'seller' :
    heatIndex >= 44 ? 'neutral' :
    heatIndex >= 28 ? 'buyer' :
    'strong-buyer';

  // Recommendation threshold: require confidence >= 0.4 to commit either way.
  let recommendation: 'sell-now' | 'wait' | 'neutral';
  if (confidence < 0.4) {
    recommendation = 'neutral';
  } else if (score > 0.15) {
    recommendation = 'sell-now';
  } else if (score < -0.15) {
    recommendation = 'wait';
  } else {
    recommendation = 'neutral';
  }

  return { score, heatIndex, marketBucket, confidence, signals, seasonalBias, recommendation };
}

/**
 * Project the home's value 3 months out using the 6-month ZHVI change as
 * a monthly rate. Returns all-zero projection if data is missing.
 */
export function projectThreeMonths(
  zipData: MarketDataZip | null,
  estimatedHomeValue: number,
): Projection {
  if (!zipData || zipData.zhvi <= 0 || zipData.zhviChange6Mo === null || zipData.zhviChange6Mo === undefined) {
    return { projectedValue3Mo: estimatedHomeValue, delta3Mo: 0, monthlyRate: 0 };
  }
  const sixMonthRate = zipData.zhviChange6Mo / zipData.zhvi; // fractional
  const monthlyRate = sixMonthRate / 6;
  const projectedValue3Mo = Math.round(estimatedHomeValue * (1 + monthlyRate * 3));
  return {
    projectedValue3Mo,
    delta3Mo: projectedValue3Mo - estimatedHomeValue,
    monthlyRate,
  };
}
