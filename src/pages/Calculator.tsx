import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage, fmt } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { BillWaLink } from '../components/ui/WaLink';
import { RATES } from '../config/tariffs';
import type { CalcTab } from '../config/navigation';
import { CROPS, TREES, cropNeedsTree, optionLabel } from '../content/farmCrops';
import type { CalculatorContext } from '../services/leadService';
import {
  bill,
  kwhFromBill,
  calcHome,
  calcFarm,
  calcIndustrialGrid,
  calcIndustrialOffGrid,
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
type SiteConfig = 'on-grid' | 'off-grid';

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

/** Empty or non-numeric input becomes 0, which the calculator treats as "no estimate". */
const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const DASH = '–';

export default function Calculator() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const tabRefs = useRef<Record<CalcTab, HTMLButtonElement | null>>({ home: null, farm: null, ind: null, svc: null });
  const initialTab = (searchParams.get('tab') as CalcTab | null) ?? 'home';
  const [tab, setTab] = useState<CalcTab>(TABS.includes(initialTab) ? initialTab : 'home');

  // Residential & Commercial
  const [hUnit, setHUnit] = useState<'kwh' | 'egp'>('kwh');
  const [hVal, setHVal] = useState(1200);
  const [hRoof, setHRoof] = useState(120);
  const [hBat, setHBat] = useState(false);

  // Agricultural Farms
  const [fHp, setFHp] = useState(40);
  const [fHrs, setFHrs] = useState(8);
  const [fDays, setFDays] = useState(300);
  const [fDp, setFDp] = useState<number>(RATES.diesel.value);
  const [fCrop, setFCrop] = useState('');
  const [fTree, setFTree] = useState('');

  // Industrial Facilities (each configuration keeps its own cost, so switching never reuses the other's figure)
  const [iConfig, setIConfig] = useState<SiteConfig>('on-grid');
  const [iGridCost, setIGridCost] = useState(150000);
  const [iFuelCost, setIFuelCost] = useState(615000);
  const [iDp, setIDp] = useState<number>(RATES.diesel.value);
  const [iShare, setIShare] = useState(30);

  // Services Sector
  const [sType, setSType] = useState('');
  const [sCost, setSCost] = useState(150000);
  const [sShare, setSShare] = useState(30);

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
    if (tab === 'home') return calcHome(hKwh, hRoof, hBat);
    if (tab === 'farm') return calcFarm(fHp, fHrs, fDays, fDp);
    if (tab === 'svc') return calcIndustrialGrid(sCost, sShare, RATES.service.value, 'n_svc_grid');
    return iConfig === 'on-grid' ? calcIndustrialGrid(iGridCost, iShare) : calcIndustrialOffGrid(iFuelCost, iShare, iDp);
  }, [tab, hKwh, hRoof, hBat, fHp, fHrs, fDays, fDp, sCost, sShare, iConfig, iGridCost, iFuelCost, iDp, iShare]);

  function fmtYears(p: CalcResult['payback0']) {
    if (p && p.yrs !== null) return `${n1.format(p.yrs)} ${t.u_yr}`;
    return result.ok ? t.over30 : DASH;
  }

  const noteKey = result.note;
  const note = noteKey
    ? noteKey === 'n_home' && result.homeCapKwp !== null
      ? fmt(t.n_home, 'cap', n1.format(result.homeCapKwp))
      : t[noteKey]
    : '';

  /** Context of the ACTIVE tab only -- inputs from other tabs are never included. */
  const context: CalculatorContext | null = useMemo(() => {
    if (!result.ok) return null;
    const base = {
      category: TAB_CATEGORY[tab],
      systemSizeKwp: Math.round(result.kwp * 10) / 10,
      indicativePriceEgp: roundedPrice(result.price),
      yearlySavingEgp: Math.round(result.save),
      paybackYears: result.payback0?.yrs != null ? Math.round(result.payback0.yrs * 10) / 10 : null,
    };
    if (tab === 'home') return { ...base, monthlyKwh: Math.round(hKwh), roofM2: hRoof, battery: hBat };
    if (tab === 'farm')
      return { ...base, pumpHp: fHp, crop: fCrop || undefined, tree: showTree && fTree ? fTree : undefined, dieselPriceEgp: fDp };
    if (tab === 'svc') return { ...base, facilityType: sType || undefined, monthlyElectricityCostEgp: sCost, solarSharePct: sShare };
    return {
      ...base,
      siteConfig: iConfig,
      monthlyElectricityCostEgp: iConfig === 'on-grid' ? iGridCost : iFuelCost,
      solarSharePct: iShare,
      dieselPriceEgp: iConfig === 'off-grid' ? iDp : undefined,
    };
  }, [result, tab, hKwh, hRoof, hBat, fHp, fCrop, fTree, showTree, fDp, sType, sCost, sShare, iConfig, iGridCost, iFuelCost, iShare, iDp]);

  // Exactly the figures shown in the results panel (same formatting and
  // rounding), so WhatsApp and the contact form never disagree with the screen.
  const details = [
    tab === 'farm' && fCrop ? `${t.f_crop}: ${optionLabel(CROPS, fCrop, language)}` : '',
    tab === 'farm' && showTree && fTree ? `${t.f_tree}: ${optionLabel(TREES, fTree, language)}` : '',
    tab === 'ind' ? `${t.f_imode}: ${iConfig === 'on-grid' ? t.opt_grid : t.opt_diesel}` : '',
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

  const contactType = tab === 'home' ? 'home' : tab === 'farm' ? 'farm' : tab === 'svc' ? 'service' : iConfig === 'off-grid' ? 'oilgas' : 'factory';

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

  const shareField = (id: string, value: number, set: (n: number) => void) => (
    <div className="field">
      <label htmlFor={id}>
        <span>{t.f_ishare}</span> <span className="rv">{value}%</span>
      </label>
      <input id={id} type="range" min={10} max={80} step={5} value={value} aria-valuetext={`${value}%`} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );

  return (
    <>
      <Seo page="calculator" path="/calculator" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.c_eyebrow}</span>
          <h1>{t.c_title}</h1>
          <p className="lead">{t.c_lead}</p>
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
                  <div className="field">
                    <label htmlFor="h_unit">{t.f_unit}</label>
                    <select id="h_unit" value={hUnit} onChange={(e) => onUnitChange(e.target.value as 'kwh' | 'egp')}>
                      <option value="kwh">{t.opt_kwh}</option>
                      <option value="egp">{t.opt_egp}</option>
                    </select>
                  </div>
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
                  <div className="field">
                    <label htmlFor="f_hp">{t.f_hp}</label>
                    <input id="f_hp" type="number" min={1} step={1} value={fHp} onChange={(e) => setFHp(toNumber(e.target.value))} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_hrs">{t.f_hrs}</label>
                    <input id="f_hrs" type="number" min={1} max={14} step={1} value={fHrs} onChange={(e) => setFHrs(toNumber(e.target.value))} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_days">{t.f_days}</label>
                    <input id="f_days" type="number" min={30} max={365} step={5} value={fDays} onChange={(e) => setFDays(toNumber(e.target.value))} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_dp">{t.f_dp}</label>
                    <input id="f_dp" type="number" min={1} step={0.25} value={fDp} onChange={(e) => setFDp(toNumber(e.target.value))} />
                  </div>
                </div>
              )}

              {tab === 'ind' && (
                <div>
                  <fieldset className="field choices">
                    <legend>{t.f_imode}</legend>
                    {(['on-grid', 'off-grid'] as const).map((c) => (
                      <label key={c} className="choice">
                        <input type="radio" name="i_config" value={c} checked={iConfig === c} onChange={() => setIConfig(c)} />
                        <span>{c === 'on-grid' ? t.opt_grid : t.opt_diesel}</span>
                      </label>
                    ))}
                  </fieldset>
                  <div className="field">
                    <label htmlFor="i_cost">{t.f_icost}</label>
                    <input
                      id="i_cost"
                      type="number"
                      min={0}
                      step={5000}
                      value={iConfig === 'on-grid' ? iGridCost : iFuelCost}
                      onChange={(e) => (iConfig === 'on-grid' ? setIGridCost : setIFuelCost)(toNumber(e.target.value))}
                      aria-describedby="i_cost_h"
                    />
                    <span className="hint" id="i_cost_h">{iConfig === 'on-grid' ? t.h_icost_grid : t.h_icost_off}</span>
                  </div>
                  {iConfig === 'off-grid' && (
                    <div className="field">
                      <label htmlFor="i_dp">{t.f_dp}</label>
                      <input id="i_dp" type="number" min={1} step={0.25} value={iDp} onChange={(e) => setIDp(toNumber(e.target.value))} />
                    </div>
                  )}
                  {shareField('i_share', iShare, setIShare)}
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
                  <div className="field">
                    <label htmlFor="s_cost">{t.f_icost}</label>
                    <input id="s_cost" type="number" min={0} step={5000} value={sCost} onChange={(e) => setSCost(toNumber(e.target.value))} aria-describedby="s_cost_h" />
                    <span className="hint" id="s_cost_h">{t.h_icost_grid}</span>
                  </div>
                  {shareField('s_share', sShare, setSShare)}
                </div>
              )}
            </div>

            <div className="panel">
              <h2 className="sr-only">{t.c_title}</h2>
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
                  <BillWaLink segment="calc" trackSegment="villas" extra={summary} systemSizeKwp={result.kwp} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
