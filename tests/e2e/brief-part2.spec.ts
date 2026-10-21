import { expect, test, type Page, type Route } from '@playwright/test';
import { LEADS_URL, open } from './helpers';
import { ROUTES } from '../../src/content/seoHead';

/** Client brief, October 2026 part 2: categories, calculator, homepage, partners, payment terms, FAQ, WhatsApp rules, footer. */

const BILL_TEXT = { en: /send your bill to whatsapp/i, ar: /أرسل فاتورتك على واتساب/ } as const;
const billLinks = (page: Page, lang: 'en' | 'ar') => page.locator('main a[href^="https://wa.me/"]').filter({ hasText: BILL_TEXT[lang] });

const CATEGORIES = {
  en: ['Residential & Commercial', 'Agricultural Farms', 'Industrial Facilities', 'Services Sector'],
  ar: ['سكني وتجاري', 'المزارع الزراعية', 'المنشآت الصناعية', 'قطاع الخدمات'],
};

test.describe('WhatsApp bill CTA visibility rules', () => {
  const allowed = new Set(['', '/residential', '/calculator', '/lp/villas', '/lp/compounds']);
  for (const lang of ['en', 'ar'] as const) {
    for (const route of ROUTES) {
      const path = `/${lang}${route.path}`;
      const shows = allowed.has(route.path);
      test(`${path}: bill CTA ${shows ? 'shown' : 'hidden'}; footer chat button present`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await open(page, path);
        if (shows) await expect(billLinks(page, lang).first()).toBeVisible();
        else await expect(billLinks(page, lang)).toHaveCount(0);
        const footerWa = page.locator('footer a.footerWa');
        await expect(footerWa).toBeVisible();
        await expect(footerWa).toHaveAttribute('href', /^https:\/\/wa\.me\/201211892995\?text=/);
      });
    }
  }

  test('calculator: bill CTA only on the Residential & Commercial tab', async ({ page }) => {
    await open(page, '/en/calculator');
    await expect(billLinks(page, 'en')).toHaveCount(1);
    for (const tab of ['farm', 'ind', 'svc']) {
      await page.locator(`#tab-${tab}`).click();
      await expect(billLinks(page, 'en')).toHaveCount(0);
    }
  });
});

test.describe('payment terms removed, FAQ renamed', () => {
  for (const route of ROUTES) {
    test(`/en${route.path} has no payment-terms content`, async ({ page }) => {
      await open(page, `/en${route.path}`);
      const body = page.locator('body');
      await expect(body).not.toContainText(/payment terms|70 \/ 30|50 \/ 30 \/ 20|80 \/ 20|You pay as we deliver/i);
      await expect(page.locator('.termsline, table.terms, .trustrow span:has-text("%")')).toHaveCount(0);
      await expect(body).not.toContainText('Common questions');
      if (await page.locator('main details').count()) {
        await expect(page.locator('main h2', { hasText: /^FAQ$/ })).toHaveCount(1);
      }
    });
  }

  test('Arabic FAQ heading', async ({ page }) => {
    await open(page, '/ar/residential');
    await expect(page.locator('main h2', { hasText: /^الأسئلة الشائعة$/ })).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('شروط الدفع حسب نوع المشروع');
  });
});

test.describe('four solution categories', () => {
  for (const lang of ['en', 'ar'] as const) {
    test(`${lang}: header menu, home cards, page eyebrows and calculator tabs match`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, `/${lang}`);
      await page.locator('.navDropTrigger').first().click();
      const items = page.locator('.navDropPanel a');
      await expect(items).toHaveText(CATEGORIES[lang]);
      expect(await items.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(
        ['/residential', '/agriculture', '/industrial', '/service'].map((p) => `/${lang}${p}`),
      );
      await expect(page.locator('.cards4 a.seg h3')).toHaveText(CATEGORIES[lang]);
      for (const [i, p] of ['/residential', '/agriculture', '/industrial', '/service'].entries()) {
        await open(page, `/${lang}${p}`);
        await expect(page.locator('.page-hero .eyebrow')).toHaveText(CATEGORIES[lang][i]);
      }
      await open(page, `/${lang}/calculator`);
      await expect(page.locator('[role="tab"]')).toHaveText(CATEGORIES[lang]);
    });
  }

  test('mobile menu lists the same four categories', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 860 });
    await open(page, '/en');
    await page.locator('.menu-btn').click();
    await page.locator('.navMobileGroupTrigger').first().click();
    await expect(page.locator('.navMobileSubList a')).toHaveText(CATEGORIES.en);
  });
});

