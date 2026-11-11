/**
 * Site-wide marketing attribution (CRM launch blocker C1/W1).
 *
 * The bug this replaces: attribution used to be captured only by the lead-form hook
 * (useLeadForm -> useUtmParams), i.e. only on pages that render a form. A visitor who landed on
 * /en/farms?utm_source=google&utm_medium=cpc&utm_campaign=test (no form on that page) and then
 * clicked "Get a free quote" had their FIRST capture happen on /en/contact - no UTM in that URL, an
 * internal referrer - so the CRM recorded Source: Direct, landing page /en/contact.
 *
 * Now `captureAttribution()` runs once per full page load from main.tsx (before React renders) and
 * again on every client-side route change (LangLayout), on EVERY page. It keeps:
 *
 *   first - the first-touch acquisition (the page and campaign that first brought the visitor in).
 *           Never overwritten while the record is alive - internal navigation, language switches,
 *           a direct revisit or a later campaign click all leave it untouched.
 *   last  - the most recent ATTRIBUTABLE campaign touch (a landing URL that carried UTM parameters
 *           or an ad click id). Only a new campaign landing replaces it; internal/direct page views
 *           never do. For a single-visit journey first === last.
 *
 * Storage: localStorage (primary) mirrored to a first-party cookie (survives storage partitioning
 * quirks and is shared between reservia-energy.com and www.reservia-energy.com), with an in-memory
 * copy so attribution still survives client-side navigation when both are blocked (private mode).
 * The record expires LOOKBACK_DAYS after the most recent attributable touch.
 *
 * Privacy: nothing here is personal data. Only the fixed allowlist of campaign parameters below is
 * read from the URL (never the rest of the query string, which could carry personal values); the
 * landing page is stored as a path; the referrer is reduced to its origin + path and only kept when
 * it is EXTERNAL. The record is first-party only and is sent to Reservia's own CRM solely as part
 * of an enquiry the visitor submits themselves.
 */

export const ATTRIBUTION_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'ttclid',
] as const;

export type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];
export type AttributionParams = Partial<Record<AttributionParam, string>>;

export interface Touch {
  /** Allowlisted campaign parameters present on the landing URL (may be empty for a direct/organic first touch). */
  params: AttributionParams;
  /** Landing path, e.g. "/en/farms". */
  landingPage: string;
  /** Landing path + ONLY the allowlisted campaign parameters, e.g. "/en/farms?utm_source=google&utm_medium=cpc". */
  landingUrl: string;
  /** External referrer (origin + path) at that landing, if any. Internal referrers are never stored. */
  referrer?: string;
  /** ISO timestamp of the touch. */
  at: string;
}

export interface AttributionRecord {
  v: 2;
  first: Touch;
  last: Touch;
}

export const STORAGE_KEY = 'rsv_attr';
export const COOKIE_NAME = 'rsv_attr';
/** Legacy first-touch record written by the old useUtmParams hook - imported once, then left alone. */
export const LEGACY_STORAGE_KEY = 'rsv_utm';
export const LOOKBACK_DAYS = 30;
const LOOKBACK_MS = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
const MAX_PARAM_LENGTH = 150;
const MAX_PATH_LENGTH = 250;

/** Hosts that are this website itself - a referrer from one of these is internal navigation, never a source. */
const OWN_HOST_SUFFIXES = ['reservia-energy.com'];

let memoryRecord: AttributionRecord | null = null;

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

/** True when `referrer` is empty or points at this site (same host, apex/www, or a known own domain). */
export function isInternalReferrer(referrer: string | undefined | null, currentHost: string): boolean {
  if (!referrer) return true;
  try {
    const host = stripWww(new URL(referrer).hostname);
    const current = stripWww(currentHost);
    if (host === current) return true;
    return OWN_HOST_SUFFIXES.some((own) => host === own || host.endsWith(`.${own}`));
  } catch {
    return true; // unparseable - never treat garbage as an acquisition source
  }
}

function cleanValue(value: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim().slice(0, MAX_PARAM_LENGTH);
  return trimmed.length ? trimmed : undefined;
}

/** Reads ONLY the allowlisted campaign parameters from a query string. */
export function readCampaignParams(search: string): AttributionParams {
  const out: AttributionParams = {};
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    return out;
  }
  for (const key of ATTRIBUTION_PARAMS) {
    const value = cleanValue(q.get(key));
    if (value) out[key] = value;
  }
  return out;
}

function hasCampaign(params: AttributionParams): boolean {
  return Object.keys(params).length > 0;
}

function sameParams(a: AttributionParams, b: AttributionParams): boolean {
  return ATTRIBUTION_PARAMS.every((k) => (a[k] ?? '') === (b[k] ?? ''));
}

