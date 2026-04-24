import Link from 'next/link';

/**
 * Persistent green banner displayed on every page.
 * "Want a licensed agent to handle everything?" with CTA.
 * This is a top-of-funnel differentiator — we're honest about the option.
 */
export function FullServiceUpgradeBanner() {
  return (
    <div className="bg-primary px-4 py-3 text-center text-sm text-white">
      <span className="mr-2">Want a licensed agent to handle everything?</span>
      <Link
        href="/sell?upgrade=full-service"
        className="inline-block rounded-md bg-white px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-gray-100"
      >
        Switch to Full Service
      </Link>
    </div>
  );
}
