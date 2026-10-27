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
  for (const width of [1280, 1000, 400, 360]) {
    test(`larger logo and wordmark fit on one row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/en');
      const logo = await page.locator('header .brand > img').boundingBox();
      expect(logo!.width).toBe(width <= 480 ? 50 : 60);
      // Official wordmark image (battery "i", round "a"), undistorted and not clipped.
      const wm = page.locator('header .brand .wm-light');
      await expect(wm).toBeVisible();
      await expect(page.locator('header .brand .wm-dark')).toBeHidden();
      const box = (await wm.boundingBox())!;
      expect(box.height).toBe(width <= 380 ? 20 : width <= 420 ? 26 : width <= 480 ? 30 : 38);
      expect(box.width / box.height).toBeCloseTo(539 / 96, 1);
      expect(await wm.evaluate((el) => el.parentElement!.parentElement!.scrollWidth <= el.parentElement!.parentElement!.clientWidth + 1)).toBe(true);
      const header = await page.locator('header.top').boundingBox();
      expect(header!.height).toBeLessThanOrEqual(90);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('dark mode shows the light wordmark variant', async ({ page }) => {
    await setTheme(page, 'dark');
    await open(page, '/en');
    await expect(page.locator('header .brand .wm-dark')).toBeVisible();
    await expect(page.locator('header .brand .wm-light')).toBeHidden();
    await expect(page.getByRole('link', { name: /^Reservia Integrated Energy Solutions/ })).toBeVisible();
  });

  for (const [width, minOffset] of [[1440, 80], [1280, 40], [1000, 4]] as const) {
    test(`rate board sits further towards the outer edge without clipping at ${width}px, mirrored in Arabic`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of ['en', 'ar']) {
        await open(page, `/${lang}`);
        const board = page.locator('.hero-grid > .board');
        const offset = parseFloat(await css(page, '.hero-grid > .board', lang === 'en' ? 'left' : 'right'));
        expect(offset).toBeGreaterThanOrEqual(minOffset);
        expect(offset).toBeGreaterThan(width >= 1280 ? 20 : 0); // further than the previous 20px on desktop
        const b = (await board.boundingBox())!;
        const vw = await page.evaluate(() => document.documentElement.clientWidth);
        const gap = lang === 'en' ? vw - (b.x + b.width) : b.x;
        expect(gap).toBeGreaterThanOrEqual(width >= 1280 ? 12 : 8); // never touches or crosses the viewport edge
        const copy = (await page.locator('.hero-grid > div').first().boundingBox())!;
        expect(lang === 'en' ? b.x >= copy.x + copy.width : b.x + b.width <= copy.x).toBe(true); // no overlap with the copy
      }
    });
  }

  test('rate board stacks normally on tablet and mobile', async ({ page }) => {
    for (const width of [768, 400]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/en');
      expect(await css(page, '.hero-grid > .board', 'position')).toBe('static');
    }
  });

  test('homepage hero uses the company-profile pyramids cover, mirrored in Arabic', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en');
    expect(await css(page, '.hero-bg', 'background-image')).toMatch(/hero-pyramids-1920.*\.webp/);
    await page.setViewportSize({ width: 400, height: 900 });
    expect(await css(page, '.hero-bg', 'background-image')).toMatch(/hero-pyramids-960.*\.webp/);
    await open(page, '/ar');
    expect(await css(page, '.hero-bg', 'transform')).toBe('matrix(-1, 0, 0, 1, 0, 0)');
    await expect(page.locator('.hero h1')).toBeVisible();
  });
});

test.describe('About page', () => {
  test('approved company description, larger and all bold; old banner gone; no MD name, no sources list', async ({ page }) => {
    await open(page, '/en/about');
    const copy = page.locator('.page-hero .about-copy p');
    await expect(copy).toHaveText([
      'Reservia is an integrated energy partner helping Egyptian homes, farms, industrial facilities and the services sector ensure business continuity and reduce electricity costs through tailored engineered solar systems, intelligent energy management and flexible financing.',
      'We design, install and maintain energy solutions for clean, safe, reliable and sustainable power.',
    ]);
    for (const p of await copy.all()) {
      expect(Number(await p.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
      expect(parseFloat(await p.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(18);
    }
    // Only the description is bold, not the rest of the page.
    expect(Number(await css(page, '.about-copy-secondary p', 'font-weight'))).toBe(400);
    await expect(page.locator('main img.brandband, main img[src*="about-banner"]')).toHaveCount(0);
    await expect(page.locator('section.slides')).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/Managing Director|Fattah|Sources for figures/);
    await expect(page.locator('ol.sources')).toHaveCount(0);
    await open(page, '/ar/about');
    await expect(page.locator('main')).not.toContainText(/العضو المنتدب|عبد الفتاح|مصادر الأرقام/);
    const arCopy = page.locator('.page-hero .about-copy p');
    await expect(arCopy).toHaveCount(2);
    expect(Number(await arCopy.last().evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
    expect(await arCopy.last().evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
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

  test('slideshow advances every ~5 s, loops, pauses on hover and on Pause', async ({ page }) => {
    await page.clock.install();
    await open(page, '/en/about');
    const section = page.locator('section.slides');
    await section.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const dots = section.locator('.slides-dot');
    // Smooth scrolling runs in real time while the fake clock jumps; wait until the track rests on slide i.
    const settle = (i: number) =>
      expect
        .poll(() => section.locator('.slides-track').evaluate((el, n) => Math.abs(Math.abs(el.scrollLeft) - n * el.clientWidth) < 2, i))
        .toBe(true);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await page.clock.fastForward(4000);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true'); // not before ~5 s
    await page.clock.fastForward(1200);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    // Live region stays quiet while autoplay runs.
    await expect(section.locator('[role=status]')).toHaveAttribute('aria-live', 'off');

    // Manual navigation restarts the countdown instead of being overridden.
    await dots.nth(5).click();
    await page.mouse.move(0, 0);
    await settle(5);
    await page.clock.fastForward(3000);
    await expect(dots.nth(5)).toHaveAttribute('aria-current', 'true');
    await page.clock.fastForward(2200);
    await expect(dots.nth(6)).toHaveAttribute('aria-current', 'true');

    // Loops from the last slide back to the first.
    await expect(dots.nth(6)).toHaveAttribute('aria-current', 'true');
    await settle(6);
    await dots.last().click();
    await page.mouse.move(0, 0);
    await settle(14);
    await page.clock.fastForward(5200);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');

    await settle(0);
    // Hovering pauses.
    await section.locator('.slides-track').hover();
    await page.clock.fastForward(11000);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');

    // Pause button stops it; Play resumes.
    await section.getByRole('button', { name: 'Pause slideshow' }).click();
    await page.mouse.move(0, 0);
    await page.clock.fastForward(11000);
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await section.getByRole('button', { name: 'Play slideshow' }).click();
    await page.mouse.move(0, 0);
    await page.clock.fastForward(5200);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  });

  test('slideshow does not autoplay with prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await open(page, '/ar/about');
    const section = page.locator('section.slides');
    await section.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(section.getByRole('button', { name: 'تشغيل العرض التلقائي للشرائح' })).toBeVisible();
    await page.clock.fastForward(11000);
    await expect(section.locator('.slides-dot').first()).toHaveAttribute('aria-current', 'true');
    await expect(section.locator('[role=status]')).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('footer contacts and CTAs', () => {
  test('sales and business emails (mailto), mobile and landline (tel)', async ({ page }) => {
    await open(page, '/en');
    const list = page.locator('footer .footerContacts');
    await expect(list.locator('a[href="mailto:Reservia_Sales@reservia-energy.com"]')).toHaveText('Reservia_Sales@reservia-energy.com');
    await expect(list.locator('a[href="mailto:Business_info@reservia-energy.com"]')).toHaveText('Business_info@reservia-energy.com');
    await expect(list.locator('li small')).toContainText(['Sales email', 'Business email', 'Mobile', 'Landline']);
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
      await page.getByRole('radio', { name: 'Monthly bill (EGP)' }).check();
      await page.getByLabel('Monthly electricity cost (EGP)').fill('25500'); // 10,000 kWh x 2.55
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

test.describe('calculator: EGP / kWh as segmented tabs', () => {
  for (const width of [1280, 400]) {
    test(`visible tabs instead of a dropdown in Residential, Industrial and Services (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const tab of ['home', 'ind', 'svc']) {
        await open(page, `/en/calculator?tab=${tab}`);
        await expect(page.locator('#calcPanel select:has(option[value="egp"]), #calcPanel select:has(option[value="kwh"])')).toHaveCount(0);
        const tabs = page.locator('#calcPanel fieldset.seg-tabs');
        await expect(tabs).toHaveCount(1);
        await expect(tabs.locator('label.choice')).toHaveText(['Monthly bill (EGP)', 'Consumption (kWh)']);
        for (const l of await tabs.locator('label.choice').all()) await expect(l).toBeVisible();
        // Active tab filled like the category tabs; inactive one plain.
        const active = tabs.locator('label.choice:has(input:checked)');
        await expect(active).toHaveCount(1);
        const tabBg = await css(page, '.tabs .tab[aria-selected="true"]', 'background-color');
        expect(await active.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(tabBg);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      }
    });
  }

  test('Residential: switching tabs swaps the input and keeps the estimate consistent', async ({ page }) => {
    await open(page, '/en/calculator');
    await expect(page.getByRole('radio', { name: 'Consumption (kWh)' })).toBeChecked();
    await expect(page.locator('.results')).toContainText('6.0 kWp');
    await page.getByRole('radio', { name: 'Monthly bill (EGP)' }).check();
    await expect(page.getByRole('radio', { name: 'Monthly bill (EGP)' })).toBeChecked();
    await expect(page.locator('.results')).toContainText('6.0 kWp'); // same home, now entered as its bill
    await page.keyboard.press('ArrowRight'); // native radio group: arrow keys switch tabs
    await expect(page.getByRole('radio', { name: 'Consumption (kWh)' })).toBeChecked();
    await expect(page.locator('#h_val')).toHaveValue('1200');
  });

  test('no EGP / kWh tabs for farms or off-grid diesel inputs', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    await expect(page.locator('#calcPanel fieldset.seg-tabs')).toHaveCount(0);
    await open(page, '/en/calculator?tab=ind');
    await page.getByRole('radio', { name: 'Off-grid (diesel generators)' }).check();
    await expect(page.locator('#calcPanel fieldset.seg-tabs')).toHaveCount(0);
  });
});

