import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ROUTES, routeLangs } from '../../src/content/seoHead';
import { seoText } from '../../src/content/seo';
import { open, watchErrors } from './helpers';

/**
 * Technical SEO brief (22 October 2026): what crawlers receive before any
 * JavaScript runs, hydration health, and the reproducible site checker.
 */

const SITE = 'https://www.example-e2e.test';

test.describe('initial HTML (before JavaScript)', () => {
  for (const route of ROUTES) {
    for (const lang of routeLangs(route)) {
      const path = `/${lang}${route.path}`;
      test(`${path}: served HTML is prerendered with its own head`, async ({ request }) => {
        const res = await request.get(path);
        expect(res.status()).toBe(200);
        const html = await res.text();
        const [title, description] = seoText(lang, route.page);
        const head = html.slice(0, html.indexOf('</head>'));
        expect(html).toContain(`<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`);
        const decode = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        expect(decode(head.match(/<title[^>]*>([^<]*)<\/title>/)![1])).toBe(title);
        expect(decode(head.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)![1])).toBe(description);
        expect((head.match(/<title[\s>]/g) ?? []).length).toBe(1);
        const body = html.slice(html.indexOf('<div id="root">'));
        expect(body).toMatch(/<h1[\s>]/);
        // The main content is in the HTML, not only after hydration.
        expect(body.length).toBeGreaterThan(5000);
        if (route.noindex) expect(head).toContain('content="noindex, follow"');
        else expect(head).toContain(`rel="canonical" href="${SITE}${path}"`);
      });
    }
  }

  test('no metadata leaks between routes: each file has only its own title', async ({ request }) => {
    const seen = new Set<string>();
    for (const route of ROUTES.filter((r) => !r.noindex)) {
      for (const lang of routeLangs(route)) {
        const html = await (await request.get(`/${lang}${route.path}`)).text();
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/)![1];
        expect(seen.has(title), title).toBe(false);
        seen.add(title);
      }
    }
  });
});

test.describe('hydration', () => {
  for (const path of ['/en', '/ar', '/en/calculator?tab=farm', '/ar/contact?type=service', '/en/oil-gas', '/ar/solar-irrigation-guide', '/en/how-we-work']) {
    test(`${path}: hydrates without errors or duplicated content`, async ({ page }) => {
      const errors = watchErrors(page);
      await open(page, path);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('#root > .appLoader, #root .appLoader')).toHaveCount(0);
      expect(await page.locator('header.top').count()).toBe(1);
      expect(await page.locator('footer').count()).toBe(1);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  test('dark-mode visitors hydrate without a theme mismatch', async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => localStorage.setItem('rsv_theme', 'dark'));
    await open(page, '/en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('button.themeToggle')).toHaveAccessibleName('Switch to light mode');
    expect(errors).toEqual([]);
  });

  test('calculator and contact form still work after hydration', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    await expect(page.locator('#tab-farm')).toHaveAttribute('aria-selected', 'true');
    await page.locator('#f_hp').fill('20');
    await expect(page.locator('.results')).toContainText('20.9 kWp');
    await open(page, '/en/contact?type=service');
    await expect(page.locator('#q_type option:checked')).toHaveText('Services sector (hospital, hotel, school, office)');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('#q_name_e')).toBeVisible();
  });
});

test.describe('new pages and links', () => {
  test('oil and gas page: linked from Industrial, breadcrumbs, CTA, no project claims', async ({ page }) => {
    await open(page, '/en/industrial');
    await page.locator('main a[href="/en/oil-gas"]').click();
    await expect(page).toHaveURL(/\/en\/oil-gas$/);
    await expect(page.locator('nav.crumbs li')).toHaveText(['Home', 'Industrial Facilities', 'Oil and gas sites']);
    await expect(page.locator('main')).toContainText('Not a Reservia project');
    await expect(page.locator('main')).toContainText('not a measured result');
    await expect(page.locator('main a[href="/en/contact?type=oilgas"]').first()).toBeVisible();
  });

  test('Arabic irrigation guide: linked from Agriculture (both languages), RTL, financing not promised', async ({ page }) => {
    await open(page, '/en/agriculture');
    await expect(page.locator('main a[href="/ar/solar-irrigation-guide"]')).toHaveAttribute('hreflang', 'ar');
    await open(page, '/ar/agriculture');
    await page.locator('main a[href="/ar/solar-irrigation-guide"]').click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('main h1')).toHaveText('دليل الري بالطاقة الشمسية للمزارع في مصر');
    await expect(page.locator('main')).toContainText('البنك الزراعي المصري');
    await expect(page.locator('main')).not.toContainText(/فائدة \d|%\s*فائدة/);
  });

  test('language switch on the Arabic-only guide goes to the English parent page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/ar/solar-irrigation-guide');
    await page.locator('button.lang').click();
    await expect(page).toHaveURL(/\/en\/agriculture$/);
  });

  test('residential price table matches the calculator price list', async ({ page }) => {
    await open(page, '/en/residential');
    const rows = page.locator('table.pricetable tbody tr');
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(2)).toContainText('6 kWp');
    await expect(rows.nth(2)).toContainText('183,600 EGP');
  });

  test('calculator page has one visible heading per level and related links', async ({ page }) => {
    await open(page, '/en/calculator');
    const h2s = await page.locator('main h2').allTextContents();
    expect(h2s).not.toContain('See what solar could save you');
    await expect(page.locator('main a[href="/en/agriculture"]')).toBeVisible();
  });
});

test.describe('reproducible site checker', () => {
  test('scripts/check-site.mjs passes against this build', () => {
    const base = test.info().project.use.baseURL!;
    const out = execFileSync('node', ['scripts/check-site.mjs', base, `--expect-origin=${SITE}`], { encoding: 'utf8' });
    expect(out).toContain('All checks passed');
  });

  test('its route list matches the app route inventory', () => {
    const src = readFileSync('scripts/check-site.mjs', 'utf8');
    const listed = [...src.matchAll(/\['(\/[^']*|)', \[([^\]]*)\](, true)?\]/g)].map((m) => `${m[1]}|${m[2].replace(/[' ]/g, '')}|${Boolean(m[3])}`);
    const actual = ROUTES.map((r) => `${r.path}|${routeLangs(r).join(',')}|${Boolean(r.noindex)}`);
    expect(listed).toEqual(actual);
  });
});
