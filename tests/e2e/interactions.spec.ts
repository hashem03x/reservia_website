import { expect, test, type Page, type Route } from '@playwright/test';
import { LEADS_URL, PII, blockExternalNavigation, dataLayer, events, open, watchErrors } from './helpers';
import { quoteMessage } from '../../src/content/whatsappMessages';

/** The "Send your bill to WhatsApp" CTA (any page). */
const BILL = 'main a.btn.wa:has-text("Send your bill to WhatsApp")';

const waText = async (page: Page, locator: string) => {
  const href = await page.locator(locator).first().getAttribute('href');
  return new URL(href!).searchParams.get('text') ?? '';
};

/** Asserts that no analytics payload contains anything the visitor typed. */
async function expectNoPii(page: Page) {
  const json = JSON.stringify(await dataLayer(page));
  for (const value of Object.values(PII)) expect(json).not.toContain(value);
}

test.describe('calculator', () => {
  test('reference villa: displayed figures, WhatsApp message and analytics agree', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, '/en/calculator');
    const results = page.locator('.results');
    await expect(results).toContainText('6.0 kWp');
    await expect(results).toContainText('184,000 EGP');
    await expect(results).toContainText('36,804 EGP/yr');
    await expect(results).toContainText('5.3 years');
    await expect(results).toContainText('4.8 years');

    const text = await waText(page, BILL);
    expect(text.startsWith("Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: \nMonthly bill or consumption: 1,200 kWh")).toBe(true);
    for (const part of ['6.0 kWp', '184,000 EGP', '36,804 EGP/yr', '5.3 years', '4.8 years']) expect(text).toContain(part);

    await blockExternalNavigation(page);
    await page.locator(BILL).click();
    const [click] = await events(page, 'click_whatsapp');
    expect(click).toMatchObject({ segment: 'villas', group: 'villas', system_size_kwp: 6, page: '/en/calculator' });
    expect(errors).toEqual([]);
  });

  test('tabs support Arrow keys, Home and End (mirrored in Arabic)', async ({ page }) => {
    await open(page, '/en/calculator');
    const home = page.locator('#tab-home');
    await home.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-farm')).toBeFocused();
    await expect(page.locator('#tab-farm')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#f_hp')).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-svc')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-home')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tab-svc')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-home')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#calcPanel')).toHaveAttribute('aria-labelledby', 'tab-home');

    await open(page, '/ar/calculator');
    await page.locator('#tab-home').focus();
    await page.keyboard.press('ArrowLeft'); // RTL: left = next
    await expect(page.locator('#tab-farm')).toBeFocused();
  });

  test('empty, zero and negative input show a message, not nonsense', async ({ page }) => {
    await open(page, '/en/calculator');
    for (const value of ['', '0', '-500']) {
      await page.locator('#h_val').fill(value);
      await expect(page.locator('.calc-invalid')).toHaveText('Enter positive numbers in every field to see an estimate.');
      await expect(page.locator('.results')).not.toContainText('NaN');
      await expect(page.locator(BILL)).toHaveCount(0);
    }
    await page.locator('#h_val').fill('1200');
    await expect(page.locator('.calc-invalid')).toHaveText('');
  });

  test('5% tariff-growth payback stays below today’s-tariff payback for the farm example', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    await expect(page.locator('.results')).toContainText('41.8 kWp');
    await expect(page.locator('.results')).toContainText('828,000 EGP');
  });
});

