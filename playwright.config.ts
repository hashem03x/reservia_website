import { defineConfig } from '@playwright/test';

/**
 * Browser regression suite. Two production builds are served by
 * `vite preview`, each with TEST-ONLY configuration:
 *
 *  - "site" (tests/e2e, dist-e2e, port 4179): VITE_LEADS_API_URL points at
 *    a fake host that every test intercepts with page.route(), so lead
 *    delivery success/failure can be exercised without a real CRM
 *    (nothing leaves the machine); VITE_SITE_URL is a placeholder domain
 *    so canonical/hreflang output can be checked; VITE_PARTNERS_PREVIEW
 *    shows the partners carousel with labelled placeholder tiles.
 *  - "preview-mode" (tests/e2e-preview, dist-e2e-preview, port 4180): no
 *    lead endpoint and no domain -- the state the site ships in until the
 *    client decisions are made. Verifies forms never claim delivery.
 *
 * Neither build touches dist/. Uses the locally installed Google Chrome
 * (channel: 'chrome'); set PW_CHANNEL=chromium to use Playwright's bundled
 * Chromium instead (after `npx playwright install chromium`).
 */
const SITE_PORT = 4179;
const PREVIEW_PORT = 4180;
const channel = process.env.PW_CHANNEL === 'chromium' ? undefined : 'chrome';

export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: { channel, trace: 'retain-on-failure' },
  projects: [
    { name: 'site', testDir: 'tests/e2e', use: { baseURL: `http://localhost:${SITE_PORT}` } },
    { name: 'preview-mode', testDir: 'tests/e2e-preview', use: { baseURL: `http://localhost:${PREVIEW_PORT}` } },
  ],
  webServer: [
    {
      command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${SITE_PORT} --strictPort`,
      url: `http://localhost:${SITE_PORT}/en`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        VITE_LEADS_API_URL: 'https://leads.e2e.invalid/api/leads',
        VITE_SITE_URL: 'https://www.example-e2e.test',
        // Labelled placeholder tiles, so the partners carousel can be tested before real logos exist.
        VITE_PARTNERS_PREVIEW: 'true',
      },
    },
    {
      command: `npx vite build --outDir dist-e2e-preview --emptyOutDir && npx vite preview --outDir dist-e2e-preview --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}/en`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { VITE_LEADS_API_URL: '', VITE_SITE_URL: '', VITE_PARTNERS_PREVIEW: '' },
    },
  ],
});
