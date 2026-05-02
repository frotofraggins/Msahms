/**
 * Lambda handler for the MesaHomes dashboard performance service.
 *
 * Reads all leads, aggregates by assigned agent, computes conversion
 * metrics, returns the shape expected by the frontend Performance
 * page.
 *
 * Routes:
 *   GET /api/v1/dashboard/performance → Agent metrics (admin only)
 *
 * Runtime: Node.js 20 | Memory: 256 MB | Timeout: 10s
 */

import {
  AppError,
  ErrorCode,
  toLambdaResponse,
  generateCorrelationId,
  type LambdaProxyResponse,
} from '../../lib/errors.js';
import {
  extractClaims,
  requirePermission,
  type AuthorizedEvent,
} from '../../lib/authorizer.js';
import { queryGSI1 } from '../../lib/dynamodb.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
} as const;

interface AgentMetric {
  id: string;
  name: string;
  totalLeads: number;
  closedLeads: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
}

interface PerformanceResponse {
  agents: AgentMetric[];
  summary: {
    totalLeads: number;
    totalClosed: number;
    conversionRate: number;
  };
}

interface LeadRecord {
  PK: string;
  SK: string;
  data?: {
    name?: string;
    email?: string;
    status?: string;
    toolSource?: string;
    assignedAgentId?: string;
    assignedAgentName?: string;
  };
}

export async function handler(event: AuthorizedEvent): Promise<LambdaProxyResponse> {
  const correlationId = generateCorrelationId();

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    const claims = extractClaims(event, correlationId);
    requirePermission(claims, 'view_team_performance', correlationId);

    // Gather leads across the whole team. Pattern matches dashboard-leads:
    //   TEAM#{teamId} -> agent list
    //   AGENT#{agentId} -> leads assigned to each agent
    //   AGENT#UNASSIGNED -> unassigned leads
    const allLeads: LeadRecord[] = [];
    const agentNameById = new Map<string, string>();

    const teamResult = await queryGSI1(`TEAM#${claims.teamId}`);
    const agentIds: string[] = [];
    for (const a of teamResult.items) {
      const d = a.data as Record<string, unknown> | undefined;
      const id = d?.['agentId'] as string | undefined;
      const name = d?.['name'] as string | undefined;
      if (id) {
        agentIds.push(id);
        agentNameById.set(id, name ?? id);
      }
    }

    for (const agentId of agentIds) {
      const leads = await queryGSI1(`AGENT#${agentId}`, {
        skCondition: { operator: 'begins_with', value: 'LEAD#' },
        limit: 500,
      });
      allLeads.push(...(leads.items as unknown as LeadRecord[]));
    }
    const unassigned = await queryGSI1('AGENT#UNASSIGNED', {
      skCondition: { operator: 'begins_with', value: 'LEAD#' },
      limit: 500,
    });
    allLeads.push(...(unassigned.items as unknown as LeadRecord[]));

    // Aggregate by assigned agent. Unassigned leads go under 'unassigned'.
    const byAgent = new Map<string, AgentMetric>();
    let totalLeads = 0;
    let totalClosed = 0;

    for (const lead of allLeads) {
      const d = lead.data ?? {};
      const agentId = d.assignedAgentId ?? 'unassigned';
      const agentName = d.assignedAgentName ?? agentNameById.get(agentId) ?? (agentId === 'unassigned' ? 'Unassigned' : agentId);
      const status = (d.status ?? 'new').toLowerCase();
      const source = d.toolSource ?? 'unknown';

      if (!byAgent.has(agentId)) {
        byAgent.set(agentId, {
          id: agentId,
          name: agentName,
          totalLeads: 0,
          closedLeads: 0,
          conversionRate: 0,
          leadsBySource: {},
        });
      }
      const metric = byAgent.get(agentId)!;
      metric.totalLeads += 1;
      if (status === 'closed-won' || status === 'won' || status === 'closed') {
        metric.closedLeads += 1;
        totalClosed += 1;
      }
      metric.leadsBySource[source] = (metric.leadsBySource[source] ?? 0) + 1;
      totalLeads += 1;
    }

    // Compute conversion rates.
    for (const m of byAgent.values()) {
      m.conversionRate = m.totalLeads > 0 ? m.closedLeads / m.totalLeads : 0;
    }

    const response: PerformanceResponse = {
      agents: Array.from(byAgent.values()).sort(
        (a, b) => b.totalLeads - a.totalLeads,
      ),
      summary: {
        totalLeads,
        totalClosed,
        conversionRate: totalLeads > 0 ? totalClosed / totalLeads : 0,
      },
    };

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (err) {
    if (err instanceof AppError) return toLambdaResponse(err);
    console.error('[dashboard-performance] unexpected:', err);
    return toLambdaResponse(
      new AppError(ErrorCode.STORAGE_ERROR, 'Internal error', correlationId),
    );
  }
}
