import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { CONTACT_DEFAULTS } from './src/config/contactDefaults.ts';
import { organizationJsonLd } from './src/content/organization.ts';
import { DEFAULT_LANG, normalizeSiteUrl, ROUTES, robotsTxt, sitemapXml, staticHead } from './src/content/seoHead.ts';
import { EMPTY_CMS_FEED, validateCmsFeed, type CmsFeed } from './src/content/cms.ts';
import { injectGlobal } from './src/content/cmsInject.ts';

const MARKER = '<!--static-head-->';
const CMS_MODULE = 'virtual:cms-feed';

/**
 * The CMS feed for this build (content/cms.ts). scripts/build-site.mjs fetches it ONCE and points
 * RESERVIA_CMS_FEED_FILE at the saved copy, so the client build, the SSR build, the sitemap and
 * index.html all use exactly the same snapshot. Without that file (dev server, a build without
 * CMS_API_URL) the feed is empty and the site's own text is used everywhere.
 */
function loadCmsFeed(): { feed: CmsFeed; warnings: string[] } {
  const file = process.env.RESERVIA_CMS_FEED_FILE;
  if (!file) return { feed: EMPTY_CMS_FEED, warnings: [] };
  // A file that was announced but can't be read or validated is a build error, never a silent
  // fallback to stale or missing SEO.
  return validateCmsFeed(JSON.parse(readFileSync(file, 'utf8')), ROUTES.map((r) => r.path));
}

function cmsFeedModule(feed: CmsFeed): Plugin {
  const resolved = `\0${CMS_MODULE}`;
  return {
    name: 'reservia-cms-feed',
    resolveId: (id) => (id === CMS_MODULE ? resolved : null),
    load: (id) => (id === resolved ? `export default ${JSON.stringify(feed)};` : null),
  };
}

/**
 * Build-time SEO files. Per-route HTML is written by scripts/prerender.mjs
 * (real React output for every page); this plugin handles the rest:
 *
 *  - index.html: static head for the root URL / dev server (Arabic home, DEFAULT_LANG)
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
function staticSeo(mode: string, deployEnv: string, cms: CmsFeed): Plugin {
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
        // Site-wide CMS items (verification tags, favicon, custom code) go into the template, so every
        // prerendered page and the app shell carry them exactly once (src/content/cmsInject.ts).
        return injectGlobal(html.replace(MARKER, staticHead({ lang: DEFAULT_LANG, page: 'home', siteUrl: base ?? '', orgJsonLd: org, ogImage: base ? `${base}/og-image.png` : null, cms })), cms);
      },
    },
    closeBundle() {
      if (isSsrBuild) return;
      try {
        readFileSync(resolve(outDir, 'index.html'));
      } catch {
        return; // not a client build output
      }
      writeFileSync(resolve(outDir, 'robots.txt'), robotsTxt(base ?? '', preview, cms));
      const sitemap = !preview && base ? sitemapXml(base, cms) : null;
      if (sitemap) writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development'; empty elsewhere.
  const deployEnv = process.env.VERCEL_ENV ?? '';
  const { feed: cms, warnings } = loadCmsFeed();
  for (const w of warnings) console.warn(`[cms] ${w}`);
  return {
    plugins: [react(), cmsFeedModule(cms), staticSeo(mode, deployEnv, cms)],
    define: { 'import.meta.env.VITE_DEPLOY_ENV': JSON.stringify(deployEnv) },
  };
});
