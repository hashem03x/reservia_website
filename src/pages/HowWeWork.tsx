import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { TermsTable } from '../components/sections/TermsTable';

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function HowWeWork() {
  const { t } = useLanguage();

  return (
    <>
      <Seo page="how" path="/how-we-work" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.how_eyebrow}</span>
          <h1>{t.how_title}</h1>
          <p className="lead">{t.how_lead}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <ol className="steps">
            {STEPS.map((n) => (
              <li key={n}>
                <h3>{t[`s${n}t`]}</h3>
                <p>{t[`s${n}d`]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.terms_title}</h2>
          <div style={{ marginTop: 20 }}>
            <TermsTable t={t} />
          </div>
        </div>
      </section>
    </>
  );
}
