import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests (pure logic: tariffs, calculator, validation, analytics privacy,
// WhatsApp links, SEO data, translations). Browser regression tests live in
// tests/e2e and run with Playwright (see playwright.config.ts).
//
// 'virtual:cms-feed' (vite.config.ts) is the build's CMS snapshot; unit tests run with the EMPTY
// feed - the site's own content - unless a test builds its own feed explicitly.
const CMS_FEED = 'virtual:cms-feed';
const RESOLVED = `\0${CMS_FEED}`;
const CMS_MODULE = resolve('src/content/cms.ts').replace(/\\/g, '/');

export default defineConfig({
  plugins: [
    {
      name: 'cms-feed-empty',
      resolveId: (id) => (id === CMS_FEED ? RESOLVED : null),
      load: (id) => (id === RESOLVED ? `export { EMPTY_CMS_FEED as default } from ${JSON.stringify(CMS_MODULE)};` : null),
    },
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
