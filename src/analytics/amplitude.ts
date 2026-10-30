import * as amplitude from '@amplitude/analytics-browser';
import { env, isAmplitudeConfigured } from '../config/env';
import { sanitizeParams } from '../services/analytics';
import { getStoredUtm } from '../hooks/useUtmParams';
import { segmentGroup, type Segment } from '../config/navigation';

/**
 * Amplitude Browser SDK 2.x (Developer Brief section 5/4H) -- a SEPARATE analytics channel from
 * src/services/analytics.ts (the existing GA4/GTM/Meta Pixel/dataLayer integration, which this
 * file does not touch, replace, or duplicate). Amplitude feeds the CRM's own product-analytics
 * project; the dataLayer feeds marketing/ads platforms. Both read the SAME first-party UTM
 * context (useUtmParams) and the SAME privacy allowlist (sanitizeParams), so the two channels can
 * never silently disagree about what counts as a safe property.
 *
 * PRIVACY (mandatory):
 *  - `trackingOptions.ipAddress: false` -- IP tracking explicitly off.
 *  - `autocapture: false` -- NOTHING is auto-captured (no element clicks, no form-interaction
 *    capture, no network/page-content capture, no built-in attribution). Only the three
 *    hand-picked events below are ever sent, each only with allowlisted, non-PII properties.
 *  - Every property passes through sanitizeParams() before being sent -- the identical filter
 *    src/services/analytics.ts#pushEvent already uses, not a parallel, driftable copy.
 *  - No name, phone, email, message/note content, or raw form payload is ever passed to track().
 */

let initialized = false;

/** Call once, as early as possible (see main.tsx). Safe to call multiple times - a no-op after the first. */
export function initAmplitude() {
  if (initialized) return;
  if (!isAmplitudeConfigured) return; // mock mode: no key configured, nothing loads, nothing fires
  initialized = true;
  amplitude.init(env.amplitudeApiKey!, {
    trackingOptions: { ipAddress: false },
    autocapture: false,
    defaultTracking: false,
  });
}

export const isAmplitudeReady = () => initialized;

/**
 * The visitor's own Amplitude device id -- a random, Amplitude-managed identifier, never derived
 * from or containing any personal data. Sent to the CRM alongside a lead submission
 * (src/analytics/crm-bridge.ts) so the CRM's `crm_lead_created` event and this browser's own
 * events share one Amplitude identity -- the supported, privacy-safe correlation mechanism the
 * integration brief asks for. Returns undefined when Amplitude isn't initialized (mock mode).
 */
export function getAmplitudeDeviceId(): string | undefined {
  if (!initialized) return undefined;
  return amplitude.getDeviceId();
}

function track(eventName: string, params?: Record<string, unknown>) {
  if (!initialized) return;
  amplitude.track(eventName, sanitizeParams({ ...getStoredUtm(), ...params }));
}

let lastPageViewKey: string | null = null;

/** One page_view per distinct route + language, mirroring src/services/analytics.ts#trackPageView's own dedupe rule. */
export function trackPageView(page: string, lang: string) {
  const key = `${lang}|${page}`;
  if (key === lastPageViewKey) return;
  lastPageViewKey = key;
  track('page_view', { page, lang });
}

/** Test helper: forget the last page view so the next one is tracked. */
export function resetAmplitudePageViewDedupe() {
  lastPageViewKey = null;
}

/** Mirrors src/services/analytics.ts#trackWhatsappClick's call sites exactly (see WaLink.tsx) - same segment, same page, at the same click. */
export function trackWhatsappClicked(segment: Segment, page: string) {
  track('whatsapp_clicked', { segment, group: segmentGroup(segment), page });
}

export type QuoteFormOutcome = 'sent' | 'mock';

/**
 * Fires ONLY after the lead endpoint confirms delivery (or mock/preview mode) -- never before,
 * never on a validation or network error, mirroring src/services/analytics.ts#trackLeadGenerated's
 * own "only after confirmed delivery" rule. Never includes the form's actual contents (name,
 * phone, message) -- only the segment/source/outcome it was already safe to log.
 */
export function trackQuoteFormSubmitted(params: { segment: Segment; source: 'contact_form' | 'landing_form'; page: string; outcome: QuoteFormOutcome }) {
  track('quote_form_submitted', { segment: params.segment, group: segmentGroup(params.segment), source: params.source, page: params.page, outcome: params.outcome });
}
