'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiRequestError } from '@/lib/api';

type NotificationChannel = 'email' | 'email-sms' | 'none';

interface NotificationPrefs {
  newLead: NotificationChannel;
  statusChange: NotificationChannel;
}

const channelOptions: { value: NotificationChannel; label: string }[] = [
  { value: 'email', label: 'Email only' },
  { value: 'email-sms', label: 'Email + SMS' },
  { value: 'none', label: 'None' },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    newLead: 'email',
    statusChange: 'email',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.dashboard.notificationSettings()) as NotificationPrefs;
      setPrefs(data);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Failed to load settings.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.dashboard.updateNotificationSettings(prefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.apiError?.message ?? 'Failed to save settings.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Notification preferences */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-text">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h2>

        <div className="space-y-6">
          {/* New Lead */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              New Lead Notifications
            </label>
            <p className="mb-3 text-xs text-text-light">
              How would you like to be notified when a new lead comes in?
            </p>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrefs((p) => ({ ...p, newLead: opt.value }))}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    prefs.newLead === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-text-light hover:bg-gray-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Change */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Status Change Notifications
            </label>
            <p className="mb-3 text-xs text-text-light">
              Get notified when a lead&apos;s status changes.
            </p>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrefs((p) => ({ ...p, statusChange: opt.value }))}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    prefs.statusChange === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-text-light hover:bg-gray-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors',
              saving
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-primary hover:bg-primary-dark',
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
          {success && (
            <span className="flex items-center gap-1 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
