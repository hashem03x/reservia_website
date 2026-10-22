import { findRoute, type RouteDef } from './seoHead';
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

/** Home > ... > current page, following each route's `parent`. Empty for home, campaign and unknown pages. */
export function breadcrumbTrail(path: string, t: Dictionary): Crumb[] {
  const trail: RouteDef[] = [];
  let route = findRoute(path);
  if (!route || route.parent === undefined) return [];
  while (route) {
    trail.unshift(route);
    route = route.parent === undefined ? undefined : findRoute(route.parent);
  }
  return trail.map((r) => ({ name: t[LABEL_KEY[r.page] ?? 'nav_home'], path: r.path }));
}
