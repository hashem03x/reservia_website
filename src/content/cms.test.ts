import { describe, expect, it } from 'vitest';
import { cmsOverrides, EMPTY_CMS_FEED, validateCmsFeed, type CmsFeed } from './cms';
import { DEFAULT_LANG, ROUTES, findRoute, pageText, pageUrls, sitemapXml, staticHead } from './seoHead';
import { breadcrumbTrail } from './breadcrumbs';
import { seoText } from './seo';
import { organizationJsonLd } from './organization';
import en from '../i18n/translations/en';
import ar from '../i18n/translations/ar';

const SITE = 'https://www.example.com';
const ROUTE_PATHS = ROUTES.map((r) => r.path);

/** One language version as the CMS backend resolves it (utils/website/seoResolver.js). */
function seo(lang: 'ar' | 'en', path: string, over: Record<string, unknown> = {}) {
  const url = `${SITE}/${lang}${path === '/' ? '' : path}`;
  return {
    locale: lang,
    url,
    title: '',
    titleSource: 'website',
    description: '',
    descriptionSource: 'website',
    canonical: url,
    robots: 'index,follow',
    indexable: true,
    alternates: [],
    openGraph: { type: 'website', title: '', description: '', image: null, url, locale: 'ar_EG', siteName: '' },
    twitter: { card: 'summary', cardSource: 'auto', title: '', description: '', image: null, site: null },
    breadcrumbs: [{ name: lang === 'ar' ? 'الرئيسية' : 'Home', url: `${SITE}/${lang}` }, { name: '', url, path }],
    warnings: [],
    ...over,
  };
}

function feedOf(pages: unknown[]): CmsFeed {
  return validateCmsFeed({ success: true, data: { schemaVersion: 1, generatedAt: '2026-11-10T10:00:00Z', origin: SITE, settings: {}, pages } }, ROUTE_PATHS).feed;
}

const page = (path: string, seoByLang: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
  slug: path.replace(/\//g, '') || 'home',
  path,
  pageType: 'legacy',
  isHomePage: path === '/',
  parentSlug: null,
  locales: ['ar', 'en'],
  publishedAt: '2026-11-10T10:00:00Z',
  seo: seoByLang,
  sections: [],
  ...over,
});

describe('Arabic default language', () => {
  it('x-default points at the Arabic version', () => {
    expect(DEFAULT_LANG).toBe('ar');
    const u = pageUrls(SITE, 'en', findRoute('/about')!)!;
    expect(u.alternates.find((a) => a.hreflang === 'x-default')!.href).toBe(`${SITE}/ar/about`);
  });

  it('the root index.html head is the Arabic home page', () => {
    const head = staticHead({ lang: DEFAULT_LANG, page: 'home', siteUrl: SITE, orgJsonLd: organizationJsonLd({}) });
    expect(head).toContain(`<title>${seoText('ar', 'home')[0]}</title>`);
    expect(head).toContain(`rel="canonical" href="${SITE}/ar"`);
  });
});

describe('CMS feed validation', () => {
  it('rejects a feed it does not understand instead of rendering it', () => {
    expect(() => validateCmsFeed({ data: { schemaVersion: 2, pages: [] } }, ROUTE_PATHS)).toThrow(/schemaVersion/);
    expect(() => validateCmsFeed('nope', ROUTE_PATHS)).toThrow();
    expect(() => validateCmsFeed({ data: { schemaVersion: 1 } }, ROUTE_PATHS)).toThrow(/pages/);
  });

  it('a CMS-built (managed) page at a new path becomes a CMS-only page; a legacy page without a route is skipped and reported', () => {
    const { feed, warnings } = validateCmsFeed({ data: { schemaVersion: 1, pages: [page('/new-campaign', {}, { pageType: 'managed' }), page('/old-thing', {}), page('/about', {})] } }, ROUTE_PATHS);
    expect(feed.pages.map((p) => [p.path, p.dynamic])).toEqual([['/new-campaign', true], ['/about', false]]);
    expect(warnings[0]).toMatch(/old-thing/);
  });

  it('drops a non-https share image', () => {
    const feed = feedOf([page('/about', { en: seo('en', '/about', { openGraph: { title: '', description: '', image: 'http://insecure.example.com/x.jpg' } }) })]);
    expect(cmsOverrides(feed, 'en', '/about').ogImage).toBeUndefined();
  });

  it('an empty feed changes nothing anywhere', () => {
    for (const r of ROUTES) {
      for (const lang of ['en', 'ar'] as const) {
        if (!(r.langs ?? ['en', 'ar']).includes(lang)) continue;
        expect(pageText(lang, r.page, r.path, EMPTY_CMS_FEED)).toEqual(seoText(lang, r.page));
        expect(pageUrls(SITE, lang, r, EMPTY_CMS_FEED)).toEqual(pageUrls(SITE, lang, r));
      }
    }
    expect(sitemapXml(SITE, EMPTY_CMS_FEED)).toBe(sitemapXml(SITE));
  });
});