function referrerOriginAndPath(referrer: string): string | undefined {
  try {
    const u = new URL(referrer);
    return `${u.origin}${u.pathname}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

export function buildTouch(location: { pathname: string; search: string; host: string }, referrer: string | undefined, now: Date): Touch {
  const params = readCampaignParams(location.search);
  const landingPage = (location.pathname || '/').slice(0, MAX_PATH_LENGTH);
  const query = new URLSearchParams();
  for (const key of ATTRIBUTION_PARAMS) if (params[key]) query.set(key, params[key]!);
  const qs = query.toString();
  const external = referrer && !isInternalReferrer(referrer, location.host) ? referrerOriginAndPath(referrer) : undefined;
  return {
    params,
    landingPage,
    landingUrl: (qs ? `${landingPage}?${qs}` : landingPage).slice(0, 600),
    ...(external ? { referrer: external } : {}),
    at: now.toISOString(),
  };
}

function isTouch(value: unknown): value is Touch {
  const t = value as Touch;
  return !!t && typeof t === 'object' && typeof t.landingPage === 'string' && typeof t.at === 'string' && typeof t.params === 'object' && t.params !== null;
}

function isValidRecord(value: unknown, now: Date): value is AttributionRecord {
  const r = value as AttributionRecord;
  if (!r || r.v !== 2 || !isTouch(r.first) || !isTouch(r.last)) return false;
  const lastAt = Date.parse(r.last.at);
  return Number.isFinite(lastAt) && now.getTime() - lastAt <= LOOKBACK_MS;
}

// ---------------------------------------------------------------- persistence

function readCookie(): string | null {
  try {
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') return null;
    const hit = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
    return hit ? decodeURIComponent(hit.slice(COOKIE_NAME.length + 1)) : null;
  } catch {
    return null;
  }
}

function cookieDomainAttr(host: string): string {
  const bare = stripWww(host.split(':')[0]);
  return OWN_HOST_SUFFIXES.includes(bare) ? `; Domain=.${bare}` : '';
}

function writeCookie(serialized: string): void {
  try {
    if (typeof document === 'undefined') return;
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    const domain = typeof location !== 'undefined' ? cookieDomainAttr(location.host) : '';
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; Max-Age=${Math.floor(LOOKBACK_MS / 1000)}; Path=/; SameSite=Lax${secure}${domain}`;
  } catch {
    // cookies blocked - localStorage / memory still hold the record
  }
}

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Imports the old hook's `rsv_utm` first-touch record (same 30-day rule) so visitors mid-journey during the deploy keep their source. */
function readLegacy(now: Date): AttributionRecord | null {
  try {
    const raw = parse(localStorage.getItem(LEGACY_STORAGE_KEY)) as { utm?: Record<string, string>; firstTouchAt?: number; referrer?: string; landingPage?: string } | null;
    if (!raw || typeof raw.firstTouchAt !== 'number' || now.getTime() - raw.firstTouchAt > LOOKBACK_MS) return null;
    const params: AttributionParams = {};
    for (const key of ATTRIBUTION_PARAMS) {
      const value = cleanValue(raw.utm?.[key] ?? null);
      if (value) params[key] = value;
    }
    let landingPage = '/';
    try {
      landingPage = raw.landingPage ? new URL(raw.landingPage, 'https://x.invalid').pathname : '/';
    } catch {
      /* keep "/" */
    }
    const touch: Touch = { params, landingPage, landingUrl: landingPage, at: new Date(raw.firstTouchAt).toISOString() };
    const host = typeof location !== 'undefined' ? location.host ?? '' : '';
    if (raw.referrer && !isInternalReferrer(raw.referrer, host)) {
      const ref = referrerOriginAndPath(raw.referrer);
      if (ref) touch.referrer = ref;
    }
    return { v: 2, first: touch, last: touch };
  } catch {
    return null;
  }
}

/** The current, still-valid attribution record, or null. Never throws. */
export function readAttribution(now: Date = new Date()): AttributionRecord | null {
  let fromStorage: unknown = null;
  try {
    fromStorage = parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    fromStorage = null;
  }
  if (isValidRecord(fromStorage, now)) return fromStorage;
  const fromCookie = parse(readCookie());
  if (isValidRecord(fromCookie, now)) return fromCookie;
  if (memoryRecord && isValidRecord(memoryRecord, now)) return memoryRecord;
  return readLegacy(now);
}

function persist(record: AttributionRecord): void {
  memoryRecord = record;
  const serialized = JSON.stringify(record);
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // storage unavailable - cookie + memory below
  }
  writeCookie(serialized);
}

/**
 * Records the current page view. Call on every full page load and every client-side navigation;
 * safe to call repeatedly. Returns the (possibly unchanged) record.
 *
 *  - no valid record yet  -> this page view is the first touch (and the last touch);
 *  - URL carries campaign parameters different from the current last touch -> new last touch;
 *  - anything else (internal navigation, language switch, direct revisit, same campaign reload)
 *    -> no change at all.
 */
export function captureAttribution(
  loc: { pathname: string; search: string; host: string } = typeof window !== 'undefined' ? window.location : { pathname: '/', search: '', host: '' },
  referrer: string | undefined = typeof document !== 'undefined' ? document.referrer || undefined : undefined,
  now: Date = new Date(),
): AttributionRecord {
  const existing = readAttribution(now);
  const touch = buildTouch(loc, referrer, now);

  if (!existing) {
    const record: AttributionRecord = { v: 2, first: touch, last: touch };
    persist(record);
    return record;
  }
  if (hasCampaign(touch.params) && !sameParams(existing.last.params, touch.params)) {
    const record: AttributionRecord = { ...existing, last: touch };
    persist(record);
    return record;
  }
  // Re-persist an imported legacy/cookie-only record so later reads are fast and consistent.
  persist(existing);
  return existing;
}

/** Wire shape sent to the CRM with a lead (backend: utils/validators/crm/publicLeadValidators.js). */
export interface AttributionPayload {
  first: Touch;
  last: Touch;
}

/** The record to attach to an enquiry right now (captures the current page first if nothing was recorded yet). */
export function attributionForSubmission(): AttributionPayload {
  const record = readAttribution() ?? captureAttribution();
  return { first: record.first, last: record.last };
}

/** Test helper - forgets the in-memory copy. */
export function __resetAttributionMemory(): void {
  memoryRecord = null;
}
