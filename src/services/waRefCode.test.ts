import { describe, expect, it } from 'vitest';
import { buildWaRefCode } from './waRefCode';

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
