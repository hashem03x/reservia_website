import { env, isLeadsApiConfigured } from '../config/env';
import { segmentGroup, type Segment } from '../config/navigation';
import type { UtmParams } from '../hooks/useUtmParams';
import type { Language } from '../i18n/LanguageContext';

export { segmentGroup };

/**
 * The savings-calculator estimate a visitor chose to send with their
 * enquiry ("Get an exact quote"). Built only from the active tab's
 * fields, so inputs from another category are never carried over.
 * Option ids (crop, tree, facility type) are stable identifiers from
 * src/content/farmCrops.ts and the calculator, never free text.
 */
export interface CalculatorContext {
  category: 'residential_commercial' | 'agricultural_farms' | 'industrial_facilities' | 'services_sector';
  siteConfig?: 'on-grid' | 'off-grid';
  monthlyKwh?: number;
  roofM2?: number;
  battery?: boolean;
  pumpHp?: number;
  crop?: string;
  tree?: string;
  facilityType?: string;
  monthlyElectricityCostEgp?: number;
  solarSharePct?: number;
  dieselPriceEgp?: number;
  systemSizeKwp: number;
  indicativePriceEgp: number;
  yearlySavingEgp: number;
  paybackYears: number | null;
}

export interface LeadFormInput {
  name: string;
  phone: string;
  segment: Segment;
  governorate?: string;
  message?: string;
  /** Numeric field from a landing-page form (bill, pump hp, diesel litres, ...). */
  siteInput?: number;
  source: 'contact_form' | 'landing_form';
  calculator?: CalculatorContext;
}

export interface LeadPayload extends LeadFormInput {
  /**
   * Same id as the browser `generate_lead` / Meta Pixel `Lead` event. The
   * CRM should store it and the server-side Meta Conversions API call must
   * send it as `event_id`, so Meta counts the browser and server events as
   * one conversion. See docs/CLIENT_DECISIONS.md, decision 10.
   */
  eventId: string;
  /** Reporting group: 'industrial' for the service sector (website assumption). */
  segmentGroup: string;
  lang: Language;
  pageUrl: string;
  utm: UtmParams;
  submittedAt: string;
}

export type LeadSubmitResult = { status: 'sent' } | { status: 'mock' } | { status: 'error'; message: string };

const TIMEOUT_MS = 15000;

/**
 * Lead-capture service adapter.
 *
 * VITE_LEADS_API_URL is the single integration point. Unset, this adapter
 * delivers nothing and returns `{ status: 'mock' }`; callers must show
 * that as "not sent". When the URL is configured, it performs a real POST
 * and reports success only on a 2xx response -- a network failure,
 * timeout or non-2xx response is an error, never a false success.
 *
 * Personal data goes only to this endpoint (ideally a server-side proxy
 * in front of the CRM). It is never logged with its contents and never
 * passed to analytics. No secrets or CRM tokens are included here.
 */
export async function submitLead(
  input: LeadFormInput,
  context: { eventId: string; lang: Language; utm: UtmParams },
): Promise<LeadSubmitResult> {
  const payload: LeadPayload = {
    ...input,
    eventId: context.eventId,
    segmentGroup: segmentGroup(input.segment),
    lang: context.lang,
    // Path only: query strings can carry campaign or personal parameters.
    pageUrl: window.location.origin + window.location.pathname,
    utm: context.utm,
    submittedAt: new Date().toISOString(),
  };

  if (!isLeadsApiConfigured) {
    if (import.meta.env.DEV) {
      console.info('[leadService] Preview mode (VITE_LEADS_API_URL not set): the lead was NOT delivered.', {
        eventId: payload.eventId,
        segment: payload.segment,
        source: payload.source,
      });
    }
    return { status: 'mock' };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(env.leadsApiUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.eventId },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { status: 'error', message: `Server responded with status ${response.status}` };
    }
    return { status: 'sent' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Network error while submitting the enquiry' };
  } finally {
    window.clearTimeout(timer);
  }
}