describe('CMS overrides', () => {
  it('only what an editor typed replaces the code\'s text; empty fields keep it', () => {
    const feed = feedOf([
      page('/about', {
        ar: seo('ar', '/about', { title: 'من نحن - ريزيرفيا للطاقة', titleSource: 'custom' }),
        en: seo('en', '/about'),
      }),
    ]);
    expect(pageText('ar', 'about', '/about', feed)).toEqual(['من نحن - ريزيرفيا للطاقة', seoText('ar', 'about')[1]]);
    expect(pageText('en', 'about', '/about', feed)).toEqual(seoText('en', 'about'));
  });

  it('noindex from the CMS removes the version from canonical/hreflang/sitemap, and the other version stops pointing at it', () => {
    const feed = feedOf([page('/calculator', { ar: seo('ar', '/calculator'), en: seo('en', '/calculator', { robots: 'noindex,follow', indexable: false }) })]);
    const route = findRoute('/calculator')!;
    expect(pageUrls(SITE, 'en', route, feed)).toBeNull();
    const ar = pageUrls(SITE, 'ar', route, feed)!;
    expect(ar.canonical).toBe(`${SITE}/ar/calculator`);
    expect(ar.alternates).toEqual([]); // only one indexable version left: no pair is claimed
    const sitemap = sitemapXml(SITE, feed)!;
    expect(sitemap).not.toContain(`<loc>${SITE}/en/calculator</loc>`);
    expect(sitemap).toContain(`<loc>${SITE}/ar/calculator</loc>`);
  });

  it('a canonical override is used as-is, without alternates, and that URL leaves the sitemap', () => {
    const feed = feedOf([page('/service', { en: seo('en', '/service', { canonical: `${SITE}/en/industrial`, warnings: ['canonical_overridden'] }), ar: seo('ar', '/service') })]);
    const u = pageUrls(SITE, 'en', findRoute('/service')!, feed)!;
    expect(u).toEqual({ canonical: `${SITE}/en/industrial`, alternates: [] });
    expect(sitemapXml(SITE, feed)).not.toContain(`<loc>${SITE}/en/service</loc>`);
  });

  it('robots, share text/image and X card come through', () => {
    const feed = feedOf([
      page('/contact', {
        en: seo('en', '/contact', {
          robots: 'index,nofollow',
          openGraph: { title: 'Talk to Reservia', description: 'Free quote.', image: 'https://res.cloudinary.com/demo/og.jpg' },
          twitter: { card: 'summary', cardSource: 'custom' },
        }),
      }),
    ]);
    const o = cmsOverrides(feed, 'en', '/contact');
    expect(o.nofollow).toBe(true);
    expect(o.noindex).toBeUndefined();
    expect(o.ogTitle).toBe('Talk to Reservia');
    expect(o.ogImage).toBe('https://res.cloudinary.com/demo/og.jpg');
    expect(o.twitterCard).toBe('summary');
    const head = staticHead({ lang: 'en', page: 'contact', siteUrl: SITE, orgJsonLd: {}, cms: feed });
    expect(head).toContain('content="index, nofollow"');
    expect(head).toContain('content="https://res.cloudinary.com/demo/og.jpg"');
  });

  it('breadcrumbs: a CMS label replaces the navigation label; switching them off hides the trail', () => {
    const labelled = feedOf([
      page('/oil-gas', {
        en: seo('en', '/oil-gas', {
          breadcrumbs: [
            { name: 'Home', url: `${SITE}/en` },
            { name: 'Factories', url: `${SITE}/en/industrial`, path: '/industrial' },
            { name: '', url: `${SITE}/en/oil-gas`, path: '/oil-gas' },
          ],
        }),
      }),
    ]);
    const trail = breadcrumbTrail('/oil-gas', en, { lang: 'en', feed: labelled });
    expect(trail.map((c) => c.name)).toEqual([en.nav_home, 'Factories', en.og_crumb]);

    const hidden = feedOf([page('/about', { ar: seo('ar', '/about', { breadcrumbs: [] }) })]);
    expect(breadcrumbTrail('/about', ar, { lang: 'ar', feed: hidden })).toEqual([]);
    expect(breadcrumbTrail('/about', en, { lang: 'en', feed: hidden }).length).toBe(2); // English version untouched
  });

  it('text from the CMS is escaped in the static head', () => {
    const feed = feedOf([page('/', { ar: seo('ar', '/', { title: '"><script>alert(1)</script>', titleSource: 'custom' }) })]);
    const head = staticHead({ lang: 'ar', page: 'home', siteUrl: SITE, orgJsonLd: {}, cms: feed });
    expect(head).not.toContain('<script>alert(1)');
    expect(head).toContain('&quot;&gt;&lt;script&gt;');
  });
});
