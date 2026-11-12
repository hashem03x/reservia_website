/**
 * Pure SEO helpers shared by the React app (Seo.tsx), the build
 * (vite.config.ts, scripts/prerender.mjs) and the tests. No React, no
 * import.meta.env -- callers pass configuration in.
 *
 * ROUTES is the single route inventory: the router, the prerendered HTML
 * files, the sitemap, canonical/hreflang tags and the regression tests
 * are all derived from it, so a page added here is covered everywhere.
 */
import { seoText, type PageId } from './seo.ts';
import { jsonLdString } from './organization.ts';
import { cmsOverrides, cmsPageFor, managedPageFor, toRoutePath, type CmsFeed } from './cms.ts';

export type Lang = 'en' | 'ar';
export const LANGS: Lang[] = ['en', 'ar'];
/**
 * Arabic is the site's default language (Website CMS SEO brief 2.2, answering CLIENT_DECISIONS.md
 * section 7's open "which language should / default to"): the x-default alternate, the language
 * for unknown or unmatched browser languages, and the root index.html.
 */
export const DEFAULT_LANG: Lang = 'ar';

export interface RouteDef {
  /** Language-agnostic path: '' for home, '/residential', '/lp/service', ... */
  path: string;
  page: PageId;
  /** Campaign pages: noindex, follow; never in the sitemap; no canonical/hreflang. */
  noindex?: boolean;
  /** Languages the page genuinely exists in (default: both). */
  langs?: Lang[];
  /** Parent route path for breadcrumbs ('' = home). Omitted for home and campaign pages. */
  parent?: string;
  /** The page describes a Reservia service (Service structured data). */
  service?: boolean;
}

/** Every public page: 14 from the earlier briefs plus the oil and gas page and the Arabic irrigation guide. */
export const ROUTES: RouteDef[] = [
  { path: '', page: 'home' },
  { path: '/residential', page: 'residential', parent: '', service: true },
  { path: '/agriculture', page: 'agriculture', parent: '', service: true },
  { path: '/industrial', page: 'industrial', parent: '', service: true },
  { path: '/oil-gas', page: 'oilgas', parent: '/industrial', service: true },
  { path: '/service', page: 'service', parent: '', service: true },
  { path: '/solar-irrigation-guide', page: 'irrigation', langs: ['ar'], parent: '/agriculture' },
  { path: '/calculator', page: 'calculator', parent: '' },
  { path: '/how-we-work', page: 'how', parent: '' },
  { path: '/about', page: 'about', parent: '' },
  { path: '/contact', page: 'contact', parent: '' },
  { path: '/lp/villas', page: 'lp-villas', noindex: true },
  { path: '/lp/compounds', page: 'lp-compounds', noindex: true },
  { path: '/lp/agriculture', page: 'lp-agriculture', noindex: true },
  { path: '/lp/industrial', page: 'lp-industrial', noindex: true },
  { path: '/lp/service', page: 'lp-service', noindex: true },
];

export const routeLangs = (r: RouteDef): Lang[] => r.langs ?? LANGS;

/**
 * Routes for pages that exist only in the CMS (managed pages published at a path with no built-in
 * page). They are prerendered, listed in the sitemap and get canonical/hreflang exactly like the
 * built-in pages. A managed page's parent (breadcrumbs) is its CMS parent page, else home.
 */
export function cmsRoutes(cms?: CmsFeed | null): RouteDef[] {
  if (!cms) return [];
  const pathOfSlug = new Map(cms.pages.map((p) => [p.slug, toRoutePath(p.path)]));
  return cms.pages
    .filter((p) => p.dynamic && p.pageType === 'managed')
    .map((p) => ({ path: toRoutePath(p.path), page: 'cms' as PageId, langs: p.locales, parent: p.parentSlug && pathOfSlug.has(p.parentSlug) ? pathOfSlug.get(p.parentSlug) : p.layout === 'landing' ? undefined : '' }));
}

/** Built-in routes plus the CMS-only pages of this build. */
export function allRoutes(cms?: CmsFeed | null): RouteDef[] {
  return [...ROUTES, ...cmsRoutes(cms)];
}

/** The route for a language-agnostic path, if any (CMS-only pages included when the feed is given). */
export function findRoute(path: string, cms?: CmsFeed | null): RouteDef | undefined {
  return ROUTES.find((r) => r.path === path) ?? cmsRoutes(cms).find((r) => r.path === path);
}

/** Splits '/ar/oil-gas' into { lang: 'ar', path: '/oil-gas' }. */
export function splitPath(pathname: string): { lang: Lang | null; path: string } {
  const m = pathname.match(/^\/(en|ar)(\/.*)?$/);
  if (!m) return { lang: null, path: pathname };
  return { lang: m[1] as Lang, path: (m[2] ?? '').replace(/\/$/, '') };
}

