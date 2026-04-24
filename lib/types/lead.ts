/**
 * Lead type definitions for the MesaHomes lead capture system.
 *
 * Covers all lead lifecycle states, tool sources, and the full Lead
 * record shape stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Classification of a lead by intent. */
export enum LeadType {
  Buyer = 'Buyer',
  Seller = 'Seller',
  Renter = 'Renter',
  Landlord = 'Landlord',
  Investor = 'Investor',
}

/** Lifecycle state of a lead. */
export enum LeadStatus {
  New = 'New',
  Contacted = 'Contacted',
  Showing = 'Showing',
  Under_Contract = 'Under_Contract',
  Closed = 'Closed',
  Lost = 'Lost',
}

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** How soon the lead intends to act. */
export type Timeframe = 'now' | '30d' | '3mo' | '6mo+';

/** Which consumer tool or entry point generated the lead. */
export type ToolSource =
  | 'net-sheet'
  | 'home-value'
  | 'affordability'
  | 'offer-writer'
  | 'listing-generator'
  | 'comparison'
  | 'first-time-buyer-guide'
  | 'sell-now-or-wait'
  | 'ai-chat'
  | 'direct-consult'
  | 'full-service-request'
  | 'flat-fee-listing'
  | 'relocation-guide';

// ---------------------------------------------------------------------------
// Supporting interfaces
// ---------------------------------------------------------------------------

/** A note attached to a lead by an agent. */
export interface LeadNote {
  agentId: string;
  text: string;
  timestamp: string;
}

/** An entry in the lead's status change history. */
export interface StatusHistoryEntry {
  status: LeadStatus;
  timestamp: string;
  agentId: string;
}

// ---------------------------------------------------------------------------
// Lead record
// ---------------------------------------------------------------------------

/** Full lead record stored in DynamoDB. */
export interface Lead {
  /** UUID v4 lead identifier */
  leadId: string;
  /** Contact name */
  name: string;
  /** Contact email */
  email: string;
  /** Contact phone (US format) */
  phone: string;
  /** City within the Mesa metro service area */
  city: string;
  /** 5-digit ZIP code */
  zip: string;
  /** How soon the lead intends to act */
  timeframe: Timeframe;
  /** Lead classification by intent */
  leadType: LeadType;
  /** Current lifecycle status */
  leadStatus: LeadStatus;
  /** Which tool or entry point generated this lead */
  toolSource: ToolSource;
  /** ISO 8601 creation timestamp */
  createdAt: string;

  // Optional fields ---------------------------------------------------------

  /** Freeform tags for categorization */
  tags?: string[];
  /** Agent assigned to this lead */
  assignedAgentId?: string;
  /** Financing pre-approval status */
  financingStatus?: string;
  /** Desired price range description */
  priceRange?: string;
  /** Tool-specific input/output data snapshot */
  toolData?: Record<string, unknown>;
  /** Ordered list of tools/pages the visitor used */
  pathHistory?: string[];
  /** Engagement-based readiness score (0–100) */
  readinessScore?: number;
  /** UTM source parameter */
  utmSource?: string;
  /** UTM medium parameter */
  utmMedium?: string;
  /** UTM campaign parameter */
  utmCampaign?: string;
  /** Agent notes attached to this lead */
  notes?: LeadNote[];
  /** Status change audit trail */
  statusHistory?: StatusHistoryEntry[];
}
