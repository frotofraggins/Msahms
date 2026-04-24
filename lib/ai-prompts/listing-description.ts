/**
 * Listing description prompt — generates MLS-ready property descriptions.
 *
 * Output: 120-180 words, structured JSON with description + keyFeatures.
 * Temperature: 0.3 | Max tokens: 300
 */

import { BANNED_PHRASES, FEATURE_PREMIUM_WORDS, TERM_REPLACEMENTS } from './constants.js';

export interface ListingDescriptionInput {
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  lotSizeUnit?: string;
  yearBuilt?: number;
  upgrades?: string[];
  neighborhood?: string;
  subdivision?: string;
  schoolDistrict?: string;
  /** Features that match premium words (auto-detected from upgrades). */
  premiumFeatures?: string[];
}

export interface ListingDescriptionOutput {
  description: string;
  keyFeatures: string[];
  wordCount: number;
  premiumFeaturesUsed: string[];
}

/**
 * Build the system + user prompt for listing description generation.
 *
 * Returns { system, user } strings ready to send to the AI backend.
 */
export function buildListingDescriptionPrompt(input: ListingDescriptionInput): {
  system: string;
  user: string;
} {
  // Auto-detect premium features from upgrades
  const detectedPremiums: string[] = [];
  if (input.upgrades) {
    for (const upgrade of input.upgrades) {
      const lower = upgrade.toLowerCase();
      for (const [feature, premium] of Object.entries(FEATURE_PREMIUM_WORDS)) {
        if (lower.includes(feature.toLowerCase())) {
          detectedPremiums.push(`${feature} (+${premium}% value)`);
        }
      }
    }
  }

  const system = `You are a real estate listing description writer for the Mesa, AZ metro area.

RULES:
- Output ONLY valid JSON: {"description": "...", "keyFeatures": ["..."], "wordCount": N, "premiumFeaturesUsed": ["..."]}
- Description: 120-180 words, MLS-ready
- First two lines must differentiate the property with specifics
- Use "primary bedroom" not "master bedroom"
- Never describe who the property is "for" — describe the property itself
- Never claim school quality — state district name only
- Never promise views or sunlight duration — state orientation
- Include one lifestyle sentence balanced with specifics
- End with a concrete next step ("Schedule a private showing")

BANNED PHRASES (hard reject if used):
${BANNED_PHRASES.join(', ')}

TERM REPLACEMENTS:
${Object.entries(TERM_REPLACEMENTS).map(([from, to]) => `"${from}" → "${to}"`).join(', ')}

PREMIUM FEATURES (cite when present — these increase listing value):
${Object.entries(FEATURE_PREMIUM_WORDS).map(([f, p]) => `${f}: +${p}%`).join(', ')}`;

  const user = `Generate a listing description for:
Address: ${input.address}
Bedrooms: ${input.bedrooms} | Bathrooms: ${input.bathrooms} | Sqft: ${input.sqft.toLocaleString()}
${input.lotSize ? `Lot: ${input.lotSize} ${input.lotSizeUnit ?? 'sqft'}` : ''}
${input.yearBuilt ? `Year Built: ${input.yearBuilt}` : ''}
${input.upgrades?.length ? `Upgrades: ${input.upgrades.join(', ')}` : ''}
${input.neighborhood ? `Neighborhood: ${input.neighborhood}` : ''}
${input.subdivision ? `Subdivision: ${input.subdivision}` : ''}
${input.schoolDistrict ? `School District: ${input.schoolDistrict}` : ''}
${detectedPremiums.length ? `Premium features detected: ${detectedPremiums.join(', ')}` : ''}

Output JSON only.`;

  return { system, user };
}

/**
 * Validate a listing description output from the AI.
 * Returns null if valid, or an error message if invalid.
 */
export function validateListingDescriptionOutput(
  output: unknown,
): string | null {
  if (!output || typeof output !== 'object') return 'Output is not an object';
  const o = output as Record<string, unknown>;
  if (typeof o.description !== 'string') return 'Missing description field';
  if (!Array.isArray(o.keyFeatures)) return 'Missing keyFeatures array';
  if (o.description.length < 50) return 'Description too short (< 50 chars)';
  if (o.description.length > 2000) return 'Description too long (> 2000 chars)';

  // Check for banned phrases
  const lower = o.description.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return `Banned phrase detected: "${phrase}"`;
    }
  }

  return null;
}
