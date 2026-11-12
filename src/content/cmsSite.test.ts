import { describe, expect, it } from 'vitest';
import { cleanSections, managedPageFor, validateCmsFeed, validatePreviewPage, type CmsFeed } from './cms';
import { allRoutes, findRoute, pageText, robotsTxt, ROUTES, sitemapXml } from './seoHead';
import { injectForPage, injectGlobal } from './cmsInject';
import { footerColumns, siteNav } from '../cms/nav';
import en from '../i18n/translations/en';

// Website CMS on the public site: managed pages, sections, menus, settings, tracking, custom code.

const SITE = 'https://www.example.com';
const ROUTE_PATHS = ROUTES.map((r) => r.path);

const seo = (lang: 'ar' | 'en', path: string, title: string, description: string) => ({
  locale: lang,
  url: `${SITE}/${lang}${path}`,
  title,
  titleSource: 'custom',
  description,
  descriptionSource: 'custom',
  canonical: `${SITE}/${lang}${path}`,
  robots: 'index,follow',
  indexable: true,
  openGraph: { title: '', description: '', image: null },
  twitter: { card: 'summary', cardSource: 'auto' },
  breadcrumbs: [{ name: 'Home', url: `${SITE}/${lang}` }, { name: title, url: `${SITE}/${lang}${path}`, path }],
  warnings: [],
});