test.describe('WhatsApp quote message', () => {
  const INTRO = "Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: \nMonthly bill or consumption: ";
  const bill = 'main a.btn.wa:has-text("Send your bill to WhatsApp")';
  // Farms / Industrial / Services have no in-page bill button (client rule: Residential only); the
  // floating WhatsApp button carries the figure there.
  const fab = 'a.wafab';

  test('Residential: kWh and EGP figures with their units', async ({ page }) => {
    await open(page, '/en/calculator');
    const href = (await page.locator(bill).first().getAttribute('href'))!;
    expect(href).toMatch(/^https:\/\/wa\.me\/201211892995\?text=Hello%20Reservia%2C%20I'd%20like%20a%20solar%20quote%20\(Please%20attach%20Electricity%20bill\)\.%0A%0ALocation%3A%20%0AMonthly/);
    expect((await waText(page, bill)).startsWith(`${INTRO}1,200 kWh`)).toBe(true);
    await page.getByRole('radio', { name: 'Monthly bill (EGP)' }).check();
    expect(await waText(page, bill)).toMatch(/Monthly bill or consumption: [\d,]+ EGP \(electricity bill\)/);
    await expect.poll(() => waText(page, fab)).toMatch(/^Hello Reservia, I'd like a solar quote \(Please attach Electricity bill\)\.\n\nLocation: \nMonthly bill or consumption: [\d,]+ EGP \(electricity bill\)$/);
  });

  test('Agricultural Farms: diesel litres and EGP labelled as diesel', async ({ page }) => {
    await open(page, '/en/calculator?tab=farm');
    const mode = page.getByRole('group', { name: 'Diesel use', exact: true });
    await mode.getByRole('radio', { name: 'Litres per month' }).check();
    await expect.poll(() => waText(page, fab)).toBe(`${INTRO}1,800 litres of diesel`);
    await mode.getByRole('radio', { name: 'EGP per month' }).check();
    await expect.poll(() => waText(page, fab)).toBe(`${INTRO}36,900 EGP spent on diesel`);
  });

  for (const tab of ['ind', 'svc'] as const) {
    test(`${tab === 'ind' ? 'Industrial Facilities' : 'Services Sector'}: bill, kWh and diesel figures`, async ({ page }) => {
      await open(page, `/en/calculator?tab=${tab}`);
      await expect.poll(() => waText(page, fab)).toBe(`${INTRO}150,000 EGP (electricity bill)`);
      await page.getByRole('radio', { name: 'Consumption (kWh)' }).check();
      await expect.poll(() => waText(page, fab)).toBe(`${INTRO}58,800 kWh`);
      await page.getByRole('radio', { name: 'Off-grid (diesel generators)' }).check();
      await expect.poll(() => waText(page, fab)).toBe(`${INTRO}30,000 litres of diesel`);
      await page.getByRole('radio', { name: 'EGP per month' }).check();
      await expect.poll(() => waText(page, fab)).toBe(`${INTRO}615,000 EGP spent on diesel`);
    });
  }

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

test.describe('page-level WhatsApp buttons use what the visitor entered', () => {
  const BLANK = "Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: \nMonthly bill or consumption: ";

  test('contact page location reaches the floating button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en/contact');
    await page.locator('#q_gov').fill('Giza');
    await expect.poll(() => waText(page, 'a.wafab')).toBe("Hello Reservia, I'd like a solar quote (Please attach Electricity bill).\n\nLocation: Giza\nMonthly bill or consumption: ");
  });

  test('a calculator figure does not follow the visitor to another page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/en/calculator?tab=ind');
    await expect.poll(() => waText(page, 'a.wafab')).toBe(`${BLANK}150,000 EGP (electricity bill)`);
    await page.locator('header .brand').click();
    await expect(page).toHaveURL(/\/en$/);
    await expect.poll(() => waText(page, 'a.wafab')).toBe(BLANK);
  });

  test('Arabic pages keep the Arabic version of the approved message', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, '/ar/calculator?tab=svc');
    await expect.poll(() => waText(page, 'a.wafab')).toMatch(/^مرحبًا ريزيرفيا، أريد عرض سعر للطاقة الشمسية \(يُرجى إرفاق فاتورة الكهرباء\)\.\n\nالموقع: \nالفاتورة أو الاستهلاك الشهري: 150,000 /);
  });
});
