import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage, fmt, type Language } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { useIsClient } from '../hooks/useIsClient';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { BillWaLink } from '../components/ui/WaLink';
import { ChoiceGroup, DieselInputs, NumberField, SiteEnergyInputs, type SiteEnergy } from '../components/calculator/EnergyInputs';
import { toNumber } from '../components/calculator/numbers';
import { RATES } from '../config/tariffs';
import type { CalcTab } from '../config/navigation';
import { CROPS, TREES, cropNeedsTree, optionLabel } from '../content/farmCrops';
import { monthlyValue } from '../content/whatsappMessages';
import type { CalculatorContext } from '../services/leadService';
import { usePublishWaPrefill } from '../services/waPrefill';
import {
  bill,
  kwhFromBill,
  calcHome,
  calcFarm,
  calcFarmFromDiesel,
  calcGridFromKwh,
  calcIndustrialDiesel,
  calcIndustrialGrid,
  calcIndustrialOffGrid,
  IND_TAR,
  roundedPrice,
  type CalcResult,
} from '../services/calculator';

/** One tab per solution category, in the site-wide order. */
const TABS: CalcTab[] = ['home', 'farm', 'ind', 'svc'];
const TAB_CATEGORY: Record<CalcTab, CalculatorContext['category']> = {
  home: 'residential_commercial',
  farm: 'agricultural_farms',
  ind: 'industrial_facilities',
  svc: 'services_sector',
};
const FACILITY_TYPES = ['hospital', 'hotel', 'school', 'mall'] as const;
type FarmMode = 'hours' | 'litres' | 'egp';

/** Defaults for both site categories (the industrial on-grid figures are the long-standing defaults). */
const SITE_DEFAULTS: SiteEnergy = {
  config: 'on-grid',
  gridInput: 'bill',
  bill: 150000,
  kwh: 58800,
  dieselInput: 'litres',
  litres: 30000,
  dieselEgp: 615000,
  dieselPrice: RATES.diesel.value,
  share: 30,
};

/** Estimate for an Industrial Facilities or Services Sector site, through the path matching its inputs. */
function siteResult(s: SiteEnergy, tariff: number, note: 'n_ind_grid' | 'n_svc_grid'): CalcResult {
  if (s.config === 'on-grid') {
    return s.gridInput === 'bill' ? calcIndustrialGrid(s.bill, s.share, tariff, note) : calcGridFromKwh(s.kwh, s.share, tariff, note);
  }
  return s.dieselInput === 'litres' ? calcIndustrialDiesel(s.litres, s.share, s.dieselPrice) : calcIndustrialOffGrid(s.dieselEgp, s.share, s.dieselPrice);
}

/** The site's monthly figure with its real unit (for the WhatsApp message and the attached estimate). */
function siteMonthly(lang: Language, s: SiteEnergy): string {
  if (s.config === 'on-grid') return s.gridInput === 'bill' ? monthlyValue(lang, s.bill, 'billEgp') : monthlyValue(lang, s.kwh, 'kwh');
  return s.dieselInput === 'litres' ? monthlyValue(lang, s.litres, 'dieselLitres') : monthlyValue(lang, s.dieselEgp, 'dieselEgp');
}

/** Context fields for a site: only the inputs of the selected connection and unit. */
function siteContext(s: SiteEnergy): Partial<CalculatorContext> {
  if (s.config === 'on-grid') {
    return {
      siteConfig: 'on-grid',
      gridInput: s.gridInput,
      ...(s.gridInput === 'bill' ? { monthlyElectricityCostEgp: s.bill } : { monthlyKwh: s.kwh }),
      solarSharePct: s.share,
    };
  }
  return {
    siteConfig: 'off-grid',
    dieselInput: s.dieselInput,
    ...(s.dieselInput === 'litres' ? { monthlyDieselLitres: s.litres } : { monthlyDieselCostEgp: s.dieselEgp }),
    dieselPriceEgp: s.dieselPrice,
    solarSharePct: s.share,
  };
}

function useNumberFormat(lang: 'en' | 'ar', fractionDigits: 0 | 1) {
  return useMemo(
    () =>
      new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits,
      }),
    [lang, fractionDigits],
  );
}

const DASH = '–';

