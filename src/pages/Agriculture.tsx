import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Faq, faqPairs } from '../components/sections/Faq';

const FAQ_KEYS: Array<[string, string]> = [
  ['a_q1', 'a_a1'],
  ['a_q2', 'a_a2'],
  ['a_q3', 'a_a3'],
  ['a_q4', 'a_a4'],
];

export default function Agriculture() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="agriculture" path="/agriculture" faq={faqPairs(t, FAQ_KEYS)} />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.a_eyebrow}</span>
          <h1>{t.a_title}</h1>
          <p className="lead">{t.a_lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=farm`}>{t.try_calc_farm}</Link>
            <Link className="btn ghost" to={`/${language}/contact?type=farm`}>{t.quote}</Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="facts">
            <div><b>{t.a_f1_n}</b><p>{t.a_f1}</p></div>
            <div><b>{t.a_f2_n}</b><p>{t.a_f2}</p></div>
            <div><b>{t.a_f3_n}</b><p>{t.a_f3}</p></div>
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.a_reg_t}</h2>
          <div className="cards3">
            <div className="region">
              <span className="tag">{t.a_up_tag}</span>
              <h3>{t.a_up_t}</h3>
              <p>{t.a_up_d}</p>
            </div>
            <div className="region">
              <span className="tag">{t.a_wn_tag}</span>
              <h3>{t.a_wn_t}</h3>
              <p>{t.a_wn_d}</p>
            </div>
            <div className="region">
              <span className="tag">{t.a_al_tag}</span>
              <h3>{t.a_al_t}</h3>
              <p>{t.a_al_d}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="stack">
            <h2>{t.a_sol_t}</h2>
            <ul className="ticks">
              <li>{t.a_s1}</li>
              <li>{t.a_s2}</li>
              <li>{t.a_s3}</li>
              <li>{t.a_s4}</li>
            </ul>
          </div>
          <div className="example">
            <h3>{t.a_ex_t}</h3>
            <dl>
              <div><dt>{t.a_ex1l}</dt><dd>{t.a_ex1}</dd></div>
              <div><dt>{t.a_ex2l}</dt><dd>{t.a_ex2}</dd></div>
              <div><dt>{t.a_ex3l}</dt><dd>{t.a_ex3}</dd></div>
              <div><dt>{t.ex_price}</dt><dd>{t.a_ex4}</dd></div>
              <div><dt>{t.ex_payback}</dt><dd>{t.a_ex5}</dd></div>
            </dl>
            <p className="foot">{t.a_ex_note}</p>
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Faq t={t} items={FAQ_KEYS} />
        </div>
      </section>
    </>
  );
}
