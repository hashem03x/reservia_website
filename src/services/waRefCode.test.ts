import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWaRefCode } from './waRefCode';

// Minimal browser globals for the node test environment (same technique as
// src/hooks/useUtmParams.test.ts) - registerWaRefCode reads first-touch UTM/referrer from
// localStorage and posts via fetch, so both need a stub here.
const store = new Map<string, string>();
vi.stubGlobal('window', globalThis);
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});

async function load(crmUrl: string) {
  vi.resetModules();
  vi.stubEnv('VITE_CRM_URL', crmUrl);
  return import('./waRefCode');
}

beforeEach(() => {
  store.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('buildWaRefCode', () => {
  it('encodes the Cairo-local day and month, matching the CRM\'s own DDMM convention', () => {
    // 2026-11-05 12:00 UTC is 2026-11-05 14:00 in Cairo (UTC+2) - same calendar day either way.
    const code = buildWaRefCode('villas', new Date('2026-11-05T12:00:00Z'));
    expect(code).toMatch(/^WA-0511-VIL-[A-Z0-9]{4}$/);
  });

  it('a date just before Cairo midnight still lands on the earlier Cairo day', () => {
    // 2026-11-05 21:30 UTC = 2026-11-05 23:30 Cairo - still the 5th, not yet the 6th.
    const code = buildWaRefCode('villas', new Date('2026-11-05T21:30:00Z'));
    expect(code).toMatch(/^WA-0511-/);
  });

  it('tags every known segment distinctly, and falls back to GEN for an unrecognized one', () => {
    const date = new Date('2026-11-05T12:00:00Z');
    expect(buildWaRefCode('villas', date)).toContain('-VIL-');
    expect(buildWaRefCode('compounds', date)).toContain('-CMP-');
    expect(buildWaRefCode('agriculture', date)).toContain('-FRM-');
    expect(buildWaRefCode('industrial', date)).toContain('-OIL-');
    expect(buildWaRefCode('service', date)).toContain('-SRV-');
    expect(buildWaRefCode('general', date)).toContain('-GEN-');
    expect(buildWaRefCode('calc', date)).toContain('-CLC-');
    expect(buildWaRefCode('something-unknown', date)).toContain('-GEN-');
  });

  it('is never mistaken for the CRM\'s own sequential RSV- lead reference', () => {
    expect(buildWaRefCode('villas')).not.toMatch(/^RSV-/);
  });
});

describe('registerWaRefCode (Change Request 1, Feature 1: WhatsApp ref code attribution)', () => {
  it('does nothing when the CRM is not configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { registerWaRefCode } = await load('');
    registerWaRefCode('WA-0511-VIL-K2F9');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the code with this first-touch UTM/referrer context to the CRM\'s public endpoint', async () => {
    localStorage.setItem(
      'rsv_utm',
      JSON.stringify({
        utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'villas-nov', utm_content: 'banner' },
        firstTouchAt: Date.now(),
        referrer: 'https://www.google.com/',
      }),
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const { registerWaRefCode } = await load('https://crm.example.test');
    registerWaRefCode('WA-0511-VIL-K2F9');
    // Fire-and-forget: the call returns synchronously without the caller awaiting fetch.
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://crm.example.test/crm/public/wa-ref');
    expect(init?.keepalive).toBe(true);
    expect(JSON.parse(String(init!.body))).toEqual({
      code: 'WA-0511-VIL-K2F9',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'villas-nov',
      utmContent: 'banner',
      referrer: 'https://www.google.com/',
    });
  });

  it('sends nulls (never throws) when there is no stored UTM context at all', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const { registerWaRefCode } = await load('https://crm.example.test');
    expect(() => registerWaRefCode('WA-0511-GEN-AAAA')).not.toThrow();
    await Promise.resolve();

    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init!.body))).toEqual({
      code: 'WA-0511-GEN-AAAA',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      referrer: null,
    });
  });

  it('swallows a network failure rather than throwing (never blocks the wa.me link)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const { registerWaRefCode } = await load('https://crm.example.test');
    expect(() => registerWaRefCode('WA-0511-VIL-K2F9')).not.toThrow();
  });
});
