/**
 * Tests for the AI prompts library.
 * Validates prompt building, output validation, and banned phrase detection.
 */

import { describe, it, expect } from 'vitest';
import {
  buildListingDescriptionPrompt,
  validateListingDescriptionOutput,
} from './listing-description.js';
import {
  buildOfferDraftPrompt,
  validateOfferDraftOutput,
} from './offer-draft.js';
import {
  buildToolSummaryPrompt,
  validateToolSummaryOutput,
} from './tool-summary.js';
import {
  buildCityIntroPrompt,
  validateCityIntroOutput,
} from './city-intro.js';
import { BANNED_PHRASES, FEATURE_PREMIUM_WORDS } from './constants.js';

// ---------------------------------------------------------------------------
// Listing description
// ---------------------------------------------------------------------------

describe('listing-description prompt', () => {
  const input = {
    address: '1234 E Main St, Mesa, AZ 85201',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    yearBuilt: 2005,
    upgrades: ['quartz counters', 'solar panels'],
    neighborhood: 'Eastmark',
  };

  it('builds system and user prompts', () => {
    const { system, user } = buildListingDescriptionPrompt(input);
    expect(system).toContain('primary bedroom');
    expect(system).toContain('BANNED PHRASES');
    expect(user).toContain('1234 E Main St');
    expect(user).toContain('quartz');
  });

  it('detects premium features from upgrades', () => {
    const { user } = buildListingDescriptionPrompt(input);
    expect(user).toContain('quartz');
    expect(user).toContain('solar panels');
  });

  it('validates valid output', () => {
    const output = {
      description: 'A beautiful 3-bedroom home in Eastmark with quartz counters and solar panels. ' +
        'This 1,800 sqft property features an open floor plan with modern finishes throughout. ' +
        'Schedule a private showing today.',
      keyFeatures: ['quartz counters', 'solar panels', 'open floor plan'],
      wordCount: 35,
      premiumFeaturesUsed: ['quartz', 'solar panels'],
    };
    expect(validateListingDescriptionOutput(output)).toBeNull();
  });

  it('rejects output with banned phrase', () => {
    const output = {
      description: 'This stunning home is nestled in a quiet neighborhood.',
      keyFeatures: [],
      wordCount: 10,
      premiumFeaturesUsed: [],
    };
    const error = validateListingDescriptionOutput(output);
    expect(error).toContain('Banned phrase');
  });

  it('rejects too-short description', () => {
    const output = { description: 'Short.', keyFeatures: [], wordCount: 1, premiumFeaturesUsed: [] };
    expect(validateListingDescriptionOutput(output)).toContain('too short');
  });

  it('rejects non-object output', () => {
    expect(validateListingDescriptionOutput(null)).toContain('not an object');
    expect(validateListingDescriptionOutput('string')).toContain('not an object');
  });
});

// ---------------------------------------------------------------------------
// Offer draft
// ---------------------------------------------------------------------------

describe('offer-draft prompt', () => {
  const input = {
    propertyAddress: '5678 W Broadway, Mesa, AZ 85210',
    offeredPrice: 425000,
    earnestMoney: 5000,
    financingType: 'Conventional',
    contingencies: ['Inspection', 'Appraisal', 'Financing'],
    closingDate: '2026-06-15',
  };

  it('builds prompts with Arizona-specific references', () => {
    const { system } = buildOfferDraftPrompt(input);
    expect(system).toContain('Arizona');
    expect(system).toContain('BINSR');
    expect(system).toContain('disclaimer');
  });

  it('validates valid output', () => {
    const output = {
      keyTerms: {
        offeredPrice: '$425,000',
        earnestMoney: '$5,000',
        financingType: 'Conventional',
        contingencies: ['Inspection', 'Appraisal', 'Financing'],
        closingDate: '2026-06-15',
      },
      draftText: 'This offer is for the property at 5678 W Broadway...',
      disclaimer: 'This is for educational purposes only and does not constitute legal advice.',
      wordCount: 200,
    };
    expect(validateOfferDraftOutput(output)).toBeNull();
  });

  it('rejects output without disclaimer', () => {
    const output = { keyTerms: {}, draftText: 'text', disclaimer: 'wrong', wordCount: 1 };
    expect(validateOfferDraftOutput(output)).toContain('Disclaimer');
  });
});

// ---------------------------------------------------------------------------
// Tool summary
// ---------------------------------------------------------------------------

describe('tool-summary prompt', () => {
  it('builds prompt with tool name and results', () => {
    const { user } = buildToolSummaryPrompt({
      toolName: 'net-sheet',
      inputs: { salePrice: 450000 },
      results: { netProceeds: 410000 },
    });
    expect(user).toContain('net-sheet');
    expect(user).toContain('450000');
  });

  it('validates valid output', () => {
    const output = {
      summary: 'Based on a sale price of $450K, you would net approximately $410K after all costs.',
      nextStep: 'Consider running the Sell Now or Wait analysis to check market timing.',
      wordCount: 25,
    };
    expect(validateToolSummaryOutput(output)).toBeNull();
  });

  it('rejects too-short summary', () => {
    expect(validateToolSummaryOutput({ summary: 'Short', nextStep: 'ok', wordCount: 1 })).toContain('too short');
  });
});

// ---------------------------------------------------------------------------
// City intro
// ---------------------------------------------------------------------------

describe('city-intro prompt', () => {
  it('builds prompt with city data', () => {
    const { user } = buildCityIntroPrompt({
      cityName: 'Mesa',
      medianHomeValue: 448000,
      daysOnMarket: 60,
      saleToListRatio: 97.7,
    });
    expect(user).toContain('Mesa');
    expect(user).toContain('448,000');
  });

  it('validates valid output', () => {
    const output = {
      paragraphs: ['First paragraph about Mesa market.', 'Second paragraph about neighborhoods.'],
      wordCount: 20,
    };
    expect(validateCityIntroOutput(output)).toBeNull();
  });

  it('rejects wrong number of paragraphs', () => {
    expect(validateCityIntroOutput({ paragraphs: ['one'], wordCount: 5 })).toContain('exactly 2');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('banned phrases list is non-empty', () => {
    expect(BANNED_PHRASES.length).toBeGreaterThan(10);
  });

  it('feature premium words have positive values', () => {
    for (const [feature, premium] of Object.entries(FEATURE_PREMIUM_WORDS)) {
      expect(premium).toBeGreaterThan(0);
      expect(feature.length).toBeGreaterThan(0);
    }
  });

  it('master bedroom is in banned list', () => {
    expect(BANNED_PHRASES).toContain('master bedroom');
  });
});
