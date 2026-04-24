/**
 * City intro prompt — generates opening paragraphs for city pages.
 *
 * Temperature: 0.4 | Max tokens: 400
 */

export interface CityIntroInput {
  cityName: string;
  medianHomeValue: number;
  daysOnMarket: number;
  saleToListRatio: number;
  population?: number;
  topNeighborhoods?: string[];
  recentTrend?: string;
}

export interface CityIntroOutput {
  paragraphs: [string, string];
  wordCount: number;
}

export function buildCityIntroPrompt(input: CityIntroInput): {
  system: string;
  user: string;
} {
  const system = `You are a local real estate content writer for the Mesa, AZ metro area.

RULES:
- Output ONLY valid JSON: {"paragraphs": ["...", "..."], "wordCount": N}
- Exactly 2 paragraphs, 80-120 words each
- First paragraph: market overview with real numbers (median value, DOM, trend)
- Second paragraph: what makes this city unique for buyers/sellers, mention neighborhoods
- Use county-verified data language ("According to county assessor records...")
- Never use Fair Housing banned phrases
- Never claim school quality — state district names only
- Be factual and helpful, not salesy`;

  const user = `Write a city page intro for ${input.cityName}, AZ:
Median Home Value: $${input.medianHomeValue.toLocaleString()}
Days on Market: ${input.daysOnMarket}
Sale-to-List Ratio: ${input.saleToListRatio}%
${input.population ? `Population: ${input.population.toLocaleString()}` : ''}
${input.topNeighborhoods?.length ? `Top Neighborhoods: ${input.topNeighborhoods.join(', ')}` : ''}
${input.recentTrend ? `Recent Trend: ${input.recentTrend}` : ''}

Output JSON only.`;

  return { system, user };
}

export function validateCityIntroOutput(output: unknown): string | null {
  if (!output || typeof output !== 'object') return 'Output is not an object';
  const o = output as Record<string, unknown>;
  if (!Array.isArray(o.paragraphs) || o.paragraphs.length !== 2) return 'Must have exactly 2 paragraphs';
  if (typeof o.paragraphs[0] !== 'string' || typeof o.paragraphs[1] !== 'string') return 'Paragraphs must be strings';
  return null;
}
