/**
 * A short attribution stamp appended to every WhatsApp prefilled message (acceptance report
 * finding 1: "WhatsApp links carry no Ref code... add Ref code to every wa.me link"). Generated
 * entirely client-side, at the moment the link is built - there is no backend round-trip before
 * wa.me opens, and no Lead exists yet to issue a real CRM reference for.
 *
 * Deliberately prefixed `WA-`, not `RSV-`: this is NOT the CRM's own atomic, sequential lead
 * reference code (utils/crm/refCode.js on the backend) - it carries no uniqueness guarantee
 * beyond "very unlikely to collide inside one business day". Its only job is to give the sales
 * team a short, visible tag in the customer's own first WhatsApp message so they can trace it
 * back to the page/segment/campaign that produced the click (via the matching `wa_ref` property
 * on the `whatsapp_clicked` Amplitude event - see components/ui/WaLink.tsx).
 */

import { env, isCrmConfigured } from '../config/env';
import { getStoredReferrer, getStoredUtm } from '../hooks/useUtmParams';

const WA_REF_PATH = '/crm/public/wa-ref';

/**
 * Registers this ref code's first-touch attribution with the CRM (Change Request 1, Feature 1:
 * "WhatsApp with recognized Ref code -> that code's source"), so that when the customer's first
 * inbound WhatsApp message is parsed for a `WA-...` code, the CRM already knows what campaign
 * produced it. Fire-and-forget: never awaited by the caller, never blocks or delays the wa.me
 * link opening, and any failure (CRM unreachable, not configured) is swallowed -- worst case the
 * lead just falls back to the generic "WhatsApp Direct" source, same as before this existed.
 * `keepalive` lets the request survive the page navigating away right after the click.
 */
export function registerWaRefCode(code: string): void {
  if (!isCrmConfigured) return;
  const utm = getStoredUtm();
  const body = JSON.stringify({
    code,
    utmSource: utm.utm_source ?? null,
    utmMedium: utm.utm_medium ?? null,
    utmCampaign: utm.utm_campaign ?? null,
    utmContent: utm.utm_content ?? null,
    referrer: getStoredReferrer() ?? null,
  });
  try {
    fetch(`${env.crmUrl}${WA_REF_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort only
  }
}

const SEGMENT_TAGS: Record<string, string> = {
  villas: 'VIL',
  compounds: 'CMP',
  agriculture: 'FRM',
  industrial: 'OIL',
  service: 'SRV',
  general: 'GEN',
  calc: 'CLC',
};

function cairoDayMonth(date: Date): { day: string; month: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: '2-digit' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { day: parts.day, month: parts.month };
}

/** 4 base-36 characters from the current time, so two clicks in the same millisecond still differ in practice. */
function shortSuffix(): string {
  return Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0');
}

/** @returns e.g. "WA-0511-VIL-K2F9" */
export function buildWaRefCode(segment: string, date: Date = new Date()): string {
  const { day, month } = cairoDayMonth(date);
  const tag = SEGMENT_TAGS[segment] ?? 'GEN';
  return `WA-${day}${month}-${tag}-${shortSuffix()}`;
}
