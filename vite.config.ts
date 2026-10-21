import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { CONTACT_DEFAULTS } from './src/config/contactDefaults.ts';
import { organizationJsonLd } from './src/content/organization.ts';
import { LANGS, ROUTES, sitemapXml, staticHead, type Lang, type RouteDef } from './src/content/seoHead.ts';

const MARKER = '<!--static-head-->';

/**
 * Static SEO fallback for crawlers and link previews that do not run
 * JavaScript. The SPA is unchanged; this only writes HTML entry files:
 *
 *  - dist/index.html            English home head (also the SPA fallback)
 *  - dist/<lang><path>.html     one per route and language, with that
 *    page's title, description, lang/dir, Open Graph, robots and (when
 *    VITE_SITE_URL is set) canonical + hreflang
 *  - dist/sitemap.xml + robots.txt Sitemap line, only when VITE_SITE_URL is set
 *
 * Organization JSON-LD is written into every file from the same
 * definition the app uses (src/content/organization.ts).
 */
function staticSeo(mode: string): Plugin {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (fileEnv.VITE_SITE_URL ?? '').trim();
  const publishContacts = fileEnv.VITE_PUBLISH_ORG_CONTACTS === 'true' || fileEnv.VITE_PUBLISH_ORG_CONTACTS === '1';
  const pick = (key: string, fallback: string) => (fileEnv[key] && fileEnv[key].trim()) || fallback;
  const org = organizationJsonLd({
    siteUrl,
    contacts: publishContacts
      ? {
          businessEmail: pick('VITE_BUSINESS_EMAIL', CONTACT_DEFAULTS.businessEmail),
          salesEmail: pick('VITE_SALES_EMAIL', CONTACT_DEFAULTS.salesEmail),
          officePhone: pick('VITE_OFFICE_PHONE', CONTACT_DEFAULTS.officePhone),
          mobilePhone: pick('VITE_MOBILE_PHONE', CONTACT_DEFAULTS.mobilePhone),
        }
      : null,
  });

  const render = (html: string, lang: Lang, route: RouteDef) =>
    html
      .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
      .replace(MARKER, staticHead({ lang, route, siteUrl, orgJsonLd: org }));

  let outDir = 'dist';
  return {
    name: 'reservia-static-seo',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return render(html, 'en', ROUTES[0]);
      },
    },
    closeBundle() {
      // index.html already carries the English home head (transformIndexHtml).
      let template: string;
      try {
        template = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      } catch {
        return; // not a client build (e.g. dev server)
      }
      // Rebuild each route's head from a clean template.
      const clean = template.replace(/<title>[\s\S]*?<script type="application\/ld\+json" id="ld-org">[\s\S]*?<\/script>/, MARKER);
      // <lang><path>.html (e.g. ar/service.html, en.html) matches the app's
      // no-trailing-slash URLs (/ar/service). Served for /ar/service by
      // default on sirv/vite preview, Netlify, Cloudflare Pages and GitHub
      // Pages; nginx needs `try_files $uri $uri.html /index.html`.
      for (const lang of LANGS) {
        for (const route of ROUTES) {
          const file = resolve(outDir, `${lang}${route.path}.html`);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, render(clean, lang, route));
        }
      }
      const sitemap = sitemapXml(siteUrl);
      if (sitemap) {
        writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap);
        const robotsPath = resolve(outDir, 'robots.txt');
        const robots = readFileSync(robotsPath, 'utf8');
        writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml\n`);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), staticSeo(mode)],
}));
