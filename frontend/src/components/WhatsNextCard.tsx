import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface WhatsNextCardProps {
  /** Title of the next recommended tool. */
  title: string;
  /** Why this step matters for the user. */
  explanation: string;
  /** Link to the next tool page. */
  href: string;
}

/**
 * Post-tool recommendation card for the guided decision engine.
 *
 * "Based on your numbers, here's what to do next."
 */
export function WhatsNextCard({ title, explanation, href }: WhatsNextCardProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
        What&apos;s Next
      </p>
      <h3 className="mb-2 text-lg font-bold text-text">{title}</h3>
      <p className="mb-4 text-sm text-text-light">{explanation}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-100 hover:bg-primary-light active:scale-[0.98]"
      >
        {title}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
