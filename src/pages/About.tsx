import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SlidesCarousel } from '../components/sections/SlidesCarousel';

/** Who-we-work-with list: reuses the exact segment copy already shown elsewhere (home cards, nav), not new claims. */
const SEGMENTS: Array<{ path: string; t: string; d: string }> = [
  { path: '/residential', t: 'seg_res_t', d: 'seg_res_d' },
  { path: '/agriculture', t: 'seg_agri_t', d: 'seg_agri_d' },
  { path: '/industrial', t: 'seg_ind_t', d: 'seg_ind_d' },
  { path: '/service', t: 'seg_svc_t', d: 'seg_svc_d' },
];

/**
 * About Reservia. The approved company description is shown large and bold;
 * the auto-advancing company-profile slideshow is the page's company visual
 * (the earlier brand banner was removed at the client's request). The
 * Managing Director line and the visible sources list were removed at the
 * client's request (October 2026); the figures' sources remain documented
 * internally (docs/TARIFFS.md, src/content/aboutSources.ts).
 */
export default function About() {
  const { t, language } = useLanguage();

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

      {/* Readable HTML text, crawlable without the slideshow: vision/mission (ab_approach),
          the Generate/Store/Optimize/Sustain model (same words as the homepage slogan), the
          Clean/Smart/Safe/Affordable values already shown above, and who it applies to. Every
          sentence reuses a fact already published elsewhere on the site (ab_lead, ab_p2, the
          why_* pillars, the segment cards) -- nothing here is a new claim. */}
      <section className="band alt">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <h2>{t.ab_approach_t}</h2>
          <p className="lead">{t.ab_approach_d}</p>

          <h3 style={{ marginTop: 32 }}>{t.ab_model_t}</h3>
          <div className="pillars" style={{ marginTop: 18 }}>
            <div>
              <h3>{t.slogan_1}</h3>
              <p>{t.ab_gen_d}</p>
            </div>
            <div>
              <h3>{t.slogan_2}</h3>
              <p>{t.ab_store_d}</p>
            </div>
            <div>
              <h3>{t.slogan_3}</h3>
              <p>{t.ab_opt_d}</p>
            </div>
            <div>
              <h3>{t.slogan_4}</h3>
              <p>{t.ab_sus_d}</p>
            </div>
          </div>

          <p className="lead" style={{ marginTop: 32 }}>{t.ab_values_d}</p>

          <h3 style={{ marginTop: 32 }}>{t.ab_who_t}</h3>
          <p>{t.ab_who_d}</p>
          <ul className="ticks" style={{ marginTop: 14 }}>
            {SEGMENTS.map((seg) => (
              <li key={seg.path}>
                <Link to={`/${language}${seg.path}`}>{t[seg.t]}</Link> — {t[seg.d]}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
