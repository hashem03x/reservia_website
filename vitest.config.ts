import { defineConfig } from 'vitest/config';

// Unit tests (pure logic: tariffs, calculator, validation, analytics privacy,
// WhatsApp links, SEO data, translations). Browser regression tests live in
// tests/e2e and run with Playwright (see playwright.config.ts).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
