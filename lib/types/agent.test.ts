import { describe, it, expect } from 'vitest';
import type {
  Agent,
  AgentRole,
  AgentStatus,
  AgentSpecialty,
  NotificationPreference,
} from './agent.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A valid agent record for testing. */
function validAgent(overrides?: Partial<Agent>): Agent {
  return {
    agentId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    cognitoSub: 'us-west-2_abc123|sub-xyz',
    name: 'Jane Smith',
    email: 'jane@mesahomes.com',
    phone: '4805551234',
    role: 'Agent',
    status: 'active',
    teamId: 'team-mesa-01',
    specialties: ['buyer', 'seller'],
    assignedCities: ['Mesa', 'Gilbert'],
    assignedZips: ['85201', '85233'],
    productionData: { transactionsClosed: 12, volume: 4800000 },
    notificationPrefs: { newLead: 'email-sms', statusChange: 'email' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Agent interface shape
// ---------------------------------------------------------------------------

describe('Agent interface', () => {
  it('should accept a valid agent with all required fields', () => {
    const agent = validAgent();
    expect(agent.agentId).toBeDefined();
    expect(agent.name).toBe('Jane Smith');
    expect(agent.role).toBe('Agent');
    expect(agent.status).toBe('active');
  });

  it('should accept optional photoUrl and bio fields', () => {
    const agent = validAgent({
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Experienced Mesa real estate agent.',
    });
    expect(agent.photoUrl).toBe('https://example.com/photo.jpg');
    expect(agent.bio).toBe('Experienced Mesa real estate agent.');
  });

  it('should allow photoUrl and bio to be undefined', () => {
    const agent = validAgent();
    expect(agent.photoUrl).toBeUndefined();
    expect(agent.bio).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AgentRole type values
// ---------------------------------------------------------------------------

describe('AgentRole values', () => {
  it('should accept Agent role', () => {
    const role: AgentRole = 'Agent';
    expect(role).toBe('Agent');
  });

  it('should accept Team_Admin role', () => {
    const role: AgentRole = 'Team_Admin';
    expect(role).toBe('Team_Admin');
  });
});

// ---------------------------------------------------------------------------
// AgentStatus type values
// ---------------------------------------------------------------------------

describe('AgentStatus values', () => {
  const validStatuses: AgentStatus[] = ['active', 'pending', 'deactivated'];

  it.each(validStatuses)('should accept "%s" as a valid status', (status) => {
    const agent = validAgent({ status });
    expect(agent.status).toBe(status);
  });
});

// ---------------------------------------------------------------------------
// AgentSpecialty type values
// ---------------------------------------------------------------------------

describe('AgentSpecialty values', () => {
  const validSpecialties: AgentSpecialty[] = [
    'buyer',
    'seller',
    'new-construction',
    'investment',
    'property-management',
  ];

  it.each(validSpecialties)('should accept "%s" as a valid specialty', (specialty) => {
    const agent = validAgent({ specialties: [specialty] });
    expect(agent.specialties).toContain(specialty);
  });

  it('should accept multiple specialties', () => {
    const agent = validAgent({ specialties: ['buyer', 'investment', 'property-management'] });
    expect(agent.specialties).toHaveLength(3);
  });

  it('should accept an empty specialties array', () => {
    const agent = validAgent({ specialties: [] });
    expect(agent.specialties).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// NotificationPreference type values
// ---------------------------------------------------------------------------

describe('NotificationPreference values', () => {
  const validPrefs: NotificationPreference[] = ['email', 'email-sms', 'none'];

  it.each(validPrefs)('should accept "%s" as a valid notification preference', (pref) => {
    const agent = validAgent({
      notificationPrefs: { newLead: pref, statusChange: pref },
    });
    expect(agent.notificationPrefs.newLead).toBe(pref);
    expect(agent.notificationPrefs.statusChange).toBe(pref);
  });
});

// ---------------------------------------------------------------------------
// ProductionData
// ---------------------------------------------------------------------------

describe('ProductionData', () => {
  it('should accept zero values for new agents', () => {
    const agent = validAgent({
      productionData: { transactionsClosed: 0, volume: 0 },
    });
    expect(agent.productionData.transactionsClosed).toBe(0);
    expect(agent.productionData.volume).toBe(0);
  });

  it('should accept positive production values', () => {
    const agent = validAgent({
      productionData: { transactionsClosed: 50, volume: 25000000 },
    });
    expect(agent.productionData.transactionsClosed).toBe(50);
    expect(agent.productionData.volume).toBe(25000000);
  });
});
