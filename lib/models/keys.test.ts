import { describe, it, expect } from 'vitest';
import {
  generateAgentKeys,
  generateMarketZipKeys,
  generateMarketMetroKeys,
  generatePropertyCacheKeys,
  generateCompsCacheKeys,
  generateBlogPostKeys,
  generateCityPageKeys,
  generateListingKeys,
  generateScenarioKeys,
} from './keys.js';

// ---------------------------------------------------------------------------
// generateAgentKeys
// ---------------------------------------------------------------------------

describe('generateAgentKeys', () => {
  it('should produce correct PK and SK patterns', () => {
    const keys = generateAgentKeys('agent-1', 'team-1');
    expect(keys.PK).toBe('AGENT#agent-1');
    expect(keys.SK).toBe('AGENT#agent-1');
  });

  it('should produce GSI1PK with team ID', () => {
    const keys = generateAgentKeys('agent-1', 'team-1');
    expect(keys.GSI1PK).toBe('TEAM#team-1');
  });

  it('should produce GSI1SK with agent ID', () => {
    const keys = generateAgentKeys('agent-1', 'team-1');
    expect(keys.GSI1SK).toBe('AGENT#agent-1');
  });
});

// ---------------------------------------------------------------------------
// generateMarketZipKeys
// ---------------------------------------------------------------------------

describe('generateMarketZipKeys', () => {
  it('should produce correct PK with ZIP prefix', () => {
    const keys = generateMarketZipKeys('85140', '2026-03');
    expect(keys.PK).toBe('MARKET#ZIP#85140');
  });

  it('should produce correct SK with ZHVI prefix and month', () => {
    const keys = generateMarketZipKeys('85140', '2026-03');
    expect(keys.SK).toBe('ZHVI#2026-03');
  });

  it('should handle LATEST as month value', () => {
    const keys = generateMarketZipKeys('85201', 'LATEST');
    expect(keys.SK).toBe('ZHVI#LATEST');
  });
});

// ---------------------------------------------------------------------------
// generateMarketMetroKeys
// ---------------------------------------------------------------------------

describe('generateMarketMetroKeys', () => {
  it('should produce fixed PK for phoenix-mesa metro', () => {
    const keys = generateMarketMetroKeys('medianSalePrice', '2026-03');
    expect(keys.PK).toBe('MARKET#METRO#phoenix-mesa');
  });

  it('should produce SK with metric and month', () => {
    const keys = generateMarketMetroKeys('medianSalePrice', '2026-03');
    expect(keys.SK).toBe('medianSalePrice#2026-03');
  });

  it('should handle LATEST as month value', () => {
    const keys = generateMarketMetroKeys('daysOnMarket', 'LATEST');
    expect(keys.SK).toBe('daysOnMarket#LATEST');
  });
});

// ---------------------------------------------------------------------------
// generatePropertyCacheKeys
// ---------------------------------------------------------------------------

describe('generatePropertyCacheKeys', () => {
  it('should produce PK with PROPERTY prefix and normalized address', () => {
    const keys = generatePropertyCacheKeys('123-main-st-mesa-az-85201');
    expect(keys.PK).toBe('PROPERTY#123-main-st-mesa-az-85201');
  });

  it('should produce fixed SK of LOOKUP', () => {
    const keys = generatePropertyCacheKeys('456-oak-ave');
    expect(keys.SK).toBe('LOOKUP');
  });
});

// ---------------------------------------------------------------------------
// generateCompsCacheKeys
// ---------------------------------------------------------------------------

describe('generateCompsCacheKeys', () => {
  it('should produce subdivision comps PK with SUB prefix', () => {
    const keys = generateCompsCacheKeys('SUB', 'Eastmark', '85212');
    expect(keys.PK).toBe('COMPS#SUB#Eastmark');
  });

  it('should produce subdivision comps SK with zip', () => {
    const keys = generateCompsCacheKeys('SUB', 'Eastmark', '85212');
    expect(keys.SK).toBe('#85212');
  });

  it('should produce ZIP comps PK with ZIP prefix', () => {
    const keys = generateCompsCacheKeys('ZIP', '85201');
    expect(keys.PK).toBe('COMPS#ZIP#85201');
  });

  it('should produce ZIP comps SK as LATEST', () => {
    const keys = generateCompsCacheKeys('ZIP', '85201');
    expect(keys.SK).toBe('LATEST');
  });
});

