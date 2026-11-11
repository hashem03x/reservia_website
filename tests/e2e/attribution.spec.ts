import { expect, test, type Page, type Route } from '@playwright/test';
import { LEADS_URL, PII, open, watchErrors } from './helpers';

// CRM launch blocker C1 - attribution survives the real browser journey on the production build:
// campaign landing -> internal navigation -> language switch -> contact page -> quote submission.
// The lead request is intercepted (nothing leaves the machine) and its attribution payload checked.

async function submitContact(page: Page) {
  const bodies: Array<Record<string, any>> = [];
  await page.route(LEADS_URL, async (route: Route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"refCode":"RSV-1211-0001"}}' });
  });
  await page.locator('#q_name').fill(PII.name);
  await page.locator('#q_phone').fill(PII.phone);
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('form .formmsg.ok')).toBeVisible();
  expect(bodies).toHaveLength(1);
  return bodies[0];
}

async function clickInternal(page: Page, href: string) {
  await page.locator(`a[href="${href}"]:visible`).first().click();
  await expect(page).toHaveURL(new RegExp(`${href.replace(/[?]/g, '\\?')}$`));
  await expect(page.locator('main h1').first()).toBeVisible();
}

test('Google Ads: /en/farms?utm... -> another page -> Arabic -> back -> contact keeps google / cpc / test and landing /en/farms', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, '/en/farms?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=TeSt-GCLID');
  // the alias shows the real farm page, not the 404 page
  await expect(page.locator('main h1').first()).not.toHaveText(/not found/i);

  await clickInternal(page, '/en/calculator'); // internal navigation (client-side, no full reload)
  await page.goto('/ar/calculator'); // language switch = a different URL with no campaign params
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goto('/en/contact');
  await expect(page.locator('#q_name')).toBeVisible();

  const body = await submitContact(page);
  expect(body.pageUrl).toBe('/en/farms');
  expect(body.utm).toMatchObject({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'test', gclid: 'TeSt-GCLID' });
  expect(body.attribution.first).toMatchObject({ landingPage: '/en/farms', params: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'test', gclid: 'TeSt-GCLID' } });
  expect(body.attribution.last.params.utm_campaign).toBe('test');
  expect(body.submittedFrom).toBe('/en/contact');
  expect(errors).toEqual([]);
});

test('Facebook and TikTok campaigns: first touch kept, a later campaign becomes the last touch', async ({ page }) => {
  await open(page, '/en/agriculture?utm_source=facebook&utm_medium=paid_social&utm_campaign=farms-fb&fbclid=IwAR-e2e');
  await clickInternal(page, '/en/contact');
  await page.goto('/en/residential?utm_source=tiktok&utm_medium=paid&utm_campaign=villas-tt&ttclid=E.C.P.e2e');
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goto('/en/contact');
  const body = await submitContact(page);
  expect(body.attribution.first).toMatchObject({ landingPage: '/en/agriculture', params: { utm_source: 'facebook', fbclid: 'IwAR-e2e' } });
  expect(body.attribution.last).toMatchObject({ landingPage: '/en/residential', params: { utm_source: 'tiktok', ttclid: 'E.C.P.e2e' } });
});

test('direct visit: no campaign, no referrer - never invents a source; the cookie mirror is first-party', async ({ page, context }) => {
  await open(page, '/en');
  await page.goto('/en/contact');
  const body = await submitContact(page);
  expect(body.attribution.first.params).toEqual({});
  expect(body.attribution.first.landingPage).toBe('/en');
  expect(body.attribution.first.referrer).toBeUndefined();
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'rsv_attr')?.sameSite).toBe('Lax');
});
