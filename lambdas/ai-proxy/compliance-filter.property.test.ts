/**
 * Property-based test for the compliance filter.
 *
 * **Property 10: AI-Generated Content Compliance Filter**
 * **Validates: Requirements 5.2, 5.3**
 *
 * For any text with prohibited terms → flags them.
 * For any text without → no flags.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scanForCompliance, PROHIBITED_TERMS } from './compliance-filter.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** All prohibited terms flattened with their category. */
const ALL_PROHIBITED: Array<{ term: string; category: string }> = [];
for (const [category, terms] of Object.entries(PROHIBITED_TERMS)) {
  for (const term of terms) {
    ALL_PROHIBITED.push({ term, category });
  }
}

/** Arbitrary that picks a random prohibited term. */
const prohibitedTermArb = fc.constantFrom(...ALL_PROHIBITED);

/**
 * Arbitrary for "clean" text that does not contain any prohibited terms.
 *
 * Uses a safe alphabet and short words to avoid accidental matches.
 */
const cleanWordArb = fc.constantFrom(
  'beautiful', 'spacious', 'modern', 'updated', 'kitchen', 'bedroom',
  'bathroom', 'garage', 'pool', 'patio', 'granite', 'hardwood', 'tile',
  'stainless', 'appliances', 'backyard', 'landscaped', 'quiet', 'street',
  'corner', 'lot', 'cul-de-sac', 'mountain', 'views', 'open', 'floor',
  'plan', 'vaulted', 'ceilings', 'natural', 'light', 'storage', 'closet',
  'laundry', 'room', 'office', 'den', 'loft', 'bonus', 'covered',
);

const cleanTextArb = fc
  .array(cleanWordArb, { minLength: 3, maxLength: 20 })
  .map((words) => words.join(' '));

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 10: AI-Generated Content Compliance Filter', () => {
  it('should flag any text containing a prohibited term', () => {
    fc.assert(
      fc.property(
        cleanTextArb,
        prohibitedTermArb,
        cleanTextArb,
        (prefix, prohibited, suffix) => {
          const text = `${prefix} ${prohibited.term} ${suffix}`;
          const result = scanForCompliance(text);

          // Must not be compliant
          expect(result.isCompliant).toBe(false);

          // Must flag the specific term
          const flaggedTerms = result.flags.map((f) => f.term.toLowerCase());
          expect(flaggedTerms).toContain(prohibited.term.toLowerCase());

          // Must identify the correct category
          const matchingFlag = result.flags.find(
            (f) => f.term.toLowerCase() === prohibited.term.toLowerCase(),
          );
          expect(matchingFlag).toBeDefined();
          expect(matchingFlag!.category).toBe(prohibited.category);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should return no flags for any clean text', () => {
    fc.assert(
      fc.property(cleanTextArb, (text) => {
        const result = scanForCompliance(text);
        expect(result.isCompliant).toBe(true);
        expect(result.flags).toHaveLength(0);
      }),
      { numRuns: 200 },
    );
  });
});