const managed = (path: string, over: Record<string, unknown> = {}) => ({
  slug: path.slice(1).replace(/\//g, '-') || 'home',
  path,
  pageType: 'managed',
  isHomePage: false,
  parentSlug: null,
  titleEn: 'Solar farms',
  titleAr: 'المزارع الشمسية',
  layout: 'default',
  locales: ['ar', 'en'],
  seo: { en: seo('en', path, 'Solar farms | Reservia', 'Solar pumping for farms.'), ar: seo('ar', path, 'المزارع | ريزيرفيا', 'طاقة شمسية للمزارع.') },
  sections: [{ type: 'hero', sortOrder: 0, content: { headingEn: 'Power your farm', headingAr: 'شغّل مزرعتك' }, settings: { spacing: { top: 'lg', bottom: 'sm' }, devices: { mobile: false } } }],
  ...over,
});

function feed(data: Record<string, unknown>): CmsFeed {
  return validateCmsFeed({ success: true, data: { schemaVersion: 1, generatedAt: '2026-11-12T08:00:00Z', pages: [], ...data } }, ROUTE_PATHS).feed;
}

describe('managed pages', () => {
  it('a managed page at a new path becomes a route of the site (prerender, sitemap, canonical)', () => {
    const f = feed({ pages: [managed('/solar-farms')] });
    const route = findRoute('/solar-farms', f);
    expect(route).toMatchObject({ path: '/solar-farms', page: 'cms', langs: ['ar', 'en'], parent: '' });
    expect(allRoutes(f).length).toBe(ROUTES.length + 1);
    expect(sitemapXml(SITE, f)).toContain(`${SITE}/ar/solar-farms`);
    expect(pageText('en', 'cms', '/solar-farms', f)).toEqual(['Solar farms | Reservia', 'Solar pumping for farms.']);
    expect(findRoute('/solar-farms')).toBeUndefined();
  });

  it('a managed page at a built-in path replaces that page and uses its CMS text', () => {
    const f = feed({ pages: [managed('/about')] });
    expect(managedPageFor(f, '/about')?.dynamic).toBe(false);
    expect(allRoutes(f).length).toBe(ROUTES.length);
    expect(pageText('en', 'about', '/about', f)[0]).toBe('Solar farms | Reservia');
  });

  it('rejects reserved and malformed paths, and pages without a language', () => {
    const { feed: f, warnings } = validateCmsFeed({ data: { schemaVersion: 1, pages: [managed('/__preview'), managed('/Bad Path'), managed('/ok', { locales: [] })] } }, ROUTE_PATHS);
    expect(f.pages).toEqual([]);
    expect(warnings).toHaveLength(3);
  });

  it('keeps section settings, drops unknown section types and non-https media', () => {
    const warnings: string[] = [];
    const out = cleanSections(
      [
        { type: 'hero', content: { headingEn: 'x', image: { url: 'javascript:alert(1)' }, video: 'https://youtu.be/abcdefghijk' }, settings: { devices: { mobile: false }, background: { type: 'image', image: { url: 'http://evil.example.com/a.jpg' } } } },
        { type: 'iframeAnything', content: {} },
      ],
      warnings,
    );
    expect(out).toHaveLength(1);
    expect(out[0].content.image).toBeUndefined();
    expect(out[0].settings.devices).toEqual({ desktop: true, tablet: true, mobile: false });
    expect(out[0].settings.background.type).toBe('none');
    expect(warnings[0]).toMatch(/iframeAnything/);
  });
});

describe('menus', () => {
  it('uses the CMS header menu when published (nested dropdowns flattened), else the built-in menu', () => {
    const f = feed({
      navigation: {
        header: [
          { type: 'link', labelEn: 'Home', labelAr: 'الرئيسية', href: '/', target: '_self' },
          { type: 'group', labelEn: 'Solutions', labelAr: 'الحلول', target: '_self', items: [{ type: 'link', labelEn: 'Farms', labelAr: 'المزارع', href: '/agriculture', target: '_self' }, { type: 'group', labelEn: 'More', labelAr: 'المزيد', target: '_self', items: [{ type: 'link', labelEn: 'Docs', labelAr: 'وثائق', href: 'https://example.com', target: '_blank' }] }] },
          { type: 'link', labelEn: 'Bad', labelAr: '', href: 'javascript:alert(1)', target: '_self' },
        ],
        footer: [{ titleEn: 'Company', titleAr: 'الشركة', items: [{ type: 'link', labelEn: 'About', labelAr: 'من نحن', href: '/about', target: '_self' }] }],
      },
    });
    const nav = siteNav(f, 'ar', en);
    expect(nav.map((e) => e.label)).toEqual(['الرئيسية', 'الحلول']);
    const group = nav[1];
    expect(group.type === 'group' && group.items.map((i) => [i.label, i.to, i.external])).toEqual([
      ['المزارع', '/ar/agriculture', false],
      ['وثائق', 'https://example.com', true],
    ]);
    expect(footerColumns(f, 'en')[0]).toMatchObject({ title: 'Company', items: [{ to: '/en/about' }] });
    expect(siteNav(feed({}), 'en', en).length).toBeGreaterThan(3);
  });
});

describe('site-wide injection', () => {
  const f = feed({
    settings: { favicon: 'https://res.cloudinary.com/x/favicon.png', robots: { discourageIndexing: false, disallowPaths: ['/thank-you'] } },
    integrations: { ga4: 'G-ABC123XYZ9', verification: { google: 'abcDEF123_-xyz' } },
    customCode: [
      { id: '1', name: 'css', kind: 'css', placement: 'head', scope: 'global', code: '.x{color:red}' },
      { id: '1b', name: 'css again', kind: 'css', placement: 'head', scope: 'global', code: '.x{color:red}' },
      { id: '2', name: 'js', kind: 'js', placement: 'body_end', scope: 'global', code: 'console.log(1)' },
      { id: '3', name: 'page', kind: 'html', placement: 'head', scope: 'page', pageSlug: 'about', code: '<meta name="x" content="y">' },
      { id: '4', name: 'breakout', kind: 'js', placement: 'body_end', scope: 'global', code: '</script><script>alert(1)' },
    ],
  });
  const template = '<html><head>\n<link rel="icon" href="/favicon.ico" />\n</head><body>\n<div id="root"></div>\n</body></html>';

  it('injects verification, favicon and global code exactly once; identical snippets once; break-outs never', () => {
    const html = injectGlobal(template, f);
    expect(html).toContain('<meta name="google-site-verification" content="abcDEF123_-xyz">');
    expect(html).toContain('href="https://res.cloudinary.com/x/favicon.png"');
    expect(html).not.toContain('/favicon.ico');
    expect(html.match(/data-cms-code=/g)).toHaveLength(2);
    expect(html).not.toContain('alert(1)');
    expect(injectGlobal(html, f)).toBe(html);
    expect(html).not.toContain('name="x"');
  });

  it('page-scoped code only on its own page', () => {
    expect(injectForPage(template, f, 'about')).toContain('<meta name="x" content="y">');
    expect(injectForPage(template, f, 'contact')).toBe(template);
  });

  it('tracking ids are validated; robots.txt carries the extra disallowed paths', () => {
    expect(f.integrations.ga4).toBe('G-ABC123XYZ9');
    expect(feed({ integrations: { ga4: 'UA-123' } }).integrations.ga4).toBeUndefined();
    expect(robotsTxt(SITE, false, f)).toContain('Disallow: /en/thank-you');
    expect(robotsTxt(SITE, false, feed({ settings: { robots: { discourageIndexing: true } } }))).toMatch(/Disallow: \/\n/);
  });
});

describe('draft preview response', () => {
  it('is only accepted when it says it is a preview', () => {
    expect(() => validatePreviewPage({ data: { page: managed('/x') } })).toThrow();
    const v = validatePreviewPage({ data: { preview: true, expiresAt: '2026-11-12T09:00:00Z', page: managed('/x'), navigation: { header: [] } } });
    expect(v.page.sections[0].content.headingEn).toBe('Power your farm');
    expect(v.expiresAt).toBe('2026-11-12T09:00:00Z');
  });
});
