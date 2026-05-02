/**
 * Maricopa high-value sales parser — finds recent residential sales
 * above a price threshold, per city. Feeds "big news" style content.
 *
 * These become "big fish" article bait:
 *   "Mesa's Top Home Sales This Month: 4 Properties Over $2M"
 *   "New Gilbert record: $3.4M custom estate closes in Seville"
 *
 * Source of truth is the Maricopa County Assessor — every sale is
 * public record with recorded price and date.
 */

import type { ContentSource } from '../../../lib/content-sources.js';

interface ParsedItem {
  id: string;
  title?: string;
  data: Record<string, unknown>;
}

interface GisBigSale {
  PHYSICAL_ADDRESS?: string | null;
  PHYSICAL_CITY?: string | null;
  PHYSICAL_ZIP?: string | null;
  SALE_PRICE?: string | null;
  SALE_DATE?: string | null;
  SUBNAME?: string | null;
  LIVING_SPACE?: string | null;
  LAND_SIZE?: string | number | null;
  CONST_YEAR?: string | null;
  LATITUDE?: number | null;
  LONGITUDE?: number | null;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function gisFetch(url: string, where: string, outFields: string, limit: number): Promise<GisBigSale[]> {
  const body = new URLSearchParams({
    where,
    f: 'json',
    outFields,
    returnGeometry: 'false',
    orderByFields: 'SALE_DATE DESC',
    resultRecordCount: String(limit),
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (MesaHomesBot/1.0; +https://mesahomes.com)',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`GIS HTTP ${res.status}`);
  }
  const data = (await res.json()) as { features?: Array<{ attributes: GisBigSale }>; error?: { message: string } };
  if (data.error) throw new Error(`GIS error: ${data.error.message}`);
  return (data.features ?? []).map((f) => f.attributes);
}

export async function fetchBigSales(source: ContentSource): Promise<ParsedItem[]> {
  const config = (source.config ?? {}) as {
    cities?: string[];
    minPrice?: number;
    lookbackDays?: number;
    limit?: number;
  };
  const cities = config.cities ?? ['MESA', 'GILBERT', 'CHANDLER', 'QUEEN CREEK'];
  const minPrice = config.minPrice ?? 1500000;
  const limit = config.limit ?? 25;

  const items: ParsedItem[] = [];

  // Maricopa stores SALE_PRICE as a string — we can't do numeric > filter.
  // Instead, pull recent sales (sorted by date DESC) and filter in JS.
  // Need enough volume to find the high-value ones — 200 per city
  // is typically ~30 days of sales for Mesa-sized cities.
  for (const city of cities) {
    try {
      const raw = await gisFetch(
        source.url,
        `PHYSICAL_CITY='${city.replace(/'/g, "''")}'`,
        'PHYSICAL_ADDRESS,PHYSICAL_CITY,PHYSICAL_ZIP,SALE_PRICE,SALE_DATE,SUBNAME,LIVING_SPACE,LAND_SIZE,CONST_YEAR,LATITUDE,LONGITUDE',
        200,
      );

      const bigOnes = raw
        .map((r) => ({ ...r, _salePriceNum: toNumber(r.SALE_PRICE), _sqft: toNumber(r.LIVING_SPACE) }))
        .filter((r) => r._salePriceNum != null && r._salePriceNum >= minPrice)
        .slice(0, limit);

      console.log(`[big-sales] ${city}: ${bigOnes.length} sales >= $${minPrice.toLocaleString()}`);

      for (const [idx, sale] of bigOnes.entries()) {
        const addr = (sale.PHYSICAL_ADDRESS ?? '').trim().replace(/\s+/g, ' ');
        const slug = addr.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
        const dateStr = sale.SALE_DATE?.replace(/\//g, '') ?? '';
        items.push({
          // Add index to ensure uniqueness when same address appears multiple
          // times with same date (condos at same address, bulk portfolio
          // sales, etc.). Dedup by content hash still catches exact dupes.
          id: `big-sale-${slug}-${dateStr}-${idx}`,
          title: `${addr} — $${sale._salePriceNum?.toLocaleString()} in ${city}`,
          data: {
            address: addr,
            city: sale.PHYSICAL_CITY,
            zip: sale.PHYSICAL_ZIP,
            salePrice: sale._salePriceNum,
            saleDate: sale.SALE_DATE,
            subdivision: sale.SUBNAME,
            sqft: sale._sqft,
            lotSize: toNumber(sale.LAND_SIZE),
            yearBuilt: toNumber(sale.CONST_YEAR),
            latitude: sale.LATITUDE,
            longitude: sale.LONGITUDE,
            pricePerSqft: sale._salePriceNum && sale._sqft ? Math.round(sale._salePriceNum / sale._sqft) : null,
          },
        });
      }
    } catch (err) {
      console.error(`[big-sales] ${city} failed:`, err);
    }
  }

  return items;
}
