import type { Language } from '../i18n/LanguageContext';

/**
 * Prefilled WhatsApp quote message (client wording, October 2026):
 *
 *   Hello Reservia, I'd like a solar quote (Please attach Electricity bill).
 *
 *   Location: [user input]
 *   Monthly bill or consumption: [user input]
 *
 * One template for every WhatsApp quote CTA. Values the visitor already
 * entered (calculator, contact or campaign form) are filled in; anything
 * unknown is left blank after the label for the visitor to complete. The
 * message asks the visitor to attach the bill -- nothing is attached
 * automatically. The monthly value always carries its real unit, so diesel
 * use is never presented as an electricity bill.
 *
 * Arabic wording is a translation of the client's English (for review).
 */
export const QUOTE_MESSAGE: Record<Language, { intro: string; location: string; monthly: string }> = {
  en: {
    intro: "Hello Reservia, I'd like a solar quote (Please attach Electricity bill).",
    location: 'Location:',
    monthly: 'Monthly bill or consumption:',
  },
  ar: {
    intro: 'مرحبًا ريزيرفيا، أريد عرض سعر للطاقة الشمسية (يُرجى إرفاق فاتورة الكهرباء).',
    location: 'الموقع:',
    monthly: 'الفاتورة أو الاستهلاك الشهري:',
  },
};

/** How a monthly value is described in the message, by its unit. `{n}` = the formatted number. */
export const MONTHLY_UNITS: Record<Language, Record<'kwh' | 'billEgp' | 'dieselLitres' | 'dieselEgp', string>> = {
  en: {
    kwh: '{n} kWh',
    billEgp: '{n} EGP (electricity bill)',
    dieselLitres: '{n} litres of diesel',
    dieselEgp: '{n} EGP spent on diesel',
  },
  ar: {
    kwh: '{n} كيلووات ساعة',
    billEgp: '{n} جنيه (فاتورة الكهرباء)',
    dieselLitres: '{n} لتر ديزل',
    dieselEgp: '{n} جنيه إنفاق على الديزل',
  },
};

export type MonthlyUnit = keyof (typeof MONTHLY_UNITS)['en'];

export interface QuoteFields {
  /** Location as the visitor typed it (contact/campaign forms); blank when unknown. */
  location?: string;
  /** Monthly bill or consumption, already formatted with its unit; blank when unknown. */
  monthly?: string;
  /** Optional extra lines (calculator estimate, site type, notes), after a blank line. */
  extra?: string;
}

/** Formats a monthly value with its unit for the message (Latin digits, thousands separators). */
export function monthlyValue(lang: Language, value: number | undefined, unit: MonthlyUnit): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return '';
  return MONTHLY_UNITS[lang][unit].replace('{n}', Math.round(value).toLocaleString('en-US'));
}

export function quoteMessage(lang: Language, fields: QuoteFields = {}): string {
  const m = QUOTE_MESSAGE[lang];
  // "Label: value", or "Label: " when blank, so the visitor can type straight after the label.
  const body = [m.intro, '', `${m.location} ${fields.location?.trim() ?? ''}`, `${m.monthly} ${fields.monthly?.trim() ?? ''}`].join('\n');
  return fields.extra?.trim() ? `${body}\n\n${fields.extra.trim()}` : body;
}
