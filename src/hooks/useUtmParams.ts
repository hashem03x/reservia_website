import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rsv_utm';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

type StoredUtm = { utm: UtmParams; firstTouchAt: number; referrer?: string; landingPage?: string };

/**
 * First-touch UTM attribution (acceptance report finding 1: "store first-touch UTM for 30
 * days"). Uses localStorage, not sessionStorage -- a session ends when the tab closes, which
 * made every previous visit's attribution vanish well before 30 days. Once a value is captured
 * here it is never overwritten by a later visit's different campaign params within the 30-day
 * window -- that is what "first-touch" means; only an expired (or empty) record starts fresh.
 */
function readStored(): StoredUtm | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as StoredUtm | null;
    if (!raw || Date.now() - raw.firstTouchAt > THIRTY_DAYS_MS) return null;
    return raw;
  } catch {
    return null; // storage unavailable (private mode, etc.) -- proceed without UTM context
  }
}

/** Exported for tests - captures (or returns the still-valid first-touch) UTM record for the current URL. */
export function captureUtm(): UtmParams {
  const existing = readStored();
  const utm: UtmParams = { ...existing?.utm };
  try {
    if (!existing) {
      const q = new URLSearchParams(window.location.search);
      UTM_KEYS.forEach((key) => {
        const value = q.get(key);
        if (value) utm[key] = value;
      });
    }
    // Referrer and landing page are only meaningful at first touch - captured once, same as the
    // UTM params themselves, never overwritten by a later visit/page. Without this, a visitor who
    // lands on a campaign page then clicks through to /contact before submitting would have the
    // form report /contact as the "landing page", losing the page the ad actually sent them to.
    const referrer = existing?.referrer ?? (typeof document !== 'undefined' ? document.referrer || undefined : undefined);
    const landingPage = existing?.landingPage ?? (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ utm, firstTouchAt: existing?.firstTouchAt ?? Date.now(), referrer, landingPage }));
  } catch {
    // storage unavailable -- the in-memory value below is still returned for this page load
  }
  return utm;
}

/** Non-hook accessor for use outside components (analytics click handlers). */
export function getStoredUtm(): UtmParams {
  return readStored()?.utm ?? {};
}

/** The first-touch referrer (document.referrer at the visitor's first arrival), or undefined if none was recorded. */
export function getStoredReferrer(): string | undefined {
  return readStored()?.referrer;
}

/** The first-touch landing page (the page the visitor actually arrived on, not wherever they submit from). */
export function getStoredLandingPage(): string | undefined {
  return readStored()?.landingPage;
}

export function useUtmParams(): UtmParams {
  const [utm, setUtm] = useState<UtmParams>({});
  useEffect(() => {
    setUtm(captureUtm());
  }, []);
  return utm;
}