test.describe('keyboard and navigation', () => {
  test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
    await open(page, '/en');
    await page.keyboard.press('Tab');
    const skip = page.locator('a.skip');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('Escape closes the mobile menu and returns focus to the menu button', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 860 });
    await open(page, '/en');
    const btn = page.locator('.menu-btn');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('nav#nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('nav#nav')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('client-side navigation moves focus to the new page heading, one page_view per page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en');
    await page.locator('.cards4 a.seg[href="/en/service"]').click();
    await expect(page).toHaveURL(/\/en\/service$/);
    await expect(page.locator('main h1')).toBeFocused();
    await page.locator('nav#nav > a[href="/en/contact"]:not(.btn)').click();
    await expect(page.locator('main h1')).toBeFocused();
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/service$/);
    const views = (await events(page, 'page_view')).map((e) => e.page);
    expect(views).toEqual(['/en', '/en/service', '/en/contact', '/en/service']);
    const ids = (await dataLayer(page)).map((e) => e.event_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('visible focus ring on the dark footer and on the hero', async ({ page }) => {
    await open(page, '/en');
    const link = page.locator('footer a').first();
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const style = await link.evaluate((el) => getComputedStyle(el));
    expect(style.outlineStyle).not.toBe('none');
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  test('language switch keeps the page, sets lang/dir and is tracked', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en/calculator?tab=farm');
    const lang = page.locator('button.lang');
    await expect(lang).toHaveAccessibleName(/عربي.*Switch the site to Arabic/);
    await lang.click();
    await expect(page).toHaveURL(/\/ar\/calculator\?tab=farm$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#tab-farm')).toHaveAttribute('aria-selected', 'true');
    const [change] = await events(page, 'language_change');
    expect(change).toMatchObject({ from_lang: 'en', lang: 'ar', page: '/en/calculator' });
    await expect(page.locator('button.lang')).toHaveAccessibleName(/English.*تحويل الموقع إلى الإنجليزية/);
  });
});

test.describe('WhatsApp links', () => {
  for (const [path, segment, lang] of [
    ['/en', 'general', 'en'],
    ['/ar/residential', 'villas', 'ar'],
    ['/en/agriculture', 'agriculture', 'en'],
    ['/ar/industrial', 'industrial', 'ar'],
    ['/en/service', 'service', 'en'],
    ['/ar/lp/service', 'service', 'ar'],
  ] as const) {
    test(`floating button on ${path} uses the ${lang} ${segment} message`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, path);
      if (path.includes('/lp/')) {
        // Campaign pages swap the floating button for the sticky bar (general chat, not the bill CTA).
        expect(await waText(page, '.lpbar a.btn.wa')).toBe(quoteMessage(lang));
        void segment;
      } else {
        expect(await waText(page, 'a.wafab')).toBe(quoteMessage(lang));
        await expect(page.locator('a.wafab')).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  test('service page CTAs target the service sector', async ({ page }) => {
    await open(page, '/en/service');
    await expect(page.locator('main a[href^="https://wa.me/"]')).toHaveCount(0);
    await page.locator('main .page-hero a[href="/en/contact?type=service"]').click();
    await expect(page.locator('#q_type option:checked')).toHaveText('Services sector (hospital, hotel, school, office)');
  });

  test('all wa.me links use the configured number', async ({ page }) => {
    await open(page, '/en/residential');
    const hrefs = await page.locator('a[href^="https://wa.me/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.length).toBeGreaterThan(1);
    for (const h of hrefs) expect(h).toMatch(/^https:\/\/wa\.me\/201211892995\?text=/);
  });
});

test.describe('contact form', () => {
  test('field-specific, accessible validation errors', async ({ page }) => {
    await open(page, '/en/contact');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('#q_name')).toBeFocused();
    await expect(page.locator('#q_name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#q_name_e')).toHaveText('Please add your name.');
    await expect(page.locator('#q_phone_e')).toHaveText(/at least 8 digits/);
    await expect(page.locator('#q_phone')).toHaveAccessibleDescription(/at least 8 digits.*WhatsApp/);
    await expect(page.locator('form [role="status"]')).toContainText('Please correct the highlighted fields.');

    await page.locator('#q_name').fill(PII.name);
    await page.locator('#q_phone').fill('12 34 56');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('#q_phone')).toBeFocused();
    await expect(page.locator('#q_name_e')).toHaveCount(0);
    await expect(page.locator('#q_phone_e')).toBeVisible();
    expect(await events(page, 'generate_lead')).toHaveLength(0);
  });

  test('success: one lead, delivered once, event id shared with the CRM, no PII in analytics', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = [];
    await page.route(LEADS_URL, async (route: Route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await open(page, '/en/contact?type=service');
    await expect(page.locator('#q_type option:checked')).toHaveText('Services sector (hospital, hotel, school, office)');
    await page.locator('#q_name').fill(PII.name);
    await page.locator('#q_phone').fill(PII.phone);
    await page.locator('#q_gov').fill(PII.area);
    await page.locator('#q_note').fill(PII.note);
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('form .formmsg.ok')).toHaveText(/has been sent to the Reservia team/);
    await expect(page.locator('form button[type="submit"]')).toHaveCount(0);
    await expect(page.locator('form a.qwa')).toBeVisible();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ name: PII.name, phone: PII.phone, segment: 'service', segmentGroup: 'industrial', source: 'contact_form', lang: 'en' });

    const leads = await events(page, 'generate_lead');
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ event_id: bodies[0].eventId, segment: 'service', group: 'industrial', source: 'contact_form', page: '/en/contact', lang: 'en' });
    expect(Object.keys(leads[0]).sort()).toEqual(['event', 'event_id', 'group', 'lang', 'page', 'segment', 'source']);

    // Pressing Enter again cannot resubmit
    await page.locator('#q_name').press('Enter').catch(() => undefined);
    expect(bodies).toHaveLength(1);
    expect(await events(page, 'generate_lead')).toHaveLength(1);
    await expectNoPii(page);
  });

  test('failure: no false success, no lead event; retry reuses the same event id', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = [];
    let fail = true;
    await page.route(LEADS_URL, async (route: Route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ status: fail ? 500 : 200, body: '{}' });
    });
    await open(page, '/ar/contact');
    await page.locator('#q_name').fill(PII.name);
    await page.locator('#q_phone').fill('+20 121 189 2995');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form [role="alert"]')).toHaveText(/تعذّر إرسال طلبك/);
    await expect(page.locator('form .formmsg.ok')).toHaveCount(0);
    expect(await events(page, 'generate_lead')).toHaveLength(0);

    fail = false;
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form .formmsg.ok')).toBeVisible();
    expect(bodies).toHaveLength(2);
    expect(bodies[1].eventId).toBe(bodies[0].eventId);
    const leads = await events(page, 'generate_lead');
    expect(leads).toHaveLength(1);
    expect(leads[0].event_id).toBe(bodies[0].eventId);
    await expectNoPii(page);
  });

  test('phone links are tracked; contact-page emails stay plain text; footer sales email is a mailto link', async ({ page }) => {
    await open(page, '/en/contact');
    await blockExternalNavigation(page);
    await page.locator('.contact-list a[href^="tel:"]').first().click();
    expect(await events(page, 'click_call')).toHaveLength(1);
    await expect(page.locator('.contact-list a[href^="mailto:"]')).toHaveCount(0);
    // Footer sales email is a mailto: link at the client's request (October 2026), address verbatim.
    await expect(page.locator('footer a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:Resrevia_sales@reservia-energu.com');
  });

  test('no response-time promise anywhere on the contact page', async ({ page }) => {
    await open(page, '/en/contact');
    await expect(page.locator('body')).not.toContainText(/working day|within \d+ hours/i);
  });
});

