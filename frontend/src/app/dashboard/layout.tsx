'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Home,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearTokens } from '@/lib/api';

const navItems = [
  { href: '/dashboard/leads', label: 'Leads', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users, adminOnly: true },
  { href: '/dashboard/performance', label: 'Performance', icon: BarChart3 },
  { href: '/dashboard/listings', label: 'Listings', icon: Home },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auth guard — client-side redirect for static export
  useEffect(() => {
    const token = localStorage.getItem('mesahomes_access_token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    setAuthenticated(true);
    setChecking(false);
  }, []);

  function handleLogout() {
    clearTokens();
    window.location.href = '/auth/login';
  }

  if (checking || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-text-light">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard/leads" className="text-lg font-bold text-primary">
            MesaHomes
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-text-light" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-light hover:bg-gray-100 hover:text-text',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-light transition-colors hover:bg-gray-100 hover:text-error"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-text" />
          </button>

          <div className="hidden text-sm font-medium text-text lg:block">
            Dashboard
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative text-text-light hover:text-text"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-text">Agent</span>
            <button
              onClick={handleLogout}
              className="hidden text-sm font-medium text-text-light hover:text-error lg:block"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
