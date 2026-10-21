import { expect, type Page } from '@playwright/test';

export const LEADS_URL = 'https://leads.e2e.invalid/api/leads';

/** Strings that must never appear in analytics payloads. */
export const PII = {
  name: 'Mona E2E Hassan',
  phone: '01211892995',
  area: 'Street 9 Maadi E2E',
  note: 'secret note e2e',
};

/** Collects uncaught page errors and console errors for the lifetime of the page. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

/** Applies a theme before any script runs (same storage key the app uses). */
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('rsv_theme', t);
    } catch {
      /* ignore */
    }
  }, theme);
}

/** Navigates and waits until the page is usable: h1 rendered and the boot loader gone. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('.appLoader')).toHaveCount(0, { timeout: 5000 });
}

export async function dataLayer(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => (window.dataLayer ?? []).filter((e) => typeof e === 'object' && e && 'event' in e) as Array<Record<string, unknown>>);
}

export async function events(page: Page, name: string) {
  return (await dataLayer(page)).filter((e) => e.event === name);
}

/** Stops tel:/mailto:/wa.me navigations so click handlers can be tested in place. */
export async function blockExternalNavigation(page: Page) {
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (e) => {
        const a = (e.target as Element).closest('a');
        if (a && /^(tel:|mailto:|https:\/\/wa\.me)/.test(a.getAttribute('href') ?? '')) e.preventDefault();
      },
      true,
    );
  });
}
