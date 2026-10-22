import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Pillars } from '../components/sections/Pillars';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export default function Industrial() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="industrial" path="/industrial" />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/industrial" />
          <span className="eyebrow">{t.i_eyebrow}</span>
          <h1>{t.i_title}</h1>
          <p className="lead">{t.i_lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=ind`}>{t.try_calc_ind}</Link>
            <Link className="btn ghost" to={`/${language}/contact?type=factory`}>{t.quote}</Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="stack">
            <span className="eyebrow">{t.i_og_eb}</span>
            <h2>{t.i_og_t}</h2>
            <p className="lead">{t.i_og_d}</p>
            <ul className="ticks">
              <li>{t.i_og1}</li>
              <li>{t.i_og2}</li>
              <li>{t.i_og3}</li>
              <li>{t.i_og4}</li>
            </ul>
            <p className="proof">{t.i_og_proof}</p>
            <p>
              <Link to={`/${language}/oil-gas`}>{t.i_og_more}</Link>
            </p>
          </div>
          <div className="stack">
            <span className="eyebrow">{t.i_fac_eb}</span>
            <h2>{t.i_fac_t}</h2>
            <p className="lead">{t.i_fac_d}</p>
            <ul className="ticks">
              <li>{t.i_fac1}</li>
              <li>{t.i_fac2}</li>
              <li>{t.i_fac3}</li>
              <li>{t.i_fac4}</li>
            </ul>
            <p className="proof">{t.i_fac_note}</p>
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.i_hse_t}</h2>
          <Pillars items={[{ body: t.i_hse1 }, { body: t.i_hse2 }, { body: t.i_hse3 }, { body: t.i_hse4 }]} />
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <h2>{t.i_assess_t}</h2>
          <ol className="numbered">
            <li>{t.i_assess_1}</li>
            <li>{t.i_assess_2}</li>
            <li>{t.i_assess_3}</li>
            <li>{t.i_assess_4}</li>
          </ol>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=ind`}>{t.try_calc_ind}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
