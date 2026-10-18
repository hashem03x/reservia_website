import type { Dictionary } from '../../i18n/translations/en';

/** Ported from the template's `termsTable()`. The 70/30, 50/30/20, 80/20 splits are fixed layout, not translated. */
export function TermsTable({ t }: { t: Dictionary }) {
  return (
    <div className="scroll-x" tabIndex={0} role="region" aria-label={t.terms_title}>
      <table className="terms">
        <caption className="sr-only">{t.terms_title}</caption>
        <thead>
          <tr>
            <th scope="col">{t.th_type}</th>
            <th scope="col">{t.th_sign}</th>
            <th scope="col">{t.th_deliv}</th>
            <th scope="col">{t.th_comm}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t.tr1}</td>
            <td className="num">70%</td>
            <td className="num">&ndash;</td>
            <td className="num">30%</td>
          </tr>
          <tr>
            <td>{t.tr2}</td>
            <td className="num">50%</td>
            <td className="num">30%</td>
            <td className="num">20%</td>
          </tr>
          <tr>
            <td>{t.tr3}</td>
            <td className="num">80%</td>
            <td className="num">&ndash;</td>
            <td className="num">20%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
