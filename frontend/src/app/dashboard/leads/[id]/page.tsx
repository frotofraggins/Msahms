import LeadDetailClient from './LeadDetailClient';

/**
 * Static export shell for /dashboard/leads/[id].
 *
 * generateStaticParams returns a single placeholder `_` so the static
 * export produces one HTML shell. CloudFront rewrites all
 * /dashboard/leads/* requests to this shell, and the client component
 * reads the actual lead ID from window.location.pathname.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function LeadDetailPage() {
  return <LeadDetailClient />;
}
