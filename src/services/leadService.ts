import { env, isLeadsApiConfigured } from '../config/env';
import type { UtmParams } from '../hooks/useUtmParams';
import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

export interface LeadFormInput {
  name: string;
  phone: string;
  segment: Segment;
  governorate?: string;
  message?: string;
  /** Numeric field from a landing-page form (bill, pump hp, diesel litres, ...). */
  siteInput?: number;
  source: 'contact_form' | 'landing_form';
}

export interface LeadPayload extends LeadFormInput {
  eventId: string;
  lang: Language;
  pageUrl: string;
  utm: UtmParams;
  submittedAt: string;
}

export type LeadSubmitResult = { status: 'sent' } | { status: 'mock' } | { status: 'error'; message: string };

/**
 * Lead-capture service adapter.
 *
 * No CRM/lead-capture endpoint or credentials were supplied with this
 * project -- the reference template's own prototype copy says the same
 * thing ("Forms log locally; CRM and tracking connect at launch").
 * VITE_LEADS_API_URL is the single integration point: unset, this
 * adapter logs locally and returns `{ status: 'mock' }`; callers must
 * surface that as "not actually delivered." When the URL is configured,
 * this performs a real POST and only reports success on a 2xx response.
 *
 * No secrets or CRM tokens are included here -- authentication for the
 * real endpoint must be handled server-side (e.g. a backend proxy).
 */
export async function submitLead(
  input: LeadFormInput,
  context: { eventId: string; lang: Language; utm: UtmParams },
): Promise<LeadSubmitResult> {
  const payload: LeadPayload = {
    ...input,
    eventId: context.eventId,
    lang: context.lang,
    pageUrl: window.location.href,
    utm: context.utm,
    submittedAt: new Date().toISOString(),
  };

  if (!isLeadsApiConfigured) {
    console.info('[leadService] Mock mode (VITE_LEADS_API_URL not set) -- payload was NOT delivered:', payload);
    return { status: 'mock' };
  }

  try {
    const response = await fetch(env.leadsApiUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { status: 'error', message: `Server responded with status ${response.status}` };
    }
    return { status: 'sent' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Network error while submitting the enquiry' };
  }
}

/** Matches the template's `sgrp()`: service rolls up to industrial for analytics grouping. */
export function segmentGroup(segment: Segment): string {
  return segment === 'service' ? 'industrial' : segment;
}
