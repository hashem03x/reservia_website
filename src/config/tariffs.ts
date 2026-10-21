/**
 * Single source of truth for every tariff / fuel-price assumption the
 * public website uses (calculator, rate board, regression tests).
 *
 * These are website estimating assumptions only -- not billing data and
 * not connected to the ERP. Every figure carries its source, as-of date,
 * customer segment and verification status, so a reviewer can see at a
 * glance which numbers are officially published and which come from the
 * press or from the client brief. See docs/TARIFFS.md for the full
 * discussion and docs/CLIENT_DECISIONS.md (decision 5) for open questions.
 */

export type VerificationStatus =
  /** Published by EgyptERA on its own tariff page. */
  | 'official'
  /** Reported by Egyptian press; not (yet) on an official EgyptERA table. */
  | 'press-reported'
  /** Supplied in the client brief; not independently verified. */
  | 'client-brief'
  /** A modelling assumption chosen by Reservia, disclosed to the user. */
  | 'assumption';

export interface RateSource {
  label: string;
  url?: string;
}

export interface Rate {
  /** EGP per kWh (or per litre for diesel). */
  value: number;
  unit: 'EGP/kWh' | 'EGP/litre';
  segment: string;
  /** ISO date the figure applies from / was last checked against. */
  asOf: string;
  status: VerificationStatus;
  sources: RateSource[];
  note?: string;
}

const EGYPTERA_APR_2026: RateSource = {
  label: 'EgyptERA: electricity tariff from April 2026',
  url: 'https://egyptera.org/en/TarrifApril2026.aspx',
};
const ENTERPRISE_AUG_2026: RateSource = {
  label: 'EnterpriseAM, 2 Aug 2026: household electricity tariffs hiked by an average of 12%',
  url: 'https://enterpriseam.com/egypt/2026/08/02/household-electricity-tariffs-hiked-by-an-average-of-12/',
};
const EGYPT_INDEPENDENT_JUL_2026: RateSource = {
  label: "Egypt Independent, 9 Jul 2026: Egypt's 2026 electricity prices (top household tier 2.58, up from 2.23)",
  url: 'https://www.egyptindependent.com/egypts-2026-electricity-prices-the-full-list-of-household-and-commercial-rates-after-latest-updates/',
};
const AHRAM_MAR_2026: RateSource = {
  label: 'Ahram Online: fuel prices raised on 10 March 2026, diesel EGP 17.50 to 20.50',
  url: 'https://english.ahram.org.eg/NewsContentP/3/563687/Business/Egypt-raises-fuel-prices-amid-global-energy-market.aspx',
};
const CLIENT_BRIEF: RateSource = { label: 'Reservia client brief, 13-17 October 2026' };

/** Date shown on the rate board ("As of 14 Oct 2026"); the client brief's effective date. */
export const TARIFF_AS_OF = '2026-10-14';

/**
 * Household tiers, kWh per month. Each slab is [width in kWh, EGP/kWh],
 * applied progressively up to 1,000 kWh (cumulative boundaries 50, 100,
 * 200, 350, 650, 1,000 -- the ranges every source lists).
 *
 * Above 1,000 kWh the whole month's consumption is billed at the top rate,
 * which is how the reference villa figures in the brief were produced
 * (1,200 kWh x 2.89 = EGP 3,468/month). See docs/TARIFFS.md: EgyptERA's
 * own table also hints that consumers above 100 kWh lose tiers 1-2 and
 * that 651-1,000 kWh is billed "from zero"; the press tables do not say
 * so, and the client has not confirmed it, so the existing tier model is
 * preserved and the question is logged as client decision 5.
 */
export const HOUSEHOLD_SLABS: ReadonlyArray<readonly [number, number]> = [
  [50, 0.68],
  [50, 0.87],
  [100, 1.06],
  [150, 1.74],
  [300, 2.18],
  [350, 2.35],
];
export const HOUSEHOLD_FLAT_THRESHOLD_KWH = 1000;

