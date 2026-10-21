import { LandingPage, type LandingPageSpec } from './LandingPage';
import { CAMPAIGN_PAGES } from '../config/navigation';

const spec: LandingPageSpec = {
  ...CAMPAIGN_PAGES[0],
  pageId: 'lp-villas',
  idPrefix: 'v',
  titleKey: 'lpv_t',
  leadKey: 'lpv_lead',
  statKey: 'lpv_stat',
  statLabelKey: 'lpv_statl',
  benefitKeys: ['lpv_b1', 'lpv_b2', 'lpv_b3'],
  extraLabelKey: 'lpv_x',
};

export default function LpVillas() {
  return <LandingPage spec={spec} />;
}
