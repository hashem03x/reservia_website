import { env, isGa4Configured, isGtmConfigured, isMetaPixelConfigured } from '../config/env';
import { getStoredUtm } from '../hooks/useUtmParams';

/**
 * Analytics / tracking integration points, ported from the reference
 * template's "v2: tracking layer (GTM-ready)" block.
 *
 * `pushEvent()` always writes to window.dataLayer with a stable
 * `event_id` and the session's UTM params attached, exactly like the
 * template's `dl()` -- this is the one feed a real GTM container would
 * read from to fire GA4 / Meta Pixel / Google Ads. The provider loaders
 * below (GA4, GTM, Meta Pixel, Google Ads) are real, functional
 * integrations that activate only once their VITE_* measurement ID is
 * configured; with nothing configured, events still land in
 * window.dataLayer (inspectable in devtools) but are not sent anywhere.
 *
 * Meta Conversions API (CAPI): requires a server-side call signed with a
 * private access token, which must never live in this client bundle.
 * The shared `event_id` is what lets a future server-side CAPI call
 * deduplicate against this client-side Pixel event -- implementing that
 * server call is backend work outside this project's scope.
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

function eid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'e' + Date.now() + Math.random().toString(16).slice(2, 8);
  }
}

/** Pushes one event to window.dataLayer with an event_id and the session's UTM context attached. Returns the event_id. */
export function pushEvent(event: string, params?: Record<string, unknown>): string {
  const id = eid();
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_id: id, ...getStoredUtm(), ...params });
  return id;
}

function injectScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initGa4() {
  if (!isGa4Configured) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args as unknown as Record<string, unknown>);
    };
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${env.ga4MeasurementId}`);
  window.gtag('js', new Date());
  window.gtag('config', env.ga4MeasurementId);
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
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer!.push(args as unknown as Record<string, unknown>);
      };
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${env.googleAdsConversionId}`);
    window.gtag('js', new Date());
  }
  window.gtag!('config', env.googleAdsConversionId);
}

function initMetaPixel() {
  if (!isMetaPixelConfigured) return;
  if (!window.fbq) {
    const fbq = function (this: FbqFunction, ...args: unknown[]) {
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
  window.fbq('init', env.metaPixelId);
  window.fbq('track', 'PageView');
}

let initialized = false;

/** Call once, on app start. Safe to call multiple times. */
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

export function trackPageView(page: string, lang: string, pageTitle: string) {
  pushEvent('page_view', { page, lang, page_title: pageTitle });
}

export function trackLanguageChange(page: string, lang: string) {
  pushEvent('language_change', { page, lang });
}

export function trackWhatsappClick(segment: string, segmentGroup: string, page: string) {
  pushEvent('click_whatsapp', { segment, segment_group: segmentGroup, page });
}

export function trackCallClick(page: string) {
  pushEvent('click_call', { page });
}

export function trackEmailClick(page: string) {
  pushEvent('click_email', { page });
}

/** source: 'contact_form' | 'landing_form'. No name/phone/area is ever included -- only non-identifying fields. */
export function trackLeadGenerated(params: {
  segment: string;
  segmentGroup: string;
  source: 'contact_form' | 'landing_form';
  page: string;
  lang: string;
  siteInput?: number;
}): string {
  const id = pushEvent('generate_lead', {
    segment: params.segment,
    segment_group: params.segmentGroup,
    source: params.source,
    page: params.page,
    lang: params.lang,
    site_input: params.siteInput,
  });

  if (isGa4Configured && window.gtag) {
    window.gtag('event', 'generate_lead', { segment: params.segment, event_id: id });
  }
  if (isMetaPixelConfigured && window.fbq) {
    window.fbq('track', 'Lead', { segment: params.segment }, { eventID: id });
  }
  return id;
}
