import { describe, expect, it } from 'vitest';
import { waHref } from './whatsapp';
import { monthlyValue, quoteMessage } from '../content/whatsappMessages';
import { normalizeWhatsappNumber } from '../config/env';
import { offersBillWhatsapp, pageWaSegment } from '../config/navigation';

// URLSearchParams.get() already percent-decodes.
const decode = (href: string) => new URL(href).searchParams.get('text') ?? '';

describe('WhatsApp destination', () => {
  it('validates the configured number', () => {
    expect(normalizeWhatsappNumber('+20 121 189 2995')).toBe('201211892995');
    expect(normalizeWhatsappNumber('0121')).toBeNull();
    expect(normalizeWhatsappNumber('')).toBeNull();
    expect(normalizeWhatsappNumber('0201211892995')).toBeNull();
  });
});

describe('quote message (client wording, October 2026)', () => {
  it('uses the exact structure, with blanks left for the visitor', () => {
    expect(quoteMessage('en')).toBe("Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: \nMonthly bill or consumption: ");
  });

  it('fills in values the visitor entered, with their units', () => {
    const msg = quoteMessage('en', { location: 'Cairo, Egypt', monthly: monthlyValue('en', 5000, 'billEgp') });
    expect(msg).toBe("Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: Cairo, Egypt\nMonthly bill or consumption: 5,000 EGP (electricity bill)");
  });

  it('labels diesel use as diesel, never as an electricity bill', () => {
    expect(monthlyValue('en', 3000, 'dieselLitres')).toBe('3,000 litres of diesel');
    expect(monthlyValue('en', 61500, 'dieselEgp')).toBe('61,500 EGP spent on diesel');
    expect(monthlyValue('en', 1200, 'kwh')).toBe('1,200 kWh');
    expect(monthlyValue('en', 0, 'kwh')).toBe('');
    expect(monthlyValue('en', undefined, 'kwh')).toBe('');
  });

  it('appends extra lines after a blank line', () => {
    expect(quoteMessage('en', { extra: 'Estimate: 6.0 kWp' }).endsWith('\n\nEstimate: 6.0 kWp')).toBe(true);
  });

  it('has an Arabic version that keeps the attach-the-bill instruction', () => {
    const msg = quoteMessage('ar');
    expect(msg).toMatch(/يُرجى إرفاق فاتورة الكهرباء/);
    expect(msg).toMatch(/الموقع: /);
    expect(msg).toMatch(/الفاتورة أو الاستهلاك الشهري: /);
  });

  it('never claims an attachment was added', () => {
    expect(quoteMessage('en')).not.toMatch(/attached|I have attached/i);
  });
});

describe('waHref', () => {
  it('URL-encodes the message, including line breaks, Arabic and symbols', () => {
    const href = waHref('ar', 'villas', { location: 'المعادي & 100%' })!;
    expect(href).toMatch(/^https:\/\/wa\.me\/201211892995\?text=/);
    expect(href.split('?text=')[1]).not.toMatch(/[\s&]/);
    expect(decode(href)).toBe(quoteMessage('ar', { location: 'المعادي & 100%' }));
  });

  it('every segment uses the same quote template', () => {
    for (const seg of ['general', 'villas', 'agriculture', 'industrial', 'service', 'calc'] as const) {
      expect(decode(waHref('en', seg)!)).toBe(quoteMessage('en'));
    }
  });
});

describe('floating button segment by page', () => {
  it.each([
    ['/en', 'general'],
    ['/ar/residential', 'villas'],
    ['/en/agriculture', 'agriculture'],
    ['/en/lp/agriculture', 'agriculture'],
    ['/ar/industrial', 'industrial'],
    ['/en/service', 'service'],
    ['/ar/lp/service', 'service'],
    ['/en/lp/compounds', 'compounds'],
    ['/en/contact', 'general'],
  ])('%s -> %s', (path, segment) => {
    expect(pageWaSegment(path)).toBe(segment);
  });
});

describe('Send-your-bill visibility rule', () => {
  it('allows the homepage and Residential & Commercial only', () => {
    expect(offersBillWhatsapp('general')).toBe(true);
    expect(offersBillWhatsapp('villas')).toBe(true);
    expect(offersBillWhatsapp('compounds')).toBe(true);
    expect(offersBillWhatsapp('agriculture')).toBe(false);
    expect(offersBillWhatsapp('industrial')).toBe(false);
    expect(offersBillWhatsapp('service')).toBe(false);
    expect(offersBillWhatsapp('calc')).toBe(false);
  });
});
