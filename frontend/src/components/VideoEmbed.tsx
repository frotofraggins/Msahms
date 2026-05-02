/**
 * VideoEmbed — responsive YouTube/Vimeo embed with VideoObject
 * schema emission for SEO.
 *
 * Handles three URL formats:
 *   - https://www.youtube.com/watch?v=ID
 *   - https://youtu.be/ID
 *   - https://vimeo.com/ID
 *
 * Renders a privacy-mode iframe (youtube-nocookie.com) to avoid
 * tracking cookies until the user plays. Lazy-loads so first
 * paint isn't blocked.
 *
 * Usage:
 *   <VideoEmbed
 *     url="https://www.youtube.com/watch?v=abc123"
 *     title="Mesa Listing Walkthrough at 1234 N Main St"
 *     description="Drone + interior tour of a flat-fee MLS listing in Mesa, AZ"
 *     thumbnailUrl="https://i.ytimg.com/vi/abc123/maxresdefault.jpg"
 *     uploadDate="2026-04-28"
 *   />
 */

interface VideoEmbedProps {
  url: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate?: string; // ISO YYYY-MM-DD
  duration?: string; // ISO 8601 duration, e.g. PT2M30S
}

function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo'; id: string } | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { provider: 'youtube', id: yt[1] };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { provider: 'vimeo', id: vimeo[1] };
  return null;
}

export function VideoEmbed(props: VideoEmbedProps) {
  const parsed = parseVideoUrl(props.url);
  if (!parsed) return null;

  const embedSrc =
    parsed.provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${parsed.id}?rel=0`
      : `https://player.vimeo.com/video/${parsed.id}`;

  const thumbnailUrl =
    props.thumbnailUrl ??
    (parsed.provider === 'youtube'
      ? `https://i.ytimg.com/vi/${parsed.id}/maxresdefault.jpg`
      : '');

  const videoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: props.title,
    description: props.description,
    thumbnailUrl: thumbnailUrl || undefined,
    uploadDate: props.uploadDate,
    duration: props.duration,
    contentUrl: props.url,
    embedUrl: embedSrc,
  };

  return (
    <figure className="my-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <div className="relative w-full overflow-hidden rounded-lg bg-charcoal" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedSrc}
          title={props.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <figcaption className="mt-2 text-xs text-text-light">{props.title}</figcaption>
    </figure>
  );
}
