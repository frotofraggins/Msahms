'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, ApiRequestError } from '@/lib/api';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';

interface Photo {
  url: string;
  attribution: string;
  license: string;
  sourceUrl: string;
  alt: string;
}

interface CitationSource {
  url: string;
  attribution: string;
}

interface Draft {
  draftId: string;
  bundleId: string;
  topic: string;
  title: string;
  slug: string;
  metaDescription: string;
  bodyMarkdown: string;
  citationSources: CitationSource[];
  photos: Photo[];
  status: string;
  createdAt: string;
  modelUsed: string;
  inputTokens?: number;
  outputTokens?: number;
}

export default function DraftDetailClient() {
  const pathname = usePathname();
  const id = pathname.split('/').filter(Boolean).pop() ?? '';

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [editingBody, setEditingBody] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingMeta, setEditingMeta] = useState<string>('');
  const [published, setPublished] = useState<{ slug: string; url: string } | null>(null);

  useEffect(() => {
    if (!id || id === '_') return;
    void fetchDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDraft() {
    setLoading(true);
    setError(null);
    try {
      const d = (await api.dashboard.draft(id)) as { draft: Draft };
      setDraft(d.draft);
      setEditingTitle(d.draft.title);
      setEditingBody(d.draft.bodyMarkdown);
      setEditingMeta(d.draft.metaDescription);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.apiError?.message ?? 'Failed' : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      await api.dashboard.updateDraft(id, {
        title: editingTitle,
        bodyMarkdown: editingBody,
        metaDescription: editingMeta,
      });
      await fetchDraft();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError?.message ?? 'Failed' : 'Network error');
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    if (!confirm('Publish this article to mesahomes.com/blog?')) return;
    setApproving(true);
    try {
      // Save any unsaved edits first
      if (
        editingTitle !== draft?.title ||
        editingBody !== draft?.bodyMarkdown ||
        editingMeta !== draft?.metaDescription
      ) {
        await api.dashboard.updateDraft(id, {
          title: editingTitle,
          bodyMarkdown: editingBody,
          metaDescription: editingMeta,
        });
      }
      const resp = (await api.dashboard.approveDraft(id)) as {
        slug: string;
        publishedUrl: string;
      };
      setPublished({ slug: resp.slug, url: resp.publishedUrl });
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError?.message ?? 'Failed' : 'Network error');
    } finally {
      setApproving(false);
    }
  }

  async function reject() {
    if (!confirm('Reject this draft? It will be archived.')) return;
    try {
      await api.dashboard.rejectDraft(id);
      window.location.href = '/dashboard/content/drafts/';
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.apiError?.message ?? 'Failed' : 'Network error');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-2 text-text-light">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading draft…
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard/content/drafts/" className="text-sm text-primary">
          ← Back to drafts
        </Link>
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error ?? 'Draft not found'}
        </p>
      </div>
    );
  }

  if (published) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h1 className="font-display text-3xl font-semibold text-charcoal">Published!</h1>
        <p className="mt-2 text-text-light">
          Your article is now live at{' '}
          <a href={published.url} className="text-primary underline" target="_blank" rel="noopener">
            {published.url}
          </a>
        </p>
        <Link
          href="/dashboard/content/drafts/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-paper hover:bg-primary-dark"
        >
          Review next draft
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:pb-8">
      <Link
        href="/dashboard/content/drafts/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to drafts
      </Link>

      <div className="mb-6 flex items-center gap-2 text-xs text-text-light">
        <span className="rounded bg-warm-beige px-2 py-0.5 font-medium uppercase tracking-wider text-primary">
          {draft.topic}
        </span>
        <span>{new Date(draft.createdAt).toLocaleString()}</span>
        <span>•</span>
        <span>{draft.modelUsed.split('.').pop()}</span>
        <span>•</span>
        <span>{draft.inputTokens}/{draft.outputTokens} tokens</span>
      </div>

      <div className="rounded-xl border border-warm-border bg-paper p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-light">
            Title
          </label>
          <input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="w-full rounded-lg border border-warm-border bg-paper p-2 font-display text-lg font-semibold text-charcoal focus:border-primary focus:outline-none sm:text-2xl"
          />
        </div>

        {/* Meta description */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-light">
            Meta description (Google search result preview)
          </label>
          <textarea
            value={editingMeta}
            onChange={(e) => setEditingMeta(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-warm-border bg-paper p-2 text-sm text-charcoal focus:border-primary focus:outline-none"
          />
          <div className="mt-1 text-xs text-text-light">{editingMeta.length}/160 chars</div>
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-light">
            URL slug
          </label>
          <div className="text-sm text-charcoal">
            mesahomes.com/blog/<strong>{draft.slug}</strong>
          </div>
        </div>

        {/* Photos */}
        {draft.photos.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-light">
              Photos ({draft.photos.length})
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {draft.photos.map((p, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-warm-border">
                  <img src={p.url} alt={p.alt} className="h-48 w-full object-cover" />
                  <div className="p-2 text-xs text-text-light">
                    <div>{p.attribution}</div>
                    <div className="opacity-70">{p.license}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-light">
            Body (markdown)
          </label>
          <textarea
            value={editingBody}
            onChange={(e) => setEditingBody(e.target.value)}
            rows={20}
            className="w-full rounded-lg border border-warm-border bg-paper p-3 font-mono text-sm text-charcoal focus:border-primary focus:outline-none"
          />
          <div className="mt-1 text-xs text-text-light">
            {editingBody.length} chars / ~{Math.round(editingBody.split(/\s+/).length)} words
          </div>
        </div>

        {/* Citations */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-light">
            Source citations ({draft.citationSources.length})
          </label>
          <ul className="space-y-1 text-xs">
            {draft.citationSources.slice(0, 20).map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-text-light">{i + 1}.</span>
                <a href={c.url} target="_blank" rel="noopener" className="text-primary hover:underline">
                  {c.attribution}
                </a>
              </li>
            ))}
            {draft.citationSources.length > 20 && (
              <li className="text-text-light opacity-70">
                + {draft.citationSources.length - 20} more
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Actions — sticky bottom bar on mobile, inline on desktop */}
      <div className="sticky bottom-0 left-0 right-0 -mx-4 mt-6 border-t border-warm-border bg-paper p-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-5xl flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            onClick={reject}
            disabled={saving || approving}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 sm:py-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
          <button
            onClick={save}
            disabled={saving || approving}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-warm-border bg-white px-4 py-3 text-sm font-medium text-charcoal hover:bg-warm-beige disabled:opacity-50 sm:py-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          <button
            onClick={approve}
            disabled={saving || approving}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-paper hover:bg-primary-dark disabled:opacity-50 sm:py-2 sm:font-medium"
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve &amp; Publish
          </button>
        </div>
      </div>
    </div>
  );
}
