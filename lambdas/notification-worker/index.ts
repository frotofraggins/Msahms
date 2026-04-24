/**
 * Lambda handler for the MesaHomes notification-worker.
 *
 * Triggered by DynamoDB Streams on the mesahomes-main table.
 * Processes lead assignment and status change events, sending
 * notifications to agents via SES (email) and optionally SMS.
 *
 * Trigger: DynamoDB Streams (NEW_AND_OLD_IMAGES)
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 10s
 */

import { getItem } from '../../lib/dynamodb.js';
import { withRetry, SES_RETRY } from '../../lib/retry.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** DynamoDB Stream record shape (minimal). */
export interface StreamRecord {
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE';
  dynamodb: {
    NewImage?: Record<string, { S?: string; N?: string; M?: Record<string, unknown> }>;
    OldImage?: Record<string, { S?: string; N?: string; M?: Record<string, unknown> }>;
  };
}

/** DynamoDB Streams event shape. */
interface DynamoDBStreamEvent {
  Records: StreamRecord[];
}

/** Notification payload for an agent. */
export interface NotificationPayload {
  type: 'new_lead' | 'status_change';
  agentId: string;
  agentEmail?: string;
  leadId: string;
  leadType: string;
  visitorName: string;
  contactMethod: string;
  city: string;
  timeframe: string;
  toolSource: string;
  summary: string;
  oldStatus?: string;
  newStatus?: string;
}

/** Result of processing a single stream record. */
export interface ProcessResult {
  processed: boolean;
  notification?: NotificationPayload;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum required fields for a valid notification. */
const REQUIRED_NOTIFICATION_FIELDS = [
  'leadType', 'name', 'city', 'timeframe', 'toolSource',
] as const;

// ---------------------------------------------------------------------------
// Stream record processing
// ---------------------------------------------------------------------------

/**
 * Extract a string value from a DynamoDB Stream attribute map.
 */
function getAttr(
  image: Record<string, { S?: string; N?: string; M?: Record<string, unknown> }> | undefined,
  key: string,
): string | undefined {
  if (!image) return undefined;
  return image[key]?.S;
}

/**
 * Extract the data map from a DynamoDB Stream image.
 * The `data` attribute is stored as a Map (M) type.
 */
function getDataMap(
  image: Record<string, { S?: string; N?: string; M?: Record<string, unknown> }> | undefined,
): Record<string, unknown> | undefined {
  if (!image?.data?.M) return undefined;
  // Flatten the DynamoDB attribute map to plain values
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(image.data.M as Record<string, Record<string, unknown>>)) {
    if ('S' in val) result[key] = val.S;
    else if ('N' in val) result[key] = Number(val.N);
    else if ('BOOL' in val) result[key] = val.BOOL;
    else result[key] = val;
  }
  return result;
}

/**
 * Determine if a stream record represents a lead event we should notify on.
 *
 * We notify on:
 * 1. New lead creation (INSERT with entityType=LEAD)
 * 2. Lead status change (MODIFY with entityType=LEAD and status changed)
 */
export function shouldNotify(record: StreamRecord): boolean {
  const newImage = record.dynamodb.NewImage;
  if (!newImage) return false;

  const entityType = getAttr(newImage, 'entityType');
  if (entityType !== 'LEAD') return false;

  if (record.eventName === 'INSERT') return true;

  if (record.eventName === 'MODIFY') {
    const oldData = getDataMap(record.dynamodb.OldImage);
    const newData = getDataMap(newImage);
    if (!oldData || !newData) return false;
    return oldData.leadStatus !== newData.leadStatus;
  }

  return false;
}

/**
 * Build a notification payload from a stream record.
 */
