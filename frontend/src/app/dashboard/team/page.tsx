'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  leadCount: number;
}

interface TeamResponse {
  members: TeamMember[];
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.team()) as TeamResponse;
      setMembers(data.members ?? []);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          setError('Admin access required to view team management.');
        } else {
          setError(err.apiError?.message ?? 'Failed to load team.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);
    setInviting(true);

    try {
      await api.dashboard.inviteAgent({ email: inviteEmail });
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setInviteError(err.apiError?.message ?? 'Failed to send invite.');
      } else {
        setInviteError('Network error. Please try again.');
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleDeactivate(memberId: string) {
    try {
      await api.dashboard.updateLead(memberId, { status: 'inactive' });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'inactive' } : m)),
      );
    } catch {
      // Silently fail
    }
  }

  if (error === 'Admin access required to view team management.') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Team</h1>
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 p-6">
          <ShieldAlert className="h-6 w-6 text-warning" />
          <div>
            <p className="font-medium text-text">Admin Access Required</p>
            <p className="text-sm text-text-light">
              Only administrators can manage team members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Team</h1>

      {/* Invite form */}
      <div className="rounded-xl bg-paper p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal">
          <UserPlus className="h-5 w-5" />
          Invite Agent
        </h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="agent@mesahomes.com"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={inviting}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
              inviting
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-primary hover:bg-primary-dark',
            )}
          >
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Send Invite
          </button>
        </form>
        {inviteSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            Invitation sent successfully.
          </div>
        )}
        {inviteError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {inviteError}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Team table */}
      <div className="overflow-x-auto rounded-xl bg-paper shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-light">
            <Users className="mx-auto mb-2 h-8 w-8 text-text-light" />
            No team members yet. Send an invite to get started.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-warm-border bg-warm-beige">
              <tr>
                <th className="px-4 py-3 font-medium text-text-light">Name</th>
                <th className="px-4 py-3 font-medium text-text-light">Email</th>
                <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Leads</th>
                <th className="px-4 py-3 font-medium text-text-light">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text">{member.name}</td>
                  <td className="px-4 py-3 text-text-light">{member.email}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums text-text md:table-cell">
                    {member.leadCount}
                  </td>
                  <td className="px-4 py-3">
                    {member.status === 'active' && (
                      <button
                        onClick={() => handleDeactivate(member.id)}
                        className="text-xs font-medium text-error hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
