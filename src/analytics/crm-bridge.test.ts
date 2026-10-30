import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/leadService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/leadService')>();
  return { ...actual, submitLead: vi.fn() };
});
vi.mock('./amplitude', () => ({
  getAmplitudeDeviceId: vi.fn(() => 'amp-device-xyz'),
  trackQuoteFormSubmitted: vi.fn(),
}));

const { submitLead } = await import('../services/leadService');
const { trackQuoteFormSubmitted, getAmplitudeDeviceId } = await import('./amplitude');
const { submitQuote } = await import('./crm-bridge');

const input = { name: 'Test Person', phone: '01211892995', segment: 'villas' as const, source: 'landing_form' as const };
const ctx = { eventId: 'lead-1', lang: 'en' as const, utm: {}, page: '/en/lp/villas' };

describe('submitQuote (the CRM bridge)', () => {
  it('forwards the current Amplitude device id to submitLead, for CRM/website correlation', async () => {
    vi.mocked(submitLead).mockResolvedValue({ status: 'sent', refCode: 'RSV-0101-0001' });
    await submitQuote(input, ctx);
    expect(submitLead).toHaveBeenCalledWith(input, expect.objectContaining({ ampDeviceId: 'amp-device-xyz' }));
  });

  it('fires quote_form_submitted with outcome "sent" on confirmed delivery, and returns the ref code', async () => {
    vi.mocked(submitLead).mockResolvedValue({ status: 'sent', refCode: 'RSV-0101-0001' });
    const result = await submitQuote(input, ctx);
    expect(trackQuoteFormSubmitted).toHaveBeenCalledWith({ segment: 'villas', source: 'landing_form', page: ctx.page, outcome: 'sent' });
    expect(result).toEqual({ status: 'sent', refCode: 'RSV-0101-0001' });
  });

  it('fires quote_form_submitted with outcome "mock" in preview mode (no CRM configured)', async () => {
    vi.mocked(submitLead).mockResolvedValue({ status: 'mock' });
    await submitQuote(input, ctx);
    expect(trackQuoteFormSubmitted).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'mock' }));
  });

  it('never fires quote_form_submitted on a network/server error', async () => {
    vi.mocked(submitLead).mockResolvedValue({ status: 'error', message: 'Network error' });
    vi.mocked(trackQuoteFormSubmitted).mockClear();
    await submitQuote(input, ctx);
    expect(trackQuoteFormSubmitted).not.toHaveBeenCalled();
  });

  it('getAmplitudeDeviceId returning undefined (Amplitude not configured) is passed through harmlessly', async () => {
    vi.mocked(getAmplitudeDeviceId).mockReturnValueOnce(undefined);
    vi.mocked(submitLead).mockResolvedValue({ status: 'mock' });
    await submitQuote(input, ctx);
    expect(submitLead).toHaveBeenCalledWith(input, expect.objectContaining({ ampDeviceId: undefined }));
  });
});
