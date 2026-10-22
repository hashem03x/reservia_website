import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { FaqText } from '../components/sections/Faq';
import { CtaBand } from '../components/sections/CtaBand';
import { OIL_GAS, type Section } from '../content/pages/oilGas';

function SectionBlock({ s }: { s: Section }) {
  return (
    <div className="stack">
      <h2>{s.h}</h2>
      {s.p?.map((p) => <p key={p}>{p}</p>)}
      {s.ticks && (
        <ul className="ticks">
          {s.ticks.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}
      {s.steps && (
        <ol className="numbered">
          {s.steps.map((x) => <li key={x}>{x}</li>)}
        </ol>
      )}
    </div>
  );
}

/** Solar hybrid systems for oil and gas sites (Industrial Facilities sub-page). Copy: content/pages/oilGas.ts. */
export default function OilGas() {
  const { t, language } = useLanguage();
  const c = OIL_GAS[language];
  const [challenge, howItWorks, fits, sizing, hse, delivery] = c.sections;

  return (
    <>
      <Seo page="oilgas" path="/oil-gas" faq={c.faq} />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/oil-gas" />
          <span className="eyebrow">{c.eyebrow}</span>
          <h1>{c.title}</h1>
          <p className="lead">{c.lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/contact?type=oilgas`}>{c.ctaAssess}</Link>
            <Link className="btn ghost" to={`/${language}/calculator?tab=ind`}>{c.ctaCalc}</Link>
          </div>
        </div>
      </section>

      <section className="band longform">
        <div className="wrap two">
          <div className="stack" style={{ gap: 28 }}>
            <SectionBlock s={challenge} />
            <SectionBlock s={howItWorks} />
            <SectionBlock s={fits} />
          </div>
          <div className="stack">
            <div className="example">
              <h2 className="h3" style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', fontSize: '1rem' }}>{c.example.h}</h2>
              <dl>
                {c.example.rows.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <p className="foot">{c.example.note}</p>
            </div>
            <p className="proof">{t.i_og_proof}</p>
          </div>
        </div>
      </section>

      <section className="band alt longform">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <SectionBlock s={sizing} />
          <p className="proof">{c.sizingNote}</p>
        </div>
      </section>

      <section className="band longform">
        <div className="wrap two">
          <SectionBlock s={hse} />
          <SectionBlock s={delivery} />
        </div>
      </section>

      <section className="band alt">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <FaqText title={t.faq_t} items={c.faq} />
          <p style={{ marginTop: 20 }}>
            <Link to={`/${language}/industrial`}>{c.backLink}</Link>
          </p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <CtaBand segment="industrial" contactType="oilgas" />
        </div>
      </section>
    </>
  );
}
