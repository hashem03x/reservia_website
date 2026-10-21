/**
 * Pure SEO helpers shared by the React app (Seo.tsx), the build-time
 * static HTML generator (vite.config.ts) and the tests. No React, no
 * import.meta.env -- callers pass configuration in.
 */
import { SEO, type PageId } from './seo.ts';
import { jsonLdString } from './organization.ts';

export type Lang = 'en' | 'ar';
export const LANGS: Lang[] = ['en', 'ar'];

export interface RouteDef {
  /** Language-agnostic path: '' for home, '/residential', '/lp/service', ... */
  path: string;
  page: PageId;
  noindex?: boolean;
}

/** Every public page (12 original + the service-sector page and its campaign page). */
export const ROUTES: RouteDef[] = [
  { path: '', page: 'home' },
  { path: '/residential', page: 'residential' },
  { path: '/agriculture', page: 'agriculture' },
  { path: '/industrial', page: 'industrial' },
  { path: '/service', page: 'service' },
  { path: '/calculator', page: 'calculator' },
  { path: '/how-we-work', page: 'how' },
  { path: '/about', page: 'about' },
  { path: '/contact', page: 'contact' },
  { path: '/lp/villas', page: 'lp-villas', noindex: true },
  { path: '/lp/compounds', page: 'lp-compounds', noindex: true },
  { path: '/lp/agriculture', page: 'lp-agriculture', noindex: true },
  { path: '/lp/industrial', page: 'lp-industrial', noindex: true },
  { path: '/lp/service', page: 'lp-service', noindex: true },
];

/** Absolute URLs for a page, or null when no production domain is configured (client decision 7). */
export function pageUrls(siteUrl: string, lang: Lang, path: string): { canonical: string; en: string; ar: string } | null {
  const base = siteUrl.trim().replace(/\/$/, '');
  if (!/^https:\/\/[^/\s]+/.test(base)) return null;
  const url = (l: Lang) => `${base}/${l}${path}`;
  return { canonical: url(lang), en: url('en'), ar: url('ar') };
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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Static <head> fallback for one route, for crawlers and link previews
 * that do not execute JavaScript. Tags carry `data-static-head` so the
 * app removes them on boot and react-helmet-async takes over without
 * duplicates (see main.tsx).
 */
export function staticHead(options: { lang: Lang; route: RouteDef; siteUrl: string; orgJsonLd: Record<string, unknown> }): string {
  const { lang, route, siteUrl, orgJsonLd } = options;
  const [title, description] = SEO[lang][route.page];
  const urls = route.noindex ? null : pageUrls(siteUrl, lang, route.path);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta data-static-head name="description" content="${esc(description)}">`,
    `<meta data-static-head name="robots" content="${route.noindex ? 'noindex, follow' : 'index, follow'}">`,
    `<meta data-static-head property="og:site_name" content="Reservia Integrated Energy Solutions">`,
    `<meta data-static-head property="og:type" content="website">`,
    `<meta data-static-head property="og:title" content="${esc(title)}">`,
    `<meta data-static-head property="og:description" content="${esc(description)}">`,
    `<meta data-static-head property="og:locale" content="${lang === 'ar' ? 'ar_EG' : 'en_US'}">`,
    `<meta data-static-head property="og:locale:alternate" content="${lang === 'ar' ? 'en_US' : 'ar_EG'}">`,
    `<meta data-static-head name="twitter:card" content="summary">`,
  ];
  if (urls) {
    tags.push(
      `<link data-static-head rel="canonical" href="${esc(urls.canonical)}">`,
      `<link data-static-head rel="alternate" hreflang="en" href="${esc(urls.en)}">`,
      `<link data-static-head rel="alternate" hreflang="ar" href="${esc(urls.ar)}">`,
      `<link data-static-head rel="alternate" hreflang="x-default" href="${esc(urls.en)}">`,
      `<meta data-static-head property="og:url" content="${esc(urls.canonical)}">`,
    );
  }
  tags.push(`<script type="application/ld+json" id="ld-org">${jsonLdString(orgJsonLd)}</script>`);
  return tags.join('\n    ');
}

/** sitemap.xml with hreflang alternates for every indexable page, or null without a production domain. */
export function sitemapXml(siteUrl: string): string | null {
  if (!pageUrls(siteUrl, 'en', '')) return null;
  const entries = ROUTES.filter((r) => !r.noindex).flatMap((r) =>
    LANGS.map((lang) => {
      const u = pageUrls(siteUrl, lang, r.path)!;
      return [
        '  <url>',
        `    <loc>${esc(u.canonical)}</loc>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${esc(u.en)}"/>`,
        `    <xhtml:link rel="alternate" hreflang="ar" href="${esc(u.ar)}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(u.en)}"/>`,
        '  </url>',
      ].join('\n');
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}
