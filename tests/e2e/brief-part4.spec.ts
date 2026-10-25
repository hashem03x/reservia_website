import { expect, test, type Page, type Route } from '@playwright/test';
import { LEADS_URL, open, setTheme } from './helpers';

/** Client brief, October 2026 part 4: brand colours, header, About, footer contacts/CTAs, calculator inputs, WhatsApp message. */

const waText = async (page: Page, selector: string) => new URL((await page.locator(selector).first().getAttribute('href'))!).searchParams.get('text') ?? '';
const css = (page: Page, selector: string, prop: string) => page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('company-profile colours', () => {
  test('light theme: green CTA, deep emerald hero and footer, mint surfaces', async ({ page }) => {
    await open(page, '/en');
    expect(await css(page, '.hero .btn.sun', 'background-color')).toBe('rgb(124, 179, 66)'); // #7CB342
    expect(await css(page, 'section.hero', 'background-color')).toBe('rgb(10, 61, 48)'); // #0A3D30
    expect(await css(page, 'footer', 'background-color')).toBe('rgb(10, 61, 48)');
    expect(await css(page, 'body', 'background-color')).toBe('rgb(243, 249, 245)');
  });

  test('dark theme stays green and readable', async ({ page }) => {
    await setTheme(page, 'dark');
    await open(page, '/en');
    expect(await css(page, '.hero .btn.sun', 'background-color')).toBe('rgb(156, 204, 101)'); // #9CCC65
    expect(await css(page, 'body', 'background-color')).toBe('rgb(11, 26, 20)');
  });
});

test.describe('header branding and rate board', () => {
  for (const width of [1280, 1000, 400]) {
    test(`larger logo and wordmark fit on one row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/en');
      const logo = await page.locator('header .brand img').boundingBox();
      expect(logo!.width).toBe(width <= 480 ? 44 : 52);
      const header = await page.locator('header.top').boundingBox();
      expect(header!.height).toBeLessThanOrEqual(90);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('rate board sits slightly towards the outer edge on desktop, mirrored in Arabic', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en');
    expect(await css(page, '.hero-grid > .board', 'left')).toBe('20px');
    await open(page, '/ar');
    expect(await css(page, '.hero-grid > .board', 'right')).toBe('20px');
    await page.setViewportSize({ width: 400, height: 900 });
    await open(page, '/en');
    expect(await css(page, '.hero-grid > .board', 'position')).toBe('static');
  });
});

test.describe('About page', () => {
  test('new company description, larger text, no MD name, no sources list', async ({ page }) => {
    await open(page, '/en/about');
    const copy = page.locator('.page-hero .about-copy p');
    await expect(copy).toHaveText([
      /^Reservia is an integrated energy partner helping Egyptian homes, farms, industrial facilities and the services sector/,
      'We design, install, maintain and facilitate financing for tailored energy solutions that deliver cost-efficient, reliable and sustainable power.',
    ]);
    expect(parseFloat(await css(page, '.page-hero .about-copy p', 'font-size'))).toBeGreaterThanOrEqual(18);
    await expect(page.locator('main')).not.toContainText(/Managing Director|Fattah|Sources for figures/);
    await expect(page.locator('ol.sources')).toHaveCount(0);
    await open(page, '/ar/about');
    await expect(page.locator('main')).not.toContainText(/العضو المنتدب|عبد الفتاح|مصادر الأرقام/);
  });

  test('figures elsewhere carry no visible source citations', async ({ page }) => {
    for (const path of ['/en/agriculture', '/en/service', '/en/industrial', '/en', '/ar/solar-irrigation-guide']) {
      await open(page, path);
      await expect(page.locator('main')).not.toContainText(/\((IFC|UICC|Afrik21|Egypt Independent|UNDP Egypt|Zawya)[,\s][^)]+\)|Sources on the About page|SolarQuarter/);
    }
  });

  test('profile slide carousel: controls, indicators and keyboard (runs once slide images are added)', async ({ page }) => {
    await open(page, '/en/about');
    const section = page.locator('section.slides');
    test.skip((await section.count()) === 0, 'Slide images not in src/assets/profile/ yet -- carousel intentionally hidden');
    const dots = section.locator('.slides-dot');
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await section.locator('.partners-btn.next').click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await section.locator('.slides-track').press('End');
    await expect(dots.last()).toHaveAttribute('aria-current', 'true');
    const ratio = await section.locator('.slide').first().evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
    expect(ratio).toBeCloseTo(16 / 9, 1);
  });
});

test.describe('footer contacts and CTAs', () => {
  test('sales email (mailto, verbatim), mobile and landline (tel)', async ({ page }) => {
    await open(page, '/en');
    const list = page.locator('footer .footerContacts');
    await expect(list.locator('a[href="mailto:Resrevia_sales@reservia-energy.com"]')).toHaveText('Resrevia_sales@reservia-energy.com');
    await expect(list.locator('a[href="tel:+201211892995"]')).toHaveText('+201211892995');
    await expect(list.locator('a[href="tel:+20225222814"]')).toHaveText('+20 2 2522 2814');
  });

  for (const width of [1280, 400]) {
    test(`"Get a free quote" matches the WhatsApp CTA's typography at ${width}px, with its own destination`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/en');
      const quote = page.locator('footer a.footerCta.sun');
      const wa = page.locator('footer a.footerCta.wa');
      await expect(quote).toHaveText('Get a free quote');
      await expect(quote).toHaveAttribute('href', '/en/contact');
      await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\//);
      const props = ['font-family', 'font-size', 'font-weight', 'text-transform', 'padding-top', 'padding-left', 'border-top-left-radius', 'line-height', 'min-height'];
      const style = (loc: typeof quote) => loc.evaluate((el, ps) => ps.map((p) => getComputedStyle(el).getPropertyValue(p)), props);
      expect(await style(quote)).toEqual(await style(wa));
      expect((await quote.boundingBox())!.height).toBeCloseTo((await wa.boundingBox())!.height, 0);
    });
  }
});

