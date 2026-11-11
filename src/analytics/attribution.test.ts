import { beforeEach, describe, expect, it, vi } from 'vitest';

// Node test environment with minimal browser globals: a Map-backed localStorage and a cookie jar,
// so persistence across "page loads" (fresh module instances) can be exercised for real.
const store = new Map<string, string>();
let cookieJar = '';
let storageBlocked = false;

const localStorageStub = {
  getItem: (k: string) => {
    if (storageBlocked) throw new Error('SecurityError');
    return store.get(k) ?? null;
  },
  setItem: (k: string, v: string) => {
    if (storageBlocked) throw new Error('SecurityError');
    store.set(k, v);
  },
};
vi.stubGlobal('localStorage', localStorageStub);
vi.stubGlobal('document', {
  get cookie() {
    return cookieJar;
  },
  set cookie(v: string) {
    // keep only "name=value" of the last write (one cookie is all this module writes)
    cookieJar = v.split(';')[0];
  },
  referrer: '',
});
vi.stubGlobal('location', { protocol: 'https:', host: 'www.reservia-energy.com' });

const HOST = 'www.reservia-energy.com';
const page = (pathAndQuery: string) => {
  const [pathname, query = ''] = pathAndQuery.split('?');
  return { pathname, search: query ? `?${query}` : '', host: HOST };
};

async function freshModule() {
  vi.resetModules();
  const mod = await import('./attribution');
  mod.__resetAttributionMemory();
  return mod;
}

beforeEach(() => {
  store.clear();
  cookieJar = '';
  storageBlocked = false;
});

describe('C1 acceptance journey: campaign landing survives internal navigation', () => {
  it('Google Ads: /en/farms?utm... -> another page -> language switch -> /en/contact keeps google/cpc/test and landing /en/farms', async () => {
    let m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=Cj0KCQ'), 'https://www.google.com/', new Date('2026-11-12T08:00:00Z'));

    // each step is a full page load (fresh module) with an INTERNAL referrer and no UTM in the URL
    for (const [path, ref] of [
      ['/en/residential', 'https://www.reservia-energy.com/en/farms'],
      ['/ar/residential', 'https://www.reservia-energy.com/en/residential'],
      ['/en/contact', 'https://reservia-energy.com/ar/residential'],
    ] as const) {
      m = await freshModule();
      m.captureAttribution(page(path), ref, new Date('2026-11-12T08:05:00Z'));
    }

    const sub = m.attributionForSubmission();
    expect(sub.first.params).toEqual({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'test', gclid: 'Cj0KCQ' });
    expect(sub.first.landingPage).toBe('/en/farms');
    expect(sub.first.landingUrl).toBe('/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=Cj0KCQ');
    expect(sub.first.referrer).toBe('https://www.google.com/');
    expect(sub.last).toEqual(sub.first);
  });

  it('client-side (SPA) navigation keeps attribution even when localStorage AND cookies are unavailable', async () => {
    storageBlocked = true;
    const m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=facebook&utm_medium=paid_social&utm_campaign=farms-nov&fbclid=IwAR1'), 'https://l.facebook.com/', new Date());
    cookieJar = ''; // cookie blocked too
    m.captureAttribution(page('/en/contact'), 'https://l.facebook.com/', new Date()); // document.referrer is unchanged on SPA navigation
    const sub = m.attributionForSubmission();
    expect(sub.first.params.utm_source).toBe('facebook');
    expect(sub.first.params.fbclid).toBe('IwAR1');
    expect(sub.first.landingPage).toBe('/en/farms');
  });

  it('TikTok click id and UTM are captured', async () => {
    const m = await freshModule();
    m.captureAttribution(page('/en/lp/villas?utm_source=tiktok&utm_medium=paid&utm_campaign=villas&ttclid=E.C.P.abc'), undefined, new Date());
    expect(m.attributionForSubmission().first.params).toEqual({ utm_source: 'tiktok', utm_medium: 'paid', utm_campaign: 'villas', ttclid: 'E.C.P.abc' });
  });

  it('Google Ads auto-tagging only (gclid / gbraid / wbraid, no UTM) is still recorded', async () => {
    const m = await freshModule();
    m.captureAttribution(page('/en?gbraid=0AAAA&wbraid=CkQK'), 'https://www.google.com/', new Date());
    expect(m.attributionForSubmission().first.params).toEqual({ gbraid: '0AAAA', wbraid: 'CkQK' });
  });
});

