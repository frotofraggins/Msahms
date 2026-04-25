'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

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

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  async function fetchPerformance() {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.dashboard.performance()) as PerformanceResponse;
      setData(res);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          setError('Admin access required to view performance metrics.');
        } else {
          setError(err.apiError?.message ?? 'Failed to load performance data.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error === 'Admin access required to view performance metrics.') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Performance</h1>
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 p-6">
          <ShieldAlert className="h-6 w-6 text-warning" />
          <div>
            <p className="font-medium text-text">Admin Access Required</p>
            <p className="text-sm text-text-light">
              Only administrators can view performance metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Performance</h1>
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  const summary = data?.summary ?? { totalLeads: 0, totalClosed: 0, conversionRate: 0 };
  const agents = data?.agents ?? [];

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
        <BarChart3 className="h-6 w-6" />
        Performance
      </h1>

      {/* Team summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-paper p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-light">
            <Users className="h-4 w-4" />
            Total Leads
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums text-charcoal">
            {summary.totalLeads}
          </p>
        </div>
        <div className="rounded-xl bg-paper p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-light">
            <Target className="h-4 w-4" />
            Total Closed
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums text-success">
            {summary.totalClosed}
          </p>
        </div>
        <div className="rounded-xl bg-paper p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-light">
            <TrendingUp className="h-4 w-4" />
            Conversion Rate
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
            {summary.conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Per-agent table */}
      <div className="overflow-x-auto rounded-xl bg-paper shadow-sm">
        {agents.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-light">
            No agent metrics available yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-warm-border bg-warm-beige">
              <tr>
                <th className="px-4 py-3 font-medium text-text-light">Agent</th>
                <th className="px-4 py-3 font-medium text-text-light">Total Leads</th>
                <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Closed</th>
                <th className="px-4 py-3 font-medium text-text-light">Conversion</th>
                <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Top Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => {
                const topSource = Object.entries(agent.leadsBySource).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                return (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text">{agent.name}</td>
                    <td className="px-4 py-3 tabular-nums text-text">{agent.totalLeads}</td>
                    <td className="hidden px-4 py-3 tabular-nums text-success sm:table-cell">
                      {agent.closedLeads}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-text">
                      {agent.conversionRate.toFixed(1)}%
                    </td>
                    <td className="hidden px-4 py-3 text-text-light md:table-cell">
                      {topSource ? `${topSource[0]} (${topSource[1]})` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
