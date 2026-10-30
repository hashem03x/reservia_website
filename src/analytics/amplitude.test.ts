import { afterEach, describe, expect, it, vi } from 'vitest';

// Minimal browser globals for the node test environment (same technique as
// src/services/analytics.test.ts).
const store = new Map<string, string>();
vi.stubGlobal('window', globalThis);
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});

const PII = ['Mona Hassan', '01211892995', 'mona@example.com'];

async function loadWithKey(apiKey: string) {
  vi.resetModules();
  store.clear();
  if (apiKey) vi.stubEnv('VITE_AMPLITUDE_API_KEY', apiKey);
  else vi.stubEnv('VITE_AMPLITUDE_API_KEY', '');
  const amplitudeSdk = await import('@amplitude/analytics-browser');
  const mod = await import('./amplitude');
  return { ...mod, amplitudeSdk };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('initAmplitude', () => {
  it('mock mode: with no API key, init() is never called and nothing is "ready"', async () => {
    const { initAmplitude, isAmplitudeReady, amplitudeSdk } = await loadWithKey('');
    const initSpy = vi.spyOn(amplitudeSdk, 'init');
    initAmplitude();
    expect(initSpy).not.toHaveBeenCalled();
    expect(isAmplitudeReady()).toBe(false);
  });

  it('with a configured key, init() is called exactly once even if called twice (idempotent, like initAnalytics)', async () => {
    const { initAmplitude, isAmplitudeReady, amplitudeSdk } = await loadWithKey('test-key-123');
    const initSpy = vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    initAmplitude();
    initAmplitude();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(isAmplitudeReady()).toBe(true);
  });

  it('IP tracking is explicitly disabled and ALL autocapture is off', async () => {
    const { initAmplitude, amplitudeSdk } = await loadWithKey('test-key-123');
    const initSpy = vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    initAmplitude();
    const [, options] = initSpy.mock.calls[0];
    expect(options).toMatchObject({ trackingOptions: { ipAddress: false }, autocapture: false });
  });
});

describe('tracked events', () => {
  it('track() is never called before initAmplitude() (mock mode is fully silent)', async () => {
    const { trackPageView, trackWhatsappClicked, trackQuoteFormSubmitted, amplitudeSdk } = await loadWithKey('');
    const trackSpy = vi.spyOn(amplitudeSdk, 'track');
    trackPageView('/en', 'en');
    trackWhatsappClicked('agriculture', '/en/agriculture');
    trackQuoteFormSubmitted({ segment: 'villas', source: 'contact_form', page: '/en/contact', outcome: 'sent' });
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('page_view: one event per distinct route + language, never twice for the same page', async () => {
    const { initAmplitude, trackPageView, amplitudeSdk } = await loadWithKey('test-key-123');
    vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    const trackSpy = vi.spyOn(amplitudeSdk, 'track');
    initAmplitude();
    trackPageView('/en/contact', 'en');
    trackPageView('/en/contact', 'en');
    trackPageView('/ar/contact', 'ar');
    expect(trackSpy).toHaveBeenCalledTimes(2);
    expect(trackSpy.mock.calls[0][0]).toBe('page_view');
  });

  it('whatsapp_clicked: carries segment/group/page only, matching the brief\'s "segment=farm"-shaped example (this codebase calls it "agriculture")', async () => {
    const { initAmplitude, trackWhatsappClicked, amplitudeSdk } = await loadWithKey('test-key-123');
    vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    const trackSpy = vi.spyOn(amplitudeSdk, 'track');
    initAmplitude();
    trackWhatsappClicked('agriculture', '/en/agriculture');
    expect(trackSpy).toHaveBeenCalledWith('whatsapp_clicked', { segment: 'agriculture', group: 'agriculture', page: '/en/agriculture' });
  });

  it('quote_form_submitted: never includes name/phone/email even if accidentally present on the call site (defense in depth via sanitizeParams)', async () => {
    const { initAmplitude, trackQuoteFormSubmitted, amplitudeSdk } = await loadWithKey('test-key-123');
    vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    const trackSpy = vi.spyOn(amplitudeSdk, 'track');
    initAmplitude();
    trackQuoteFormSubmitted({
      segment: 'villas',
      source: 'landing_form',
      page: '/en/lp/villas',
      outcome: 'sent',
      // @ts-expect-error -- deliberately simulating a careless future call site to prove the filter catches it
      name: PII[0],
      phone: PII[1],
      email: PII[2],
    });
    const [, properties] = trackSpy.mock.calls[0];
    const json = JSON.stringify(properties);
    for (const value of PII) expect(json).not.toContain(value);
    expect(properties).toEqual({ segment: 'villas', group: 'villas', source: 'landing_form', page: '/en/lp/villas', outcome: 'sent' });
  });

  it('getAmplitudeDeviceId: undefined when not initialized, a real value once initialized', async () => {
    const { initAmplitude, getAmplitudeDeviceId, amplitudeSdk } = await loadWithKey('test-key-123');
    expect(getAmplitudeDeviceId()).toBeUndefined();
    vi.spyOn(amplitudeSdk, 'init').mockImplementation(() => ({ promise: Promise.resolve() }) as never);
    vi.spyOn(amplitudeSdk, 'getDeviceId').mockReturnValue('amp-device-abc123');
    initAmplitude();
    expect(getAmplitudeDeviceId()).toBe('amp-device-abc123');
  });
});
