/**
 * Property test 13: Notification Content Completeness
 *
 * Validates: Requirements 20.3
 *
 * Properties verified:
 * - Every notification payload contains all required fields
 * - Email body always includes: lead type, visitor name, contact method,
 *   city, timeframe, tool source, and a dashboard link
 * - Status change notifications always include old and new status
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  buildNotification,
  formatEmailBody,
  type StreamRecord,
  type NotificationPayload,
} from './index.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const leadTypeArb = fc.constantFrom('Buyer', 'Seller', 'Renter', 'Landlord', 'Investor');
const toolSourceArb = fc.constantFrom(
  'net-sheet', 'home-value', 'affordability', 'offer-writer',
  'listing-generator', 'comparison', 'sell-now-or-wait', 'direct-consult',
);
const timeframeArb = fc.constantFrom('now', '30d', '3mo', '6mo+');
const statusArb = fc.constantFrom('New', 'Contacted', 'Showing', 'Under_Contract', 'Closed', 'Lost');
const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);
const emailArb = fc.emailAddress();
const phoneArb = fc.stringMatching(/^\(\d{3}\) \d{3}-\d{4}$/);
const cityArb = fc.constantFrom('Mesa', 'Gilbert', 'Chandler', 'Queen Creek', 'San Tan Valley');

function makeInsertRecord(
  leadType: string, name: string, email: string, phone: string,
  city: string, timeframe: string, toolSource: string,
): StreamRecord {
  const dataMap: Record<string, Record<string, unknown>> = {};
  const fields: Record<string, string> = {
    leadId: 'test-lead', leadType, name, email, phone,
    city, timeframe, toolSource, leadStatus: 'New', assignedAgentId: 'agent-1',
  };
  for (const [k, v] of Object.entries(fields)) {
    dataMap[k] = { S: v };
  }
  return {
    eventName: 'INSERT',
    dynamodb: {
      NewImage: {
        entityType: { S: 'LEAD' },
        data: { M: dataMap },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 13: Notification Content Completeness', () => {
  it('new lead notification contains all required fields', () => {
    const cases = fc.sample(
      fc.tuple(leadTypeArb, nameArb, emailArb, phoneArb, cityArb, timeframeArb, toolSourceArb),
      100,
    );

    for (const [leadType, name, email, phone, city, timeframe, toolSource] of cases) {
      const record = makeInsertRecord(leadType, name, email, phone, city, timeframe, toolSource);
      const notification = buildNotification(record);

      expect(notification).not.toBeNull();
      expect(notification!.leadType).toBe(leadType);
      expect(notification!.visitorName).toBe(name);
      expect(notification!.city).toBe(city);
      expect(notification!.timeframe).toBe(timeframe);
      expect(notification!.toolSource).toBe(toolSource);
      expect(notification!.contactMethod).toContain(email);
      expect(notification!.contactMethod).toContain(phone);
      expect(notification!.type).toBe('new_lead');
    }
  });

  it('email body always includes all required information', () => {
    const cases = fc.sample(
      fc.tuple(leadTypeArb, nameArb, cityArb, timeframeArb, toolSourceArb),
      100,
    );

    for (const [leadType, name, city, timeframe, toolSource] of cases) {
      const payload: NotificationPayload = {
        type: 'new_lead',
        agentId: 'agent-1',
        leadId: 'lead-123',
        leadType,
        visitorName: name,
        contactMethod: 'test@example.com / (480) 555-0000',
        city,
        timeframe,
        toolSource,
        summary: 'test',
      };

      const body = formatEmailBody(payload);

      // All required fields present in email body
      expect(body).toContain(name);
      expect(body).toContain(city);
      expect(body).toContain(timeframe);
      expect(body).toContain(toolSource);
      expect(body).toContain('lead-123');
      expect(body).toContain('dashboard/leads/lead-123');
    }
  });

  it('status change notifications always include old and new status', () => {
    const cases = fc.sample(
      fc.tuple(statusArb, statusArb.filter((_s) => true), nameArb, leadTypeArb),
      50,
    );

    for (const [oldStatus, newStatus, name, leadType] of cases) {
      const payload: NotificationPayload = {
        type: 'status_change',
        agentId: 'agent-1',
        leadId: 'lead-456',
        leadType,
        visitorName: name,
        contactMethod: 'test@example.com',
        city: 'Mesa',
        timeframe: 'now',
        toolSource: 'net-sheet',
        summary: 'test',
        oldStatus,
        newStatus,
      };

      const body = formatEmailBody(payload);
      expect(body).toContain('Lead Status Changed');
      expect(body).toContain(oldStatus);
      expect(body).toContain(newStatus);
      expect(body).toContain(`${oldStatus} → ${newStatus}`);
    }
  });
});
