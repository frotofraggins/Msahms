'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiRequestError } from '@/lib/api';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';

interface DraftSummary {
  draftId: string;
  title: string;
  topic: string;
  slug: string;
  metaDescription: string;
  citationCount: number;
  photoCount: number;
  createdAt: string;
  status: string;
  modelUsed: string;
}

export default function DraftsClient() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDrafts();
  }, []);

  async function fetchDrafts() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.drafts()) as { drafts?: DraftSummary[] };
      setDrafts(data.drafts ?? []);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.apiError?.message ?? 'Failed' : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-2 text-text-light">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading drafts…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">Content Drafts</h1>
          <p className="mt-1 text-sm text-text-light">
            AI-generated articles pending your review. Approve to publish, reject to archive.
          </p>
        </div>
        <div className="text-sm text-text-light">
          {drafts.length} pending
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {drafts.length === 0 && !error && (
        <div className="rounded-xl border border-warm-border bg-paper p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-text-light" />
          <p className="text-text-light">
            No drafts pending review. The content pipeline generates new drafts daily at 8am MST.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {drafts.map((d) => (
          <Link
            key={d.draftId}
            href={`/dashboard/content/drafts/${d.draftId}/`}
            className="block rounded-xl border border-warm-border bg-paper p-4 transition hover:border-primary hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-block rounded bg-warm-beige px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-primary">
                    {d.topic}
                  </span>
                  <span className="text-xs text-text-light">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-charcoal">{d.title}</h2>
                <p className="mt-1 text-sm text-text-light line-clamp-2">{d.metaDescription}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-light">
                  <span>{d.citationCount} citations</span>
                  <span>{d.photoCount} photos</span>
                  <span className="text-xs opacity-50">{d.modelUsed.split('.').pop()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
