/**
 * Flat-fee listing type definitions for the MesaHomes listing service.
 *
 * Covers listing lifecycle statuses and the full FlatFeeListing record
 * shape stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** Flat-fee listing lifecycle status. */
export type ListingStatus =
  | 'draft'
  | 'awaiting-broker-activation'
  | 'payment-pending'
  | 'paid'
  | 'mls-pending'
  | 'active'
  | 'sold'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Listing record
// ---------------------------------------------------------------------------

/** Full flat-fee listing record stored in DynamoDB. */
export interface FlatFeeListing {
  /** UUID v4 listing identifier */
  listingId: string;
  /** Associated lead ID */
  leadId: string;
  /** Full property address */
  propertyAddress: string;
  /** Property details (beds, baths, sqft, etc.) */
  propertyDetails: Record<string, unknown>;
  /** MLS listing description text */
  listingDescription: string;
  /** S3 keys for uploaded listing photos */
  photos: string[];
  /** AI-generated pricing recommendation (optional) */
  pricingRecommendation?: number;
  /** Current listing lifecycle status */
  status: ListingStatus;
  /** Stripe payment intent ID (optional) */
  stripePaymentId?: string;
  /** Admin agent assigned to manage this listing */
  assignedAdminId: string;
  /** MLS number once listed (optional) */
  mlsNumber?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
}