test.describe('calculator: new inputs', () => {
  test('Residential & Commercial: share slider at the bottom changes the estimate', async ({ page }) => {
    await open(page, '/en/calculator');
    const panelFields = page.locator('#calcPanel .field');
    await expect(panelFields.last()).toHaveClass(/share-field/);
    const slider = page.getByLabel('Share to supply from solar');
    await expect(slider).toHaveValue('75'); // recommended share for the reference villa (72.9% -> nearest 5%)
    await expect(page.locator('.results')).toContainText('6.0 kWp');
    await slider.fill('50');
    await expect(page.locator('.results')).toContainText('4.0 kWp');
    await expect(page.locator('#h_share_h')).toContainText('50%');
    await slider.fill('100');
    await expect(page.locator('.results')).toContainText('8.0 kWp');
    await page.getByRole('button', { name: 'Use the recommended share' }).click();
    await expect(page.locator('.results')).toContainText('6.0 kWp');
    await slider.focus();
    await page.keyboard.press('ArrowLeft'); // keyboard operable
    await expect(slider).toHaveValue('70');
  });

  test('Agricultural Farms: diesel as litres or EGP (one at a time), validated', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    const mode = page.getByRole('group', { name: 'Diesel use', exact: true });
    await mode.getByRole('radio', { name: 'Litres per month' }).check();
    await expect(page.locator('#f_hrs')).toHaveCount(0);
    await page.getByLabel('Monthly diesel consumption (litres)').fill('1800');
    await expect(page.locator('.results')).toContainText('21,600 litres/yr');
    const litresSaving = await page.locator('.results .hl dd').first().textContent();
    await mode.getByRole('radio', { name: 'EGP per month' }).check();
    await expect(page.getByLabel('Monthly diesel consumption (litres)')).toHaveCount(0);
    await page.getByLabel('Monthly diesel spend (EGP)').fill('36900');
    await expect(page.locator('.results .hl dd').first()).toHaveText(litresSaving!); // same diesel either way
    await page.getByLabel('Monthly diesel spend (EGP)').fill('-5');
    await expect(page.locator('.calc-invalid')).not.toHaveText('');
    await mode.getByRole('radio', { name: 'Litres per month' }).check();
    await expect(page.getByLabel('Monthly diesel consumption (litres)')).toHaveValue('1800'); // value kept
  });

  for (const tab of ['ind', 'svc'] as const) {
    test(`${tab === 'ind' ? 'Industrial Facilities' : 'Services Sector'}: on-grid bill/kWh and off-grid litres/EGP`, async ({ page }) => {
      await open(page, `/en/calculator?tab=${tab}`);
      await expect(page.getByRole('radio', { name: 'On-grid' })).toBeChecked();
      await page.getByRole('radio', { name: 'Consumption (kWh)' }).check();
      await expect(page.getByLabel('Monthly electricity cost (EGP)')).toHaveCount(0);
      await page.getByLabel('Monthly electricity consumption (kWh)').fill('10000');
      const kwhSaving = await page.locator('.results .hl dd').first().textContent();
      await page.getByRole('radio', { name: 'Bill (EGP)' }).check();
      await page.getByLabel('Monthly electricity cost (EGP)').fill(tab === 'ind' ? '25500' : '25500'); // 10,000 kWh x 2.55
      await expect(page.locator('.results .hl dd').first()).toHaveText(kwhSaving!);
      await page.getByRole('radio', { name: 'Consumption (kWh)' }).check();
      await expect(page.getByLabel('Monthly electricity consumption (kWh)')).toHaveValue('10000');
      await page.getByRole('radio', { name: 'Off-grid (diesel generators)' }).check();
      await expect(page.getByLabel('Monthly electricity consumption (kWh)')).toHaveCount(0);
      await page.getByRole('radio', { name: 'EGP per month' }).check();
      await page.getByLabel('Monthly diesel spend (EGP)').fill('61500');
      await expect(page.locator('.results')).toContainText('litres/yr');
      await page.getByLabel('Monthly diesel spend (EGP)').fill('');
      await expect(page.locator('.calc-invalid')).not.toHaveText('');
    });
  }
});

