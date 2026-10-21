/**
 * Client-side lead-form validation shared by the contact form and the
 * campaign landing-page form. Usability support only -- the lead
 * endpoint must validate again server-side.
 */

/** Characters people commonly type in a phone number besides digits. */
const PHONE_ALLOWED = /^[\d\s+()\-./]+$/;
export const PHONE_MIN_DIGITS = 8;
export const PHONE_MAX_DIGITS = 15;

/** Arabic-Indic (U+0660-0669) and Extended Arabic-Indic (U+06F0-06F9) digits -> ASCII, so Arabic keyboards validate correctly. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export type FieldError = 'required' | 'phone_invalid' | 'number_invalid' | null;

export function validateName(value: string): FieldError {
  return value.trim().length === 0 ? 'required' : null;
}

/** Valid when only digits and permitted formatting are used and 8-15 digits remain after removing the formatting. */
export function validatePhone(value: string): FieldError {
  const v = normalizeDigits(value).trim();
  if (!v) return 'required';
  if (!PHONE_ALLOWED.test(v)) return 'phone_invalid';
  const digits = v.replace(/\D/g, '').length;
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS ? null : 'phone_invalid';
}

/** Optional numeric field: empty is fine; otherwise a finite, non-negative number. */
export function validateOptionalNumber(value: string): FieldError {
  const v = normalizeDigits(value).trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? null : 'number_invalid';
}

/** Optional numeric field -> number or undefined (never NaN). */
export function parseOptionalNumber(value: string): number | undefined {
  const v = normalizeDigits(value).trim();
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
