/**
 * Shared constants for the AI prompts library.
 */

/** Fair Housing banned phrases — compliance-filter.ts hard-blocks these. */
export const BANNED_PHRASES: readonly string[] = [
  'perfect for singles', 'suitable for young couple', 'no children',
  'adult community', 'bachelor pad', 'family-oriented',
  'walking distance', 'able-bodied', 'no wheelchairs',
  'exclusive neighborhood', 'prestigious',
  'nestled', 'boasts', 'stunning', 'must see', 'won\'t last',
  'priced to sell', 'needs TLC', 'cozy', 'motivated seller',
  'master bedroom',
];

/** Required replacements for common problematic terms. */
export const TERM_REPLACEMENTS: Record<string, string> = {
  'master bedroom': 'primary bedroom',
  'master bath': 'primary bath',
  'master suite': 'primary suite',
  'mother-in-law suite': 'in-law suite',
  'walking distance': 'minutes on foot',
};

/**
 * Feature-premium words that increase listing value.
 * Model should cite these when the property has the feature.
 * Source: Zillow/Redfin listing analysis, 2025-2026.
 */
export const FEATURE_PREMIUM_WORDS: Record<string, number> = {
  'dock': 5.4,
  'pergola': 2.2,
  'barn door': 1.7,
  'shaker cabinet': 1.6,
  'farmhouse sink': 1.5,
  'quartz': 1.4,
  'open concept': 1.3,
  'heated pool': 3.1,
  'RV gate': 2.8,
  'solar panels': 2.5,
  'smart home': 1.9,
  'epoxy garage': 1.2,
};

/** Default AI generation settings. */
export const AI_DEFAULTS = {
  temperature: 0.3,
  maxTokens: 300,
  model: 'local', // 'local' = Hydra MCP, 'bedrock' = fallback
} as const;
