'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone } from 'lucide-react';

const navLinks = [
  { href: '/sell', label: 'Sell' },
  { href: '/buy', label: 'Buy' },
  { href: '/rent', label: 'Rent' },
  { href: '/invest', label: 'Invest' },
  { href: '/areas/mesa', label: 'Areas' },
  { href: '/news', label: 'News' },
  { href: '/blog', label: 'Blog' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-warm-border bg-paper">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="MesaHomes — Mesa AZ real estate">
          <img
            src="/brand/mesahomes-logo-minimalist.webp"
            alt="MesaHomes — Mesa AZ real estate brand"
            width={180}
            height={48}
            className="h-8 w-auto md:h-10"
          />
        </Link>

        {/* Desktop nav — absolutely centered on the container, independent of logo/CTA widths */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-light transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-text-light transition-colors hover:text-primary"
          >
            Agent Login
          </Link>
          <a
            href="tel:+14802690502"
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Phone className="h-4 w-4" />
            (480) 269-0502
          </a>
          <Link
            href="/booking"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-all duration-100 hover:bg-secondary-dark active:scale-[0.98]"
          >
            Talk to Agent
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-6 w-6 text-charcoal" /> : <Menu className="h-6 w-6 text-charcoal" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-warm-border bg-paper px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-text-light"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="mt-2 block rounded-lg bg-secondary px-4 py-2 text-center text-sm font-semibold text-white transition-all duration-100 active:scale-[0.98]"
            onClick={() => setMobileOpen(false)}
          >
            Talk to Agent
          </Link>
          <Link
            href="/auth/login"
            className="mt-2 block border-t border-warm-border pt-2 text-center text-sm font-medium text-text-light"
            onClick={() => setMobileOpen(false)}
          >
            Agent Login
          </Link>
        </nav>
      )}
    </header>
  );
}