/**
 * The public production origin, normalised: https only, host only (no path,
 * query or trailing slash). Returns null for missing or malformed values, in
 * which case no absolute URL is ever emitted -- nothing points at a guessed
 * or temporary domain (client decision 7).
 */
export function normalizeSiteUrl(siteUrl: string | undefined | null): string | null {
  const raw = (siteUrl ?? '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || !u.hostname.includes('.') || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) return null;
    return `https://${u.host.toLowerCase()}`;
  } catch {
    return null;
  }
}

export interface PageUrls {
  canonical: string;
  /** Reciprocal language alternates; empty when the page exists in one language only. */
  alternates: Array<{ hreflang: string; href: string }>;
}

/** Whether a route is indexable in a language: not a campaign page, and not switched to noindex in the CMS. */
export function isIndexable(route: RouteDef, lang: Lang, cms?: CmsFeed | null): boolean {
  return !route.noindex && !cmsOverrides(cms, lang, route.path).noindex;
}

/**
 * Absolute canonical + hreflang URLs for an indexable page, or null without a valid production
 * origin (or for a noindex page). A canonical an editor pointed at another URL in the CMS is used
 * as-is and that version declares no alternates. hreflang lists only the language versions that
 * are indexable and their own canonical -- never one that is noindex or canonicalised elsewhere --
 * with x-default -> Arabic (DEFAULT_LANG) when that version qualifies.
 */
export function pageUrls(siteUrl: string | undefined | null, lang: Lang, route: RouteDef, cms?: CmsFeed | null): PageUrls | null {
  const base = normalizeSiteUrl(siteUrl);
  if (!base || !isIndexable(route, lang, cms)) return null;
  const url = (l: Lang) => `${base}/${l}${route.path}`;
  const override = cmsOverrides(cms, lang, route.path).canonical;
  if (override) return { canonical: override, alternates: [] };
  const langs = routeLangs(route).filter((l) => isIndexable(route, l, cms) && !cmsOverrides(cms, l, route.path).canonical);
  const def = langs.includes(DEFAULT_LANG) ? DEFAULT_LANG : langs[0];
  const alternates = langs.length > 1 ? [...langs.map((l) => ({ hreflang: l, href: url(l) })), { hreflang: 'x-default', href: url(def) }] : [];
  return { canonical: url(lang), alternates };
}

/** Title and description for a page: the CMS's when an editor wrote one, otherwise the code's (content/seo.ts). */
export function pageText(lang: Lang, page: PageId, path: string, cms?: CmsFeed | null): [string, string] {
  // A section-built page: its whole text is the CMS's (typed, or derived from its own content).
  const managed = managedPageFor(cms, path);
  if (managed || page === 'cms') {
    const p = managed ?? cmsPageFor(cms, path);
    const s = p?.seo[lang];
    const name = (lang === 'ar' ? p?.titleAr || p?.titleEn : p?.titleEn || p?.titleAr) || '';
    if (page === 'cms') return [s?.title || name || 'Reservia', s?.description || ''];
    const [title, description] = seoText(lang, page);
    return [s?.title || title, s?.description || description];
  }
  const [title, description] = seoText(lang, page);
  const o = cmsOverrides(cms, lang, path);
  return [o.title ?? title, o.description ?? description];
}