test.describe('savings calculator, four categories', () => {
  test('Agricultural Farms: crop select, conditional tree select, values kept separate', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    await expect(page.locator('#f_tree')).toHaveCount(0);
    await page.locator('#f_crop').selectOption('wheat');
    await expect(page.locator('#f_tree')).toHaveCount(0);
    await page.locator('#f_crop').selectOption('orchard');
    await page.locator('#f_tree').selectOption('mango');
    await expect(page.locator('.results')).toContainText('41.8 kWp'); // crop does not change the estimate
    await page.locator('#f_crop').selectOption('rice');
    await expect(page.locator('#f_tree')).toHaveCount(0);
    await page.locator('#f_crop').selectOption('orchard');
    await expect(page.locator('#f_tree')).toHaveValue(''); // tree was cleared, not silently kept
  });

  test('Industrial Facilities: on-grid / off-grid radios and monthly cost in EGP', async ({ page }) => {
    await open(page, '/en/calculator?tab=ind');
    const onGrid = page.getByRole('radio', { name: 'On-grid' });
    const offGrid = page.getByRole('radio', { name: 'Off-grid (diesel generators)' });
    await expect(onGrid).toBeChecked();
    await expect(page.getByLabel('Monthly electricity cost (EGP)')).toHaveValue('150000');
    await expect(page.locator('#i_dp')).toHaveCount(0);
    await offGrid.check();
    await expect(page.getByLabel('Monthly electricity cost (EGP)')).toHaveValue('615000');
    await expect(page.locator('#i_dp')).toBeVisible();
    await expect(page.locator('.results')).toContainText('litres/yr');
    await page.getByLabel('Monthly electricity cost (EGP)').fill('-100');
    await expect(page.locator('.calc-invalid')).not.toHaveText('');
    await onGrid.check();
    await expect(page.getByLabel('Monthly electricity cost (EGP)')).toHaveValue('150000');
    await page.keyboard.press('ArrowRight'); // radio group is keyboard operable
    await expect(offGrid).toBeChecked();
  });

  test('Services Sector: its own tab, facility type and tariff note', async ({ page }) => {
    await open(page, '/en/calculator?tab=svc');
    await expect(page.locator('#tab-svc')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#s_type option')).toHaveCount(5);
    await expect(page.locator('.assume').first()).toContainText('assumes EGP 2.55');
    await expect(page.locator('.results')).not.toContainText('litres');
  });

  test('"Get an exact quote" sends only the active tab’s estimate with the lead', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = [];
    await page.route(LEADS_URL, async (route: Route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, body: '{}' });
    });
    await open(page, '/en/calculator?tab=farm');
    await page.locator('#f_crop').selectOption('orchard');
    await page.locator('#f_tree').selectOption('olive');
    // Switch category: the farm inputs must not travel with the industrial estimate.
    await page.locator('#tab-ind').click();
    await page.getByRole('radio', { name: 'Off-grid (diesel generators)' }).check();
    await page.locator('a.btn.sun:has-text("Get an exact quote")').click();
    await expect(page).toHaveURL(/\/en\/contact\?type=oilgas$/);
    await expect(page.locator('.calc-attached')).toContainText('Industrial Facilities');
    await expect(page.locator('.calc-attached')).toContainText('Off-grid (diesel generators)');
    await expect(page.locator('.calc-attached')).not.toContainText('Olive');
    await page.locator('#q_name').fill('Calc Person');
    await page.locator('#q_phone').fill('01211892995');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form .formmsg.ok')).toBeVisible();
    const calc = bodies[0].calculator as Record<string, unknown>;
    expect(calc).toMatchObject({ category: 'industrial_facilities', siteConfig: 'off-grid', monthlyElectricityCostEgp: 615000, dieselPriceEgp: 20.5 });
    expect(calc).not.toHaveProperty('crop');
    expect(calc).not.toHaveProperty('tree');
    expect(typeof calc.systemSizeKwp).toBe('number');
  });

  test('farm context with crop and tree reaches the lead; the estimate can be removed', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = [];
    await page.route(LEADS_URL, async (route: Route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, body: '{}' });
    });
    await open(page, '/ar/calculator?tab=farm');
    await page.locator('#f_crop').selectOption('orchard');
    await page.locator('#f_tree').selectOption('mango');
    await page.locator('main a.btn.sun').last().click();
    await expect(page.locator('.calc-attached')).toContainText('المانجو');
    await page.locator('#q_name').fill('Farm Person');
    await page.locator('#q_phone').fill('01211892995');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form .formmsg.ok')).toBeVisible();
    expect(bodies[0].calculator).toMatchObject({ category: 'agricultural_farms', crop: 'orchard', tree: 'mango', pumpHp: 40 });

    await open(page, '/en/calculator');
    await page.locator('main a.btn.sun:has-text("Get an exact quote")').click();
    await page.locator('.calc-attached button').click();
    await expect(page.locator('.calc-attached')).toHaveCount(0);
  });
});

