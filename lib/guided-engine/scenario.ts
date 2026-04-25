/**
 * Save/resume scenario persistence for the MesaHomes guided decision engine.
 *
 * Saves a visitor's guided path progress, tool inputs, and tool results
 * to DynamoDB with a UUID token. Sends an email with a return link so
 * the visitor can resume later. Records expire after 12 months (TTL).
 *
 * When a lead is created, the path history travels to the Lead record
 * per Requirements 48.3 and 48.6.
 */

import { randomUUID } from 'node:crypto';
import type { GuidedPath } from '../types/scenario.js';
import { EntityType } from '../types/dynamodb.js';
import { generateScenarioKeys } from '../models/keys.js';
import { putItem, getItem } from '../dynamodb.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Full state needed to resume a guided path scenario. */
export interface ScenarioState {
  /** UUID v4 resume token. */
  token: string;
  /** Visitor email. */
  email: string;
  /** Which guided path the visitor is on. */
  pathType: GuidedPath;
  /** IDs of completed steps. */
  completedSteps: string[];
  /** Snapshot of tool inputs keyed by step ID. */
  toolInputs: Record<string, Record<string, unknown>>;
  /** Snapshot of tool results keyed by step ID. */
  toolResults: Record<string, Record<string, unknown>>;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** TTL epoch seconds. */
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 12 months in seconds. */
const TTL_SECONDS = 365 * 24 * 60 * 60;

/** Base URL for resume links (overridable via env). */
const BASE_URL = process.env['MESAHOMES_BASE_URL'] ?? 'https://mesahomes.com';

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

/**
 * Save a guided path scenario to DynamoDB and send a resume email.
 *
 * @returns The generated UUID token for the scenario.
 */
export async function saveScenario(
  email: string,
  pathType: GuidedPath,
  completedSteps: string[],
  toolInputs: Record<string, Record<string, unknown>>,
  toolResults: Record<string, Record<string, unknown>>,
): Promise<string> {
  const token = randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  const keys = generateScenarioKeys(token, email, createdAt);

  const item = {
    ...keys,
    entityType: EntityType.SAVED_SCENARIO,
    data: {
      token,
      email,
      pathType,
      completedSteps,
      toolInputs,
      toolResults,
      resumeLink: `${BASE_URL}/resume?token=${token}`,
    },
    ttl: expiresAt,
    createdAt,
  };

  await putItem(item);

  // Email sending is handled by the notification worker Lambda.
  // The putItem triggers a DynamoDB Stream → notification-worker flow.
  // The resume link is included in the item for the worker to pick up.

  return token;
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

/**
 * Load a saved scenario by its resume token.
 *
 * Returns `null` if the token doesn't exist or the record has expired.
 */
export async function loadScenario(token: string): Promise<ScenarioState | null> {
  const keys = generateScenarioKeys(token);
  const item = await getItem(keys.PK, keys.SK);

  if (!item) return null;

  // Check TTL expiration (DynamoDB TTL deletion is eventually consistent)
  const now = Math.floor(Date.now() / 1000);
  if (typeof item.ttl === 'number' && item.ttl < now) {
    return null;
  }

  const data = item.data;

  return {
    token: data['token'] as string,
    email: data['email'] as string,
    pathType: data['pathType'] as GuidedPath,
    completedSteps: (data['completedSteps'] as string[]) ?? [],
    toolInputs: (data['toolInputs'] as Record<string, Record<string, unknown>>) ?? {},
    toolResults: (data['toolResults'] as Record<string, Record<string, unknown>>) ?? {},
    createdAt: item.createdAt ?? '',
    expiresAt: item.ttl ?? 0,
  };
}
