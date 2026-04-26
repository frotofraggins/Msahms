/**
 * Tests for the notification-worker Lambda handler.
 *
 * Covers stream record filtering, notification building,
 * email formatting, and end-to-end handler processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handler,
  shouldNotify,
  buildNotification,
  formatEmailBody,
  buildSubject,
  htmlEscape,
  processRecord,
  type StreamRecord,
  type NotificationPayload,
} from './index.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/dynamodb.js', () => ({
  getItem: vi.fn(),
}));

vi.mock('../../lib/retry.js', () => ({
  withRetry: vi.fn((fn: () => unknown) => fn()),
  SES_RETRY: { maxRetries: 3, baseDelayMs: 1000, strategy: 'exponential' },
}));

const { mockSend } = vi.hoisted(() => {
  const mockSend = vi.fn().mockResolvedValue({});
  return { mockSend };
});

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: vi.fn(() => ({ send: mockSend })),
  SendEmailCommand: vi.fn((params: unknown) => params),
}));

import { getItem } from '../../lib/dynamodb.js';
const mockGetItem = vi.mocked(getItem);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLeadInsertRecord(data: Record<string, string> = {}): StreamRecord {
  const defaults: Record<string, string> = {
    leadId: 'lead-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '(480) 555-1234',
    city: 'Mesa',
    timeframe: 'now',
    leadType: 'Seller',
    toolSource: 'net-sheet',
    leadStatus: 'New',
    assignedAgentId: 'agent-1',
    ...data,
  };

  const dataMap: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(defaults)) {
    dataMap[k] = { S: v };
  }

  return {
    eventName: 'INSERT',
    dynamodb: {
      NewImage: {
        PK: { S: `LEAD#${defaults.leadId}` },
        SK: { S: `LEAD#${defaults.leadId}` },
        entityType: { S: 'LEAD' },
        data: { M: dataMap },
      },
    },
  };
}

function makeLeadModifyRecord(
  oldStatus: string,
  newStatus: string,
  data: Record<string, string> = {},
): StreamRecord {
  const defaults: Record<string, string> = {
    leadId: 'lead-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '(480) 555-1234',
    city: 'Mesa',
    timeframe: 'now',
    leadType: 'Seller',
    toolSource: 'net-sheet',
    assignedAgentId: 'agent-1',
    ...data,
  };

  const makeDataMap = (status: string) => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries({ ...defaults, leadStatus: status })) {
      map[k] = { S: v };
    }
    return map;
  };

  return {
    eventName: 'MODIFY',
    dynamodb: {
      OldImage: {
        PK: { S: `LEAD#${defaults.leadId}` },
        SK: { S: `LEAD#${defaults.leadId}` },
        entityType: { S: 'LEAD' },
        data: { M: makeDataMap(oldStatus) },
      },
      NewImage: {
        PK: { S: `LEAD#${defaults.leadId}` },
        SK: { S: `LEAD#${defaults.leadId}` },
        entityType: { S: 'LEAD' },
        data: { M: makeDataMap(newStatus) },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// shouldNotify tests
// ---------------------------------------------------------------------------

describe('shouldNotify', () => {
  it('should return true for new lead INSERT', () => {
    expect(shouldNotify(makeLeadInsertRecord())).toBe(true);
  });

  it('should return true for lead status change MODIFY', () => {
    expect(shouldNotify(makeLeadModifyRecord('New', 'Contacted'))).toBe(true);
  });

  it('should return false for non-LEAD entity', () => {
    const record = makeLeadInsertRecord();
    record.dynamodb.NewImage!.entityType = { S: 'AGENT' };
    expect(shouldNotify(record)).toBe(false);
  });

  it('should return false for MODIFY with same status', () => {
    expect(shouldNotify(makeLeadModifyRecord('New', 'New'))).toBe(false);
  });

  it('should return false for REMOVE events', () => {
    const record: StreamRecord = {
      eventName: 'REMOVE',
      dynamodb: { OldImage: { entityType: { S: 'LEAD' } } },
    };
    expect(shouldNotify(record)).toBe(false);
  });

  it('should return false when NewImage is missing', () => {
    const record: StreamRecord = { eventName: 'INSERT', dynamodb: {} };
    expect(shouldNotify(record)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildNotification tests
// ---------------------------------------------------------------------------

describe('buildNotification', () => {
  it('should build new_lead notification from INSERT', () => {
    const result = buildNotification(makeLeadInsertRecord());
    expect(result).not.toBeNull();
    expect(result!.type).toBe('new_lead');
    expect(result!.leadType).toBe('Seller');
    expect(result!.visitorName).toBe('Jane Doe');
    expect(result!.contactMethod).toContain('jane@example.com');
    expect(result!.contactMethod).toContain('(480) 555-1234');
    expect(result!.city).toBe('Mesa');
    expect(result!.timeframe).toBe('now');
    expect(result!.toolSource).toBe('net-sheet');
    expect(result!.agentId).toBe('agent-1');
  });

  it('should build status_change notification from MODIFY', () => {
    const result = buildNotification(makeLeadModifyRecord('New', 'Contacted'));
    expect(result).not.toBeNull();
    expect(result!.type).toBe('status_change');
    expect(result!.oldStatus).toBe('New');
    expect(result!.newStatus).toBe('Contacted');
  });

  it('should return null when NewImage is missing', () => {
    const record: StreamRecord = { eventName: 'INSERT', dynamodb: {} };
    expect(buildNotification(record)).toBeNull();
  });

  it('should handle missing optional fields gracefully', () => {
    const record = makeLeadInsertRecord({ email: '', phone: '' });
    const result = buildNotification(record);
    expect(result).not.toBeNull();
    expect(result!.contactMethod).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// formatEmailBody tests
// ---------------------------------------------------------------------------

describe('formatEmailBody', () => {
  it('should format new lead email', () => {
    const payload: NotificationPayload = {
      type: 'new_lead',
      agentId: 'agent-1',
      leadId: 'lead-1',
      leadType: 'Buyer',
      visitorName: 'John Smith',
      contactMethod: 'john@example.com / (480) 555-9999',
      city: 'Gilbert',
      timeframe: '30d',
      toolSource: 'affordability',
      summary: 'test',
    };

    const body = formatEmailBody(payload);
    expect(body).toContain('New Buyer Lead');
    expect(body).toContain('John Smith');
    expect(body).toContain('john@example.com');
    expect(body).toContain('Gilbert');
    expect(body).toContain('30d');
    expect(body).toContain('affordability');
    expect(body).toContain('lead-1');
    expect(body).toContain('dashboard/leads/lead-1');
  });

  it('should format status change email', () => {
    const payload: NotificationPayload = {
      type: 'status_change',
      agentId: 'agent-1',
      leadId: 'lead-2',
      leadType: 'Seller',
      visitorName: 'Jane Doe',
      contactMethod: 'jane@example.com',
      city: 'Mesa',
      timeframe: 'now',
      toolSource: 'net-sheet',
      summary: 'test',
      oldStatus: 'New',
      newStatus: 'Contacted',
    };

    const body = formatEmailBody(payload);
    expect(body).toContain('Lead Status Changed');
    expect(body).toContain('New → Contacted');
    expect(body).toContain('Jane Doe');
  });
});

// ---------------------------------------------------------------------------
// processRecord tests
// ---------------------------------------------------------------------------

describe('processRecord', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should process a new lead notification', async () => {
    mockGetItem.mockResolvedValue(undefined); // No prefs
    const result = await processRecord(makeLeadInsertRecord());
    expect(result.processed).toBe(true);
    expect(result.notification).toBeDefined();
    expect(result.notification!.type).toBe('new_lead');
  });

  it('should skip non-lead records', async () => {
    const record = makeLeadInsertRecord();
    record.dynamodb.NewImage!.entityType = { S: 'MARKET' };
    const result = await processRecord(record);
    expect(result.processed).toBe(false);
  });

  it('should process status change notification', async () => {
    mockGetItem.mockResolvedValue(undefined);
    const result = await processRecord(makeLeadModifyRecord('New', 'Contacted'));
    expect(result.processed).toBe(true);
    expect(result.notification!.type).toBe('status_change');
  });
});

// ---------------------------------------------------------------------------
// handler tests
// ---------------------------------------------------------------------------

describe('handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should process multiple records', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await handler({
      Records: [
        makeLeadInsertRecord(),
        makeLeadModifyRecord('New', 'Contacted'),
      ],
    });

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
  });

  it('should count non-lead records as not processed', async () => {
    const nonLeadRecord = makeLeadInsertRecord();
    nonLeadRecord.dynamodb.NewImage!.entityType = { S: 'AGENT' };

    const result = await handler({
      Records: [nonLeadRecord],
    });

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('should handle empty Records array', async () => {
    const result = await handler({ Records: [] });
    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
  });
});


// ---------------------------------------------------------------------------
// buildSubject tests
// ---------------------------------------------------------------------------

describe('buildSubject', () => {
  it('should build new_lead subject with visitor name', () => {
    const payload: NotificationPayload = {
      type: 'new_lead',
      agentId: 'agent-1',
      leadId: 'lead-1',
      leadType: 'Seller',
      visitorName: 'Jane Doe',
      contactMethod: 'jane@example.com',
      city: 'Mesa',
      timeframe: 'now',
      toolSource: 'net-sheet',
      summary: 'test',
    };
    expect(buildSubject(payload)).toBe('New MesaHomes Lead: Jane Doe');
  });

  it('should build status_change subject with visitor name', () => {
    const payload: NotificationPayload = {
      type: 'status_change',
      agentId: 'agent-1',
      leadId: 'lead-1',
      leadType: 'Buyer',
      visitorName: 'John Smith',
      contactMethod: 'john@example.com',
      city: 'Gilbert',
      timeframe: '30d',
      toolSource: 'affordability',
      summary: 'test',
      oldStatus: 'New',
      newStatus: 'Contacted',
    };
    expect(buildSubject(payload)).toBe('Lead Status Updated: John Smith');
  });

  it('should fall back to Unknown for empty visitor name on new_lead', () => {
    const payload: NotificationPayload = {
      type: 'new_lead',
      agentId: 'agent-1',
      leadId: 'lead-1',
      leadType: 'Seller',
      visitorName: '',
      contactMethod: 'none',
      city: 'Mesa',
      timeframe: 'now',
      toolSource: 'net-sheet',
      summary: 'test',
    };
    expect(buildSubject(payload)).toBe('New MesaHomes Lead: Unknown');
  });
});

// ---------------------------------------------------------------------------
// htmlEscape tests
// ---------------------------------------------------------------------------

describe('htmlEscape', () => {
  it('should escape ampersands', () => {
    expect(htmlEscape('A & B')).toBe('A &amp; B');
  });

  it('should escape angle brackets', () => {
    expect(htmlEscape('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;',
    );
  });

  it('should handle strings with no special characters', () => {
    expect(htmlEscape('Hello World')).toBe('Hello World');
  });
});

// ---------------------------------------------------------------------------
// SES send tests
// ---------------------------------------------------------------------------

describe('SES email sending', () => {
  const originalFrom = process.env['NOTIFICATION_FROM_ADDRESS'];
  const originalTo = process.env['OWNER_NOTIFICATION_ADDRESS'];
  const originalReplyTo = process.env['NOTIFICATION_REPLY_TO'];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env['NOTIFICATION_FROM_ADDRESS'] = 'notifications@mesahomes.com';
    process.env['OWNER_NOTIFICATION_ADDRESS'] = 'sales@mesahomes.com';
    process.env['NOTIFICATION_REPLY_TO'] = 'sales@mesahomes.com';
  });

  afterEach(() => {
    if (originalFrom === undefined) delete process.env['NOTIFICATION_FROM_ADDRESS'];
    else process.env['NOTIFICATION_FROM_ADDRESS'] = originalFrom;
    if (originalTo === undefined) delete process.env['OWNER_NOTIFICATION_ADDRESS'];
    else process.env['OWNER_NOTIFICATION_ADDRESS'] = originalTo;
    if (originalReplyTo === undefined) delete process.env['NOTIFICATION_REPLY_TO'];
    else process.env['NOTIFICATION_REPLY_TO'] = originalReplyTo;
  });

  it('should call SES SendEmailCommand for new lead notification', async () => {
    mockGetItem.mockResolvedValue(undefined);

    const result = await processRecord(makeLeadInsertRecord());
    expect(result.processed).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const sentCommand = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(sentCommand.FromEmailAddress).toBe('notifications@mesahomes.com');
    expect(sentCommand.Destination).toEqual({ ToAddresses: ['sales@mesahomes.com'] });
    expect(sentCommand.ReplyToAddresses).toEqual(['sales@mesahomes.com']);
  });

  it('should include correct subject for new_lead', async () => {
    mockGetItem.mockResolvedValue(undefined);

    await processRecord(makeLeadInsertRecord());

    const sentCommand = mockSend.mock.calls[0][0] as Record<string, unknown>;
    const content = sentCommand.Content as Record<string, unknown>;
    const simple = content.Simple as Record<string, unknown>;
    const subject = simple.Subject as Record<string, unknown>;
    expect(subject.Data).toBe('New MesaHomes Lead: Jane Doe');
  });

  it('should include text and HTML body', async () => {
    mockGetItem.mockResolvedValue(undefined);

    await processRecord(makeLeadInsertRecord());

    const sentCommand = mockSend.mock.calls[0][0] as Record<string, unknown>;
    const content = sentCommand.Content as Record<string, unknown>;
    const simple = content.Simple as Record<string, unknown>;
    const body = simple.Body as Record<string, unknown>;
    const text = body.Text as Record<string, unknown>;
    const html = body.Html as Record<string, unknown>;
    expect(text.Data).toContain('Jane Doe');
    expect(html.Data).toContain('Jane Doe');
    expect(html.Data).toContain('<br>');
  });

  it('should NOT call SES when email preference is none', async () => {
    mockGetItem.mockResolvedValue({
      PK: 'AGENT#agent-1',
      SK: 'NOTIF_PREFS',
      data: { newLead: 'none' },
    });

    await processRecord(makeLeadInsertRecord());
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should use custom OWNER_NOTIFICATION_ADDRESS', async () => {
    process.env['OWNER_NOTIFICATION_ADDRESS'] = 'custom@mesahomes.com';
    mockGetItem.mockResolvedValue(undefined);

    await processRecord(makeLeadInsertRecord());

    const sentCommand = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(sentCommand.Destination).toEqual({ ToAddresses: ['custom@mesahomes.com'] });
  });
});