export const RATES = {
  householdTiers: {
    value: 0.68,
    unit: 'EGP/kWh',
    segment: 'Household, tiers 1-6 (0.68 / 0.87 / 1.06 / 1.74 / 2.18 / 2.35)',
    asOf: '2026-08-01',
    status: 'press-reported',
    sources: [ENTERPRISE_AUG_2026, CLIENT_BRIEF],
    note: 'EgyptERA April 2026 table: 0.68 / 0.78 / 0.95 / 1.55 / 1.95 / 2.10. The August 2026 values are press-reported (about 12% higher) and not yet on an EgyptERA page.',
  },
  householdTop: {
    value: 2.89,
    unit: 'EGP/kWh',
    segment: 'Household, consumption above 1,000 kWh a month',
    asOf: '2026-08-01',
    status: 'press-reported',
    sources: [ENTERPRISE_AUG_2026, CLIENT_BRIEF],
    note: 'Disputed: EgyptERA April 2026 lists 2.58 for this tier. 2.89 is the press-reported August 2026 rate specified by the client; EgyptERA has not been seen to confirm it.',
  },
  householdTopOct2025: {
    value: 2.23,
    unit: 'EGP/kWh',
    segment: 'Household, above 1,000 kWh, October 2025 (comparison only)',
    asOf: '2025-10-01',
    status: 'press-reported',
    sources: [EGYPT_INDEPENDENT_JUL_2026, CLIENT_BRIEF],
  },
  commercial: {
    value: 2.79,
    unit: 'EGP/kWh',
    segment: 'Commercial, above 1,000 kWh a month',
    asOf: '2026-04-01',
    status: 'official',
    sources: [EGYPTERA_APR_2026],
  },
  otherUsersMV: {
    value: 2.55,
    unit: 'EGP/kWh',
    segment: "'Other users', medium voltage (22-11 kV); used for factories",
    asOf: '2026-04-01',
    status: 'official',
    sources: [EGYPTERA_APR_2026],
  },
  service: {
    value: 2.55,
    unit: 'EGP/kWh',
    segment: 'Service sector (hospitals, hotels, schools, malls, offices, clubs)',
    asOf: '2026-04-01',
    status: 'assumption',
    sources: [EGYPTERA_APR_2026, CLIENT_BRIEF],
    note: 'Conservative assumption. Service buildings are not a separate EgyptERA category; depending on the connection they pay commercial tiers (up to 2.79) or the other-users rate (2.55 MV, 2.74 LV). A site survey replaces this with the real tariff.',
  },
  diesel: {
    value: 20.5,
    unit: 'EGP/litre',
    segment: 'Diesel (solar), retail',
    asOf: '2026-03-10',
    status: 'client-brief',
    sources: [AHRAM_MAR_2026, CLIENT_BRIEF],
    note: 'Reported price since 10 March 2026. Verify the current pump price before quoting: fuel prices are reviewed periodically.',
  },
} as const satisfies Record<string, Rate>;

/** Diesel genset fuel use, litres per kWh (modelling assumption). */
export const DIESEL_LITRES_PER_KWH = 0.3;

/** Fuel-only cost of one diesel-generated kWh (rate board "DSL" row). */
export const DIESEL_COST_PER_KWH = RATES.diesel.value * DIESEL_LITRES_PER_KWH;

/** Percentage change, one decimal, used for the rate board "vs Oct 2025" column. */
export function pctChange(from: number, to: number): number {
  return Math.round(((to - from) / from) * 1000) / 10;
}

/** Diesel retail price in October 2025 (Egyptian Streets, 17 Oct 2025), for the rate board comparison. */
export const DIESEL_OCT_2025 = 17.5;

/**
 * Rate board rows and their "vs Oct 2025" change. DSL and RES are computed
 * from sourced before/after values. COM and IND percentages are carried
 * over unchanged from the supplied reference template (Reservia.html);
 * their October 2025 base values are not recorded in the project, so they
 * are not reconstructed here (see docs/TARIFFS.md).
 */
export const RATE_BOARD = [
  { sym: 'DSL', labelKey: 'lb_dsl', value: DIESEL_COST_PER_KWH, changePct: pctChange(DIESEL_OCT_2025, RATES.diesel.value) },
  { sym: 'RES', labelKey: 'lb_res', value: RATES.householdTop.value, changePct: pctChange(RATES.householdTopOct2025.value, RATES.householdTop.value) },
  { sym: 'COM', labelKey: 'lb_com', value: RATES.commercial.value, changePct: 19.7 },
  { sym: 'IND', labelKey: 'lb_ind', value: RATES.otherUsersMV.value, changePct: 31.4 },
] as const;

/** Rate board "SOL" row: Reservia price list spread over 25 years with upkeep and one inverter replacement (value carried over from the reference template). */
export const SOLAR_COST_PER_KWH_25Y = 0.99;
