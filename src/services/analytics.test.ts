import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal browser globals for the node test environment.
const store = new Map<string, string>();
vi.stubGlobal('window', globalThis);
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});

const analytics = await import('./analytics');
const { pushEvent, sanitizeParams, trackLeadGenerated, trackPageView, resetPageViewDedupe, trackWhatsappClick, newEventId } = analytics;

const events = () => (window.dataLayer ?? []) as Array<Record<string, unknown>>;
const PII = ['Mona Hassan', '01211892995', '+20 121 189 2995', 'mona@example.com', '12 Street 9, Maadi'];

beforeEach(() => {
  window.dataLayer = [];
  store.clear();
  resetPageViewDedupe();
});

describe('privacy allowlist', () => {
  it('drops keys that are not allowed (name, phone, email, notes, address)', () => {
    const out = sanitizeParams({ name: PII[0], phone: PII[1], email: PII[3], message: 'call me', governorate: PII[4], segment: 'villas' });
    expect(out).toEqual({ segment: 'villas' });
  });

  it('drops contact-looking strings even under allowed keys', () => {
    expect(sanitizeParams({ segment: PII[2], source: PII[3], page: '/en/contact' })).toEqual({ page: '/en/contact' });
  });

  it('keeps finite numbers only', () => {
    expect(sanitizeParams({ site_input: 40, system_size_kwp: Number.NaN })).toEqual({ site_input: 40 });
  });

  it('never lets personal data reach the dataLayer through pushEvent', () => {
    store.set('rsv_utm', JSON.stringify({ utm_source: 'meta', utm_campaign: 'villas' }));
    pushEvent('generate_lead', { segment: 'villas', name: PII[0], phone: PII[1], note: 'my address is ' + PII[4] });
    const json = JSON.stringify(events());
    for (const value of PII) expect(json).not.toContain(value);
    expect(events()[0]).toMatchObject({ event: 'generate_lead', segment: 'villas', utm_source: 'meta' });
  });
});

describe('lead events', () => {
  it('fire once per event id, with only operational fields', () => {
    const id = newEventId();
    expect(trackLeadGenerated(id, { segment: 'service', source: 'landing_form', page: '/en/lp/service', lang: 'en', siteInput: 250000 })).toBe(true);
    expect(trackLeadGenerated(id, { segment: 'service', source: 'landing_form', page: '/en/lp/service', lang: 'en' })).toBe(false);
    const leads = events().filter((e) => e.event === 'generate_lead');
    expect(leads).toHaveLength(1);
    expect(leads[0]).toEqual({
      event: 'generate_lead',
      event_id: id,
      segment: 'service',
      group: 'industrial',
      source: 'landing_form',
      page: '/en/lp/service',
      lang: 'en',
      site_input: 250000,
    });
  });

  it('uses the event id it was given (shared with the CRM / Meta CAPI)', () => {
    trackLeadGenerated('lead-abc', { segment: 'villas', source: 'contact_form', page: '/ar/contact', lang: 'ar' });
    expect(events()[0].event_id).toBe('lead-abc');
    expect(events()[0].group).toBe('villas');
  });
});

describe('page views', () => {
  it('are deduplicated per route + language', () => {
    trackPageView('/en/service', 'en', 'Service');
    trackPageView('/en/service', 'en', 'Service');
    trackPageView('/ar/service', 'ar', 'Service AR');
    trackPageView('/ar/service', 'ar', 'Service AR');
    trackPageView('/en/service', 'en', 'Service');
    expect(events().filter((e) => e.event === 'page_view')).toHaveLength(3);
  });

  it('give every event a unique id', () => {
    trackPageView('/en', 'en', 'Home');
    trackPageView('/en/about', 'en', 'About');
    trackWhatsappClick('villas', '/en');
    const ids = events().map((e) => e.event_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('WhatsApp clicks', () => {
  it('classify service as segment=service, group=industrial and round the system size', () => {
    trackWhatsappClick('service', '/en/service', 6.04);
    expect(events()[0]).toMatchObject({ event: 'click_whatsapp', segment: 'service', group: 'industrial', system_size_kwp: 6 });
  });
});
