import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { CONTACT_DEFAULTS } from './src/config/contactDefaults.ts';
import { organizationJsonLd } from './src/content/organization.ts';
import { normalizeSiteUrl, robotsTxt, sitemapXml, staticHead } from './src/content/seoHead.ts';

const MARKER = '<!--static-head-->';

/**
 * Build-time SEO files. Per-route HTML is written by scripts/prerender.mjs
 * (real React output for every page); this plugin handles the rest:
 *
 *  - index.html: static head for the root URL / dev server (English home)
 *    plus Organization JSON-LD -- the template the prerender fills in;
 *  - robots.txt: always regenerated; Sitemap line only with a valid
 *    production origin; preview deployments disallow all crawling;
 *  - sitemap.xml: only with a valid production origin (VITE_SITE_URL).
 *
 * VITE_SITE_URL is the single source of truth for the public origin. When
 * it is missing or invalid, no absolute URL is emitted anywhere (canonical,
 * hreflang, og:url, og:image, sitemap) -- the build warns instead of
 * guessing a domain.
 */
function staticSeo(mode: string, deployEnv: string): Plugin {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (fileEnv.VITE_SITE_URL ?? '').trim();
  const base = normalizeSiteUrl(siteUrl);
  const preview = deployEnv === 'preview';
  const publishContacts = fileEnv.VITE_PUBLISH_ORG_CONTACTS === 'true' || fileEnv.VITE_PUBLISH_ORG_CONTACTS === '1';
  const pick = (key: string, fallback: string) => (fileEnv[key] && fileEnv[key].trim()) || fallback;
  const org = organizationJsonLd({
    siteUrl: base ?? '',
    contacts: publishContacts
      ? {
          businessEmail: pick('VITE_BUSINESS_EMAIL', CONTACT_DEFAULTS.businessEmail),
          salesEmail: pick('VITE_SALES_EMAIL', CONTACT_DEFAULTS.salesEmail),
          officePhone: pick('VITE_OFFICE_PHONE', CONTACT_DEFAULTS.officePhone),
          mobilePhone: pick('VITE_MOBILE_PHONE', CONTACT_DEFAULTS.mobilePhone),
        }
      : null,
  });

  let outDir = 'dist';
  let isSsrBuild = false;
  return {
    name: 'reservia-static-seo',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      isSsrBuild = Boolean(config.build.ssr);
      if (!isSsrBuild && config.command === 'build') {
        if (siteUrl && !base) console.warn(`\n[seo] VITE_SITE_URL "${siteUrl}" is not a bare https:// origin; canonical/hreflang/sitemap are disabled.\n`);
        if (!siteUrl && deployEnv === 'production') console.warn('\n[seo] VITE_SITE_URL is not set for a production build: no canonical, hreflang, og:url, og:image or sitemap will be emitted.\n');
        if (base?.endsWith('.vercel.app')) console.warn(`\n[seo] VITE_SITE_URL points at a vercel.app host (${base}); set the custom domain once it is connected.\n`);
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(MARKER, staticHead({ lang: 'en', page: 'home', siteUrl: base ?? '', orgJsonLd: org, ogImage: base ? `${base}/og-image.png` : null }));
      },
    },
    closeBundle() {
      if (isSsrBuild) return;
      try {
        readFileSync(resolve(outDir, 'index.html'));
      } catch {
        return; // not a client build output
      }
      writeFileSync(resolve(outDir, 'robots.txt'), robotsTxt(base ?? '', preview));
      const sitemap = !preview && base ? sitemapXml(base) : null;
      if (sitemap) writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development'; empty elsewhere.
  const deployEnv = process.env.VERCEL_ENV ?? '';
  return {
    plugins: [react(), staticSeo(mode, deployEnv)],
    define: { 'import.meta.env.VITE_DEPLOY_ENV': JSON.stringify(deployEnv) },
  };
});
