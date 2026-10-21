import { expect, test } from '@playwright/test';
import { events, open } from '../e2e/helpers';

/** The site as it ships before a lead endpoint and domain are configured. */
test.describe('preview mode (no lead endpoint, no domain)', () => {
  test('contact form says nothing was sent and fires no lead event', async ({ page }) => {
    await open(page, '/en/contact');
    await expect(page.locator('footer')).toContainText('Forms log locally');
    await page.locator('#q_name').fill('Preview Person');
    await page.locator('#q_phone').fill('01211892995');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form .formmsg.warn')).toContainText('nothing was sent');
    await expect(page.locator('form .formmsg.ok')).toHaveCount(0);
    await expect(page.locator('form a.qwa')).toBeVisible();
    expect(await events(page, 'generate_lead')).toHaveLength(0);
  });

  test('campaign form shows the preview notice, not "Your request is in"', async ({ page }) => {
    await open(page, '/ar/lp/villas');
    await page.locator('.lpform input[name=name]').fill('Preview Person');
    await page.locator('.lpform input[name=phone]').fill('01211892995');
    await page.locator('.lpform button[type="submit"]').click();
    await expect(page.locator('.lp-ok.warn')).toContainText('وضع المعاينة: لم يُرسل طلبك.');
    await expect(page.locator('.lp-ok:not(.warn)')).toHaveCount(0);
    expect(await events(page, 'generate_lead')).toHaveLength(0);
  });

  test('static HTML per route has its own head and no guessed canonical URL', async ({ request }) => {
    const ar = await (await request.get('/ar/service')).text();
    expect(ar).toContain('<html lang="ar" dir="rtl">');
    expect(ar).toContain('<title>طاقة شمسية للمستشفيات والفنادق والمدارس في مصر | ريزيرفيا</title>');
    expect(ar).not.toContain('rel="canonical"');
    expect(ar).not.toMatch(/"telephone"|"email"/);
    const lp = await (await request.get('/en/lp/service')).text();
    expect(lp).toContain('content="noindex, follow"');
    // No sitemap is generated without a domain (the server answers with the SPA fallback instead).
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('<urlset');
  });
});
