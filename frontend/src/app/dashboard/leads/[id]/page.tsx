'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

interface LeadDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  zip: string;
  leadType: string;
  toolSource: string;
  timeframe: string;
  priceRange?: string;
  status: string;
  notes: string[];
  toolData?: Record<string, unknown>;
  pathHistory?: string[];
  createdAt: string;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'showing', label: 'Showing' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    fetchLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchLead() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.lead(id)) as LeadDetail;
      setLead(data);
      setStatus(data.status);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Failed to load lead.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setStatusSaving(true);
    try {
      await api.dashboard.updateLead(id, { status: newStatus });
    } catch {
      // Revert on failure
      if (lead) setStatus(lead.status);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setNoteSaving(true);
    try {
      await api.dashboard.updateLead(id, { note: newNote.trim() });
      setLead((prev) =>
        prev ? { ...prev, notes: [...(prev.notes ?? []), newNote.trim()] } : prev,
      );
      setNewNote('');
    } catch {
      // Silently fail — note stays in input
    } finally {
      setNoteSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? 'Lead not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/leads"
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{lead.name}</h1>
          <p className="text-sm text-text-light">{lead.leadType} — via {lead.toolSource}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusSaving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Lead status"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {statusSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-xl bg-paper p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-charcoal">Contact Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-text-light" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                {lead.email}
              </a>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-text-light" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-text-light" />
              <span className="text-text">{lead.city}, {lead.zip}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-text-light" />
              <span className="text-text">{lead.timeframe}</span>
            </div>
            {lead.priceRange && (
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-text-light" />
                <span className="text-text">{lead.priceRange}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
            <button className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50">
              <Calendar className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>

        {/* Tool data */}
        <div className="rounded-xl bg-paper p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-charcoal">Tool Source &amp; Data</h2>
          <p className="mb-2 text-sm text-text-light">
            Source: <span className="font-medium text-text">{lead.toolSource}</span>
          </p>
          {lead.toolData && Object.keys(lead.toolData).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(lead.toolData).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-text-light">{key}</span>
                  <span className="font-medium text-text">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-light">No tool data available.</p>
          )}
        </div>
      </div>

      {/* Path history */}
      {lead.pathHistory && lead.pathHistory.length > 0 && (
        <div className="rounded-xl bg-paper p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-charcoal">Path History</h2>
          <div className="flex flex-wrap items-center gap-2">
            {lead.pathHistory.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-text-light">→</span>}
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <CheckCircle className="h-3 w-3" />
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-xl bg-paper p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-charcoal">Notes</h2>

        {(lead.notes ?? []).length > 0 ? (
          <div className="mb-4 space-y-2">
            {lead.notes.map((note, i) => (
              <div key={i} className="rounded-lg bg-warm-beige p-3 text-sm text-charcoal">
                {note}
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-text-light">No notes yet.</p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNote();
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={noteSaving || !newNote.trim()}
            className={cn(
              'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              noteSaving || !newNote.trim()
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-primary hover:bg-primary-dark',
            )}
          >
            {noteSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
