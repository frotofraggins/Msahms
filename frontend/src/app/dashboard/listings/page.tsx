'use client';

import { useEffect, useState } from 'react';
import {
  Home,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

interface Listing {
  id: string;
  address: string;
  status: string;
  createdAt: string;
}

interface ListingsResponse {
  listings: Listing[];
}

const listingStatusOptions = ['draft', 'active', 'pending', 'sold', 'withdrawn'];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  withdrawn: 'bg-red-100 text-red-700',
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.listings()) as ListingsResponse;
      setListings(data.listings ?? []);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Failed to load listings.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(listingId: string, newStatus: string) {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l)),
    );
    try {
      // Use a generic PATCH via apiRequest for listing status updates
      await api.dashboard.updateLead(listingId, { status: newStatus });
    } catch {
      // Revert on failure
      fetchListings();
    }
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
        <Home className="h-6 w-6" />
        Listings
      </h1>

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
        ) : listings.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-light">
            <Home className="mx-auto mb-2 h-8 w-8 text-text-light" />
            No listings yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-warm-border bg-warm-beige">
              <tr>
                <th className="px-4 py-3 font-medium text-text-light">Address</th>
                <th className="px-4 py-3 font-medium text-text-light">Status</th>
                <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Created</th>
                <th className="px-4 py-3 font-medium text-text-light">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text">{listing.address}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        statusColors[listing.status] ?? 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-text-light sm:table-cell">
                    {formatDate(listing.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={listing.status}
                      onChange={(e) => handleStatusUpdate(listing.id, e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={`Update status for ${listing.address}`}
                    >
                      {listingStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
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
