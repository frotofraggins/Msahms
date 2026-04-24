/**
 * Content type definitions for the MesaHomes blog and city pages.
 *
 * Covers blog posts, city/neighborhood pages, and content lifecycle
 * statuses stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** Content lifecycle status. */
export type ContentStatus = 'draft' | 'published' | 'archived';

// ---------------------------------------------------------------------------
// Content records
// ---------------------------------------------------------------------------

/** Blog post record stored in DynamoDB. */
export interface BlogPost {
  /** URL-friendly slug (unique identifier) */
  slug: string;
  /** Post title */
  title: string;
  /** Post body (markdown) */
  body: string;
  /** Author name */
  author: string;
  /** ISO 8601 publish date */
  publishDate: string;
  /** Post category */
  category: string;
  /** Associated city (optional) */
  city?: string;
  /** Associated ZIP codes */
  zips: string[];
  /** SEO meta description */
  metaDescription: string;
  /** Open Graph image URL (optional) */
  ogImage?: string;
  /** Freeform tags for categorization */
  tags: string[];
  /** Content lifecycle status */
  status: ContentStatus;
}

/** City/neighborhood page record stored in DynamoDB. */
export interface CityPage {
  /** URL-friendly slug (unique identifier) */
  slug: string;
  /** City display name */
  cityName: string;
  /** State abbreviation (e.g. "AZ") */
  state: string;
  /** Median home price (dollars) */
  medianPrice: number;
  /** Average days on market */
  daysOnMarket: number;
  /** Sale-to-list price ratio (e.g. 0.98) */
  saleToListRatio: number;
  /** Active listing inventory count */
  inventory: number;
  /** Population growth rate (percentage, e.g. 2.5) */
  populationGrowth: number;
  /** Property tax rate (percentage, e.g. 0.62) */
  propertyTaxRate: number;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}
