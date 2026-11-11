import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal browser globals for the node test environment (same technique as
// src/services/analytics.test.ts) - localStorage, not sessionStorage, is the point of this fix.
const store = new Map<string, string>();
vi.stubGlobal('window', globalThis);
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});

function setSearch(search: string, pathname = '/en') {
  (window as unknown as { location: { search: string; pathname: string; host: string } }).location = { search, pathname, host: 'www.reservia-energy.com' };
}

async function fresh() {
  vi.resetModules();
  const attribution = await import('../analytics/attribution');
  attribution.__resetAttributionMemory();
  return import('./useUtmParams');
}

beforeEach(() => {
  store.clear();
  setSearch('');
});

describe('acceptance report finding 1: first-touch UTM persists 30 days (now backed by src/analytics/attribution.ts)', () => {
  it('captures UTM params from the URL on first visit', async () => {
    const { captureUtm, getStoredUtm } = await fresh();
    setSearch('?utm_source=google&utm_campaign=villas-nov');
    expect(captureUtm()).toEqual({ utm_source: 'google', utm_campaign: 'villas-nov' });
    expect(getStoredUtm()).toEqual({ utm_source: 'google', utm_campaign: 'villas-nov' });
  });

  it('a later visit with different (or no) UTM params never overwrites the original first touch', async () => {
    const { captureUtm } = await fresh();
    setSearch('?utm_source=google&utm_campaign=villas-nov');
    captureUtm();

    setSearch('?utm_source=meta&utm_campaign=farms-nov');
    expect(captureUtm()).toEqual({ utm_source: 'google', utm_campaign: 'villas-nov' });

    setSearch(''); // a page with no campaign params at all - still the original first touch
    expect(captureUtm()).toEqual({ utm_source: 'google', utm_campaign: 'villas-nov' });
  });

  it('survives a simulated new tab/session (no sessionStorage dependency)', async () => {
    const mod1 = await fresh();
    setSearch('?utm_source=referral');
    mod1.captureUtm();

    setSearch('');
    const mod2 = await fresh();
    expect(mod2.getStoredUtm()).toEqual({ utm_source: 'referral' });
  });

  it('a record older than 30 days is treated as expired - a new visit starts a fresh first touch', async () => {
    const mod1 = await fresh();
    setSearch('?utm_source=google');
    mod1.captureUtm();

    const raw = JSON.parse(store.get('rsv_attr')!);
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    raw.first.at = old;
    raw.last.at = old;
    store.set('rsv_attr', JSON.stringify(raw));

    const mod2 = await fresh();
    expect(mod2.getStoredUtm()).toEqual({});

    setSearch('?utm_source=meta');
    expect(mod2.captureUtm()).toEqual({ utm_source: 'meta' });
  });

  it('the stored landing page is the first-touch path, not the page a form is submitted from', async () => {
    const mod = await fresh();
    setSearch('?utm_source=google&utm_medium=cpc&utm_campaign=test', '/en/farms');
    mod.captureUtm();
    setSearch('', '/en/contact');
    mod.captureUtm();
    expect(mod.getStoredLandingPage()).toBe('/en/farms');
  });
});