// ---------------------------------------------------------------------------
// generateBlogPostKeys
// ---------------------------------------------------------------------------

describe('generateBlogPostKeys', () => {
  it('should produce PK and SK with CONTENT#BLOG prefix', () => {
    const keys = generateBlogPostKeys('mesa-housing-market-2026', '2026-03-15');
    expect(keys.PK).toBe('CONTENT#BLOG#mesa-housing-market-2026');
    expect(keys.SK).toBe('CONTENT#BLOG#mesa-housing-market-2026');
  });

  it('should produce GSI1PK as CONTENT#BLOG', () => {
    const keys = generateBlogPostKeys('test-post', '2026-01-01');
    expect(keys.GSI1PK).toBe('CONTENT#BLOG');
  });

  it('should produce GSI1SK with publish date', () => {
    const keys = generateBlogPostKeys('test-post', '2026-03-15');
    expect(keys.GSI1SK).toBe('#2026-03-15');
  });
});

// ---------------------------------------------------------------------------
// generateCityPageKeys
// ---------------------------------------------------------------------------

describe('generateCityPageKeys', () => {
  it('should produce PK and SK with CONTENT#CITY prefix', () => {
    const keys = generateCityPageKeys('mesa');
    expect(keys.PK).toBe('CONTENT#CITY#mesa');
    expect(keys.SK).toBe('CONTENT#CITY#mesa');
  });

  it('should produce GSI1PK as CONTENT#CITY', () => {
    const keys = generateCityPageKeys('gilbert');
    expect(keys.GSI1PK).toBe('CONTENT#CITY');
  });

  it('should produce GSI1SK with slug', () => {
    const keys = generateCityPageKeys('queen-creek');
    expect(keys.GSI1SK).toBe('#queen-creek');
  });
});

// ---------------------------------------------------------------------------
// generateListingKeys
// ---------------------------------------------------------------------------

describe('generateListingKeys', () => {
  it('should produce PK and SK with LISTING prefix', () => {
    const keys = generateListingKeys('lst-001', 'active', '2026-03-01T00:00:00Z');
    expect(keys.PK).toBe('LISTING#lst-001');
    expect(keys.SK).toBe('LISTING#lst-001');
  });

  it('should produce GSI1PK with LISTING#STATUS prefix and status', () => {
    const keys = generateListingKeys('lst-001', 'draft', '2026-03-01T00:00:00Z');
    expect(keys.GSI1PK).toBe('LISTING#STATUS#draft');
  });

  it('should produce GSI1SK with createdAt', () => {
    const ts = '2026-03-01T12:00:00.000Z';
    const keys = generateListingKeys('lst-001', 'paid', ts);
    expect(keys.GSI1SK).toBe(`#${ts}`);
  });
});

// ---------------------------------------------------------------------------
// generateScenarioKeys
// ---------------------------------------------------------------------------

describe('generateScenarioKeys', () => {
  it('should produce PK and SK with SCENARIO prefix', () => {
    const keys = generateScenarioKeys('tok-abc-123');
    expect(keys.PK).toBe('SCENARIO#tok-abc-123');
    expect(keys.SK).toBe('SCENARIO#tok-abc-123');
  });

  it('should not include visitor keys when email is not provided', () => {
    const keys = generateScenarioKeys('tok-abc-123');
    expect(keys.visitorPK).toBeUndefined();
    expect(keys.visitorSK).toBeUndefined();
  });

  it('should include visitor keys when email is provided', () => {
    const ts = '2026-03-01T12:00:00.000Z';
    const keys = generateScenarioKeys('tok-abc-123', 'user@example.com', ts);
    expect(keys.visitorPK).toBe('VISITOR#user@example.com');
    expect(keys.visitorSK).toBe(`SCENARIO#${ts}`);
  });

  it('should default visitor SK to current timestamp when createdAt not provided', () => {
    const before = new Date().toISOString();
    const keys = generateScenarioKeys('tok-abc-123', 'user@example.com');
    const after = new Date().toISOString();

    const ts = keys.visitorSK!.replace('SCENARIO#', '');
    expect(ts >= before).toBe(true);
    expect(ts <= after).toBe(true);
  });
});
