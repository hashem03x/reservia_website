import { describe, expect, it } from 'vitest';
import { SEO, seoText } from './seo';
import {
  ROUTES,
  breadcrumbJsonLd,
  faqJsonLd,
  findRoute,
  normalizeSiteUrl,
  pageJsonLd,
  pageUrls,
  robotsTxt,
  routeLangs,
  sitemapXml,
  splitPath,
  staticHead,
} from './seoHead';
import { organizationJsonLd } from './organization';

const SITE = 'https://www.example.com';
const org = organizationJsonLd({});

describe('route inventory and per-page metadata', () => {
  it('every route has a title and description in each language it exists in, unique per language', () => {
    for (const lang of ['en', 'ar'] as const) {
      const routes = ROUTES.filter((r) => routeLangs(r).includes(lang));
      const titles = routes.map((r) => seoText(lang, r.page)[0]);
      expect(new Set(titles).size).toBe(routes.length);
      const descriptions = routes.map((r) => seoText(lang, r.page)[1]);
      expect(new Set(descriptions).size).toBe(routes.length);
      for (const r of routes) {
        const [title, description] = seoText(lang, r.page);
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(75);
        expect(description.length).toBeGreaterThan(40);
        expect(description.length).toBeLessThan(200);
        if (lang === 'ar') expect(title).toMatch(/[؀-ۿ]/);
      }
    }
  });

  it('includes the new oil and gas page (both languages) and the Arabic-only irrigation guide', () => {
    expect(routeLangs(findRoute('/oil-gas')!)).toEqual(['en', 'ar']);
    expect(routeLangs(findRoute('/solar-irrigation-guide')!)).toEqual(['ar']);
    expect(SEO.en.irrigation).toBeUndefined(); // no English page invented
    expect(() => seoText('en', 'irrigation')).toThrow();
  });

  it('marks exactly the campaign pages noindex', () => {
    for (const r of ROUTES) expect(Boolean(r.noindex)).toBe(r.path.startsWith('/lp/'));
  });

  it('splits language prefixes', () => {
    expect(splitPath('/ar/oil-gas')).toEqual({ lang: 'ar', path: '/oil-gas' });
    expect(splitPath('/en')).toEqual({ lang: 'en', path: '' });
    expect(splitPath('/en/service/')).toEqual({ lang: 'en', path: '/service' });
  });
});

describe('production origin (VITE_SITE_URL)', () => {
  it('accepts only a bare https origin, normalised', () => {
    expect(normalizeSiteUrl('https://www.Example.com/')).toBe('https://www.example.com');
    expect(normalizeSiteUrl('https://example.com')).toBe('https://example.com');
    for (const bad of ['', '  ', 'http://example.com', 'https://example.com/en', 'https://example.com/?a=1', 'example.com', 'https://localhost']) {
      expect(normalizeSiteUrl(bad), bad).toBeNull();
    }
  });

  it('emits no absolute URL at all without a valid origin', () => {
    expect(pageUrls('', 'en', findRoute('/service')!)).toBeNull();
    expect(sitemapXml('')).toBeNull();
    expect(sitemapXml('http://example.com')).toBeNull();
    const head = staticHead({ lang: 'en', page: 'home', siteUrl: '', orgJsonLd: org });
    expect(head).not.toMatch(/canonical|hreflang|og:url|og:image/);
  });
});

