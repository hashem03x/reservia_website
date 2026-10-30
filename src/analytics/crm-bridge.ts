import { submitLead, type LeadFormInput, type LeadSubmitResult } from '../services/leadService';
import { getAmplitudeDeviceId, trackQuoteFormSubmitted } from './amplitude';
import type { UtmParams } from '../hooks/useUtmParams';
import type { Language } from '../i18n/LanguageContext';

/**
 * The website's CRM bridge (Developer Brief section 4: "Website lead submission into CRM").
 * This is the one place a form's submit flow and Amplitude meet:
 *  1. delivers the lead via src/services/leadService.ts#submitLead (the real, already-tested HTTP
 *     call, idempotency-key header, mock/sent/error contract - reused here, not reimplemented);
 *  2. attaches this browser's own Amplitude device id to the request, so the CRM's
 *     `crm_lead_created` event can correlate with this visit (src/analytics/amplitude.ts);
 *  3. fires `quote_form_submitted` to Amplitude, but ONLY after the SAME "confirmed delivery or
 *     mock" condition src/services/analytics.ts#trackLeadGenerated already enforces for the
 *     dataLayer `generate_lead` event - never on a validation or network error, never twice for
 *     the same submission (useLeadForm.ts's own inFlight/eventId guards make a retry safe);
 *  4. returns the CRM's ref code (when a real lead was created) for the form to display.
 *
 * Deliberately does NOT reimplement validation, timeouts, or the mock/sent/error state machine -
 * all of that already lives correctly in leadService.ts/useLeadForm.ts.
 */
export async function submitQuote(
  input: LeadFormInput,
  context: { eventId: string; lang: Language; utm: UtmParams; page: string },
): Promise<LeadSubmitResult> {
  const result = await submitLead(input, { eventId: context.eventId, lang: context.lang, utm: context.utm, ampDeviceId: getAmplitudeDeviceId() });

  if (result.status === 'sent' || result.status === 'mock') {
    trackQuoteFormSubmitted({ segment: input.segment, source: input.source, page: context.page, outcome: result.status });
  }

  return result;
}
