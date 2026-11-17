import { whatsappDestination } from '../config/env';
import { quoteMessage, type QuoteFields } from '../content/whatsappMessages';
import type { Language } from '../i18n/LanguageContext';

/**
 * Builds a wa.me link from the configured, validated business number and
 * the prefilled quote message (content/whatsappMessages.ts), URL-encoded
 * with encodeURIComponent so line breaks, Arabic text and symbols survive.
 * Returns null when no valid number is configured -- callers hide the link
 * rather than guess one. Never used to auto-send data: it only builds a
 * link the user chooses to click.
 *
 * A short "(Ref: WA-...)" stamp (services/waRefCode.ts) is appended after
 * the client's own approved wording, never inside it - acceptance report
 * finding 1's "add Ref code to every wa.me link".
 *
 * `refCode` is a PARAMETER here, not generated inside this function (bug
 * fix, Nov 2026 QA: this site is build-time prerendered - scripts/build-site.mjs
 * - so a ref code generated here would freeze whatever date the build ran
 * on into the static HTML every visitor gets served until the next deploy,
 * e.g. "WA-1211-..." staying stuck on 12 Nov. The caller (WaLink.tsx) passes
 * `undefined` for the prerendered/pre-hydration render and the real,
 * freshly-dated code only once mounted client-side - see useIsClient.ts,
 * the same pattern Contact.tsx already uses for its own browser-only
 * values). `refCode` is still returned alongside the href so the caller
 * logs the SAME value to analytics, never a second, independently-built one.
 */
export function waHref(lang: Language, fields?: QuoteFields, refCode?: string): { href: string; refCode?: string } | null {
  if (!whatsappDestination) return null;
  const text = refCode ? `${quoteMessage(lang, fields)}\n\n(Ref: ${refCode})` : quoteMessage(lang, fields);
  return { href: `https://wa.me/${whatsappDestination}?text=${encodeURIComponent(text)}`, refCode };
}
