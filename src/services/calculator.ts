import {
  DIESEL_LITRES_PER_KWH,
  HOUSEHOLD_FLAT_THRESHOLD_KWH,
  HOUSEHOLD_SLABS,
  RATES,
} from '../config/tariffs';

/**
 * Solar savings/payback calculator, ported line-for-line from the
 * reference template's `calc()`/`homeCalc()`/`payback()`/`bill()`
 * functions (Reservia.html). Formulas and rounding are kept identical;
 * tariff and fuel figures now come from src/config/tariffs.ts so the
 * calculator, rate board and tests share one source. See `c_assume` in
 * the translation dictionaries for the assumptions disclosed to the user
 * alongside the result.
 *
 * Regression reference (client brief): a villa using 1,200 kWh a month
 * with 120 m2 of roof -> 6.0 kWp, EGP 183,600, about EGP 36,800 a year,
 * payback about 5.3 years (4.8 with tariffs rising 5% a year). Covered by
 * src/services/calculator.test.ts.
 */

export const YIELD = 1750;
const DEG = 0.005;
const OMR = 0.01;
const INV_YR = 12;
const INV_PCT = 0.08;
const ROOF = 8;
export const BAT = 120000;
const LPK = DIESEL_LITRES_PER_KWH;
const GEN_OM = 1.1;
/** Grid tariff for the industry/service tab: EgyptERA medium-voltage 'other users' (also the service-sector assumption). */
export const IND_TAR = RATES.otherUsersMV.value;
const HURDLE = 10;
export const ESC = 0.05;
const P_FARM = 19800;
const P_IND = 23400;
const P_HYB = 22500;

/** Turns any user input into a finite, non-negative number (NaN, Infinity and negatives become 0). */
export function safeInput(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Household tariff: progressive slabs up to 1,000 kWh; above that the whole month is billed at the top rate. */
export function bill(k: number): number {
  k = safeInput(k);
  if (k <= 0) return 0;
  if (k > HOUSEHOLD_FLAT_THRESHOLD_KWH) return k * RATES.householdTop.value;
  let b = 0;
  let r = k;
  for (const [w, p] of HOUSEHOLD_SLABS) {
    const u = Math.min(r, w);
    b += u * p;
    r -= u;
    if (r <= 0) break;
  }
  return b;
}

export function kwhFromBill(E: number): number {
  E = safeInput(E);
  if (E === 0) return 0;
  let lo = 0;
  let hi = 6000;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (bill(m) >= E) hi = m;
    else lo = m;
  }
  return hi;
}

/** Reservia home price list: EGP/kWp, 30,600 up to 10 kWp, easing to 23,400 at 50 kWp. */
function pHome(s: number): number {
  return s <= 10 ? 30600 : s >= 50 ? 23400 : 30600 - (s - 10) * (7200 / 40);
}

export interface PaybackResult {
  yrs: number | null;
  net25: number;
}

/** 30-year cash flow with panel degradation, O&M, one inverter replacement in year 12. */
function payback(capex: number, S1: number, esc: number, pv: number): PaybackResult {
  let cum = -capex;
  let yrs: number | null = null;
  let net25 = 0;
  for (let t = 1; t <= 30; t++) {
    const s = S1 * Math.pow(1 - DEG, t - 1) * Math.pow(1 + esc, t - 1);
    const n = s - OMR * pv - (t === INV_YR ? INV_PCT * pv : 0);
    if (t <= 25 && esc === 0) net25 += n;
    if (yrs === null && cum + n >= 0) yrs = t - 1 + -cum / n;
    cum += n;
  }
  return { yrs, net25: net25 - capex };
}

interface HomeCalcResult {
  kwp: number;
  cap: number;
  save: number;
  before: number;
  after: number;
  pv: number;
}

/** Sizes the home system to the kWp that maximizes 10-year-hurdle NPV, capped by roof area and 95% of usage. */
function homeCalc(k: number, roof: number): HomeCalcResult {
  const cap = Math.floor((roof / ROOF) * 2) / 2;
  const useCap = Math.floor(((k * 12 * 0.95) / YIELD) * 2) / 2;
  const max = Math.max(0, Math.min(cap, useCap));
  const sav = (s: number) => 12 * (bill(k) - bill(Math.max(0, k - (s * YIELD) / 12)));
  let best = 0;
  let bv = -1e18;
  for (let s = 0.5; s <= max + 1e-9; s += 0.5) {
    const cx = s * pHome(s);
    const val = HURDLE * sav(s) - cx - HURDLE * OMR * cx;
    if (val > bv) {
      bv = val;
      best = s;
    }
  }
  if (best === 0) best = Math.max(0.5, Math.min(cap || 0.5, 3));
  return { kwp: best, cap, save: sav(best), before: bill(k), after: bill(Math.max(0, k - (best * YIELD) / 12)), pv: best * pHome(best) };
}

export interface CalcResult {
  ok: boolean;
  kwp: number;
  prod: number;
  save: number;
  price: number;
  pv: number;
  litres: number | null;
  home: HomeCalcResult | null;
  cutPct: number | null;
  payback0: PaybackResult | null;
  payback5: PaybackResult | null;
  note: 'n_home' | 'n_farm' | 'n_ind_grid' | 'n_svc_grid' | 'n_ind_diesel' | null;
  homeCapKwp: number | null;
}