export default function Calculator() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const tabRefs = useRef<Record<CalcTab, HTMLButtonElement | null>>({ home: null, farm: null, ind: null, svc: null });
  // The prerendered HTML shows the default tab; ?tab= applies once hydrated (useIsClient), so
  // server HTML and the first client render match. A tab the visitor picks always wins.
  const isClient = useIsClient();
  const queryTab = searchParams.get('tab') as CalcTab | null;
  const [chosenTab, setTab] = useState<CalcTab | null>(null);
  const tab: CalcTab = chosenTab ?? (isClient && queryTab && TABS.includes(queryTab) ? queryTab : 'home');

  // Residential & Commercial (hShare null = the recommended, best-payback size)
  const [hUnit, setHUnit] = useState<'kwh' | 'egp'>('kwh');
  const [hVal, setHVal] = useState(1200);
  const [hRoof, setHRoof] = useState(120);
  const [hBat, setHBat] = useState(false);
  const [hShare, setHShare] = useState<number | null>(null);

  // Agricultural Farms (each way of describing diesel use keeps its own value)
  const [fHp, setFHp] = useState(40);
  const [fMode, setFMode] = useState<FarmMode>('hours');
  const [fHrs, setFHrs] = useState(8);
  const [fDays, setFDays] = useState(300);
  const [fLitres, setFLitres] = useState(1800);
  const [fEgp, setFEgp] = useState(36900);
  const [fDp, setFDp] = useState<number>(RATES.diesel.value);
  const [fCrop, setFCrop] = useState('');
  const [fTree, setFTree] = useState('');

  // Industrial Facilities and Services Sector share the same energy inputs
  const [ind, setInd] = useState<SiteEnergy>(SITE_DEFAULTS);
  const [svc, setSvc] = useState<SiteEnergy>(SITE_DEFAULTS);
  const [sType, setSType] = useState('');

  const n0 = useNumberFormat(language, 0);
  const n1 = useNumberFormat(language, 1);

  const hKwh = hUnit === 'egp' ? kwhFromBill(hVal) : hVal;
  const hint =
    hVal > 0
      ? hUnit === 'egp'
        ? fmt(t.d_kwh, 'n', n0.format(Math.round(hKwh)))
        : fmt(t.d_bill, 'n', n0.format(Math.round(bill(hKwh))))
      : '';
  const showTree = cropNeedsTree(fCrop);

  function onUnitChange(next: 'kwh' | 'egp') {
    if (next === hUnit) return;
    setHVal(next === 'egp' ? Math.round(bill(hVal) / 100) * 100 : Math.round(kwhFromBill(hVal) / 50) * 50);
    setHUnit(next);
  }

  function onCropChange(id: string) {
    setFCrop(id);
    if (!cropNeedsTree(id)) setFTree(''); // never keep a tree for a non-tree crop
  }

  const result: CalcResult = useMemo(() => {
    if (tab === 'home') return calcHome(hKwh, hRoof, hBat, hShare ?? undefined);
    if (tab === 'farm') {
      if (fMode === 'hours') return calcFarm(fHp, fHrs, fDays, fDp);
      return calcFarmFromDiesel(fHp, fMode === 'litres' ? fLitres : fDp > 0 ? fEgp / fDp : 0, fDp);
    }
    if (tab === 'svc') return siteResult(svc, RATES.service.value, 'n_svc_grid');
    return siteResult(ind, IND_TAR, 'n_ind_grid');
  }, [tab, hKwh, hRoof, hBat, hShare, fMode, fHp, fHrs, fDays, fLitres, fEgp, fDp, ind, svc]);

  // Slider position: the visitor's choice, or the recommended share (to the nearest 5%).
  const recommendedShare = result.home ? Math.min(100, Math.max(10, Math.round(result.home.recommendedSharePct / 5) * 5)) : 70;
  const shareShown = hShare ?? recommendedShare;

  function fmtYears(p: CalcResult['payback0']) {
    if (p && p.yrs !== null) return `${n1.format(p.yrs)} ${t.u_yr}`;
    return result.ok ? t.over30 : DASH;
  }

  const noteKey = result.note;
  const note = !noteKey
    ? ''
    : noteKey === 'n_home' && result.homeCapKwp !== null
      ? fmt(t.n_home, 'cap', n1.format(result.homeCapKwp))
      : noteKey === 'n_home_share' && result.home
        ? t.n_home_share.replace('{n}', n0.format(result.home.sharePct)).replace('{cap}', n1.format(result.home.cap))
        : t[noteKey];

  const site = tab === 'svc' ? svc : ind;
  const farmMonthly = fMode === 'litres' ? monthlyValue(language, fLitres, 'dieselLitres') : fMode === 'egp' ? monthlyValue(language, fEgp, 'dieselEgp') : '';
  const monthly =
    tab === 'home' ? monthlyValue(language, hVal, hUnit === 'kwh' ? 'kwh' : 'billEgp') : tab === 'farm' ? farmMonthly : siteMonthly(language, site);
  // Every category's figure also reaches the floating WhatsApp button (the in-page bill button is Residential-only).
  usePublishWaPrefill('', monthly);

  /** Context of the ACTIVE tab only -- inputs from other tabs (or other modes) are never included. */
  const context: CalculatorContext | null = useMemo(() => {
    if (!result.ok) return null;
    const base = {
      category: TAB_CATEGORY[tab],
      systemSizeKwp: Math.round(result.kwp * 10) / 10,
      indicativePriceEgp: roundedPrice(result.price),
      yearlySavingEgp: Math.round(result.save),
      paybackYears: result.payback0?.yrs != null ? Math.round(result.payback0.yrs * 10) / 10 : null,
    };
    if (tab === 'home') return { ...base, monthlyKwh: Math.round(hKwh), roofM2: hRoof, battery: hBat, solarSharePct: hShare ?? undefined };
    if (tab === 'farm') {
      return {
        ...base,
        pumpHp: fHp,
        crop: fCrop || undefined,
        tree: showTree && fTree ? fTree : undefined,
        dieselInput: fMode === 'hours' ? ('pump-hours' as const) : fMode,
        ...(fMode === 'litres' ? { monthlyDieselLitres: fLitres } : fMode === 'egp' ? { monthlyDieselCostEgp: fEgp } : {}),
        dieselPriceEgp: fDp,
      };
    }
    if (tab === 'svc') return { ...base, facilityType: sType || undefined, ...siteContext(svc) };
    return { ...base, ...siteContext(ind) };
  }, [result, tab, hKwh, hRoof, hBat, hShare, fHp, fCrop, fTree, showTree, fMode, fLitres, fEgp, fDp, sType, svc, ind]);

  // Exactly the figures shown in the results panel (same formatting and
  // rounding), so WhatsApp and the contact form never disagree with the screen.
  const details = [
    monthly,
    tab === 'farm' && fCrop ? `${t.f_crop}: ${optionLabel(CROPS, fCrop, language)}` : '',
    tab === 'farm' && showTree && fTree ? `${t.f_tree}: ${optionLabel(TREES, fTree, language)}` : '',
    tab === 'ind' || tab === 'svc' ? `${t.f_imode}: ${site.config === 'on-grid' ? t.opt_grid : t.opt_diesel}` : '',
    tab === 'svc' && sType ? `${t.f_stype}: ${t[`st_${sType}`]}` : '',
  ].filter(Boolean);
  const summary = result.ok
    ? [
        `${t[`tab_${tab}`]}: ${t.r_size} ${n1.format(result.kwp)} ${t.u_kwp}`,
        ...details,
        `${t.r_price} ${n0.format(roundedPrice(result.price))} ${t.u_egp}`,
        `${t.r_save} ${n0.format(result.save)} ${t.u_egpyr}`,
        `${t.r_pb} ${fmtYears(result.payback0)}`,
        `${t.r_pb5} ${fmtYears(result.payback5)}`,
      ].join('; ') + '.'
    : '';

  const contactType = tab === 'home' ? 'home' : tab === 'farm' ? 'farm' : tab === 'svc' ? 'service' : ind.config === 'off-grid' ? 'oilgas' : 'factory';

  /** WAI-ARIA tabs pattern: Arrow keys move and activate (mirrored in RTL), Home/End jump to the ends. */
  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.indexOf(tab);
    const rtl = document.documentElement.dir === 'rtl';
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
    else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const target = TABS[(next + TABS.length) % TABS.length];
    setTab(target);
    tabRefs.current[target]?.focus();
  }

  return (
    <>
      <Seo page="calculator" path="/calculator" />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/calculator" />
          <span className="eyebrow">{t.c_eyebrow}</span>
          <h1>{t.c_title}</h1>
          <p className="lead">{t.c_lead}</p>
          <p className="micro" style={{ color: 'var(--muted)', maxWidth: '70ch' }}>{t.c_intro}</p>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="tabs" role="tablist" aria-label={t.tabs_aria}>
            {TABS.map((id) => (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                type="button"
                className="tab"
                role="tab"
                id={`tab-${id}`}
                aria-controls="calcPanel"
                aria-selected={tab === id}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={onTabKeyDown}
              >
                {t[`tab_${id}`]}
              </button>
            ))}
          </div>

          <div className="calc">
            <div className="panel" id="calcPanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {tab === 'home' && (
                <div>
                  <ChoiceGroup
                    name="h_unit"
                    legend={t.f_gunit}
                    variant="tabs"
                    value={hUnit}
                    options={[
                      { value: 'egp', label: t.opt_gbill },
                      { value: 'kwh', label: t.opt_gkwh },
                    ]}
                    onChange={onUnitChange}
                  />
                  <div className="field">
                    <label htmlFor="h_val">{t.f_val}</label>
                    <input id="h_val" type="number" min={1} step={50} value={hVal} onChange={(e) => setHVal(toNumber(e.target.value))} aria-describedby="h_derived" />
                    <span className="hint" id="h_derived">{hint}</span>
                  </div>
                  <div className="field">
                    <label htmlFor="h_roof">{t.f_roof}</label>
                    <input id="h_roof" type="number" min={10} step={10} value={hRoof} onChange={(e) => setHRoof(toNumber(e.target.value))} />
                  </div>
                  <label className="check">
                    <input id="h_bat" type="checkbox" checked={hBat} onChange={(e) => setHBat(e.target.checked)} />
                    <span>{t.f_bat}</span>
                  </label>
                  {/* Share to supply from solar: starts at the recommended (best-payback) share; moving it sizes the system to the chosen share. */}
                  <div className="field share-field">
                    <label htmlFor="h_share">
                      <span>{t.f_hshare}</span> <span className="rv">{shareShown}%</span>
                    </label>
                    <input
                      id="h_share"
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={shareShown}
                      aria-valuetext={`${shareShown}%`}
                      aria-describedby="h_share_h"
                      onChange={(e) => setHShare(Number(e.target.value))}
                    />
                    <span className="hint" id="h_share_h">
                      {hShare === null ? t.hshare_rec.replace('{n}', String(recommendedShare)) : t.hshare_set.replace('{n}', String(hShare))}
                    </span>
                    {hShare !== null && (
                      <button type="button" className="linkbtn" onClick={() => setHShare(null)}>
                        {t.hshare_reset}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {tab === 'farm' && (
                <div>
                  <div className="field">
                    <label htmlFor="f_crop">{t.f_crop} <span className="opt">{t.q_opt}</span></label>
                    <select id="f_crop" value={fCrop} onChange={(e) => onCropChange(e.target.value)} aria-describedby="f_crop_h">
                      <option value="">{t.opt_choose}</option>
                      {CROPS.map((c) => (
                        <option key={c.id} value={c.id}>{c[language]}</option>
                      ))}
                    </select>
                    <span className="hint" id="f_crop_h">{t.h_crop}</span>
                  </div>
                  {showTree && (
                    <div className="field">
                      <label htmlFor="f_tree">{t.f_tree} <span className="opt">{t.q_opt}</span></label>
                      <select id="f_tree" value={fTree} onChange={(e) => setFTree(e.target.value)}>
                        <option value="">{t.opt_choose}</option>
                        {TREES.map((tr) => (
                          <option key={tr.id} value={tr.id}>{tr[language]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <NumberField id="f_hp" label={t.f_hp} value={fHp} step={1} min={1} onChange={setFHp} />
                  <ChoiceGroup<FarmMode>
                    name="f_mode"
                    legend={t.f_fmode}
                    value={fMode}
                    options={[
                      { value: 'hours', label: t.opt_fhours },
                      { value: 'litres', label: t.opt_dlitres },
                      { value: 'egp', label: t.opt_degp },
                    ]}
                    onChange={setFMode}
                  />
                  {fMode === 'hours' ? (
                    <>
                      <NumberField id="f_hrs" label={t.f_hrs} value={fHrs} step={1} min={1} onChange={setFHrs} />
                      <NumberField id="f_days" label={t.f_days} value={fDays} step={5} min={30} onChange={setFDays} />
                      <NumberField id="f_dp" label={t.f_dp} value={fDp} step={0.25} min={1} onChange={setFDp} />
                    </>
                  ) : (
                    <DieselInputs
                      prefix="f"
                      t={t}
                      input={fMode}
                      litres={fLitres}
                      egp={fEgp}
                      price={fDp}
                      litresHint={t.h_dlitres_farm}
                      onChange={(p) => {
                        if (p.dieselInput) setFMode(p.dieselInput);
                        if (p.litres !== undefined) setFLitres(p.litres);
                        if (p.dieselEgp !== undefined) setFEgp(p.dieselEgp);
                        if (p.dieselPrice !== undefined) setFDp(p.dieselPrice);
                      }}
                    />
                  )}
                </div>
              )}

              {tab === 'ind' && (
                <div>
                  <SiteEnergyInputs prefix="i" value={ind} tariff={IND_TAR} onChange={(p) => setInd((s) => ({ ...s, ...p }))} />
                </div>
              )}

              {tab === 'svc' && (
                <div>
                  <div className="field">
                    <label htmlFor="s_type">{t.f_stype} <span className="opt">{t.q_opt}</span></label>
                    <select id="s_type" value={sType} onChange={(e) => setSType(e.target.value)}>
                      <option value="">{t.opt_choose}</option>
                      {FACILITY_TYPES.map((f) => (
                        <option key={f} value={f}>{t[`st_${f}`]}</option>
                      ))}
                    </select>
                  </div>
                  <SiteEnergyInputs prefix="s" value={svc} tariff={RATES.service.value} onChange={(p) => setSvc((s) => ({ ...s, ...p }))} />
                </div>
              )}
            </div>

            <div className="panel">
              <h2 className="sr-only">{t.c_results}</h2>
              <dl className="results">
                <div><dt>{t.r_size}</dt><dd>{result.ok ? `${n1.format(result.kwp)} ${t.u_kwp}` : DASH}</dd></div>
                <div><dt>{t.r_prod}</dt><dd>{result.ok ? `${n0.format(result.prod)} ${t.u_kwhyr}` : DASH}</dd></div>
                {result.litres !== null && (
                  <div><dt>{t.r_diesel}</dt><dd>{`${n0.format(result.litres)} ${t.u_lyr}`}</dd></div>
                )}
                {result.home && (
                  <>
                    <div><dt>{t.r_before}</dt><dd>{`${n0.format(result.home.before)} ${t.u_egp}`}</dd></div>
                    <div><dt>{t.r_after}</dt><dd>{`${n0.format(result.home.after)} ${t.u_egp}`}</dd></div>
                  </>
                )}
                <div className="hl"><dt>{t.r_save}</dt><dd>{result.ok ? `${n0.format(result.save)} ${t.u_egpyr}` : DASH}</dd></div>
                {result.home && (
                  <div><dt>{t.r_cut}</dt><dd>{`${n0.format(result.cutPct ?? 0)}%`}</dd></div>
                )}
                <div><dt>{t.r_price}</dt><dd>{result.ok ? `${n0.format(roundedPrice(result.price))} ${t.u_egp}` : DASH}</dd></div>
                <div className="hl"><dt>{t.r_pb}</dt><dd>{fmtYears(result.payback0)}</dd></div>
                <div><dt>{t.r_pb5}</dt><dd>{fmtYears(result.payback5)}</dd></div>
                <div><dt>{t.r_net}</dt><dd>{result.ok && result.payback0 ? `${n0.format(roundedPrice(result.payback0.net25))} ${t.u_egp}` : DASH}</dd></div>
              </dl>
              <p className="calc-invalid" role="status">{result.ok ? '' : t.calc_invalid}</p>
              <p className="assume">{note}</p>
              <p className="assume">{t.c_assume}</p>
              <p className="assume">
                {t.c_related}{' '}
                <Link to={`/${language}/residential`}>{t.nav_res}</Link> · <Link to={`/${language}/agriculture`}>{t.nav_agri}</Link> ·{' '}
                <Link to={`/${language}/industrial`}>{t.nav_ind}</Link> · <Link to={`/${language}/service`}>{t.nav_svc}</Link>
              </p>
              <div className="cta-row" style={{ marginTop: 16 }}>
                <Link
                  className="btn sun"
                  to={`/${language}/contact?type=${contactType}`}
                  state={context ? { calc: { context, summary } } : undefined}
                >
                  {t.c_cta}
                </Link>
                {/* Residential & Commercial only (client rule) -- BillWaLink enforces it. */}
                {result.ok && tab === 'home' && (
                  <BillWaLink segment="calc" trackSegment="villas" fields={{ monthly, extra: summary }} systemSizeKwp={result.kwp} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
