import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SlidesCarousel } from '../components/sections/SlidesCarousel';

/**
 * About Reservia. The approved company description is shown large and bold;
 * the auto-advancing company-profile slideshow is the page's company visual
 * (the earlier brand banner was removed at the client's request). The
 * Managing Director line and the visible sources list were removed at the
 * client's request (October 2026); the figures' sources remain documented
 * internally (docs/TARIFFS.md, src/content/aboutSources.ts).
 */
export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <Seo page="about" path="/about" />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/about" />
          <span className="eyebrow">{t.ab_eyebrow}</span>
          <h1>{t.ab_title}</h1>
          <div className="about-copy about-lead">
            <p>{t.ab_lead}</p>
            <p>{t.ab_lead2}</p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="about-copy about-copy-secondary">
            <p>{t.ab_p2}</p>
            <p className="about-values">Clean &middot; Smart &middot; Safe &middot; Affordable</p>
          </div>
        </div>
      </section>

      <SlidesCarousel />
    </>
  );
}
