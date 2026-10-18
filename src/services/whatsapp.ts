import { env } from '../config/env';
import { WAMSG } from '../content/whatsappMessages';
import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

/**
 * Builds a wa.me link from the configured business number (real default:
 * the number published in the supplied reference template) plus a
 * segment-specific prefilled message, ported from the template's
 * `waHref()`. Never used to auto-send form data -- only to build a link
 * the user clicks themselves.
 */
export function waHref(lang: Language, segment: Segment, extra?: string): string {
  const digitsOnly = env.whatsappNumber.replace(/[^\d]/g, '');
  const base = WAMSG[lang][segment] ?? WAMSG[lang].general;
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(base + (extra ?? ''))}`;
}
