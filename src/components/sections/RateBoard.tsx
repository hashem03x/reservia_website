import { useLanguage } from '../../i18n/LanguageContext';

/** Ported from the template's "rate board" ledger (hero aside). Rates/deltas are fixed, dated figures from the reference, not computed. */
export function RateBoard() {
  const { t } = useLanguage();

  return (
    <aside className="ledger board" aria-labelledby="ledgerT">
      <div className="bd-head">
        <h2 id="ledgerT">{t.ledger_title}</h2>
        <span className="bd-asof">
          <i />
          <span>{t.l_asof}</span>
        </span>
      </div>
      <div className="unit">{t.l_unit}</div>
      <div className="bd-cols">
        <span>&nbsp;</span>
        <span>{t.bh_s}</span>
        <span>EGP</span>
        <span>{t.bh_c}</span>
      </div>
      <div className="bd-row">
        <span className="bd-sym" aria-hidden="true">DSL</span>
        <span className="bd-lab">{t.lb_dsl}</span>
        <span className="bd-p">6.15</span>
        <span className="bd-c up">
          <span aria-hidden="true">&#9650;</span> 17.1%<span className="sr-only"> {t.sr_up}</span>
        </span>
      </div>
      <div className="bd-row">
        <span className="bd-sym" aria-hidden="true">RES</span>
        <span className="bd-lab">{t.lb_res}</span>
        <span className="bd-p">2.89</span>
        <span className="bd-c up">
          <span aria-hidden="true">&#9650;</span> 29.6%<span className="sr-only"> {t.sr_up}</span>
        </span>
      </div>
      <div className="bd-row">
        <span className="bd-sym" aria-hidden="true">COM</span>
        <span className="bd-lab">{t.lb_com}</span>
        <span className="bd-p">2.79</span>
        <span className="bd-c up">
          <span aria-hidden="true">&#9650;</span> 19.7%<span className="sr-only"> {t.sr_up}</span>
        </span>
      </div>
      <div className="bd-row">
        <span className="bd-sym" aria-hidden="true">IND</span>
        <span className="bd-lab">{t.lb_ind}</span>
        <span className="bd-p">2.55</span>
        <span className="bd-c up">
          <span aria-hidden="true">&#9650;</span> 31.4%<span className="sr-only"> {t.sr_up}</span>
        </span>
      </div>
      <div className="bd-row" style={{ borderBottom: 0 }}>
        <span className="bd-sym" style={{ color: '#58C27D' }} aria-hidden="true">SOL</span>
        <span className="bd-lab">{t.lb_sol}</span>
        <span className="bd-p" style={{ color: '#58C27D' }}>0.99</span>
        <span className="bd-c flat">
          <span aria-hidden="true">&#9644;</span> {t.l_fixed}
        </span>
      </div>
      <p className="note">{t.ledger_note}</p>
    </aside>
  );
}
