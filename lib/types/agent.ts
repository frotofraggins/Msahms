/**
 * Agent type definitions for the MesaHomes agent management system.
 *
 * Covers agent roles, statuses, specialties, notification preferences,
 * and the full Agent record shape stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** Agent role within the team. */
export type AgentRole = 'Agent' | 'Team_Admin';

/** Agent account lifecycle status. */
export type AgentStatus = 'active' | 'pending' | 'deactivated';

/** Agent area of specialization. */
export type AgentSpecialty =
  | 'buyer'
  | 'seller'
  | 'new-construction'
  | 'investment'
  | 'property-management';

/** How the agent wants to receive notifications. */
export type NotificationPreference = 'email' | 'email-sms' | 'none';

// ---------------------------------------------------------------------------
// Supporting interfaces
// ---------------------------------------------------------------------------

/** Agent production / performance metrics. */
export interface ProductionData {
  transactionsClosed: number;
  volume: number;
}

/** Per-event notification preference settings. */
export interface NotificationPrefs {
  newLead: NotificationPreference;
  statusChange: NotificationPreference;
}

// ---------------------------------------------------------------------------
// Agent record
// ---------------------------------------------------------------------------

/** Full agent record stored in DynamoDB. */
export interface Agent {
  /** UUID v4 agent identifier */
  agentId: string;
  /** Cognito user pool subject identifier */
  cognitoSub: string;
  /** Agent display name */
  name: string;
  /** Agent email address */
  email: string;
  /** Agent phone number (US format) */
  phone: string;
  /** Profile photo URL (optional) */
  photoUrl?: string;
  /** Agent biography (optional) */
  bio?: string;
  /** Role within the team */
  role: AgentRole;
  /** Account lifecycle status */
  status: AgentStatus;
  /** Team the agent belongs to */
  teamId: string;
  /** Areas of specialization */
  specialties: AgentSpecialty[];
  /** Cities the agent is assigned to cover */
  assignedCities: string[];
  /** ZIP codes the agent is assigned to cover */
  assignedZips: string[];
  /** Production / performance metrics */
  productionData: ProductionData;
  /** Notification preference settings */
  notificationPrefs: NotificationPrefs;
}
