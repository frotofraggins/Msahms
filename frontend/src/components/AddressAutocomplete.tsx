'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Address autocomplete using Google Places API (New).
 *
 * Calls the places:autocomplete REST endpoint directly — no SDK, no map
 * library, no extra bundle cost. Our API key is HTTP-referrer-restricted
 * to mesahomes.com/* so exposing it in NEXT_PUBLIC_* is safe.
 *
 * Debounces user input at 250ms. Only fires requests after 3+ characters
 * to stay well under Google's free tier (first $200/mo ~= 70k autocomplete
 * sessions). Filters to street_address predictions within Arizona to
 * avoid wasted matches outside our service area.
 *
 * onSelect fires with the full resolved address. onChange fires on every
 * keystroke so parent state stays in sync and manual typing still works
 * when Places is blocked (ad blocker, network failure, etc.).
 */

interface Suggestion {
  placeId: string;
  text: string;
  streetAddress?: string;
  locality?: string;
  zip?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '123 E Main St, Mesa, AZ 85201',
  id,
  className,
  required,
  disabled,
  autoFocus,
}: AddressAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionToken = useRef<string>(crypto.randomUUID());

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch predictions
  useEffect(() => {
    if (!apiKey || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'suggestions.placePrediction.text,suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input: value,
            includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
            includedRegionCodes: ['us'],
            sessionToken: sessionToken.current,
            // Bias to Phoenix metro — nominal lat/lng + ~50mi radius
            locationBias: {
              circle: {
                center: { latitude: 33.4152, longitude: -111.8315 },
                radius: 50000,
              },
            },
          }),
        });

        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as {
          suggestions?: Array<{
            placePrediction?: {
              placeId?: string;
              text?: { text?: string };
              structuredFormat?: {
                mainText?: { text?: string };
                secondaryText?: { text?: string };
              };
            };
          }>;
        };

        const parsed: Suggestion[] = (data.suggestions ?? [])
          .map((s) => {
            const p = s.placePrediction;
            if (!p?.placeId) return null;
            const full = p.text?.text ?? '';
            const main = p.structuredFormat?.mainText?.text;
            const secondary = p.structuredFormat?.secondaryText?.text;
            // Extract a 5-digit AZ ZIP if the result contains one — we use
            // it to pre-fill downstream forms
            const zipMatch = full.match(/\b(8[45]\d{3})\b/);
            return {
              placeId: p.placeId,
              text: full,
              streetAddress: main,
              locality: secondary,
              zip: zipMatch ? zipMatch[1] : undefined,
            };
          })
          .filter(Boolean) as Suggestion[];

        setSuggestions(parsed);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, apiKey]);

  async function handleSelect(s: Suggestion) {
    setOpen(false);
    setHighlighted(-1);

    // Places Autocomplete returns short-form text without ZIP. Call Place
    // Details to resolve the full formatted address (with ZIP + country)
    // so downstream code can extract the ZIP and use it for county
    // routing, ZIP-level market data, and comp queries.
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${s.placeId}?sessionToken=${sessionToken.current}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': apiKey ?? '',
            'X-Goog-FieldMask': 'formattedAddress,addressComponents',
          },
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          formattedAddress?: string;
          addressComponents?: Array<{ types?: string[]; shortText?: string }>;
        };
        const zip =
          data.addressComponents?.find((c) => c.types?.includes('postal_code'))?.shortText;
        const full = data.formattedAddress ?? s.text;
        onChange(full);
        onSelect?.({ ...s, text: full, zip: zip ?? s.zip });
        sessionToken.current = crypto.randomUUID();
        setSuggestions([]);
        return;
      }
    } catch {
      // fall through to the short-form path
    }

    // Fallback: Place Details failed, use the autocomplete text as-is
    onChange(s.text);
    onSelect?.(s);
    setSuggestions([]);
    sessionToken.current = crypto.randomUUID();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={
          className ??
          'w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
        }
        required={required}
        disabled={disabled}
        autoComplete="off"
        autoFocus={autoFocus}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-light" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-warm-border bg-paper shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setHighlighted(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlighted ? 'bg-warm-beige' : 'bg-paper'
              }`}
            >
              <div className="font-medium text-charcoal">
                {s.streetAddress ?? s.text}
              </div>
              {s.locality && (
                <div className="text-xs text-text-light">{s.locality}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
