import { whatsappDestination } from '../config/env';
import { WAMSG } from '../content/whatsappMessages';
import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

/**
 * Builds a wa.me link from the configured, validated business number
 * plus a segment-specific prefilled message (see whatsappMessages.ts).
 * The text is URL-encoded with encodeURIComponent, so line breaks,
 * Arabic text and symbols survive intact. Returns null when no valid
 * number is configured -- callers hide the link rather than guess one.
 * Never used to auto-send form data: it only builds a link the user
 * chooses to click.
 */
export function waHref(lang: Language, segment: Segment, extra?: string): string | null {
  if (!whatsappDestination) return null;
  const base = WAMSG[lang][segment] ?? WAMSG[lang].general;
  return `https://wa.me/${whatsappDestination}?text=${encodeURIComponent(base + (extra ?? ''))}`;
}