describe('first-touch vs last-touch', () => {
  it('a later, different campaign updates ONLY the last touch; the first touch is never overwritten', async () => {
    let m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=farms'), undefined, new Date('2026-11-01T10:00:00Z'));
    m = await freshModule();
    m.captureAttribution(page('/en/villas?utm_source=facebook&utm_medium=paid_social&utm_campaign=villas'), 'https://m.facebook.com/', new Date('2026-11-05T10:00:00Z'));
    m = await freshModule();
    m.captureAttribution(page('/en/contact'), 'https://www.reservia-energy.com/en/villas', new Date('2026-11-05T10:03:00Z'));
    const sub = m.attributionForSubmission();
    expect(sub.first.params.utm_campaign).toBe('farms');
    expect(sub.first.landingPage).toBe('/en/farms');
    expect(sub.last.params.utm_campaign).toBe('villas');
    expect(sub.last.landingPage).toBe('/en/villas');
  });

  it('a direct revisit (no campaign) changes nothing', async () => {
    let m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=x'), undefined, new Date('2026-11-01T10:00:00Z'));
    const before = m.readAttribution(new Date('2026-11-01T10:00:00Z'));
    m = await freshModule();
    m.captureAttribution(page('/en'), undefined, new Date('2026-11-03T10:00:00Z'));
    expect(m.readAttribution(new Date('2026-11-03T10:00:00Z'))).toEqual(before);
  });
});

describe('organic, direct and internal referrers', () => {
  it('organic search: no campaign, external search referrer kept (origin + path only)', async () => {
    const m = await freshModule();
    m.captureAttribution(page('/en/industrial'), 'https://www.google.com/search?q=solar+egypt', new Date());
    const first = m.attributionForSubmission().first;
    expect(first.params).toEqual({});
    expect(first.referrer).toBe('https://www.google.com/search');
    expect(first.landingPage).toBe('/en/industrial');
  });

  it('direct: no campaign, no referrer', async () => {
    const m = await freshModule();
    m.captureAttribution(page('/en'), undefined, new Date());
    const first = m.attributionForSubmission().first;
    expect(first.params).toEqual({});
    expect(first.referrer).toBeUndefined();
  });

  it('an internal referrer is never stored as a source (apex, www and subdomains)', async () => {
    const m = await freshModule();
    expect(m.isInternalReferrer('https://reservia-energy.com/en', HOST)).toBe(true);
    expect(m.isInternalReferrer('https://www.reservia-energy.com/en', HOST)).toBe(true);
    expect(m.isInternalReferrer('https://www.google.com/', HOST)).toBe(false);
    m.captureAttribution(page('/en/contact'), 'https://www.reservia-energy.com/en/farms', new Date());
    expect(m.attributionForSubmission().first.referrer).toBeUndefined();
  });

  it('only allowlisted parameters are read - personal or unrelated query values are never stored', async () => {
    const m = await freshModule();
    m.captureAttribution(page('/en/contact?utm_source=google&email=a%40b.com&phone=0100&utm_medium=cpc'), undefined, new Date());
    const first = m.attributionForSubmission().first;
    expect(first.params).toEqual({ utm_source: 'google', utm_medium: 'cpc' });
    expect(first.landingUrl).toBe('/en/contact?utm_source=google&utm_medium=cpc');
  });
});

describe('persistence', () => {
  it('cookie fallback: a record survives when localStorage is cleared', async () => {
    let m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=test'), undefined, new Date());
    store.clear();
    m = await freshModule();
    m.captureAttribution(page('/en/contact'), 'https://www.reservia-energy.com/en/farms', new Date());
    expect(m.attributionForSubmission().first.landingPage).toBe('/en/farms');
  });

  it('expires 30 days after the last attributable touch', async () => {
    let m = await freshModule();
    m.captureAttribution(page('/en/farms?utm_source=google&utm_medium=cpc'), undefined, new Date('2026-10-01T00:00:00Z'));
    m = await freshModule();
    expect(m.readAttribution(new Date('2026-10-30T00:00:00Z'))).not.toBeNull();
    expect(m.readAttribution(new Date('2026-11-02T00:00:00Z'))).toBeNull();
    m.captureAttribution(page('/en/contact'), undefined, new Date('2026-11-02T00:00:00Z'));
    expect(m.readAttribution(new Date('2026-11-02T00:00:00Z'))!.first.landingPage).toBe('/en/contact');
  });

  it('imports the legacy rsv_utm first-touch record so visitors mid-journey during the deploy keep their source', async () => {
    store.set('rsv_utm', JSON.stringify({ utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'old' }, firstTouchAt: Date.now() - 60_000, landingPage: 'https://www.reservia-energy.com/en/farms', referrer: 'https://www.google.com/' }));
    const m = await freshModule();
    m.captureAttribution(page('/en/contact'), 'https://www.reservia-energy.com/en/farms', new Date());
    const first = m.attributionForSubmission().first;
    expect(first.params.utm_campaign).toBe('old');
    expect(first.landingPage).toBe('/en/farms');
    expect(first.referrer).toBe('https://www.google.com/');
  });
});
