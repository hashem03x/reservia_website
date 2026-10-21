import { useLanguage } from '../../i18n/LanguageContext';
import { RATE_BOARD, RATES, SOLAR_COST_PER_KWH_25Y, pctChange } from '../../config/tariffs';

const fmt2 = (n: number) => n.toFixed(2);

/**
 * The template's "rate board" ledger (hero aside). Every figure comes from
 * src/config/tariffs.ts, so the board, the calculator and the tests can
 * never disagree. Dated assumptions, not live prices.
 */
export function RateBoard() {
  const { t } = useLanguage();
  const resCmp = t.l_res_cmp
    .replace('{now}', fmt2(RATES.householdTop.value))
    .replace('{prev}', fmt2(RATES.householdTopOct2025.value))
    .replace('{pct}', pctChange(RATES.householdTopOct2025.value, RATES.householdTop.value).toFixed(1));

  return (
    <aside className="ledger board" aria-labelledby="ledgerT">
      <div className="bd-head">
        <h2 id="ledgerT">{t.ledger_title}</h2>
        <span className="bd-asof">
          <i aria-hidden="true" />
          <span>{t.l_asof}</span>
        </span>
      </div>
      <div className="unit">{t.l_unit}</div>
      <div className="bd-cols" aria-hidden="true">
        <span>&nbsp;</span>
        <span>{t.bh_s}</span>
        <span>EGP</span>
        <span>{t.bh_c}</span>
      </div>
      <ul className="bd-list">
        {RATE_BOARD.map((row) => (
          <li className="bd-row" key={row.sym}>
            <span className="bd-sym" aria-hidden="true">{row.sym}</span>
            <span className="bd-lab">{t[row.labelKey]}</span>
            <span className="bd-p">
              <span className="sr-only">EGP </span>
              {fmt2(row.value)}
            </span>
            <span className="bd-c up">
              <span aria-hidden="true">&#9650;</span> {row.changePct.toFixed(1)}%
              <span className="sr-only"> {t.sr_up}, {t.bh_c}</span>
            </span>
          </li>
        ))}
        <li className="bd-row" style={{ borderBottom: 0 }}>
          <span className="bd-sym" style={{ color: 'var(--leaf)' }} aria-hidden="true">SOL</span>
          <span className="bd-lab">{t.lb_sol}</span>
          <span className="bd-p" style={{ color: 'var(--leaf)' }}>
            <span className="sr-only">EGP </span>
            {fmt2(SOLAR_COST_PER_KWH_25Y)}
          </span>
          <span className="bd-c flat">
            <span aria-hidden="true">&#9644;</span> {t.l_fixed}
          </span>
        </li>
      </ul>
      <p className="note">{resCmp}</p>
      <p className="note">{t.ledger_note} {t.l_dsl_warn}</p>
    </aside>
  );
}
