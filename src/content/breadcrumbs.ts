import { findRoute, type Lang, type RouteDef } from './seoHead';
import { cmsOverrides, cmsPageFor, type CmsFeed } from './cms';
import type { PageId } from './seo';
import type { Dictionary } from '../i18n/translations/en';

/** Short page names for breadcrumbs, reusing the navigation labels. */
const LABEL_KEY: Partial<Record<PageId, string>> = {
  home: 'nav_home',
  residential: 'nav_res',
  agriculture: 'nav_agri',
  industrial: 'nav_ind',
  oilgas: 'og_crumb',
  service: 'nav_svc',
  irrigation: 'ig_crumb',
  calculator: 'nav_calc',
  how: 'nav_how',
  about: 'nav_about',
  contact: 'nav_contact',
};

export interface Crumb {
  name: string;
  /** Language-agnostic path ('' = home). */
  path: string;
}

/**
 * Home > ... > current page, following each route's `parent`. Empty for home, campaign and unknown
 * pages, and when an editor switched breadcrumbs off for the page in the CMS. A breadcrumb label
 * an editor set in the CMS replaces the navigation label for that step; the visible trail and the
 * BreadcrumbList JSON-LD both come from here, so they always match.
 */
export function breadcrumbTrail(path: string, t: Dictionary, cms?: { lang: Lang; feed: CmsFeed | null }): Crumb[] {
  const trail: RouteDef[] = [];
  const feed = cms?.feed ?? null;
  let route = findRoute(path, feed);
  if (!route || route.parent === undefined) return [];
  const o = cms ? cmsOverrides(cms.feed, cms.lang, path) : null;
  if (o?.hideBreadcrumbs) return [];
  while (route) {
    trail.unshift(route);
    route = route.parent === undefined ? undefined : findRoute(route.parent, feed);
  }
  const cmsName = (r: RouteDef) => {
    const p = cmsPageFor(feed, r.path);
    return p ? (cms?.lang === 'ar' ? p.titleAr || p.titleEn : p.titleEn || p.titleAr) : '';
  };
  return trail.map((r) => ({ name: o?.crumbLabels[r.path] || (r.page === 'cms' ? cmsName(r) : '') || t[LABEL_KEY[r.page] ?? 'nav_home'], path: r.path }));
}
