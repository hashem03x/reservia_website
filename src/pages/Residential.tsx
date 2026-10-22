import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Faq, faqPairs } from '../components/sections/Faq';
import { BillWaLink } from '../components/ui/WaLink';
import { CtaBand } from '../components/sections/CtaBand';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { homeSystemPrice } from '../services/calculator';

/** System sizes shown in the indicative price table (kWp). */
const PRICE_SIZES = [3, 5, 6, 10];

const FAQ_KEYS: Array<[string, string]> = [
  ['r_q1', 'r_a1'],
  ['r_q2', 'r_a2'],
  ['r_q3', 'r_a3'],
  ['r_q4', 'r_a4'],
  ['q_perm', 'a_perm'],
  ['q_pb', 'a_pb'],
  ['q_small', 'a_small'],
];

export default function Residential() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="residential" path="/residential" faq={faqPairs(t, FAQ_KEYS)} />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/residential" />
          <span className="eyebrow">{t.r_eyebrow}</span>
          <h1>{t.r_title}</h1>
          <p className="lead">{t.r_lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=home`}>{t.try_calc}</Link>
            <Link className="btn ghost" to={`/${language}/contact?type=home`}>{t.quote}</Link>
            <BillWaLink segment="villas" />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="stack">
            <h2>{t.r_pain_t}</h2>
            <ul className="ticks pain">
              <li>{t.r_p1}</li>
              <li>{t.r_p2}</li>
              <li>{t.r_p3}</li>
            </ul>
            <h2 style={{ marginTop: 18 }}>{t.r_get_t}</h2>
            <ul className="ticks">
              <li>{t.r_g1}</li>
              <li>{t.r_g2}</li>
              <li>{t.r_g3}</li>
              <li>{t.r_g4}</li>
              <li>{t.r_g5}</li>
            </ul>
          </div>
          <div className="example">
            <h3>{t.r_ex_t}</h3>
            <dl>
              <div><dt>{t.ex_size}</dt><dd>{t.r_ex1}</dd></div>
              <div><dt>{t.ex_prod}</dt><dd>{t.r_ex2}</dd></div>
              <div><dt>{t.ex_save_res}</dt><dd>{t.r_ex3}</dd></div>
              <div><dt>{t.ex_price}</dt><dd>{t.r_ex4}</dd></div>
              <div><dt>{t.ex_payback}</dt><dd>{t.r_ex5}</dd></div>
            </dl>
            <p className="foot">{t.r_ex_note}</p>
          </div>
        </div>
      </section>

      {/* Indicative prices from the calculator price list (single source: services/calculator.ts); final price follows a survey. */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap two">
          <div className="stack">
            <h2>{t.r_price_t}</h2>
            <div className="scroll-x">
              <table className="pricetable">
                <caption className="sr-only">{t.r_price_t}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t.r_price_size}</th>
                    <th scope="col">{t.r_price_col}</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_SIZES.map((kwp) => (
                    <tr key={kwp}>
                      <td className="num">{kwp} {t.u_kwp}</td>
                      <td className="num">{homeSystemPrice(kwp).toLocaleString('en-US')} {t.u_egp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="assume">{t.r_price_note}</p>
          </div>
          <div className="stack">
            <h2>{t.r_cost_t}</h2>
            <ul className="ticks">
              <li>{t.r_cost_1}</li>
              <li>{t.r_cost_2}</li>
              <li>{t.r_cost_3}</li>
              <li>{t.r_cost_4}</li>
            </ul>
            <div className="cta-row">
              <Link className="btn sun" to={`/${language}/contact?type=home`}>{t.quote}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Faq t={t} items={FAQ_KEYS} />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <CtaBand segment="villas" contactType="home" />
        </div>
      </section>
    </>
  );
}