describe('canonical and hreflang', () => {
  it('self-referencing canonical with reciprocal en/ar/x-default alternates', () => {
    const route = findRoute('/service')!;
    const ar = pageUrls(SITE, 'ar', route)!;
    const en = pageUrls(SITE, 'en', route)!;
    expect(ar.canonical).toBe(`${SITE}/ar/service`);
    expect(en.canonical).toBe(`${SITE}/en/service`);
    expect(ar.alternates).toEqual(en.alternates);
    expect(ar.alternates).toEqual([
      { hreflang: 'en', href: `${SITE}/en/service` },
      { hreflang: 'ar', href: `${SITE}/ar/service` },
      { hreflang: 'x-default', href: `${SITE}/en/service` },
    ]);
  });

  it('home canonical has no trailing slash and matches the served URL', () => {
    expect(pageUrls(SITE, 'en', findRoute('')!)!.canonical).toBe(`${SITE}/en`);
  });

  it('a single-language page has a canonical but no hreflang pair', () => {
    const u = pageUrls(SITE, 'ar', findRoute('/solar-irrigation-guide')!)!;
    expect(u.canonical).toBe(`${SITE}/ar/solar-irrigation-guide`);
    expect(u.alternates).toEqual([]);
  });

  it('noindex campaign pages get no canonical/hreflang and stay out of the sitemap', () => {
    expect(pageUrls(SITE, 'en', findRoute('/lp/service')!)).toBeNull();
    const sitemap = sitemapXml(SITE)!;
    expect(sitemap).not.toMatch(/\/lp\//);
  });
});

describe('sitemap.xml', () => {
  const sitemap = sitemapXml(SITE)!;
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it('lists every indexable page in each of its languages, once', () => {
    const expected = ROUTES.filter((r) => !r.noindex).flatMap((r) => routeLangs(r).map((l) => `${SITE}/${l}${r.path}`));
    expect(locs.sort()).toEqual(expected.sort());
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toContain(`${SITE}/ar/solar-irrigation-guide`);
    expect(locs).not.toContain(`${SITE}/en/solar-irrigation-guide`);
  });

  it('is well-formed XML with the sitemap and xhtml namespaces and no lastmod guesses', () => {
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toMatch(/xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
    expect(sitemap).not.toMatch(/lastmod/);
    expect((sitemap.match(/<url>/g) ?? []).length).toBe((sitemap.match(/<\/url>/g) ?? []).length);
  });
});

describe('robots.txt', () => {
  it('allows crawling and references the sitemap only with an origin', () => {
    expect(robotsTxt(SITE, false)).toMatch(/User-agent: \*\nAllow: \//);
    expect(robotsTxt(SITE, false)).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt('', false)).not.toMatch(/^Sitemap:/m);
    expect(robotsTxt('', false)).not.toMatch(/Disallow/);
  });

  it('disallows everything on preview deployments', () => {
    expect(robotsTxt(SITE, true)).toMatch(/Disallow: \//);
    expect(robotsTxt(SITE, true)).not.toMatch(/Sitemap/);
  });
});

describe('structured data', () => {
  it('Organization: no contact details, legal name or certification by default; logo only with an origin', () => {
    const json = JSON.stringify(org);
    expect(org['@type']).toBe('Organization');
    expect(json).not.toMatch(/telephone|email|legalName|NREA|certif/i);
    expect(org.logo).toBeUndefined();
    const withBase = organizationJsonLd({ siteUrl: SITE });
    expect(withBase['@id']).toBe(`${SITE}/#organization`);
    expect((withBase.logo as { url: string }).url).toBe(`${SITE}/icons/reservia-logo-512.png`);
  });

  it('WebPage + Service reference the organization and the page URL', () => {
    const route = findRoute('/oil-gas')!;
    const data = pageJsonLd({ base: SITE, lang: 'en', route, url: `${SITE}/en/oil-gas`, name: 'Solar hybrid systems for oil and gas sites in Egypt | Reservia', description: 'd' });
    const [page, service] = data['@graph'] as Array<Record<string, unknown>>;
    expect(page['@type']).toBe('WebPage');
    expect(service['@type']).toBe('Service');
    expect(service.name).toBe('Solar hybrid systems for oil and gas sites in Egypt');
    expect(service.provider).toEqual({ '@id': `${SITE}/#organization` });
    const calc = pageJsonLd({ base: SITE, lang: 'en', route: findRoute('/calculator')!, url: `${SITE}/en/calculator`, name: 'x', description: 'd' });
    expect((calc['@graph'] as unknown[]).length).toBe(1); // no Service for non-service pages
  });

  it('BreadcrumbList and FAQPage mirror their inputs', () => {
    const crumbs = breadcrumbJsonLd([{ name: 'Home', url: `${SITE}/en` }, { name: 'Industry', url: `${SITE}/en/industrial` }]);
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    const pairs: Array<[string, string]> = [['Q1?', 'A1.'], ['سؤال؟', 'جواب.']];
    expect(faqJsonLd('ar', pairs).mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(pairs);
  });

  it('inline JSON-LD cannot break out of its script tag', () => {
    const head = staticHead({ lang: 'en', page: 'home', siteUrl: '', orgJsonLd: { name: '</script><script>x' } });
    expect(head).not.toContain('</script><script>');
  });
});
