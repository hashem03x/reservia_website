import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seoText } from '../../src/content/seo';
import { ROUTES, routeLangs } from '../../src/content/seoHead';
import { dataLayer, open, setTheme, watchErrors } from './helpers';

const SITE = 'https://www.example-e2e.test';
const LANGS = ['en', 'ar'] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [400, 1280] as const;

/**
 * Route regression matrix: every page x language x theme x viewport.
 * 14 routes x 2 x 2 x 2 = 112 cases. Each case checks errors, overflow,
 * direction, route metadata, structured data, page_view dedupe, heading
 * order and an axe-core WCAG 2.x A/AA scan (including colour contrast).
 */
for (const route of ROUTES) {
  for (const lang of LANGS.filter((l) => routeLangs(route).includes(l))) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const path = `/${lang}${route.path}`;
        test(`${path} | ${theme} | ${width}px`, async ({ page }) => {
          const errors = watchErrors(page);
          await page.setViewportSize({ width, height: 900 });
          await setTheme(page, theme);
          await open(page, path);

          // Theme, language and direction
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await expect(page.locator('html')).toHaveAttribute('lang', lang);
          await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

          // Route metadata (one of each, matching the SEO table)
          const [title, description] = seoText(lang, route.page);
          await expect(page).toHaveTitle(title);
          await expect(page.locator('meta[name="description"]')).toHaveCount(1);
          await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
          await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
          await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', route.noindex ? 'noindex, follow' : 'index, follow');
          if (route.noindex) {
            await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
            await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
          } else {
            await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
            await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${path}`);
            if (routeLangs(route).length > 1) {
              await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
              await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}/en${route.path}`);
              await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute('href', `${SITE}/ar${route.path}`);
              await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${SITE}/en${route.path}`);
            } else {
              // Single-language page (Arabic irrigation guide): no hreflang pair is claimed.
              await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
            }
            await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
          }

          // Structured data: valid JSON, one Organization, FAQ == visible FAQ
          const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
          const parsed = ld.map((s) => JSON.parse(s) as Record<string, unknown>);
          expect(parsed.filter((d) => d['@type'] === 'Organization')).toHaveLength(1);
          const faq = parsed.find((d) => d['@type'] === 'FAQPage') as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> } | undefined;
          const visibleQuestions = await page.locator('main details summary').allTextContents();
          if (faq) {
            expect(faq.mainEntity.map((q) => q.name)).toEqual(visibleQuestions);
            const visibleAnswers = await page.locator('main details > p').allTextContents();
            expect(faq.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(visibleAnswers);
          } else {
            expect(visibleQuestions).toHaveLength(0);
          }

          // No horizontal overflow
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);

          // Exactly one page_view for this page, no lead events from just viewing
          const dl = await dataLayer(page);
          expect(dl.filter((e) => e.event === 'page_view' && e.page === path)).toHaveLength(1);
          expect(dl.filter((e) => e.event === 'generate_lead')).toHaveLength(0);

          // One h1; heading levels never skip (h1 -> h3)
          const levels = await page.locator('main :is(h1,h2,h3,h4)').evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
          expect(levels.filter((l) => l === 1)).toHaveLength(1);
          levels.forEach((l, i) => i > 0 && expect(l - levels[i - 1], `heading jump at ${i}`).toBeLessThanOrEqual(1));

          // Accessibility scan (WCAG 2.x A/AA, incl. colour contrast)
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          const violations = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) e.g. ${v.nodes[0]?.target.join(' ')}`);
          expect(violations, violations.join('\n')).toEqual([]);

          expect(errors, errors.join('\n')).toEqual([]);
        });
      }
    }
  }
}
