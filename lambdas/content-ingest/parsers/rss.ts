/**
 * RSS/Atom feed parser — used for news feeds, GovDelivery newsletters,
 * Federal Register agency feeds, and any other standards-based XML feed.
 *
 * Minimal parser: extracts item title + description + link + pubDate.
 * Uses a simple regex-based XML extraction to avoid pulling in a heavy
 * XML library (Lambda cold-start matters).
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

/** Extract content between <tag> and </tag>, handling CDATA. */
function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return undefined;
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : raw;
}

/** Strip HTML tags from a string, collapse whitespace. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchRss(source: ContentSource): Promise<ParsedItem[]> {
  const res = await fetch(source.url, {
    headers: {
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      'User-Agent': 'MesaHomesBot/1.0 (+https://mesahomes.com)',
    },
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: HTTP ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  // Split into items — handles both RSS <item> and Atom <entry>
  const itemRegex = /<(item|entry)[^>]*>([\s\S]*?)<\/(item|entry)>/gi;
  const items: ParsedItem[] = [];
  let idx = 0;

  for (const match of xml.matchAll(itemRegex)) {
    const body = match[2];
    const title = extractTag(body, 'title') ?? '';
    const description =
      extractTag(body, 'description') ??
      extractTag(body, 'summary') ??
      extractTag(body, 'content') ??
      '';
    const link =
      extractTag(body, 'link') ??
      body.match(/<link[^>]*href=["']([^"']+)/i)?.[1] ??
      '';
    const pubDate =
      extractTag(body, 'pubDate') ??
      extractTag(body, 'published') ??
      extractTag(body, 'updated') ??
      '';
    const guid = extractTag(body, 'guid') ?? extractTag(body, 'id') ?? link ?? `item-${idx}`;

    const plainTitle = stripHtml(title);
    const plainDescription = stripHtml(description);

    // Keyword filter — only keep items that match one of source.keywords
    // if keywords are defined. Empty keywords means 'keep everything'.
    if (source.keywords && source.keywords.length) {
      const haystack = `${plainTitle} ${plainDescription}`.toLowerCase();
      const matches = source.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
      if (!matches) {
        idx += 1;
        continue;
      }
    }

    items.push({
      id: `rss-${guid.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80)}-${idx}`,
      title: plainTitle,
      data: {
        title: plainTitle,
        description: plainDescription,
        link,
        pubDate,
        guid,
      },
    });
    idx += 1;
  }

  return items;
}
