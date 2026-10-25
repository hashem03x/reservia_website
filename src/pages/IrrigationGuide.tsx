import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { CtaBand } from '../components/sections/CtaBand';
import { IRRIGATION_GUIDE as g } from '../content/pages/irrigationGuide';
import type { Section } from '../content/pages/oilGas';
import NotFound from './NotFound';

function SectionBlock({ s }: { s: Section }) {
  return (
    <div className="stack">
      <h2>{s.h}</h2>
      {s.ticks && (
        <ul className="ticks">
          {s.ticks.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}
      {s.p?.map((p) => <p key={p}>{p}</p>)}
    </div>
  );
}

/**
 * Arabic-only guide to solar irrigation and agricultural financing. There is
 * no English counterpart, so /en/solar-irrigation-guide is a genuine 404
 * (no page is invented just to complete an hreflang pair).
 */
export default function IrrigationGuide() {
  const { language } = useLanguage();
  if (language !== 'ar') return <NotFound />;
  const [how, types, sizing, costs, maintenance] = g.sections;

  return (
    <>
      <Seo page="irrigation" path="/solar-irrigation-guide" />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/solar-irrigation-guide" />
          <span className="eyebrow">{g.eyebrow}</span>
          <h1>{g.title}</h1>
          <p className="lead">{g.lead}</p>
          <p className="micro" style={{ color: 'var(--muted)' }}>{g.reviewed}</p>
          <div className="cta-row">
            <Link className="btn sun" to="/ar/calculator?tab=farm">{g.ctaCalc}</Link>
            <Link className="btn ghost" to="/ar/contact?type=farm">{g.ctaQuote}</Link>
          </div>
        </div>
      </section>

      <section className="band longform">
        <div className="wrap two">
          <div className="stack" style={{ gap: 28 }}>
            <SectionBlock s={how} />
            <SectionBlock s={types} />
          </div>
          <SectionBlock s={sizing} />
        </div>
      </section>

      <section className="band alt longform">
        <div className="wrap two">
          <div className="example">
            <h2 className="h3" style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', fontSize: '1rem' }}>{g.example.h}</h2>
            <p style={{ padding: '12px 18px 0', color: 'var(--muted)', fontSize: '.92rem' }}>{g.example.intro}</p>
            <dl>
              {g.example.rows.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className="foot">{g.example.note}</p>
          </div>
          <div className="stack" style={{ gap: 28 }}>
            <SectionBlock s={costs} />
            <SectionBlock s={maintenance} />
          </div>
        </div>
      </section>

      <section className="band longform">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="stack">
            <h2>{g.financing.h}</h2>
            <p>{g.financing.p}</p>
            <ul className="ticks">
              {g.financing.ticks.map((x) => <li key={x}>{x}</li>)}
            </ul>
            {/* The visible source link was removed at the client's request (Oct 2026); the source is kept in content/pages/irrigationGuide.ts. */}
          </div>
          <p style={{ marginTop: 22 }}>
            <Link to="/ar/agriculture">{g.backLink}</Link>
          </p>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <CtaBand segment="agriculture" contactType="farm" />
        </div>
      </section>
    </>
  );
}
