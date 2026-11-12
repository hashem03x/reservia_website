import { NAV_ENTRIES } from '../config/navigation';
import type { CmsFeed, CmsNavLink } from '../content/cms';
import type { Lang } from '../content/seoHead';
import type { Dictionary } from '../i18n/translations/en';

/**
 * The header menu as the components render it. When the CMS feed has published menus they are
 * used (links to unpublished pages were already removed by the backend); otherwise the site's
 * built-in menu (config/navigation.ts). Nested CMS dropdowns are flattened into their parent's
 * panel (the header shows one dropdown level; the order is kept).
 */
export interface SiteNavLink {
  type: 'link';
  label: string;
  /** Router path ('/en/about') for internal links, the raw address for external ones. */
  to: string;
  external: boolean;
  target: '_self' | '_blank';
  /** Exact-match active state (home). */
  end?: boolean;
}
export interface SiteNavGroup {
  type: 'group';
  key: string;
  label: string;
  items: SiteNavLink[];
}
export type SiteNavEntry = SiteNavLink | SiteNavGroup;

const labelOf = (e: { labelEn: string; labelAr: string }, lang: Lang) => (lang === 'ar' ? e.labelAr || e.labelEn : e.labelEn || e.labelAr);

export function linkTo(href: string, lang: Lang): { to: string; external: boolean } {
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('#')) return { to: href, external: !href.startsWith('#') };
  if (/^\/(en|ar)(\/|$)/.test(href)) return { to: href, external: false };
  return { to: `/${lang}${href === '/' ? '' : href}`, external: false };
}

function flatten(items: CmsNavLink[], lang: Lang): SiteNavLink[] {
  return items.flatMap((i) => {
    const own = i.href ? [{ type: 'link' as const, label: labelOf(i, lang), ...linkTo(i.href, lang), target: i.target, end: i.href === '/' }] : [];
    return i.type === 'group' ? [...own, ...flatten(i.items || [], lang)] : own;
  });
}

export function siteNav(feed: CmsFeed | null | undefined, lang: Lang, t: Dictionary): SiteNavEntry[] {
  const cms = feed?.navigation?.header ?? [];
  if (cms.length) {
    return cms.map((e, idx) =>
      e.type === 'group'
        ? { type: 'group', key: `g${idx}`, label: labelOf(e, lang), items: flatten(e.items || [], lang) }
        : { type: 'link', label: labelOf(e, lang), ...linkTo(e.href || '/', lang), target: e.target, end: e.href === '/' },
    );
  }
  return NAV_ENTRIES.map((e) =>
    e.type === 'link'
      ? { type: 'link', label: t[e.labelKey], to: `/${lang}${e.path === '/' ? '' : e.path}`, external: false, target: '_self', end: e.path === '/' }
      : { type: 'group', key: e.labelKey, label: t[e.labelKey], items: e.items.map((i) => ({ type: 'link', label: t[i.labelKey], to: `/${lang}${i.path}`, external: false, target: '_self' })) },
  );
}

/** Footer link columns published in the CMS (empty = the site's built-in footer only). */
export function footerColumns(feed: CmsFeed | null | undefined, lang: Lang) {
  return (feed?.navigation?.footer ?? []).map((c) => ({ title: lang === 'ar' ? c.titleAr || c.titleEn : c.titleEn || c.titleAr, items: flatten(c.items, lang) }));
}
