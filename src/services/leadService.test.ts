import { afterEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('window', Object.assign(globalThis, { location: { origin: 'https://example.test', pathname: '/en/contact' } }));

const input = { name: 'Test Person', phone: '01211892995', segment: 'service' as const, source: 'contact_form' as const };
const ctx = { eventId: 'lead-123', lang: 'en' as const, utm: { utm_source: 'meta' } };

async function load(url: string) {
  vi.resetModules();
  vi.stubEnv('VITE_LEADS_API_URL', url);
  return import('./leadService');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('submitLead', () => {
  it('reports preview mode (never success) when no endpoint is configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { submitLead } = await load('');
    expect(await submitLead(input, ctx)).toEqual({ status: 'mock' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports sent only on a 2xx response, passing event id and group to the CRM', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    const { submitLead } = await load('https://leads.example.test/api');
    expect(await submitLead(input, ctx)).toEqual({ status: 'sent' });
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(String(init!.body));
    expect(body).toMatchObject({ eventId: 'lead-123', segment: 'service', segmentGroup: 'industrial', lang: 'en' });
    expect(body.pageUrl).toBe('https://example.test/en/contact');
    expect((init!.headers as Record<string, string>)['Idempotency-Key']).toBe('lead-123');
  });

  it('reports an error on a non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    const { submitLead } = await load('https://leads.example.test/api');
    expect((await submitLead(input, ctx)).status).toBe('error');
  });

  it('reports an error on a network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const { submitLead } = await load('https://leads.example.test/api');
    expect(await submitLead(input, ctx)).toEqual({ status: 'error', message: 'Failed to fetch' });
  });
});
