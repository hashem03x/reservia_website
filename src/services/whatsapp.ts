import { whatsappDestination } from '../config/env';
import { quoteMessage, type QuoteFields } from '../content/whatsappMessages';
import { buildWaRefCode } from './waRefCode';
import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

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
 * finding 1's "add Ref code to every wa.me link". `refCode` is returned
 * alongside the href so the caller (WaLink.tsx) can log the SAME value to
 * analytics, not a second, independently-generated one.
 */
export function waHref(lang: Language, segment: Segment, fields?: QuoteFields): { href: string; refCode: string } | null {
  if (!whatsappDestination) return null;
  const refCode = buildWaRefCode(segment);
  const text = `${quoteMessage(lang, fields)}\n\n(Ref: ${refCode})`;
  return { href: `https://wa.me/${whatsappDestination}?text=${encodeURIComponent(text)}`, refCode };
}
