'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, setTokens, ApiRequestError } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login({ email, password }) as {
        accessToken: string;
        refreshToken: string;
        idToken?: string;
      };
      setTokens(data.accessToken, data.refreshToken, data.idToken);
      window.location.href = '/dashboard/leads';
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          setError(
            'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.',
          );
        } else if (err.status === 401) {
          setError('Invalid email or password.');
        } else {
          setError(err.apiError?.message ?? 'Login failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] items-center justify-center bg-surface px-4 py-16">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <LogIn className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-text">Agent Login</h1>
            <p className="mt-1 text-sm text-text-light">
              Sign in to your MesaHomes dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="agent@mesahomes.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors',
                loading
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-primary hover:bg-primary-dark',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-light">
            Have an invite?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Create your account
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
