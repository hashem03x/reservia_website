import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { LeadForm } from '../components/forms/LeadForm';
import type { CampaignPage } from '../config/navigation';
import type { PageId } from '../content/seo';

export interface LandingPageSpec extends CampaignPage {
  pageId: PageId;
  idPrefix: string;
  titleKey: string;
  leadKey: string;
  statKey: string;
  statLabelKey: string;
  benefitKeys: [string, string, string];
  extraLabelKey: string;
}

/** Shared shape for all five campaign landing pages (`lp-*` in the reference template) -- identical structure, segment-specific content. */
export function LandingPage({ spec }: { spec: LandingPageSpec }) {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page={spec.pageId} path={spec.path} noindex />

      <section className="page-hero">
        <div className="wrap lp-grid">
          <div>
            <span className="eyebrow">{t[spec.eyebrowKey]}</span>
            <h1>{t[spec.titleKey]}</h1>
            <p className="lead">{t[spec.leadKey]}</p>
            <div className="lp-stat">
              <b>{t[spec.statKey]}</b>
              <span>{t[spec.statLabelKey]}</span>
            </div>
            <div className="trustrow">
              <span>{t.lp_tr1}</span>
              <span>{t.lp_tr2}</span>
            </div>
            <ul className="ticks" style={{ marginTop: 22 }}>
              {spec.benefitKeys.map((k) => (
                <li key={k}>{t[k]}</li>
              ))}
            </ul>
          </div>
          <LeadForm segment={spec.segment} extraLabel={t[spec.extraLabelKey]} idPrefix={spec.idPrefix} />
        </div>
      </section>

      <section className="band" style={{ paddingBlock: 28 }}>
        <div className="wrap" style={{ display: 'flex', gap: '10px 22px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)', fontSize: '.92rem' }}>{t.lp_more}</span>
          <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to={`/${language}/calculator?tab=${spec.calcTab}`}>{t.nav_calc}</Link>
            <Link to={`/${language}/how-we-work`}>{t.nav_how}</Link>
            <Link to={`/${language}/about`}>{t.nav_about}</Link>
          </span>
        </div>
      </section>
    </>
  );
}