/** FAQPage JSON-LD built from the exact visible question/answer strings. */
export function faqJsonLd(lang: Lang, pairs: Array<[string, string]>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

/** BreadcrumbList JSON-LD mirroring the visible breadcrumb trail (absolute URLs required). */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

/**
 * WebPage (+ Service on service pages) JSON-LD for one page. Only facts the
 * page itself states: its title, description, language, the provider
 * (the Organization node) and the service area (Egypt).
 */
export function pageJsonLd(options: { base: string; lang: Lang; route: RouteDef; url: string; name: string; description: string }) {
  const { base, lang, route, url, name, description } = options;
  const org = { '@id': `${base}/#organization` };
  const graph: Record<string, unknown>[] = [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name, description, inLanguage: lang, isPartOf: { '@id': `${base}/#website` }, publisher: org },
  ];
  if (route.service) {
    graph.push({ '@type': 'Service', '@id': `${url}#service`, name: name.replace(/\s*\|\s*[^|]+$/, ''), description, provider: org, areaServed: { '@type': 'Country', name: 'Egypt' }, url });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** WebSite JSON-LD (home pages). No SearchAction: the site has no search. */
export function websiteJsonLd(base: string, lang: Lang, name: string) {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/${lang}`, name, inLanguage: ['en', 'ar'], publisher: { '@id': `${base}/#organization` } };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Markers around the replaceable head block in index.html (prerender swaps it per route). */
export const HEAD_START = '<!--seo:start-->';
export const HEAD_END = '<!--seo:end-->';

/**
 * Static <head> block for the root index.html and 404.html (pages that are
 * not prerendered). Tags carry `data-static-head`; the app removes them on
 * boot so the live head has no duplicates (see main.tsx). Prerendered pages
 * get their head from the React render instead (scripts/prerender.mjs).
 */
export function staticHead(options: { lang: Lang; page: PageId; noindex?: boolean; siteUrl: string; orgJsonLd: Record<string, unknown>; ogImage?: string | null; cms?: CmsFeed | null }): string {
  const { lang, page, siteUrl, orgJsonLd, cms } = options;
  const route = ROUTES.find((r) => r.page === page);
  const o = route ? cmsOverrides(cms, lang, route.path) : null;
  const [title, description] = route ? pageText(lang, page, route.path, cms) : seoText(lang, page);
  const noindex = options.noindex || !!o?.noindex;
  const ogImage = o?.ogImage ?? options.ogImage;
  const urls = route && !noindex ? pageUrls(siteUrl, lang, route, cms) : null;
  const tags = [
    HEAD_START,
    `<title>${esc(title)}</title>`,
    `<meta data-static-head name="description" content="${esc(description)}">`,
    `<meta data-static-head name="robots" content="${robotsContent(noindex, !!o?.nofollow)}">`,
    `<meta data-static-head property="og:site_name" content="Reservia Integrated Energy Solutions">`,
    `<meta data-static-head property="og:type" content="website">`,
    `<meta data-static-head property="og:title" content="${esc(o?.ogTitle ?? title)}">`,
    `<meta data-static-head property="og:description" content="${esc(o?.ogDescription ?? description)}">`,
    `<meta data-static-head property="og:locale" content="${lang === 'ar' ? 'ar_EG' : 'en_US'}">`,
    `<meta data-static-head name="twitter:card" content="${o?.twitterCard ?? (ogImage ? 'summary_large_image' : 'summary')}">`,
  ];
  if (ogImage) tags.push(`<meta data-static-head property="og:image" content="${esc(ogImage)}">`, `<meta data-static-head property="og:image:width" content="1200">`, `<meta data-static-head property="og:image:height" content="630">`);
  if (urls) {
    tags.push(`<link data-static-head rel="canonical" href="${esc(urls.canonical)}">`, `<meta data-static-head property="og:url" content="${esc(urls.canonical)}">`);
    for (const a of urls.alternates) tags.push(`<link data-static-head rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}">`);
  }
  tags.push(HEAD_END, `<script type="application/ld+json" id="ld-org">${jsonLdString(orgJsonLd)}</script>`);
  return tags.join('\n    ');
}

/** "index, follow" / "noindex, follow" / "index, nofollow" / "noindex, nofollow" */
export function robotsContent(noindex: boolean, nofollow = false): string {
  return `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
}

/**
 * sitemap.xml: every indexable page in every language it exists in, with reciprocal alternates;
 * null without a production origin. A version the CMS set to noindex, or canonicalised to another
 * URL, is left out (a sitemap lists canonical, indexable URLs only).
 */
export function sitemapXml(siteUrl: string, cms?: CmsFeed | null): string | null {
  const base = normalizeSiteUrl(siteUrl);
  if (!base) return null;
  const entries = allRoutes(cms).filter((r) => !r.noindex).flatMap((r) =>
    routeLangs(r).flatMap((lang) => {
      const u = pageUrls(siteUrl, lang, r, cms);
      if (!u || u.canonical !== `${base}/${lang}${r.path}`) return [];
      return [['  <url>', `    <loc>${esc(u.canonical)}</loc>`, ...u.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`), '  </url>'].join('\n')];
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

/**
 * robots.txt: crawl everything public; Sitemap line only with a production origin; preview builds
 * disallow all. The CMS can add paths to keep out (Settings > Search engines) or, for a staging
 * domain, discourage indexing of the whole site. (The draft-preview page is noindex itself.)
 */
export function robotsTxt(siteUrl: string, preview: boolean, cms?: CmsFeed | null): string {
  if (preview || cms?.settings?.robots.discourageIndexing) return 'User-agent: *\nDisallow: /\n\n# Not for indexing.\n';
  const base = normalizeSiteUrl(siteUrl);
  const extra = (cms?.settings?.robots.disallowPaths ?? []).flatMap((p) => [`Disallow: /ar${p}`, `Disallow: /en${p}`]);
  return [
    'User-agent: *',
    'Allow: /',
    ...extra,
    '',
    base ? `Sitemap: ${base}/sitemap.xml` : '# Sitemap: added automatically once VITE_SITE_URL (the production domain) is set.',
    '',
  ].join('\n');
}
