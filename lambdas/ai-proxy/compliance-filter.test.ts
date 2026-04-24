import { describe, it, expect } from 'vitest';
import { scanForCompliance, PROHIBITED_TERMS } from './compliance-filter.js';

// ---------------------------------------------------------------------------
// Clean text
// ---------------------------------------------------------------------------

describe('scanForCompliance — clean text', () => {
  it('should return compliant for a normal listing description', () => {
    const text =
      'Beautiful 4-bedroom home with granite countertops, updated kitchen, ' +
      'and a spacious backyard. Located near top-rated schools and parks.';

    const result = scanForCompliance(text);
    expect(result.isCompliant).toBe(true);
    expect(result.flags).toHaveLength(0);
  });

  it('should return compliant for empty text', () => {
    const result = scanForCompliance('');
    expect(result.isCompliant).toBe(true);
    expect(result.flags).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Prohibited terms detection
// ---------------------------------------------------------------------------

describe('scanForCompliance — prohibited terms', () => {
  it('should flag familial status violations', () => {
    const text = 'This property is perfect for adults only. No children allowed.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);

    const categories = result.flags.map((f) => f.category);
    expect(categories).toContain('familial status');
  });

  it('should flag disability-related violations', () => {
    const text = 'Only able-bodied tenants need apply. No wheelchairs.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    const categories = result.flags.map((f) => f.category);
    expect(categories).toContain('disability');
  });

  it('should flag steering language', () => {
    const text = 'This is a gentrifying neighborhood, ideal for minorities.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    const categories = result.flags.map((f) => f.category);
    expect(categories).toContain('steering');
  });

  it('should flag race-related terms', () => {
    const text = 'Located in a white neighborhood with great schools.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    expect(result.flags.some((f) => f.category === 'race')).toBe(true);
  });

  it('should be case-insensitive', () => {
    const text = 'ADULTS ONLY community. NO CHILDREN allowed.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);
  });

  it('should report correct positions', () => {
    const text = 'This is adults only housing.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    const flag = result.flags.find((f) => f.term === 'adults only');
    expect(flag).toBeDefined();
    expect(flag!.startIndex).toBe(text.toLowerCase().indexOf('adults only'));
    expect(flag!.endIndex).toBe(flag!.startIndex + 'adults only'.length);
  });

  it('should detect multiple violations in one text', () => {
    const text = 'No children allowed. Handicapped not welcome. Adults only.';
    const result = scanForCompliance(text);

    expect(result.isCompliant).toBe(false);
    expect(result.flags.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// All categories have terms
// ---------------------------------------------------------------------------

describe('PROHIBITED_TERMS', () => {
  it('should have terms for all Fair Housing Act categories', () => {
    const expectedCategories = [
      'race',
      'color',
      'religion',
      'sex',
      'national origin',
      'familial status',
      'disability',
      'steering',
    ];

    for (const category of expectedCategories) {
      expect(PROHIBITED_TERMS[category]).toBeDefined();
      expect(PROHIBITED_TERMS[category].length).toBeGreaterThan(0);
    }
  });
});
