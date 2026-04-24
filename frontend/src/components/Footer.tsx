import Link from 'next/link';

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
  return (
    <footer className="border-t border-gray-200 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-primary">MesaHomes</h3>
            <p className="text-sm text-text-light">
              Flat-fee real estate for the Mesa, AZ metro area. Save thousands
              with county-verified data and free tools.
            </p>
          </div>

          {/* Areas */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text">Areas</h3>
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
            <h3 className="mb-3 text-sm font-semibold text-text">Tools</h3>
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

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text">Company</h3>
            <ul className="space-y-1">
              <li><Link href="/about" className="text-sm text-text-light hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-sm text-text-light hover:text-primary">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-text-light hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-text-light hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-text-light">
          © {new Date().getFullYear()} MesaHomes. Licensed in Arizona.
        </div>
      </div>
    </footer>
  );
}
