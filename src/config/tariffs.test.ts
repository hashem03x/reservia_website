import { describe, expect, it } from 'vitest';
import { DIESEL_COST_PER_KWH, RATES, RATE_BOARD, TARIFF_AS_OF, pctChange } from './tariffs';

describe('tariff assumptions (client brief, 14 October 2026)', () => {
  it('uses the specified rates', () => {
    expect(RATES.householdTop.value).toBe(2.89);
    expect(RATES.commercial.value).toBe(2.79);
    expect(RATES.otherUsersMV.value).toBe(2.55);
    expect(RATES.service.value).toBe(2.55);
    expect(RATES.diesel.value).toBe(20.5);
    expect(TARIFF_AS_OF).toBe('2026-10-14');
  });

  it('records source, as-of date, segment and verification status for every rate', () => {
    for (const rate of Object.values(RATES)) {
      expect(rate.sources.length).toBeGreaterThan(0);
      expect(rate.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rate.segment.length).toBeGreaterThan(0);
      expect(['official', 'press-reported', 'client-brief', 'assumption']).toContain(rate.status);
    }
  });

  it('never presents the press-reported top household rate as official', () => {
    expect(RATES.householdTop.status).toBe('press-reported');
    expect(RATES.householdTop.note).toMatch(/2\.58/);
    expect(RATES.service.status).toBe('assumption');
  });

  it('shows the top residential tier up about 29.6% from 2.23 in October 2025', () => {
    expect(RATES.householdTopOct2025.value).toBe(2.23);
    const res = RATE_BOARD.find((r) => r.sym === 'RES')!;
    expect(res.value).toBe(2.89);
    expect(res.changePct).toBe(29.6);
    expect(pctChange(2.23, 2.89)).toBe(29.6);
  });

  it('derives the diesel kWh cost from the litre price', () => {
    expect(DIESEL_COST_PER_KWH).toBeCloseTo(6.15);
    expect(RATE_BOARD.find((r) => r.sym === 'DSL')!.changePct).toBe(17.1);
  });
});
