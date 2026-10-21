import { describe, expect, it } from 'vitest';
import { waHref } from './whatsapp';
import { WAMSG } from '../content/whatsappMessages';
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

describe('waHref', () => {
  it('URL-encodes the message, including line breaks, Arabic and symbols', () => {
    const href = waHref('ar', 'villas', '\n& 100%')!;
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(href).not.toMatch(/[\s&](?!text)/);
    expect(decode(href)).toBe(WAMSG.ar.villas + '\n& 100%');
  });

  it('appends the calculator figures to the calc message', () => {
    const summary = 'Home: System 6.0 kWp; Price 184,000 EGP; Saving 36,804 EGP/yr; Payback 5.3 years.';
    expect(decode(waHref('en', 'calc', summary)!)).toBe(WAMSG.en.calc + summary);
  });
});

describe('segment messages', () => {
  const needs: Record<string, { en: RegExp[]; ar: RegExp[] }> = {
    villas: { en: [/bill/i, /location/i, /kWh/], ar: [/فاتورة/, /الموقع/, /كيلووات ساعة/] },
    agriculture: { en: [/location/i, /pump size/i, /irrigation/i], ar: [/موقع/, /قدرة المضخة/, /الري/] },
    industrial: { en: [/location/i, /consumption/i, /need/i], ar: [/موقع/, /الاستهلاك/, /المطلوب/] },
    service: { en: [/facility type/i, /location/i, /consumption/i], ar: [/نوع المنشأة/, /الموقع/, /استهلاك/] },
  };
  for (const [segment, req] of Object.entries(needs)) {
    it(`${segment} asks for the details an engineer needs, in both languages`, () => {
      for (const re of req.en) expect(WAMSG.en[segment as keyof typeof WAMSG.en]).toMatch(re);
      for (const re of req.ar) expect(WAMSG.ar[segment as keyof typeof WAMSG.ar]).toMatch(re);
    });
  }
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
