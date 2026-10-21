import { LandingPage, type LandingPageSpec } from './LandingPage';
import { CAMPAIGN_PAGES } from '../config/navigation';

const spec: LandingPageSpec = {
  ...CAMPAIGN_PAGES[1],
  pageId: 'lp-compounds',
  idPrefix: 'c',
  titleKey: 'lpc_t',
  leadKey: 'lpc_lead',
  statKey: 'lpc_stat',
  statLabelKey: 'lpc_statl',
  benefitKeys: ['lpc_b1', 'lpc_b2', 'lpc_b3'],
  extraLabelKey: 'lpc_x',
};

export default function LpCompounds() {
  return <LandingPage spec={spec} />;
}
