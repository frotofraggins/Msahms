/**
 * Saved scenario type definitions for the MesaHomes guided decision engine.
 *
 * Covers guided path types, progress tracking, and the full SavedScenario
 * record shape stored in the mesahomes-main DynamoDB table.
 */

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

/** Guided decision path type. */
export type GuidedPath = 'seller' | 'buyer' | 'landlord' | 'investor';

// ---------------------------------------------------------------------------
// Supporting interfaces
// ---------------------------------------------------------------------------

/** Progress state within a guided decision path. */
export interface PathProgress {
  /** Which guided path the visitor is on */
  currentPath: GuidedPath;
  /** Steps the visitor has completed */
  completedSteps: string[];
  /** Step the visitor is currently on */
  currentStep: string;
}

// ---------------------------------------------------------------------------
// Scenario record
// ---------------------------------------------------------------------------

/** Saved scenario record stored in DynamoDB. */
export interface SavedScenario {
  /** UUID v4 token for resuming the scenario */
  token: string;
  /** Visitor email address */
  email: string;
  /** Which tool generated this scenario */
  toolType: string;
  /** Tool input data snapshot */
  inputs: Record<string, unknown>;
  /** Tool result data snapshot */
  results: Record<string, unknown>;
  /** Guided path progress state */
  pathProgress: PathProgress;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** TTL epoch seconds (12 months from creation) */
  expiresAt: number;
}