export function buildNotification(record: StreamRecord): NotificationPayload | null {
  const newImage = record.dynamodb.NewImage;
  if (!newImage) return null;

  const data = getDataMap(newImage);
  if (!data) return null;

  const leadId = (data.leadId as string) || '';
  const leadType = (data.leadType as string) || 'Unknown';
  const visitorName = (data.name as string) || 'Unknown';
  const email = (data.email as string) || '';
  const phone = (data.phone as string) || '';
  const city = (data.city as string) || '';
  const timeframe = (data.timeframe as string) || '';
  const toolSource = (data.toolSource as string) || '';
  const assignedAgentId = (data.assignedAgentId as string) || '';

  // Determine contact method
  const contactMethod = email && phone ? `${email} / ${phone}` : email || phone || 'none';

  // Build summary
  const summary = `${leadType} lead from ${toolSource} tool — ${visitorName} in ${city}, timeframe: ${timeframe}`;

  const isStatusChange = record.eventName === 'MODIFY';
  let oldStatus: string | undefined;
  let newStatus: string | undefined;

  if (isStatusChange) {
    const oldData = getDataMap(record.dynamodb.OldImage);
    oldStatus = (oldData?.leadStatus as string) || undefined;
    newStatus = (data.leadStatus as string) || undefined;
  }

  return {
    type: isStatusChange ? 'status_change' : 'new_lead',
    agentId: assignedAgentId,
    leadId,
    leadType,
    visitorName,
    contactMethod,
    city,
    timeframe,
    toolSource,
    summary,
    oldStatus,
    newStatus,
  };
}

/**
 * Format an email body for a notification.
 */
export function formatEmailBody(payload: NotificationPayload): string {
  if (payload.type === 'new_lead') {
    return [
      `New ${payload.leadType} Lead`,
      ``,
      `Name: ${payload.visitorName}`,
      `Contact: ${payload.contactMethod}`,
      `City: ${payload.city}`,
      `Timeframe: ${payload.timeframe}`,
      `Source: ${payload.toolSource}`,
      ``,
      `Lead ID: ${payload.leadId}`,
      ``,
      `View in dashboard: https://mesahomes.com/dashboard/leads/${payload.leadId}`,
    ].join('\n');
  }

  return [
    `Lead Status Changed`,
    ``,
    `Lead: ${payload.visitorName} (${payload.leadType})`,
    `Status: ${payload.oldStatus} → ${payload.newStatus}`,
    `City: ${payload.city}`,
    ``,
    `Lead ID: ${payload.leadId}`,
    ``,
    `View in dashboard: https://mesahomes.com/dashboard/leads/${payload.leadId}`,
  ].join('\n');
}

/**
 * Send notification via SES (mock for MVP — logs instead of sending).
 *
 * In production, this would use @aws-sdk/client-ses to send email
 * and optionally SNS for SMS.
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<void> {
  // Look up agent's notification preferences
  let prefs: Record<string, unknown> | undefined;
  try {
    const prefsItem = await getItem(`AGENT#${payload.agentId}`, 'NOTIF_PREFS');
    prefs = prefsItem?.data as Record<string, unknown> | undefined;
  } catch {
    // Default to email if prefs lookup fails
  }

  const emailPref = payload.type === 'new_lead'
    ? (prefs?.newLead as string) ?? 'email'
    : (prefs?.statusChange as string) ?? 'email';

  if (emailPref === 'none') return;

  const emailBody = formatEmailBody(payload);

  // MVP: log the notification. Production: SES send with retry.
  console.log(`[notification-worker] Sending ${payload.type} notification to agent ${payload.agentId}`);
  console.log(`[notification-worker] Email body:\n${emailBody}`);

  if (emailPref === 'email-sms') {
    console.log(`[notification-worker] SMS would also be sent to agent ${payload.agentId}`);
  }
}

/**
 * Process a single DynamoDB Stream record.
 */
export async function processRecord(record: StreamRecord): Promise<ProcessResult> {
  try {
    if (!shouldNotify(record)) {
      return { processed: false };
    }

    const notification = buildNotification(record);
    if (!notification) {
      return { processed: false, error: 'Failed to build notification payload' };
    }

    await withRetry(() => sendNotification(notification), SES_RETRY);

    return { processed: true, notification };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[notification-worker] Error processing record:`, message);
    return { processed: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the notification-worker function.
 *
 * Processes DynamoDB Stream events for lead notifications.
 */
export async function handler(event: DynamoDBStreamEvent): Promise<{
  processed: number;
  errors: number;
}> {
  let processed = 0;
  let errors = 0;

  for (const record of event.Records) {
    const result = await processRecord(record);
    if (result.processed) {
      processed++;
    }
    if (result.error) {
      errors++;
    }
  }

  console.log(`[notification-worker] Processed ${processed} notifications, ${errors} errors out of ${event.Records.length} records`);

  return { processed, errors };
}
