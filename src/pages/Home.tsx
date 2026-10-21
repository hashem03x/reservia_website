import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { RateBoard } from '../components/sections/RateBoard';
import { SegmentPicker } from '../components/sections/SegmentPicker';
import { EgyptMap } from '../components/sections/EgyptMap';
import { Pillars } from '../components/sections/Pillars';
import { TermsTable } from '../components/sections/TermsTable';
import { TrustGrid } from '../components/sections/TrustGrid';
import { Faq, faqPairs } from '../components/sections/Faq';
import { CtaBand } from '../components/sections/CtaBand';
import { EnergySparks } from '../components/effects/EnergySparks';
import { WaLink } from '../components/ui/WaLink';
import heroBg from '../assets/brand/hero-bg.webp';

const FAQ_KEYS: Array<[string, string]> = [
  ['q_net', 'a_net'],
  ['q_perm', 'a_perm'],
  ['q_pb', 'a_pb'],
  ['q_small', 'a_small'],
  ['q_docs', 'a_docs'],
];

export default function Home() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="home" path="" faq={faqPairs(t, FAQ_KEYS)} />

      <section className="hero">
        <div className="hero-bg" aria-hidden="true" style={{ backgroundImage: `url(${heroBg})` }} />
        <EnergySparks count={6} />
        <div className="heroEnergyLine" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{t.h_eyebrow}</span>
            <h1>{t.h_title}</h1>
            <p className="lead">{t.h_lead}</p>
            <div className="cta-row">
              <Link className="btn sun" to={`/${language}/contact`}>
                {t.quote}
              </Link>
              <Link className="btn ghost" to={`/${language}/calculator`}>
                {t.h_cta1}
              </Link>
              <WaLink segment="general">{t.h_cta_wa}</WaLink>
            </div>
            <p className="micro">{t.h_micro}</p>
          </div>
          <RateBoard />
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.seg_title}</h2>
          <SegmentPicker />
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="stack">
            <h2>{t.map_title}</h2>
            <p className="lead">{t.map_lead}</p>
            <div className="legend">
              <span>
                <i className="dot" style={{ background: 'var(--sun)' }} />
                <span>{t.legend_hq}</span>
              </span>
              <span>
                <i className="dot" style={{ background: 'var(--leaf)' }} />
                <span>{t.legend_agri}</span>
              </span>
              <span>
                <i className="dot" style={{ background: 'var(--navy)' }} />
                <span>{t.legend_ind}</span>
              </span>
            </div>
          </div>
          <EgyptMap />
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.why_title}</h2>
          <Pillars
            items={[
              { title: t.why_clean_t, body: t.why_clean_d },
              { title: t.why_smart_t, body: t.why_smart_d },
              { title: t.why_safe_t, body: t.why_safe_d },
              { title: t.why_aff_t, body: t.why_aff_d },
            ]}
          />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>{t.pay_title}</h2>
          <p className="lead" style={{ marginTop: 10 }}>{t.pay_lead}</p>
          <div style={{ marginTop: 22 }}>
            <TermsTable t={t} />
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.trust_t}</h2>
          <p className="lead" style={{ marginTop: 10 }}>{t.trust_lead}</p>
          <TrustGrid t={t} />
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Faq t={t} items={FAQ_KEYS} />
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <CtaBand />
        </div>
      </section>
    </>
  );
}
