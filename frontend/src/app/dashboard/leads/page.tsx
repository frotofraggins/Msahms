'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Phone,
  Eye,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

interface Lead {
  leadId: string;
  name: string;
  email: string;
  leadType: string;
  toolSource: string;
  timeframe: string;
  leadStatus: string;
  createdAt: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Users }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: Users },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700', icon: Phone },
  showing: { label: 'Showing', color: 'bg-purple-100 text-purple-700', icon: Eye },
  under_contract: { label: 'Under Contract', color: 'bg-orange-100 text-orange-700', icon: FileText },
  closed: { label: 'Closed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const statusOptions = ['all', 'new', 'contacted', 'showing', 'under_contract', 'closed'];
const typeOptions = ['all', 'Buyer', 'Seller', 'Investor', 'Renter'];
const sourceOptions = [
  'all',
  'net-sheet',
  'affordability',
  'home-value',
  'listing-generator',
  'sell-now-or-wait',
  'offer-writer',
  'direct-consult',
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortNewest, setSortNewest] = useState(true);

  // Status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    new: 0,
    contacted: 0,
    showing: 0,
    under_contract: 0,
    closed: 0,
  });

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, sourceFilter, sortNewest]);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.leads()) as LeadsResponse;
      let filtered = data.leads ?? [];

      // Client-side filtering
      if (statusFilter !== 'all') {
        filtered = filtered.filter((l) => l.leadStatus === statusFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter((l) => l.leadType === typeFilter);
      }
      if (sourceFilter !== 'all') {
        filtered = filtered.filter((l) => l.toolSource === sourceFilter);
      }

      // Sort
      filtered.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sortNewest ? db - da : da - db;
      });

      // Count statuses from full dataset
      const counts: Record<string, number> = {
        new: 0,
        contacted: 0,
        showing: 0,
        under_contract: 0,
        closed: 0,
      };
      for (const lead of data.leads ?? []) {
        if (counts[lead.leadStatus] !== undefined) {
          counts[lead.leadStatus]++;
        }
      }
      setStatusCounts(counts);

      setTotal(filtered.length);
      const start = (page - 1) * pageSize;
      setLeads(filtered.slice(start, start + pageSize));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Failed to load leads.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Leads</h1>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className="rounded-xl bg-paper p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-text-light" />
                <span className="text-xs font-medium text-text-light">{cfg.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-text">
                {statusCounts[key] ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Filter by status"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : statusConfig[s]?.label ?? s}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Filter by type"
        >
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : t}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Filter by source"
        >
          {sourceOptions.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Sources' : s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortNewest(!sortNewest)}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-text-light hover:bg-gray-50"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortNewest ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-paper shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-light">
            No leads found matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-warm-border bg-warm-beige">
              <tr>
                <th className="px-4 py-3 font-medium text-text-light">Name</th>
                <th className="px-4 py-3 font-medium text-text-light">Type</th>
                <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Source</th>
                <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Timeframe</th>
                <th className="px-4 py-3 font-medium text-text-light">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.leadId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/leads/${lead.leadId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-light">{lead.leadType}</td>
                  <td className="hidden px-4 py-3 text-text-light sm:table-cell">{lead.toolSource}</td>
                  <td className="hidden px-4 py-3 text-text-light md:table-cell">{lead.timeframe}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConfig[lead.leadStatus]?.color ?? 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {statusConfig[lead.leadStatus]?.label ?? lead.leadStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-light">
            Page {page} of {totalPages} ({total} leads)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
