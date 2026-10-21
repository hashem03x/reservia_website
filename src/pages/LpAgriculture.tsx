import { LandingPage, type LandingPageSpec } from './LandingPage';
import { CAMPAIGN_PAGES } from '../config/navigation';

const spec: LandingPageSpec = {
  ...CAMPAIGN_PAGES[2],
  pageId: 'lp-agriculture',
  idPrefix: 'a',
  titleKey: 'lpa_t',
  leadKey: 'lpa_lead',
  statKey: 'lpa_stat',
  statLabelKey: 'lpa_statl',
  benefitKeys: ['lpa_b1', 'lpa_b2', 'lpa_b3'],
  extraLabelKey: 'lpa_x',
};

export default function LpAgriculture() {
  return <LandingPage spec={spec} />;
}
