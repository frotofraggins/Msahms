/**
 * Fair Housing Act compliance filter for AI-generated content.
 *
 * Scans text for prohibited terms related to race, color, religion, sex,
 * national origin, familial status, or disability, as well as steering
 * language. Returns flagged terms with their locations, or empty flags
 * for clean text.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single flagged term found in the text. */
export interface FlaggedTerm {
  /** The prohibited term that was found. */
  term: string;
  /** The Fair Housing Act category this term violates. */
  category: string;
  /** Character index where the term starts. */
  startIndex: number;
  /** Character index where the term ends. */
  endIndex: number;
}

/** Result of running the compliance filter on a text. */
export interface ComplianceResult {
  /** Whether the text passed compliance (no flags). */
  isCompliant: boolean;
  /** Array of flagged terms (empty if compliant). */
  flags: FlaggedTerm[];
}

// ---------------------------------------------------------------------------
// Prohibited terms by category
// ---------------------------------------------------------------------------

/**
 * Map of Fair Housing Act categories to prohibited terms/phrases.
 *
 * These terms, when used in real estate advertising or listing descriptions,
 * may violate the Fair Housing Act.
 */
export const PROHIBITED_TERMS: Record<string, string[]> = {
  race: [
    'white neighborhood',
    'black neighborhood',
    'african american area',
    'caucasian',
    'hispanic area',
    'asian community',
    'ethnic',
    'racially',
    'segregated',
    'colored',
  ],
  color: [
    'dark-skinned',
    'light-skinned',
    'skin color',
  ],
  religion: [
    'christian neighborhood',
    'muslim area',
    'jewish community',
    'church district',
    'near mosque',
    'near synagogue',
    'religious community',
  ],
  sex: [
    'bachelor pad',
    'man cave',
    'female only',
    'male only',
    'single women',
    'single men',
  ],
  'national origin': [
    'american-born',
    'no immigrants',
    'english speakers only',
    'foreign',
    'mexican neighborhood',
    'chinese area',
  ],
  'familial status': [
    'no children',
    'adults only',
    'no kids',
    'couples only',
    'senior living',
    'perfect for singles',
    'not suitable for families',
    'child-free',
    'no families',
  ],
  disability: [
    'no wheelchairs',
    'able-bodied',
    'handicapped',
    'crippled',
    'mentally ill',
    'no disabilities',
    'physically fit only',
  ],
  steering: [
    'ideal for minorities',
    'perfect for your kind',
    'people like you',
    'your people',
    'transitional area',
    'changing neighborhood',
    'up and coming area',
    'gentrifying',
  ],
};

// ---------------------------------------------------------------------------
// Filter implementation
// ---------------------------------------------------------------------------

/**
 * Scan text for Fair Housing Act prohibited terms.
 *
 * Performs case-insensitive matching of all prohibited terms against the
 * input text. Returns all matches with their category and position.
 *
 * @param text - The text to scan for compliance.
 * @returns A {@link ComplianceResult} with flags for any violations found.
 */
export function scanForCompliance(text: string): ComplianceResult {
  const flags: FlaggedTerm[] = [];
  const lowerText = text.toLowerCase();

  for (const [category, terms] of Object.entries(PROHIBITED_TERMS)) {
    for (const term of terms) {
      const lowerTerm = term.toLowerCase();
      let searchFrom = 0;

      while (searchFrom < lowerText.length) {
        const index = lowerText.indexOf(lowerTerm, searchFrom);
        if (index === -1) break;

        flags.push({
          term,
          category,
          startIndex: index,
          endIndex: index + term.length,
        });

        searchFrom = index + 1;
      }
    }
  }

  // Sort flags by position for consistent output
  flags.sort((a, b) => a.startIndex - b.startIndex);

  return {
    isCompliant: flags.length === 0,
    flags,
  };
}
