import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Pillars } from '../components/sections/Pillars';
import { Faq, faqPairs } from '../components/sections/Faq';
import { CtaBand } from '../components/sections/CtaBand';

/**
 * Service-sector segment (hospitals and clinics, hotels and resorts,
 * schools and universities, malls, offices and clubs). Priced and tracked
 * under the industrial model on the website (analytics segment =
 * 'service', group = 'industrial'). No WhatsApp bill CTA here (client
 * rule). The 2.55 EGP/kWh grid rate is disclosed as an assumption (s_note, s_faq_a1), never as the tariff
 * every such building pays. The industry examples are third-party
 * installations, each explicitly labelled "Not a Reservia project".
 */
const GROUPS = [
  { eb: 's_g1_eb', t: 's_g1_t', d: 's_g1_d', ticks: ['s_g1_1', 's_g1_2', 's_g1_3'], ex: 's_g1_ex' },
  { eb: 's_g2_eb', t: 's_g2_t', d: 's_g2_d', ticks: ['s_g2_1', 's_g2_2', 's_g2_3'], ex: 's_g2_ex' },
  { eb: 's_g3_eb', t: 's_g3_t', d: 's_g3_d', ticks: ['s_g3_1', 's_g3_2', 's_g3_3'], ex: 's_g3_ex' },
  { eb: 's_g4_eb', t: 's_g4_t', d: 's_g4_d', ticks: ['s_g4_1', 's_g4_2', 's_g4_3'], ex: 's_g4_ex' },
] as const;

const FAQ_KEYS: Array<[string, string]> = [
  ['s_faq_q1', 's_faq_a1'],
  ['s_faq_q2', 's_faq_a2'],
];

export default function Service() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="service" path="/service" faq={faqPairs(t, FAQ_KEYS)} />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/service" />
          <span className="eyebrow">{t.s_eyebrow}</span>
          <h1>{t.s_title}</h1>
          <p className="lead">{t.s_lead}</p>
          <div className="cta-row">
            <Link className="btn sun" to={`/${language}/calculator?tab=svc`}>{t.try_calc_ind}</Link>
            <Link className="btn ghost" to={`/${language}/contact?type=service`}>{t.quote}</Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="cards4" style={{ marginTop: 0 }}>
            {GROUPS.map((g) => (
              <article className="region" key={g.t}>
                <span className="tag">{t[g.eb]}</span>
                <h2 className="h3">{t[g.t]}</h2>
                <p>{t[g.d]}</p>
                <ul className="ticks">
                  {g.ticks.map((k) => (
                    <li key={k}>{t[k]}</li>
                  ))}
                </ul>
                <p className="proof ext-example" style={{ fontSize: '.85rem' }}>{t[g.ex]}</p>
              </article>
            ))}
          </div>
          <p className="proof">{t.s_note}</p>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <h2>{t.s_how_t}</h2>
          <Pillars items={[{ body: t.s_h1 }, { body: t.s_h2 }, { body: t.s_h3 }, { body: t.s_h4 }]} />
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Faq t={t} items={FAQ_KEYS} />
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <CtaBand segment="service" contactType="service" />
        </div>
      </section>
    </>
  );
}