export function calcHome(monthlyKwh: number, roofM2: number, battery: boolean): CalcResult {
  monthlyKwh = safeInput(monthlyKwh);
  roofM2 = safeInput(roofM2);
  if (monthlyKwh < 20 || roofM2 < 4) return emptyResult();
  const home = homeCalc(monthlyKwh, roofM2);
  const price = home.pv + (battery ? BAT : 0);
  return finish(home.kwp, home.save, price, home.pv, null, home, 'n_home', home.cap);
}

export function calcFarm(pumpHp: number, hoursPerDay: number, daysPerYear: number, dieselPrice: number): CalcResult {
  pumpHp = safeInput(pumpHp);
  hoursPerDay = Math.min(24, safeInput(hoursPerDay));
  daysPerYear = Math.min(366, safeInput(daysPerYear));
  dieselPrice = safeInput(dieselPrice);
  if (!pumpHp || !hoursPerDay || !daysPerYear || !dieselPrice) return emptyResult();
  const kw = pumpHp * 0.746;
  const e = kw * hoursPerDay * daysPerYear;
  const litres = e * LPK;
  const save = litres * dieselPrice * GEN_OM;
  const kwp = Math.round(kw * 1.4 * 10) / 10;
  const price = kwp * P_FARM;
  return finish(kwp, save, price, price, litres, null, 'n_farm', null);
}

/**
 * Grid-connected site (Industrial Facilities on-grid, Services Sector).
 * The monthly bill is converted to kWh at `tariff` -- EgyptERA's 2.55
 * medium-voltage rate for industry, and the disclosed 2.55 assumption for
 * the services sector (RATES.service). Priced on the industrial list.
 */
export function calcIndustrialGrid(
  monthlyBillEgp: number,
  solarSharePct: number,
  tariff: number = IND_TAR,
  note: 'n_ind_grid' | 'n_svc_grid' = 'n_ind_grid',
): CalcResult {
  monthlyBillEgp = safeInput(monthlyBillEgp);
  tariff = safeInput(tariff);
  if (!tariff) return emptyResult();
  solarSharePct = Math.min(100, safeInput(solarSharePct));
  if (!monthlyBillEgp || !solarSharePct) return emptyResult();
  const share = solarSharePct / 100;
  const e = (monthlyBillEgp / tariff) * 12 * share;
  const kwp = e / YIELD;
  const price = kwp * P_IND;
  return finish(kwp, monthlyBillEgp * 12 * share, price, price, null, null, note, null);
}

export function calcIndustrialDiesel(monthlyLitres: number, solarSharePct: number, dieselPrice: number): CalcResult {
  monthlyLitres = safeInput(monthlyLitres);
  solarSharePct = Math.min(100, safeInput(solarSharePct));
  dieselPrice = safeInput(dieselPrice);
  if (!monthlyLitres || !solarSharePct || !dieselPrice) return emptyResult();
  const share = solarSharePct / 100;
  const L = monthlyLitres * 12 * share;
  const e = L / LPK;
  const kwp = e / YIELD;
  const price = kwp * P_HYB;
  return finish(kwp, L * dieselPrice * GEN_OM, price, price, L, null, 'n_ind_diesel', null);
}

/**
 * Off-grid site on diesel generators, from what it spends on fuel each
 * month (EGP). Litres = spend / price per litre -- a plain unit conversion,
 * no new assumption -- then the existing diesel-hybrid model applies.
 */
export function calcIndustrialOffGrid(monthlyFuelCostEgp: number, solarSharePct: number, dieselPrice: number): CalcResult {
  const price = safeInput(dieselPrice);
  if (!price) return emptyResult();
  return calcIndustrialDiesel(safeInput(monthlyFuelCostEgp) / price, solarSharePct, price);
}

function finish(
  kwp: number,
  save: number,
  price: number,
  pv: number,
  litres: number | null,
  home: HomeCalcResult | null,
  note: CalcResult['note'],
  homeCapKwp: number | null,
): CalcResult {
  const prod = kwp * YIELD;
  const ok = save > 0 && price > 0;
  const payback0 = ok ? payback(price, save, 0, pv) : null;
  const payback5 = ok ? payback(price, save, ESC, pv) : null;
  const cutPct = home && home.before > 0 ? (1 - home.after / home.before) * 100 : home ? 0 : null;
  return { ok, kwp, prod, save, price, pv, litres, home, cutPct, payback0, payback5, note, homeCapKwp };
}

function emptyResult(): CalcResult {
  return {
    ok: false,
    kwp: 0,
    prod: 0,
    save: 0,
    price: 0,
    pv: 0,
    litres: null,
    home: null,
    cutPct: null,
    payback0: null,
    payback5: null,
    note: null,
    homeCapKwp: null,
  };
}

/** Displayed/shared price: rounded to the nearest EGP 1,000, exactly as the results panel shows it. */
export function roundedPrice(price: number): number {
  return Math.round(price / 1000) * 1000;
}

/** Indicative price of a home system of `kwp` (without battery), from the same price list the calculator uses. */
export function homeSystemPrice(kwp: number): number {
  const s = safeInput(kwp);
  return s * pHome(s);
}
