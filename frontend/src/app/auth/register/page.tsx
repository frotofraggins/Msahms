'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, setTokens, ApiRequestError } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.register({ token, name, email, password }) as {
        accessToken: string;
        refreshToken: string;
        idToken?: string;
      };
      setTokens(data.accessToken, data.refreshToken, data.idToken);
      window.location.href = '/dashboard/leads';
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 400) {
          setError(
            err.apiError?.message ?? 'Invalid registration details. Please check your inputs.',
          );
        } else if (err.status === 410) {
          setError('This invite token has expired or already been used.');
        } else if (err.status === 404) {
          setError('Invalid invite token. Please request a new invitation.');
        } else {
          setError(err.apiError?.message ?? 'Registration failed. Please try again.');
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
            <UserPlus className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-text">Agent Registration</h1>
            <p className="mt-1 text-sm text-text-light">
              Create your account with an invite token
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
              <label htmlFor="token" className="mb-1 block text-sm font-medium text-text">
                Invite Token
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Paste your invite token"
              />
            </div>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Jane Smith"
              />
            </div>

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
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Min. 8 characters"
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
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-light">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
