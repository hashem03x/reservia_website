import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Pillars } from '../components/sections/Pillars';

const GROUPS = [
  { eb: 's_g1_eb', t: 's_g1_t', d: 's_g1_d', ticks: ['s_g1_1', 's_g1_2', 's_g1_3'], ex: 's_g1_ex' },
  { eb: 's_g2_eb', t: 's_g2_t', d: 's_g2_d', ticks: ['s_g2_1', 's_g2_2', 's_g2_3'], ex: 's_g2_ex' },
  { eb: 's_g3_eb', t: 's_g3_t', d: 's_g3_d', ticks: ['s_g3_1', 's_g3_2', 's_g3_3'], ex: 's_g3_ex' },
  { eb: 's_g4_eb', t: 's_g4_t', d: 's_g4_d', ticks: ['s_g4_1', 's_g4_2', 's_g4_3'], ex: 's_g4_ex' },
] as const;

export default function Service() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="service" path="/service" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.s_eyebrow}</span>
          <h1>{t.s_title}</h1>
          <p className="lead">{t.s_lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=ind`}>{t.try_calc_ind}</Link>
            <Link className="btn ghost" to={`/${language}/contact`}>{t.h_cta2}</Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="cards4" style={{ marginTop: 0 }}>
            {GROUPS.map((g) => (
              <div className="region" key={g.t}>
                <span className="tag">{t[g.eb]}</span>
                <h3>{t[g.t]}</h3>
                <p>{t[g.d]}</p>
                <ul className="ticks">
                  {g.ticks.map((k) => (
                    <li key={k}>{t[k]}</li>
                  ))}
                </ul>
                <p className="proof" style={{ fontSize: '.85rem' }}>{t[g.ex]}</p>
              </div>
            ))}
          </div>
          <p className="proof">{t.s_note}</p>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.s_how_t}</h2>
          <Pillars items={[{ body: t.s_h1 }, { body: t.s_h2 }, { body: t.s_h3 }, { body: t.s_h4 }]} />
          <div className="termsline">
            <span className="chip">50 / 30 / 20</span>
            <b>{t.terms_label}</b>
            <span>{t.i_terms}</span>
          </div>
        </div>
      </section>
    </>
  );
}
