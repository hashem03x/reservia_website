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

export type Lang = 'en' | 'ar';
export const LANGS: Lang[] = ['en', 'ar'];

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

/** The route for a language-agnostic path, if any. */
export function findRoute(path: string): RouteDef | undefined {
  return ROUTES.find((r) => r.path === path);
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

/** Absolute canonical + hreflang URLs for an indexable page, or null without a valid production origin. */
export function pageUrls(siteUrl: string | undefined | null, lang: Lang, route: RouteDef): PageUrls | null {
  const base = normalizeSiteUrl(siteUrl);
  if (!base || route.noindex) return null;
  const url = (l: Lang) => `${base}/${l}${route.path}`;
  const langs = routeLangs(route);
  const alternates =
    langs.length > 1
      ? [...langs.map((l) => ({ hreflang: l, href: url(l) })), ...(langs.includes('en') ? [{ hreflang: 'x-default', href: url('en') }] : [])]
      : [];
  return { canonical: url(lang), alternates };
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
export function staticHead(options: { lang: Lang; page: PageId; noindex?: boolean; siteUrl: string; orgJsonLd: Record<string, unknown>; ogImage?: string | null }): string {
  const { lang, page, noindex, siteUrl, orgJsonLd, ogImage } = options;
  const [title, description] = seoText(lang, page);
  const route = ROUTES.find((r) => r.page === page);
  const urls = route && !noindex ? pageUrls(siteUrl, lang, route) : null;
  const tags = [
    HEAD_START,
    `<title>${esc(title)}</title>`,
    `<meta data-static-head name="description" content="${esc(description)}">`,
    `<meta data-static-head name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}">`,
    `<meta data-static-head property="og:site_name" content="Reservia Integrated Energy Solutions">`,
    `<meta data-static-head property="og:type" content="website">`,
    `<meta data-static-head property="og:title" content="${esc(title)}">`,
    `<meta data-static-head property="og:description" content="${esc(description)}">`,
    `<meta data-static-head property="og:locale" content="${lang === 'ar' ? 'ar_EG' : 'en_US'}">`,
    `<meta data-static-head name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">`,
  ];
  if (ogImage) tags.push(`<meta data-static-head property="og:image" content="${esc(ogImage)}">`, `<meta data-static-head property="og:image:width" content="1200">`, `<meta data-static-head property="og:image:height" content="630">`);
  if (urls) {
    tags.push(`<link data-static-head rel="canonical" href="${esc(urls.canonical)}">`, `<meta data-static-head property="og:url" content="${esc(urls.canonical)}">`);
    for (const a of urls.alternates) tags.push(`<link data-static-head rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}">`);
  }
  tags.push(HEAD_END, `<script type="application/ld+json" id="ld-org">${jsonLdString(orgJsonLd)}</script>`);
  return tags.join('\n    ');
}

/** sitemap.xml: every indexable page in every language it exists in, with reciprocal alternates; null without a production origin. */
export function sitemapXml(siteUrl: string): string | null {
  if (!normalizeSiteUrl(siteUrl)) return null;
  const entries = ROUTES.filter((r) => !r.noindex).flatMap((r) =>
    routeLangs(r).map((lang) => {
      const u = pageUrls(siteUrl, lang, r)!;
      return ['  <url>', `    <loc>${esc(u.canonical)}</loc>`, ...u.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`), '  </url>'].join('\n');
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

/** robots.txt: crawl everything public; Sitemap line only with a production origin; preview builds disallow all. */
export function robotsTxt(siteUrl: string, preview: boolean): string {
  if (preview) return 'User-agent: *\nDisallow: /\n\n# Preview deployment -- not for indexing.\n';
  const base = normalizeSiteUrl(siteUrl);
  return [
    'User-agent: *',
    'Allow: /',
    '',
    base ? `Sitemap: ${base}/sitemap.xml` : '# Sitemap: added automatically once VITE_SITE_URL (the production domain) is set.',
    '',
  ].join('\n');
}
