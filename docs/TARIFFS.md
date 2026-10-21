# Tariff and price assumptions (public website)

These assumptions are used only for website estimates. They are **not** billing data and are
not connected to the ERP. The single source in code is
[`src/config/tariffs.ts`](../src/config/tariffs.ts). The calculator, the rate board and the
tests all read from it.

Rate-board date shown to visitors: **As of 14 October 2026** (`TARIFF_AS_OF`), the effective
date in the client brief.

## Figures in use

| Item | Value | Segment | As of | Status | Source |
|---|---:|---|---|---|---|
| Household tiers 1–6 | 0.68 / 0.87 / 1.06 / 1.74 / 2.18 / 2.35 EGP/kWh | Household, 0–1,000 kWh/month | Aug 2026 | press-reported | EnterpriseAM, 2 Aug 2026; client brief |
| Household, above 1,000 kWh | **2.89** EGP/kWh | Household | Aug 2026 | press-reported, **disputed** | EnterpriseAM, 2 Aug 2026; client brief |
| Household top tier, Oct 2025 (comparison) | 2.23 EGP/kWh | Household | Oct 2025 | press-reported | Egypt Independent, 9 Jul 2026 ("2.58, up from 2.23") |
| Commercial, above 1,000 kWh | 2.79 EGP/kWh | Commercial | Apr 2026 | official | EgyptERA April 2026 tariff page |
| Other users, medium voltage | 2.55 EGP/kWh | Factories (industry tab) | Apr 2026 | official | EgyptERA April 2026 tariff page |
| Service sector | 2.55 EGP/kWh | Hospitals, hotels, schools, malls, offices, clubs | Apr 2026 | **assumption** | EgyptERA (range 2.55–2.79); client brief |
| Diesel | 20.50 EGP/litre | Retail diesel | 10 Mar 2026 | client-brief, verify | Ahram Online; client brief |

Tier boundaries (kWh/month): 0–50, 51–100, 101–200, 201–350, 351–650, 651–1,000, above
1,000. All sources list these same ranges.

## Checked against the sources on 21 October 2026

- **EgyptERA, April 2026** (https://egyptera.org/en/TarrifApril2026.aspx), residential
  pt/kWh: 68 (0–50), 78 (51–100); for consumers in the 101–1,000 band: 95 (0–200), 155
  (201–350), 195 (351–650); "more than 650, from zero to 1,000": 210; more than 1,000: 258.
  Commercial: 162 / 216 / 264 / 274 / 279. Other users: 255 at medium voltage, 274 at low
  voltage.
- **EnterpriseAM, 2 August 2026**: 0.68, 0.87, 1.06, 1.74, 2.18, 2.35 and "above 1 MWh 2.89, up
  from 2.58". No band rules described.
- **Egypt Independent, 9 July 2026**: April 2026 table, top tier 2.58 "up from 2.23".

## Unresolved discrepancies (client decision 5)

1. **Top household rate.** EgyptERA's own page still shows **2.58**. **2.89** is the press-reported
   August 2026 rate, specified by the client. The site uses 2.89, as the brief requires. The rate
   board says it is press-reported and that EgyptERA's April 2026 table lists 2.58. The site
   never claims that EgyptERA confirms 2.89.
2. **Band rules below 1,000 kWh.** EgyptERA's layout suggests that consumers above 100 kWh lose
   tiers 1–2, and that 651–1,000 kWh is billed "from zero" at the tier-6 rate. The press tables do
   not say this, and the client has not confirmed it. The calculator keeps its existing
   progressive model and bills the whole month at 2.89 above 1,000 kWh. The reference villa
   depends on that whole-month rule (1,200 kWh × 2.89 = EGP 3,468/month).
   - Under the EgyptERA-style band reading, the villa's post-solar bill (325 kWh) would be about
     EGP 430 instead of about EGP 401. The yearly saving would be about EGP 36,460 instead of about
     EGP 36,800, and payback about 5.4 years instead of 5.3.
   - Sizing for homes below 1,000 kWh could also change.
3. **Rate-board comparisons.** RES (+29.6%: 2.23 → 2.89) and DSL (+17.1%: 17.50 → 20.50 EGP/litre)
   are computed from the values above. COM (+19.7%) and IND (+31.4%) are carried over unchanged
   from the reference template; their October 2025 base values are not recorded in the project.
4. **Diesel.** 20.50 EGP/litre is the 10 March 2026 price. Fuel prices are reviewed periodically, so
   the site tells visitors to check the current pump price.

## Calculator regression reference (client brief)

The villa example (1,200 kWh/month, 120 m² roof) is a regression test, not a hard-coded output:

| | Brief | Model | Test |
|---|---|---|---|
| System | 6.0 kWp | 6.0 kWp | `calculator.test.ts` |
| Price | EGP 183,600 | EGP 183,600 (shown rounded: 184,000) | ✓ |
| Yearly saving | ≈ EGP 36,800 | EGP 36,804 | ✓ |
| Payback, today's tariffs | ≈ 5.3 years | 5.31 | ✓ |
| Payback, +5%/year | ≈ 4.8 years | 4.80 | ✓ |

The model matched the brief before any change. No formula was altered to force a result. The only
calculator changes are reading rates from `tariffs.ts` and rejecting invalid input (NaN, negatives,
zero) instead of computing on it.
