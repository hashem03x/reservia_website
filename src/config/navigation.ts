/** Matches the reference template's `nav.main` links and `pages` list exactly -- same destinations, same labels. */
export interface NavItem {
  path: string;
  labelKey: string;
}

/**
 * The template's header lists all nine pages flat, which wraps onto a
 * second row at realistic desktop widths (the nav text alone exceeds the
 * ~1160px content width once the logo, phone pill, language toggle and
 * CTA are accounted for). Every destination and label below is the same
 * as the template -- only the presentation is grouped, into the
 * "Solutions" (the four segment pages, matching the Home page's own
 * "Pick your site" picker) and "Company" (how-we-work + about) clusters.
 */
export type NavEntry =
  | { type: 'link'; path: string; labelKey: string }
  | { type: 'group'; labelKey: string; items: NavItem[] };

export const NAV_ENTRIES: NavEntry[] = [
  { type: 'link', path: '/', labelKey: 'nav_home' },
  {
    type: 'group',
    labelKey: 'nav_solutions',
    items: [
      { path: '/residential', labelKey: 'nav_res' },
      { path: '/agriculture', labelKey: 'nav_agri' },
      { path: '/industrial', labelKey: 'nav_ind' },
      { path: '/oil-gas', labelKey: 'nav_oilgas' },
      { path: '/service', labelKey: 'nav_svc' },
    ],
  },
  { type: 'link', path: '/calculator', labelKey: 'nav_calc' },
  {
    type: 'group',
    labelKey: 'nav_company',
    items: [
      { path: '/how-we-work', labelKey: 'nav_how' },
      { path: '/about', labelKey: 'nav_about' },
    ],
  },
  { type: 'link', path: '/contact', labelKey: 'nav_contact' },
];

/** Flat form of every main-nav destination, in original template order -- used by the footer's site-map column. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'nav_home' },
  { path: '/residential', labelKey: 'nav_res' },
  { path: '/agriculture', labelKey: 'nav_agri' },
  { path: '/industrial', labelKey: 'nav_ind' },
  { path: '/service', labelKey: 'nav_svc' },
  { path: '/calculator', labelKey: 'nav_calc' },
  { path: '/how-we-work', labelKey: 'nav_how' },
  { path: '/about', labelKey: 'nav_about' },
  { path: '/contact', labelKey: 'nav_contact' },
];

export type Segment = 'villas' | 'compounds' | 'agriculture' | 'industrial' | 'service' | 'general' | 'calc';

/**
 * Reporting group for a segment. The service sector (hospitals, hotels,
 * schools, malls, offices, clubs) is priced and tracked under the
 * industrial model on the website: segment = 'service', group =
 * 'industrial' (client brief). Website-only assumption -- it does not
 * touch ERP payment or accounting logic.
 */
/**
 * Where "Send your bill to WhatsApp" may appear (client rule, October 2026):
 * the homepage ('general') and the Residential & Commercial solution
 * (villas, compounds) only. Agricultural Farms, Industrial Facilities and
 * the Services Sector never show it. The general WhatsApp chat (floating
 * button, footer, contact page) is a different CTA and is not affected.
 * Enforced in one place by <BillWaLink>.
 */
const BILL_WHATSAPP_SEGMENTS: ReadonlySet<Segment> = new Set<Segment>(['general', 'villas', 'compounds']);

export function offersBillWhatsapp(segment: Segment): boolean {
  return BILL_WHATSAPP_SEGMENTS.has(segment);
}

export function segmentGroup(segment: Segment): string {
  return segment === 'service' ? 'industrial' : segment;
}

/** Savings-calculator tabs, one per solution category (Residential & Commercial, Agricultural Farms, Industrial Facilities, Services Sector). */
export type CalcTab = 'home' | 'farm' | 'ind' | 'svc';

export interface CampaignPage {
  path: string;
  segment: Segment;
  eyebrowKey: string;
  calcTab: CalcTab;
}

/** The five ad-campaign landing pages (`lp-*` in the template), kept separate from the main nav. */
export const CAMPAIGN_PAGES: CampaignPage[] = [
  { path: '/lp/villas', segment: 'villas', eyebrowKey: 'lpv_eb', calcTab: 'home' },
  { path: '/lp/compounds', segment: 'compounds', eyebrowKey: 'lpc_eb', calcTab: 'home' },
  { path: '/lp/agriculture', segment: 'agriculture', eyebrowKey: 'lpa_eb', calcTab: 'farm' },
  { path: '/lp/industrial', segment: 'industrial', eyebrowKey: 'lpi_eb', calcTab: 'ind' },
  { path: '/lp/service', segment: 'service', eyebrowKey: 'lps_eb', calcTab: 'svc' },
];

/** Ported from the template's `route()`: which WhatsApp segment the floating button/sticky bar uses, by current page. */
export function pageWaSegment(pathname: string): Segment {
  const p = pathname.replace(/^\/(en|ar)/, '');
  if (p.startsWith('/lp/villas')) return 'villas';
  if (p.startsWith('/lp/compounds')) return 'compounds';
  if (p.startsWith('/lp/agriculture')) return 'agriculture';
  if (p.startsWith('/lp/industrial')) return 'industrial';
  if (p.startsWith('/lp/service')) return 'service';
  if (p.startsWith('/residential')) return 'villas';
  if (p.startsWith('/agriculture')) return 'agriculture';
  if (p.startsWith('/industrial')) return 'industrial';
  if (p.startsWith('/service')) return 'service';
  return 'general';
}