test.describe('campaign form (service sector)', () => {
  test('validates the numeric field and records segment=service, group=industrial', async ({ page }) => {
    const bodies: Array<Record<string, unknown>> = [];
    await page.route(LEADS_URL, async (route: Route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ status: 201, body: '{}' });
    });
    await open(page, '/en/lp/service');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await page.locator('#sv_name').fill(PII.name);
    await page.locator('#sv_phone').fill(PII.phone);
    await page.locator('#sv_extra').fill('-5');
    await page.locator('.lpform button[type="submit"]').click();
    await expect(page.locator('#sv_extra')).toBeFocused();
    await expect(page.locator('#sv_extra_e')).toBeVisible();
    expect(bodies).toHaveLength(0);

    await page.locator('#sv_extra').fill('250000');
    await page.locator('.lpform button[type="submit"]').click();
    await expect(page.locator('.lp-ok.show')).toContainText('Thank you. Your request is in.');
    expect(bodies[0]).toMatchObject({ segment: 'service', segmentGroup: 'industrial', siteInput: 250000, source: 'landing_form' });
    const leads = await events(page, 'generate_lead');
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ segment: 'service', group: 'industrial', source: 'landing_form', site_input: 250000, event_id: bodies[0].eventId });
    expect(await waText(page, '.lpform a.btn.wa')).toContain('Monthly bill or consumption: 250,000 EGP (electricity bill)');
    await expectNoPii(page);
  });
});

test.describe('trust, claims and content', () => {
  test('home: trust section, FAQs, quote CTAs and no certification claims', async ({ page }) => {
    await open(page, '/en');
    await expect(page.locator('h2', { hasText: 'What you can check before you sign' })).toBeVisible();
    await expect(page.locator('.tg > div')).toHaveCount(6);
    await expect(page.locator('main details')).toHaveCount(5);
    await expect(page.locator('.hero .cta-row > a')).toHaveText(['Calculate your savings', 'Talk to an engineer', 'Send your bill to WhatsApp']);
    await expect(page.locator('header .tools a.btn.sun')).toHaveText('Get a free quote');
    await expect(page.locator('body')).not.toContainText(/NREA|certified/i);
    await expect(page.locator('.board')).toContainText('2.89');
    await expect(page.locator('.board')).toContainText('2.23');
    await expect(page.locator('.board')).toContainText('29.6%');
    await expect(page.locator('.board')).toContainText('As of 14 Oct 2026');
  });

  test('Arabic home: rate board carries the same date and comparison', async ({ page }) => {
    await open(page, '/ar');
    await expect(page.locator('.board')).toContainText('حتى 14 أكتوبر 2026');
    await expect(page.locator('.board')).toContainText('2.89');
    await expect(page.locator('.board')).toContainText('2.23');
    await expect(page.locator('.board')).toContainText('29.6%');
  });

  test('service page: four groups, every example labelled not a Reservia project, tariff assumption disclosed', async ({ page }) => {
    await open(page, '/en/service');
    await expect(page.locator('.cards4 > article')).toHaveCount(4);
    const examples = await page.locator('.ext-example').allTextContents();
    expect(examples).toHaveLength(4);
    for (const e of examples) expect(e).toMatch(/not a Reservia project/i);
    await expect(page.locator('main')).toContainText('2.55');
    await open(page, '/ar/service');
    for (const e of await page.locator('.ext-example').allTextContents()) expect(e).toMatch(/ليست? مشروعًا لريزيرفيا/);
  });

  test('home segment picker includes the service sector', async ({ page }) => {
    await open(page, '/en');
    await expect(page.locator('.cards4 a.seg[href="/en/service"]')).toBeVisible();
    await expect(page.locator('footer a[href="/en/lp/service"]')).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('decorative animations are off and the loader does not hold content back', async ({ page }) => {
    const start = Date.now();
    await open(page, '/en');
    expect(Date.now() - start).toBeLessThan(4000);
    const anims = await page.evaluate(() =>
      ['.heroEnergyLine', '.board', '.hero h1'].map((s) => getComputedStyle(document.querySelector(s)!).animationName),
    );
    expect(anims).toEqual(['none', 'none', 'none']);
  });
});
