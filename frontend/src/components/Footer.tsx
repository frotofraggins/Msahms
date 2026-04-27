import Link from 'next/link';
import { tryGetBrokerOfRecord, portalsSentence } from '@mesahomes/lib/brokerage';
import { BLOG_CATEGORIES, NEWS_CATEGORIES } from '@/lib/content-taxonomy';

const areaLinks = [
  { href: '/areas/mesa', label: 'Mesa' },
  { href: '/areas/gilbert', label: 'Gilbert' },
  { href: '/areas/chandler', label: 'Chandler' },
  { href: '/areas/queen-creek', label: 'Queen Creek' },
  { href: '/areas/san-tan-valley', label: 'San Tan Valley' },
  { href: '/areas/apache-junction', label: 'Apache Junction' },
];

const toolLinks = [
  { href: '/tools/net-sheet', label: 'Seller Net Sheet' },
  { href: '/tools/affordability', label: 'Affordability Calculator' },
  { href: '/tools/home-value', label: 'Home Value Request' },
  { href: '/tools/listing-generator', label: 'AI Listing Generator' },
  { href: '/compare/flat-fee-vs-traditional-agent', label: 'Flat Fee vs Traditional' },
];

export function Footer() {
  const broker = tryGetBrokerOfRecord();

  return (
    <footer className="border-t border-warm-border bg-warm-beige">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* About */}
          <div>
            <h3 className="font-heading mb-3 text-sm font-semibold text-primary">MesaHomes</h3>
            <p className="text-sm text-text-light">
              Flat-fee real estate for the Mesa, AZ metro area. Save thousands
              with county-verified data and free tools.
            </p>
          </div>

          {/* Areas */}
          <div>
            <h3 className="font-heading mb-3 text-sm font-semibold text-charcoal">Areas</h3>
            <ul className="space-y-1">
              {areaLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-light hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-heading mb-3 text-sm font-semibold text-charcoal">Tools</h3>
            <ul className="space-y-1">
              {toolLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-light hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* News & Guides */}
          <div>
            <h3 className="font-heading mb-3 text-sm font-semibold text-charcoal">News &amp; Guides</h3>
            <ul className="space-y-1">
              <li><Link href="/news/" className="text-sm text-text-light hover:text-primary">All News</Link></li>
              <li><Link href="/blog/" className="text-sm text-text-light hover:text-primary">All Blog Posts</Link></li>
              {BLOG_CATEGORIES.slice(0, 3).map((c) => (
                <li key={c.slug}>
                  <Link href={`/blog/${c.slug}/`} className="text-sm text-text-light hover:text-primary">
                    {c.title}
                  </Link>
                </li>
              ))}
              {NEWS_CATEGORIES.slice(0, 2).map((c) => (
                <li key={c.slug}>
                  <Link href={`/news/${c.slug}/`} className="text-sm text-text-light hover:text-primary">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading mb-3 text-sm font-semibold text-charcoal">Company</h3>
            <ul className="space-y-1">
              <li><Link href="/about" className="text-sm text-text-light hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-sm text-text-light hover:text-primary">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-text-light hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-text-light hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/auth/login" className="text-sm text-text-light hover:text-primary">Agent Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-warm-border pt-6 text-center text-xs text-text-light">
          <p>© {new Date().getFullYear()} MesaHomes. Licensed in Arizona.</p>
          {broker && (
            <p className="mt-1">
              {broker.name}, Arizona License #{broker.licenseNumber}
              {broker.brokerageName !== 'MesaHomes' ? ` — ${broker.brokerageName}` : ''}
            </p>
          )}
          <p className="mt-1">
            Flat-fee MLS listings syndicated to {portalsSentence()} via ARMLS.
          </p>
        </div>
      </div>
    </footer>
  );
}
