import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage, fmt } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { waHref } from '../services/whatsapp';
import { trackWhatsappClick } from '../services/analytics';
import { segmentGroup } from '../services/leadService';
import {
  bill,
  kwhFromBill,
  calcHome,
  calcFarm,
  calcIndustrialGrid,
  calcIndustrialDiesel,
  type CalcResult,
} from '../services/calculator';

type Tab = 'home' | 'farm' | 'ind';

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
  const location = useLocation();
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'home';
  const [tab, setTab] = useState<Tab>(['home', 'farm', 'ind'].includes(initialTab) ? initialTab : 'home');

  const [hUnit, setHUnit] = useState<'kwh' | 'egp'>('kwh');
  const [hVal, setHVal] = useState(1200);
  const [hRoof, setHRoof] = useState(120);
  const [hBat, setHBat] = useState(false);

  const [fHp, setFHp] = useState(40);
  const [fHrs, setFHrs] = useState(8);
  const [fDays, setFDays] = useState(300);
  const [fDp, setFDp] = useState(20.5);

  const [iMode, setIMode] = useState<'grid' | 'diesel'>('grid');
  const [iBill, setIBill] = useState(150000);
  const [iLit, setILit] = useState(30000);
  const [iDp, setIDp] = useState(20.5);
  const [iShare, setIShare] = useState(30);

  const n0 = useNumberFormat(language, 0);
  const n1 = useNumberFormat(language, 1);

  const hKwh = hUnit === 'egp' ? kwhFromBill(hVal) : hVal;
  const hint =
    hVal > 0
      ? hUnit === 'egp'
        ? fmt(t.d_kwh, 'n', n0.format(Math.round(hKwh)))
        : fmt(t.d_bill, 'n', n0.format(Math.round(bill(hKwh))))
      : '';

  function onUnitChange(next: 'kwh' | 'egp') {
    if (next === hUnit) return;
    setHVal(next === 'egp' ? Math.round(bill(hVal) / 100) * 100 : Math.round(kwhFromBill(hVal) / 50) * 50);
    setHUnit(next);
  }

  const result: CalcResult = useMemo(() => {
    if (tab === 'home') return calcHome(hKwh, hRoof, hBat);
    if (tab === 'farm') return calcFarm(fHp, fHrs, fDays, fDp);
    return iMode === 'grid' ? calcIndustrialGrid(iBill, iShare) : calcIndustrialDiesel(iLit, iShare, iDp);
  }, [tab, hKwh, hRoof, hBat, fHp, fHrs, fDays, fDp, iMode, iBill, iLit, iDp, iShare]);

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

  const summary = useMemo(() => {
    if (!result.ok) return '';
    const tabName = t[`tab_${tab}`];
    return `${tabName}: ${t.r_size} ${n1.format(result.kwp)} ${t.u_kwp}, ${t.r_price} ${n0.format(Math.round(result.price / 1000) * 1000)} ${t.u_egp}, ${t.r_save} ${n0.format(result.save)} ${t.u_egpyr}, ${t.r_pb} ${fmtYears(result.payback0)}. `;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, t, tab, n0, n1]);

  useEffect(() => {
    document.getElementById('calcPanel')?.setAttribute('aria-labelledby', `tab-${tab}`);
  }, [tab]);

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
            {(['home', 'farm', 'ind'] as Tab[]).map((id) => (
              <button
                key={id}
                className="tab"
                role="tab"
                id={`tab-${id}`}
                aria-controls="calcPanel"
                aria-selected={tab === id}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
              >
                {t[`tab_${id}`]}
              </button>
            ))}
          </div>

          <div className="calc">
            <div className="panel" id="calcPanel" role="tabpanel">
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
                    <input id="h_val" type="number" min={1} step={50} value={hVal} onChange={(e) => setHVal(Number(e.target.value) || 0)} aria-describedby="h_derived" />
                    <span className="hint" id="h_derived">{hint}</span>
                  </div>
                  <div className="field">
                    <label htmlFor="h_roof">{t.f_roof}</label>
                    <input id="h_roof" type="number" min={10} step={10} value={hRoof} onChange={(e) => setHRoof(Number(e.target.value) || 0)} />
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
                    <label htmlFor="f_hp">{t.f_hp}</label>
                    <input id="f_hp" type="number" min={1} step={1} value={fHp} onChange={(e) => setFHp(Number(e.target.value) || 0)} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_hrs">{t.f_hrs}</label>
                    <input id="f_hrs" type="number" min={1} max={14} step={1} value={fHrs} onChange={(e) => setFHrs(Number(e.target.value) || 0)} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_days">{t.f_days}</label>
                    <input id="f_days" type="number" min={30} max={365} step={5} value={fDays} onChange={(e) => setFDays(Number(e.target.value) || 0)} />
                  </div>
                  <div className="field">
                    <label htmlFor="f_dp">{t.f_dp}</label>
                    <input id="f_dp" type="number" min={1} step={0.25} value={fDp} onChange={(e) => setFDp(Number(e.target.value) || 0)} />
                  </div>
                </div>
              )}

              {tab === 'ind' && (
                <div>
                  <div className="field">
                    <label htmlFor="i_mode">{t.f_imode}</label>
                    <select id="i_mode" value={iMode} onChange={(e) => setIMode(e.target.value as 'grid' | 'diesel')}>
                      <option value="grid">{t.opt_grid}</option>
                      <option value="diesel">{t.opt_diesel}</option>
                    </select>
                  </div>
                  {iMode === 'grid' ? (
                    <div className="field">
                      <label htmlFor="i_bill">{t.f_ibill}</label>
                      <input id="i_bill" type="number" min={5000} step={5000} value={iBill} onChange={(e) => setIBill(Number(e.target.value) || 0)} />
                    </div>
                  ) : (
                    <>
                      <div className="field">
                        <label htmlFor="i_lit">{t.f_ilit}</label>
                        <input id="i_lit" type="number" min={500} step={500} value={iLit} onChange={(e) => setILit(Number(e.target.value) || 0)} />
                      </div>
                      <div className="field">
                        <label htmlFor="i_dp">{t.f_dp}</label>
                        <input id="i_dp" type="number" min={1} step={0.25} value={iDp} onChange={(e) => setIDp(Number(e.target.value) || 0)} />
                      </div>
                    </>
                  )}
                  <div className="field">
                    <label htmlFor="i_share">
                      <span>{t.f_ishare}</span> <span className="rv">{iShare}%</span>
                    </label>
                    <input
                      id="i_share"
                      type="range"
                      min={10}
                      max={80}
                      step={5}
                      value={iShare}
                      aria-valuetext={`${iShare}%`}
                      onChange={(e) => setIShare(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <dl className="results" aria-live="polite">
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
                <div><dt>{t.r_price}</dt><dd>{result.ok ? `${n0.format(Math.round(result.price / 1000) * 1000)} ${t.u_egp}` : DASH}</dd></div>
                <div className="hl"><dt>{t.r_pb}</dt><dd>{fmtYears(result.payback0)}</dd></div>
                <div><dt>{t.r_pb5}</dt><dd>{fmtYears(result.payback5)}</dd></div>
                <div><dt>{t.r_net}</dt><dd>{result.ok && result.payback0 ? `${n0.format(Math.round(result.payback0.net25 / 1000) * 1000)} ${t.u_egp}` : DASH}</dd></div>
              </dl>
              <p className="assume">{note}</p>
              <p className="assume">{t.c_assume}</p>
              <div className="cta-row" style={{ marginTop: 16 }}>
                <Link className="btn sun" to={`/${language}/contact`}>{t.c_cta}</Link>
                <a
                  className="btn wa"
                  href={waHref(language, 'calc', summary)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsappClick('calc', segmentGroup('calc'), location.pathname)}
                >
                  {t.c_wa}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
