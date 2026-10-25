import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SlidesCarousel } from '../components/sections/SlidesCarousel';
import banner from '../assets/brand/about-banner.webp';

/**
 * About Reservia. The company description is shown large for readability;
 * the company-profile slides follow (rendered once their exported images
 * are in src/assets/profile/). The Managing Director line and the visible
 * sources list were removed at the client's request (October 2026); the
 * figures' sources remain documented internally (docs/TARIFFS.md,
 * src/content/aboutSources.ts).
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
          <div className="about-copy">
            <p>{t.ab_lead}</p>
            <p>{t.ab_lead2}</p>
          </div>
        </div>
      </section>

      <section className="band" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <img className="brandband" src={banner} alt={t.ab_banner_alt} />
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
