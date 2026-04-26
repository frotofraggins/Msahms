'use client';

/**
 * Event tracking for lead capture touchpoints.
 *
 * Tracks: form submissions, call clicks, chat initiations, valuation requests.
 * Logs: page source, timestamp, visitor session ID.
 * Captures UTM parameters and persists in lead records.
 *
 * Requirements: 12.3, 12.4
 */

// ---------------------------------------------------------------------------
// Session ID
// ---------------------------------------------------------------------------

const SESSION_KEY = 'mesahomes_session_id';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// UTM capture
// ---------------------------------------------------------------------------

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'mesahomes_utm';

export interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/** Capture UTM params from URL on page load and persist in sessionStorage. */
export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  const url = new URL(window.location.href);
  const params: UTMParams = {};

  if (url.searchParams.has('utm_source')) params.utmSource = url.searchParams.get('utm_source')!;
  if (url.searchParams.has('utm_medium')) params.utmMedium = url.searchParams.get('utm_medium')!;
  if (url.searchParams.has('utm_campaign')) params.utmCampaign = url.searchParams.get('utm_campaign')!;
  if (url.searchParams.has('utm_term')) params.utmTerm = url.searchParams.get('utm_term')!;
  if (url.searchParams.has('utm_content')) params.utmContent = url.searchParams.get('utm_content')!;

  if (Object.keys(params).length > 0) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
  }

  return params;
}

/** Get previously captured UTM params from sessionStorage. */
export function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Event tracking
// ---------------------------------------------------------------------------

export type TrackingEventType =
  | 'form_submit'
  | 'call_click'
  | 'chat_initiation'
  | 'valuation_request'
  | 'booking_submit'
  | 'tool_use'
  | 'lead_capture'
  | 'full_service_click'
  | 'listing_start';

export interface TrackingEvent {
  type: TrackingEventType;
  source: string;
  timestamp: string;
  sessionId: string;
  utm: UTMParams;
  metadata?: Record<string, unknown>;
}

/** In-memory event buffer — flushed to API or console in MVP. */
const eventBuffer: TrackingEvent[] = [];

declare global {
  interface Window {
    gtag?: (command: string, target: string, params?: Record<string, unknown>) => void;
    clarity?: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Track an event. Fans out to:
 *   1. In-memory buffer (for debugging + future batch flushing)
 *   2. Google Analytics 4 (if loaded) via gtag('event', ...)
 *   3. Microsoft Clarity custom tag (if loaded)
 *   4. Console (development only)
 *
 * GA4 / Clarity are no-ops when their scripts haven't loaded — so this
 * function is safe to call from any component regardless of whether
 * analytics is configured.
 */
export function trackEvent(
  type: TrackingEventType,
  source: string,
  metadata?: Record<string, unknown>,
): void {
  const event: TrackingEvent = {
    type,
    source,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    utm: getUTMParams(),
    metadata,
  };

  eventBuffer.push(event);

  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', type, {
      event_category: 'engagement',
      event_label: source,
      ...(metadata ?? {}),
    });
  }

  // Microsoft Clarity — tag the session with the event type so we can
  // filter session recordings by "lead_capture" etc.
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', type, source);
  }

  // Dev-only console log
  if (process.env.NODE_ENV === 'development') {
    console.log('[tracking]', event.type, event.source, event.metadata);
  }
}

/** Get all tracked events (for debugging). */
export function getTrackedEvents(): readonly TrackingEvent[] {
  return eventBuffer;
}

/**
 * Get UTM + session data to include in lead creation payloads.
 * Call this when submitting a lead to attach tracking context.
 */
export function getLeadTrackingContext(): Record<string, unknown> {
  const utm = getUTMParams();
  return {
    sessionId: getSessionId(),
    ...utm,
  };
}
