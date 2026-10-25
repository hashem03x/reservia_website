import { whatsappDestination } from '../config/env';
import { quoteMessage, type QuoteFields } from '../content/whatsappMessages';
import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

/**
 * Builds a wa.me link from the configured, validated business number and
 * the prefilled quote message (content/whatsappMessages.ts), URL-encoded
 * with encodeURIComponent so line breaks, Arabic text and symbols survive.
 * `segment` is kept for analytics and call-site clarity; every segment uses
 * the same client-approved message. Returns null when no valid number is
 * configured -- callers hide the link rather than guess one. Never used to
 * auto-send data: it only builds a link the user chooses to click.
 */
export function waHref(lang: Language, _segment: Segment, fields?: QuoteFields): string | null {
  if (!whatsappDestination) return null;
  return `https://wa.me/${whatsappDestination}?text=${encodeURIComponent(quoteMessage(lang, fields))}`;
}
