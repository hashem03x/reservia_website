import { env, isLeadsApiConfigured, isCrmConfigured } from '../config/env';
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
  /** On-grid sites: which figure the visitor entered (never both). */
  gridInput?: 'bill' | 'kwh';
  /** Diesel sites and farms: how diesel use was entered (never both); farms may use pump hours instead. */
  dieselInput?: 'litres' | 'egp' | 'pump-hours';
  monthlyKwh?: number;
  roofM2?: number;
  battery?: boolean;
  pumpHp?: number;
  crop?: string;
  tree?: string;
  facilityType?: string;
  monthlyElectricityCostEgp?: number;
  monthlyDieselLitres?: number;
  monthlyDieselCostEgp?: number;
  /** Residential: the share chosen on the slider; omitted when the recommended size is used. Sites: share to supply from solar. */
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
  /**
   * Honeypot (Developer Brief: "a hidden honeypot input"). Always empty for a real visitor -- the
   * field is visually hidden and never asked for (see LeadForm.tsx / Contact.tsx). Sent to the
   * CRM as `website`; a non-empty value there is treated as a bot submission and silently
   * discarded (no lead created), never surfaced as an error to whatever filled it in.
   */
  honeypot?: string;
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
  /**
   * The visitor's own Amplitude device id (src/analytics/amplitude.ts#getAmplitudeDeviceId) --
   * a random, non-personal, Amplitude-managed identifier, never a name/phone/email. Lets the CRM's
   * own `crm_lead_created` Amplitude event share the same device id as this browser's
   * `page_view`/`quote_form_submitted` events, which is how the two become correlated as one
   * Amplitude user -- see src/analytics/crm-bridge.ts. Omitted entirely when Amplitude isn't
   * configured/initialized; the CRM then just generates its own.
   */
  ampDeviceId?: string;
}

export type LeadSubmitResult = { status: 'sent'; refCode?: string } | { status: 'mock' } | { status: 'error'; message: string };

const TIMEOUT_MS = 15000;

// Resolves to the real CRM's public intake endpoint
// (backend/server/routes/crm/publicLeadRoute.js, POST /crm/public/leads). VITE_LEADS_API_URL,
// when set, is a full-URL override (e.g. a proxy in front of the CRM) and takes precedence;
// VITE_CRM_URL (the CRM backend's own base URL) is the normal way to configure this.
const PUBLIC_LEAD_PATH = '/crm/public/leads';
function resolveLeadsEndpoint(): string | undefined {
  if (env.leadsApiUrl && env.leadsApiUrl.trim().length > 0) return env.leadsApiUrl;
  if (isCrmConfigured) return `${env.crmUrl}${PUBLIC_LEAD_PATH}`;
  return undefined;
}
const isDeliveryConfigured = isLeadsApiConfigured || isCrmConfigured;

/**
 * Lead-capture service adapter -- posts to the real Reservia CRM's public, unauthenticated
 * lead-intake endpoint (see resolveLeadsEndpoint above).
 *
 * Unset (no VITE_CRM_URL/VITE_LEADS_API_URL), this adapter delivers nothing and returns
 * `{ status: 'mock' }`; callers must show that as "not sent". When configured, it performs a real
 * POST and reports success only on a 2xx response -- a network failure, timeout or non-2xx
 * response is an error, never a false success. A honeypot-triggered submission still gets back a
 * 2xx / `{ status: 'sent' }` (by design -- see the CRM's own publicLeadController.js comment on
 * why a detected bot is never told so), just without a `refCode` (nothing was actually created).
 *
 * Personal data goes only to this endpoint. It is never logged with its contents and never passed
 * to analytics. No secrets or CRM tokens are included here -- the endpoint is public by design.
 */
export async function submitLead(
  input: LeadFormInput,
  context: { eventId: string; lang: Language; utm: UtmParams; ampDeviceId?: string },
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
    ampDeviceId: context.ampDeviceId,
  };

  const endpoint = resolveLeadsEndpoint();
  if (!isDeliveryConfigured || !endpoint) {
    if (import.meta.env.DEV) {
      console.info('[leadService] Preview mode (VITE_CRM_URL/VITE_LEADS_API_URL not set): the lead was NOT delivered.', {
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
    // The CRM's wire field is `website` (Developer Brief's exact honeypot field name), not
    // `honeypot` -- renamed only at the serialization boundary so forms/tests can keep calling it
    // by its self-documenting internal name.
    const { honeypot, ...rest } = payload;
    const wireBody = { ...rest, website: honeypot ?? '' };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.eventId },
      body: JSON.stringify(wireBody),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { status: 'error', message: `Server responded with status ${response.status}` };
    }
    const refCode = await extractRefCode(response);
    return { status: 'sent', refCode };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Network error while submitting the enquiry' };
  } finally {
    window.clearTimeout(timer);
  }
}

/** The CRM's own `{ success, message, data: { refCode } }` shape -- malformed/unexpected bodies never throw, just omit the code. */
async function extractRefCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { data?: { refCode?: unknown } };
    return typeof body?.data?.refCode === 'string' ? body.data.refCode : undefined;
  } catch {
    return undefined;
  }
}
