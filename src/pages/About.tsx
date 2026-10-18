import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { ABOUT_SOURCES } from '../content/aboutSources';
import banner from '../assets/brand/about-banner.webp';

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <Seo page="about" path="/about" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.ab_eyebrow}</span>
          <h1>{t.ab_title}</h1>
          <p className="lead">{t.ab_lead}</p>
        </div>
      </section>

      <section className="band" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <img className="brandband" src={banner} alt={t.ab_banner_alt} />
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="stack">
            <p>{t.ab_p2}</p>
            <p><b>{t.ab_md}</b></p>
            <p style={{ color: 'var(--muted)' }}>Clean &middot; Smart &middot; Safe &middot; Affordable</p>
          </div>
          <div className="stack">
            <h3>{t.ab_src_t}</h3>
            <ol className="sources">
              {ABOUT_SOURCES.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noopener noreferrer">
                    {source.text}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
