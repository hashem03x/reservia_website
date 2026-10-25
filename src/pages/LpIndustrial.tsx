import { LandingPage, type LandingPageSpec } from './LandingPage';
import { CAMPAIGN_PAGES } from '../config/navigation';

const spec: LandingPageSpec = {
  ...CAMPAIGN_PAGES[3],
  pageId: 'lp-industrial',
  idPrefix: 'i',
  titleKey: 'lpi_t',
  leadKey: 'lpi_lead',
  statKey: 'lpi_stat',
  statLabelKey: 'lpi_statl',
  benefitKeys: ['lpi_b1', 'lpi_b2', 'lpi_b3'],
  extraLabelKey: 'lpi_x',
  extraKind: 'dieselLitres',
};

export default function LpIndustrial() {
  return <LandingPage spec={spec} />;
}
