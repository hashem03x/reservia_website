import { env, isGa4Configured, isGtmConfigured, isMetaPixelConfigured } from '../config/env';
import { segmentGroup, type Segment } from '../config/navigation';
import { getStoredUtm } from '../hooks/useUtmParams';

/**
 * Analytics / tracking integration points, ported from the reference
 * template's "v2: tracking layer (GTM-ready)" block.
 *
 * `pushEvent()` always writes to window.dataLayer with a unique
 * `event_id` and the session's UTM params attached -- the one feed a GTM
 * container reads from. GA4 / GTM / Meta Pixel / Google Ads loaders are
 * real integrations that activate only once their VITE_* ID is set.
 *
 * Privacy: every payload passes through an allowlist (`ALLOWED_KEYS`).
 * Names, phone numbers, emails, free-text notes and typed addresses can
 * never reach the dataLayer, GA4 or the Meta Pixel -- not even by
 * accident from a future caller. Analytics is also kept separate from
 * lead delivery: a lead event fires only after the lead endpoint has
 * confirmed delivery, never before and never twice for the same id.
 *
 * Meta Conversions API: the lead `event_id` generated here is sent to the
 * lead endpoint with the lead itself (see leadService.ts), so the
 * server-side CAPI call can reuse it and Meta deduplicates the browser
 * Pixel `Lead` and the server `Lead` as one conversion. The server call
 * needs a private access token and lives outside this client bundle; see
 * docs/CLIENT_DECISIONS.md (decision 10).
 */

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqFunction;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

/** The only parameter names any event may carry (plus UTM/click-id keys from the session). */
const ALLOWED_KEYS = new Set([
  'page',
  'lang',
  'from_lang',
  'page_title',
  'segment',
  'group',
  'source',
  'system_size_kwp',
  'site_input',
  // 'sent' | 'mock' - whether a quote form's submission was actually delivered to the CRM or ran
  // in preview/mock mode (no endpoint configured). Added for src/analytics/amplitude.ts's
  // `quote_form_submitted` event; not a PII risk (a fixed, two-value enum), so it is safe to
  // allow for every event through this one shared filter rather than a second allowlist.
  'outcome',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
]);

/** Belt and braces: drop any string that looks like an email address or a phone number, even under an allowed key. */
const LOOKS_LIKE_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const LOOKS_LIKE_PHONE = /(?:\+?\d[\s\-().]*){8,}/;

export function sanitizeParams(params: Record<string, unknown> = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_KEYS.has(key) || value === undefined || value === null) continue;
    if (typeof value === 'number') {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === 'string') {
      // Paths and titles are fine; anything resembling contact data is not.
      // (Click ids are opaque random tokens and may legitimately contain long digit runs.)
      const opaque = key === 'page' || key === 'gclid' || key === 'fbclid';
      if (!opaque && (LOOKS_LIKE_EMAIL.test(value) || LOOKS_LIKE_PHONE.test(value))) continue;
      out[key] = value.slice(0, 200);
    }
  }
  return out;
}

export function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
}

/** Pushes one event to window.dataLayer with an event_id and the session's UTM context attached. Returns the event_id. */
export function pushEvent(event: string, params?: Record<string, unknown>, eventId: string = newEventId()): string {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_id: eventId, ...sanitizeParams({ ...getStoredUtm(), ...params }) });
  return eventId;
}

function injectScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      // gtag.js expects the Arguments object itself on the dataLayer.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
    };
}

function initGa4() {
  if (!isGa4Configured) return;
  ensureGtag();
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${env.ga4MeasurementId}`);
  window.gtag!('js', new Date());
  // Page views are sent explicitly per route by trackPageView(), so the
  // automatic one is disabled -- otherwise the first page counts twice.
  window.gtag!('config', env.ga4MeasurementId, { send_page_view: false });
}

function initGtm() {
  if (!isGtmConfigured) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${env.gtmContainerId}`);
}

function initGoogleAds() {
  if (!env.googleAdsConversionId) return;
  if (!isGa4Configured) {
    ensureGtag();
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${env.googleAdsConversionId}`);
    window.gtag!('js', new Date());
  }
  window.gtag!('config', env.googleAdsConversionId, { send_page_view: false });
}

function initMetaPixel() {
  if (!isMetaPixelConfigured) return;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as FbqFunction;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
    injectScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  // No automatic PageView here: trackPageView() sends one per route, with an eventID.
  window.fbq('init', env.metaPixelId);
}

let initialized = false;

/** Call once, before the first render (see main.tsx). Safe to call multiple times. */
export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  initGa4();
  initGtm();
  initGoogleAds();
  initMetaPixel();
}

export const isAnalyticsReady =
  isGa4Configured || isGtmConfigured || isMetaPixelConfigured || Boolean(env.googleAdsConversionId);

let lastPageViewKey: string | null = null;

/**
 * One page_view per distinct route + language. Re-renders, React
 * StrictMode's double effects and theme changes never produce a second
 * event for the same page.
 */
export function trackPageView(page: string, lang: string, pageTitle: string): string | null {
  const key = `${lang}|${page}`;
  if (key === lastPageViewKey) return null;
  lastPageViewKey = key;
  const id = pushEvent('page_view', { page, lang, page_title: pageTitle });
  if (isGa4Configured && window.gtag) {
    window.gtag('event', 'page_view', { page_path: page, page_title: pageTitle, language: lang, event_id: id });
  }
  if (isMetaPixelConfigured && window.fbq) {
    window.fbq('track', 'PageView', {}, { eventID: id });
  }
  return id;
}

/** Test helper: forget the last page view so the next one is tracked. */
export function resetPageViewDedupe() {
  lastPageViewKey = null;
}

export function trackLanguageChange(page: string, fromLang: string, toLang: string) {
  pushEvent('language_change', { page, from_lang: fromLang, lang: toLang });
}

export function trackWhatsappClick(segment: Segment, page: string, systemSizeKwp?: number) {
  pushEvent('click_whatsapp', {
    segment,
    group: segmentGroup(segment),
    page,
    system_size_kwp: systemSizeKwp !== undefined ? Math.round(systemSizeKwp * 10) / 10 : undefined,
  });
}

export function trackCallClick(page: string) {
  pushEvent('click_call', { page });
}

export function trackEmailClick(page: string) {
  pushEvent('click_email', { page });
}

export type LeadSource = 'contact_form' | 'landing_form';

const trackedLeadIds = new Set<string>();

/**
 * Records a delivered lead. Call ONLY after submitLead() returned
 * `{ status: 'sent' }`, with the same eventId that was sent to the lead
 * endpoint (so a server-side Meta CAPI call can deduplicate against it).
 * Returns false -- and sends nothing -- if this eventId was already
 * tracked. Only non-identifying fields are accepted by design.
 */
export function trackLeadGenerated(
  eventId: string,
  params: { segment: Segment; source: LeadSource; page: string; lang: string; siteInput?: number },
): boolean {
  if (trackedLeadIds.has(eventId)) return false;
  trackedLeadIds.add(eventId);
  const group = segmentGroup(params.segment);
  pushEvent(
    'generate_lead',
    { segment: params.segment, group, source: params.source, page: params.page, lang: params.lang, site_input: params.siteInput },
    eventId,
  );
  if (isGa4Configured && window.gtag) {
    window.gtag('event', 'generate_lead', { segment: params.segment, group, source: params.source, event_id: eventId });
  }
  if (isMetaPixelConfigured && window.fbq) {
    window.fbq('track', 'Lead', { segment: params.segment, group, source: params.source }, { eventID: eventId });
  }
  return true;
}