test.describe('homepage hero', () => {
  test('animated slogan: one word at a time, stable layout, full text for screen readers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en');
    const slogan = page.locator('.hero .slogan');
    await expect(slogan.locator('.sr-only')).toHaveText('Generate. Store. Optimize. Sustain.');
    await expect(slogan.locator('.slogan-word')).toHaveText(['Generate.', 'Store.', 'Optimize.', 'Sustain.']);
    await expect(slogan.locator('.slogan-anim')).toHaveAttribute('aria-hidden', 'true');
    const box = async () => (await slogan.boundingBox())!;
    const heights: number[] = [];
    const visibleWords: string[] = [];
    for (let i = 0; i < 6; i++) {
      heights.push((await box()).height);
      visibleWords.push(
        await slogan.locator('.slogan-word').evaluateAll((ws) => ws.filter((w) => Number(getComputedStyle(w).opacity) > 0.9).map((w) => w.textContent).join('|')),
      );
      await page.waitForTimeout(1300);
    }
    expect(new Set(heights).size).toBe(1); // no layout shift
    expect(new Set(visibleWords.filter(Boolean)).size).toBeGreaterThanOrEqual(2); // it cycles
    for (const v of visibleWords) expect(v.split('|').filter(Boolean).length).toBeLessThanOrEqual(1); // one word at a time
  });

  test('new company description', async ({ page }) => {
    await open(page, '/en');
    await expect(page.locator('.hero .lead')).toHaveText(/integrated energy partner .* flexible financing\.$/);
  });
});

test.describe('reduced motion (part 2)', () => {
  test.use({ reducedMotion: 'reduce' });
  test('slogan is static and How we work cards are visible without animating', async ({ page }) => {
    await open(page, '/en');
    await expect(page.locator('.slogan-static')).toBeVisible();
    await expect(page.locator('.slogan-static')).toHaveText('Generate. Store. Optimize. Sustain.');
    await expect(page.locator('.slogan-anim')).toBeHidden();
    await open(page, '/en/how-we-work');
    const opacities = await page.locator('.steps > li').evaluateAll((lis) => lis.map((li) => getComputedStyle(li).opacity));
    expect(opacities).toEqual(Array(8).fill('1'));
  });
});

test.describe('Our partners', () => {
  test('carousel: rounded tiles, keyboard-focusable list, previous/next scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 860 });
    await open(page, '/en');
    const section = page.locator('section.partners');
    await expect(section.locator('h2')).toHaveText('Our partners');
    const list = section.locator('.partners-list');
    await expect(list.locator('li')).toHaveCount(8);
    await expect(list.locator('li').first()).toContainText('Logo pending');
    const prev = section.locator('.partners-btn.prev');
    const next = section.locator('.partners-btn.next');
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => list.evaluate((el) => Math.abs(el.scrollLeft))).toBeGreaterThan(50);
    await expect(prev).toBeEnabled();
    const radius = await list.locator('li').first().evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(radius)).toBeGreaterThan(10);
    await expect(list).toHaveAttribute('tabindex', '0');
  });

  test('carousel scrolls the right way in Arabic', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 860 });
    await open(page, '/ar');
    const list = page.locator('.partners-list');
    await page.locator('.partners-btn.next').click();
    await expect.poll(() => list.evaluate((el) => Math.abs(el.scrollLeft))).toBeGreaterThan(50);
  });
});

test.describe('How we work', () => {
  test('cards animate in as they enter the viewport and end fully visible', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await open(page, '/en/how-we-work');
    const last = page.locator('.steps > li').last();
    expect(Number(await last.evaluate((li) => getComputedStyle(li).opacity))).toBeLessThan(1);
    await last.scrollIntoViewIfNeeded();
    await expect.poll(() => last.evaluate((li) => getComputedStyle(li).opacity)).toBe('1');
    await expect(page.locator('.steps > li')).toHaveCount(8);
    await expect(page.locator('main h2')).toHaveCount(8);
  });
});

test.describe('footer', () => {
  test('LLC name, new description, WhatsApp chat, no main menu', async ({ page }) => {
    await open(page, '/en');
    const footer = page.locator('footer');
    await expect(footer.locator('.footerBrandMark small')).toHaveText('Reservia Integrated Energy Solutions LLC');
    await expect(footer).toContainText('© 2026 Reservia Integrated Energy Solutions LLC');
    await expect(footer.locator('.footerBrand p')).toHaveText(/designs, finances, installs and maintains tailored energy solutions/);
    await expect(footer.locator('a.footerWa')).toHaveAccessibleName(/Chat with us on WhatsApp/);
    await expect(footer.locator('a[href="/en/residential"], a[href="/en/how-we-work"], a[href="/en/about"]')).toHaveCount(0);
    await expect(footer.locator('.footerCol')).toHaveCount(1);
  });
});
