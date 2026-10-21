import { LandingPage, type LandingPageSpec } from './LandingPage';
import { CAMPAIGN_PAGES } from '../config/navigation';

const spec: LandingPageSpec = {
  ...CAMPAIGN_PAGES[4],
  pageId: 'lp-service',
  idPrefix: 'sv',
  titleKey: 'lps_t',
  leadKey: 'lps_lead',
  statKey: 'lps_stat',
  statLabelKey: 'lps_statl',
  benefitKeys: ['lps_b1', 'lps_b2', 'lps_b3'],
  extraLabelKey: 'lps_x',
};

export default function LpService() {
  return <LandingPage spec={spec} />;
}
