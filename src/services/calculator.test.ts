import { describe, expect, it } from 'vitest';
import {
  bill,
  calcFarm,
  calcHome,
  calcIndustrialDiesel,
  calcIndustrialGrid,
  kwhFromBill,
  roundedPrice,
  safeInput,
} from './calculator';
import { HOUSEHOLD_SLABS, RATES } from '../config/tariffs';

describe('household tariff (bill)', () => {
  it('applies the six tiers progressively at the brief rates', () => {
    expect(bill(50)).toBeCloseTo(50 * 0.68);
    expect(bill(100)).toBeCloseTo(50 * 0.68 + 50 * 0.87);
    expect(bill(200)).toBeCloseTo(34 + 43.5 + 100 * 1.06);
    expect(bill(350)).toBeCloseTo(183.5 + 150 * 1.74);
    expect(bill(650)).toBeCloseTo(444.5 + 300 * 2.18);
    expect(bill(1000)).toBeCloseTo(1098.5 + 350 * 2.35);
  });

  it('keeps the tier boundaries at 50 / 100 / 200 / 350 / 650 / 1,000 kWh', () => {
    const cumulative = HOUSEHOLD_SLABS.reduce<number[]>((acc, [w]) => [...acc, (acc.at(-1) ?? 0) + w], []);
    expect(cumulative).toEqual([50, 100, 200, 350, 650, 1000]);
    expect(HOUSEHOLD_SLABS.map(([, p]) => p)).toEqual([0.68, 0.87, 1.06, 1.74, 2.18, 2.35]);
  });

  it('bills the whole month at 2.89 EGP/kWh above 1,000 kWh', () => {
    expect(RATES.householdTop.value).toBe(2.89);
    expect(bill(1001)).toBeCloseTo(1001 * 2.89);
    expect(bill(1200)).toBeCloseTo(3468);
  });

  it('is monotonic (more kWh never costs less)', () => {
    let prev = 0;
    for (let k = 0; k <= 1500; k += 5) {
      const b = bill(k);
      expect(b).toBeGreaterThanOrEqual(prev);
      prev = b;
    }
  });

  it('treats zero, negative and invalid input as no consumption', () => {
    expect(bill(0)).toBe(0);
    expect(bill(-100)).toBe(0);
    expect(bill(Number.NaN)).toBe(0);
    expect(bill(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('inverts the bill back to kWh', () => {
    expect(kwhFromBill(bill(420))).toBeCloseTo(420, 3);
    expect(kwhFromBill(bill(1200))).toBeCloseTo(1200, 3);
    expect(kwhFromBill(0)).toBe(0);
    expect(kwhFromBill(-5)).toBe(0);
  });
});

describe('reference villa (client brief regression)', () => {
  const r = calcHome(1200, 120, false);

  it('sizes 6.0 kWp at EGP 183,600', () => {
    expect(r.ok).toBe(true);
    expect(r.kwp).toBe(6);
    expect(r.price).toBe(183600);
    expect(r.prod).toBe(10500);
  });

  it('saves about EGP 36,800 a year', () => {
    expect(r.save).toBeGreaterThan(36700);
    expect(r.save).toBeLessThan(36900);
    expect(r.home?.before).toBeCloseTo(3468);
    expect(Math.round(r.home!.after)).toBe(401);
    expect(r.save).toBeCloseTo(12 * (r.home!.before - r.home!.after), 6);
  });

  it('pays back in about 5.3 years, about 4.8 with tariffs up 5% a year', () => {
    expect(r.payback0?.yrs).toBeCloseTo(5.3, 1);
    expect(r.payback5?.yrs).toBeCloseTo(4.8, 1);
    expect(r.payback5!.yrs!).toBeLessThan(r.payback0!.yrs!);
  });

  it('adds the battery price on top without changing the system size', () => {
    const withBat = calcHome(1200, 120, true);
    expect(withBat.kwp).toBe(6);
    expect(withBat.price).toBe(183600 + 120000);
    expect(withBat.payback0!.yrs!).toBeGreaterThan(r.payback0!.yrs!);
  });

  it('rounds the displayed price to the nearest EGP 1,000', () => {
    expect(roundedPrice(r.price)).toBe(184000);
    expect(roundedPrice(183499)).toBe(183000);
  });
});

describe('small homes (backs the tk6_d / a_small copy)', () => {
  const pb = (k: number) => calcHome(k, 120, false).payback0!.yrs!;
  it('takes 10 years or more under about 400 kWh a month', () => {
    for (const k of [200, 300, 350, 380]) expect(pb(k)).toBeGreaterThanOrEqual(10);
  });
  it('takes 8 to 10 years for most homes under 1,000 kWh a month', () => {
    for (const k of [400, 500, 600, 800, 1000]) {
      expect(pb(k)).toBeGreaterThanOrEqual(8);
      expect(pb(k)).toBeLessThan(10);
    }
  });
  it('is closer to 5 years above 1,000 kWh a month', () => {
    expect(pb(1200)).toBeLessThan(6);
  });
});

describe('farm (40 hp example on the agriculture page)', () => {
  const r = calcFarm(40, 8, 300, RATES.diesel.value);
  it('matches the published example', () => {
    expect(Math.round(r.litres! / 100) * 100).toBe(21500);
    expect(Math.round(r.save / 1000) * 1000).toBe(484000);
    expect(r.kwp).toBeCloseTo(41.8, 1);
    expect(roundedPrice(r.price)).toBe(828000);
    expect(r.payback0?.yrs).toBeCloseTo(1.7, 1);
  });
});

describe('industrial / service grid site', () => {
  it('converts the bill to kWh at the 2.55 EGP/kWh assumption', () => {
    const r = calcIndustrialGrid(150000, 30);
    expect(r.ok).toBe(true);
    expect(r.save).toBeCloseTo(150000 * 12 * 0.3);
    expect(r.kwp).toBeCloseTo((150000 / 2.55) * 12 * 0.3 / 1750, 6);
  });

  it('diesel hybrid uses 0.3 litres per kWh', () => {
    const r = calcIndustrialDiesel(30000, 30, 20.5);
    expect(r.litres).toBeCloseTo(30000 * 12 * 0.3);
    expect(r.ok).toBe(true);
  });
});

describe('invalid input handling', () => {
  it.each([
    ['home zero', () => calcHome(0, 120, false)],
    ['home negative', () => calcHome(-1200, 120, false)],
    ['home NaN roof', () => calcHome(1200, Number.NaN, false)],
    ['farm zero hp', () => calcFarm(0, 8, 300, 20.5)],
    ['farm negative diesel', () => calcFarm(40, 8, 300, -1)],
    ['grid zero bill', () => calcIndustrialGrid(0, 30)],
    ['grid negative share', () => calcIndustrialGrid(150000, -10)],
    ['diesel zero litres', () => calcIndustrialDiesel(0, 30, 20.5)],
  ])('%s returns no estimate instead of nonsense', (_name, run) => {
    const r = run();
    expect(r.ok).toBe(false);
    expect(r.payback0).toBeNull();
    expect(Number.isNaN(r.price)).toBe(false);
  });

  it('safeInput clamps', () => {
    expect(safeInput(-1)).toBe(0);
    expect(safeInput(Number.NaN)).toBe(0);
    expect(safeInput(5)).toBe(5);
  });
});
