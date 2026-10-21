import { describe, expect, it } from 'vitest';
import { SEO } from './seo';
import { LANGS, ROUTES, faqJsonLd, pageUrls, sitemapXml, staticHead } from './seoHead';
import { organizationJsonLd } from './organization';

const org = organizationJsonLd({});

describe('per-page titles and descriptions', () => {
  it('exist for every route in both languages and are unique', () => {
    for (const lang of LANGS) {
      const titles = ROUTES.map((r) => SEO[lang][r.page][0]);
      expect(new Set(titles).size).toBe(ROUTES.length);
      for (const r of ROUTES) {
        const [title, description] = SEO[lang][r.page];
        expect(title.length).toBeGreaterThan(10);
        expect(description.length).toBeGreaterThan(40);
        expect(description.length).toBeLessThan(200);
      }
    }
  });

  it('covers the service-sector page and campaign page', () => {
    expect(ROUTES.map((r) => r.path)).toEqual(expect.arrayContaining(['/service', '/lp/service']));
    expect(SEO.en.service[0]).toMatch(/hospitals, hotels and schools/i);
    expect(SEO.ar.service[0]).toMatch(/مستشفيات/);
  });

  it('has Arabic text for Arabic pages', () => {
    for (const r of ROUTES) expect(SEO.ar[r.page][0]).toMatch(/[؀-ۿ]/);
  });
});

describe('canonical and hreflang', () => {
  it('are omitted without a valid https production domain', () => {
    expect(pageUrls('', 'en', '/service')).toBeNull();
    expect(pageUrls('http://example.com', 'en', '/service')).toBeNull();
    expect(sitemapXml('')).toBeNull();
    const head = staticHead({ lang: 'en', route: ROUTES[0], siteUrl: '', orgJsonLd: org });
    expect(head).not.toMatch(/canonical|hreflang|og:url/);
  });

  it('pair en/ar self-referencing URLs once the domain is set', () => {
    const u = pageUrls('https://www.example.com/', 'ar', '/service')!;
    expect(u).toEqual({ canonical: 'https://www.example.com/ar/service', en: 'https://www.example.com/en/service', ar: 'https://www.example.com/ar/service' });
  });

  it('noindex campaign pages carry no canonical/hreflang and are left out of the sitemap', () => {
    const lp = ROUTES.find((r) => r.path === '/lp/service')!;
    expect(lp.noindex).toBe(true);
    const head = staticHead({ lang: 'en', route: lp, siteUrl: 'https://www.example.com', orgJsonLd: org });
    expect(head).toMatch(/noindex, follow/);
    expect(head).not.toMatch(/canonical|hreflang/);
    const sitemap = sitemapXml('https://www.example.com')!;
    expect(sitemap).not.toMatch(/\/lp\//);
    expect((sitemap.match(/<loc>/g) ?? []).length).toBe(ROUTES.filter((r) => !r.noindex).length * 2);
  });

  it('all campaign pages are noindex and no indexable page is', () => {
    for (const r of ROUTES) expect(Boolean(r.noindex)).toBe(r.path.startsWith('/lp/'));
  });
});

describe('structured data', () => {
  it('Organization omits contact details and any certification by default', () => {
    const json = JSON.stringify(org);
    expect(org['@type']).toBe('Organization');
    expect(json).not.toMatch(/telephone|email|legalName|NREA|certif/i);
  });

  it('Organization includes contact details only when publishing is enabled', () => {
    const withContacts = organizationJsonLd({
      contacts: { businessEmail: 'a@b.c', salesEmail: 's@b.c', officePhone: '+20 2', mobilePhone: '+20 1' },
    });
    expect(withContacts.email).toBe('a@b.c');
  });

  it('FAQPage JSON-LD mirrors the visible strings exactly', () => {
    const pairs: Array<[string, string]> = [['Q1?', 'A1.'], ['سؤال؟', 'جواب.']];
    const data = faqJsonLd('ar', pairs);
    expect(data.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(pairs);
  });

  it('inline JSON-LD cannot break out of its script tag', () => {
    const head = staticHead({ lang: 'en', route: ROUTES[0], siteUrl: '', orgJsonLd: { name: '</script><script>x' } });
    expect(head).not.toContain('</script><script>');
  });
});