test.describe('WhatsApp quote message', () => {
  test('calculator: attach-bill wording, blank location, monthly value with its unit', async ({ page }) => {
    await open(page, '/en/calculator');
    const bill = 'main a.btn.wa:has-text("Send your bill to WhatsApp")';
    let text = await waText(page, bill);
    expect(text.startsWith("Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: \nMonthly bill or consumption: 1,200 kWh")).toBe(true);
    await page.locator('#h_unit').selectOption('egp');
    text = await waText(page, bill);
    expect(text).toMatch(/Monthly bill or consumption: [\d,]+ EGP \(electricity bill\)/);
  });

  test('campaign forms fill location and the monthly figure; diesel is labelled as diesel', async ({ page }) => {
    await page.route(LEADS_URL, (route: Route) => route.fulfill({ status: 200, body: '{}' }));
    await open(page, '/en/lp/villas');
    await page.locator('.lpform input[name=name]').fill('Wa Person');
    await page.locator('.lpform input[name=phone]').fill('01211892995');
    await page.locator('.lpform input[name=gov]').fill('Cairo, Egypt');
    await page.locator('.lpform input[name=extra]').fill('5000');
    await page.locator('.lpform button[type=submit]').click();
    await expect(page.locator('.lp-ok.show')).toBeVisible();
    expect(await waText(page, '.lpform a.btn.wa')).toBe(
      "Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: Cairo, Egypt\nMonthly bill or consumption: 5,000 EGP (electricity bill)",
    );

    await open(page, '/en/lp/industrial');
    await page.locator('.lpform input[name=name]').fill('Wa Person');
    await page.locator('.lpform input[name=phone]').fill('01211892995');
    await page.locator('.lpform input[name=extra]').fill('3000');
    await page.locator('.lpform button[type=submit]').click();
    await expect(page.locator('.lp-ok.show')).toBeVisible();
    const diesel = await waText(page, '.lpform a.btn.wa');
    expect(diesel).toContain('Monthly bill or consumption: 3,000 litres of diesel');
    expect(diesel).toContain('Location: \n');
  });
});
