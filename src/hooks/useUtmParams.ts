import { useEffect, useState } from 'react';
import { captureAttribution, readAttribution, type AttributionParams } from '../analytics/attribution';

/**
 * Backward-compatible accessors over the site-wide attribution store (src/analytics/attribution.ts).
 *
 * Attribution is no longer captured here on form mount - it is captured on EVERY page load and
 * client-side navigation (main.tsx + LangLayout), so a visitor who lands on a campaign page and
 * only later opens a form keeps the campaign that brought them in. These helpers keep their old
 * names and semantics (first-touch UTM, first-touch referrer, first-touch landing page) for the
 * existing callers: analytics event context, WhatsApp ref-code registration and the lead form.
 */
export type UtmParams = AttributionParams;

/** Captures the current page (no-op if a first touch already exists) and returns the FIRST-touch parameters. */
export function captureUtm(): UtmParams {
  return { ...captureAttribution().first.params };
}

/** First-touch campaign parameters (UTM + click ids), or {} if nothing was recorded. */
export function getStoredUtm(): UtmParams {
  return { ...(readAttribution()?.first.params ?? {}) };
}

/** The first-touch EXTERNAL referrer, or undefined if the visitor arrived directly / it was internal. */
export function getStoredReferrer(): string | undefined {
  return readAttribution()?.first.referrer;
}

/** The first-touch landing page path (where the visitor actually arrived, not where they submit from). */
export function getStoredLandingPage(): string | undefined {
  return readAttribution()?.first.landingPage;
}

export function useUtmParams(): UtmParams {
  const [utm, setUtm] = useState<UtmParams>({});
  useEffect(() => {
    setUtm(captureUtm());
  }, []);
  return utm;
}
