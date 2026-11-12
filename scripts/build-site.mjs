/**
 * Production build with static prerendering.
 *
 *   node scripts/build-site.mjs [outDir]      (default: dist)
 *
 * 1. Client build (the normal Vite build) into <outDir>.
 * 2. SSR build of src/entry-server.tsx into <outDir>-ssr (build-time only, never deployed).
 * 3. For every route in ROUTES and every language the page exists in,
 *    render the real React app at that URL and write <outDir>/<lang><path>.html:
 *    the page's own <title>/<meta>/<link> tags (hoisted by React 19) go into
 *    <head>, the page HTML into #root, lang/dir onto <html>. The browser
 *    hydrates this HTML instead of rendering from scratch (main.tsx).
 * 4. <outDir>/404.html: noindex shell for unknown URLs (served with status
 *    404 by the host); the app renders its not-found page client-side.
 *
 * Exits non-zero if any page fails to render or lacks a <title>/<h1>, so a
 * broken page can never ship silently.
 *
 * CMS SEO overrides (src/content/cms.ts): when CMS_API_URL is set (the
 * Central Portal API base, e.g. https://reserviabackend.vercel.app/api/v1 --
 * a build-time variable, deliberately NOT VITE_-prefixed, so it never reaches
 * the browser bundle), the published-content feed is fetched ONCE before
 * anything is built and handed to both builds through
 * RESERVIA_CMS_FEED_FILE, so every page, the sitemap and index.html use the
 * same snapshot. If CMS_API_URL is set but the feed can't be fetched, the
 * build FAILS: on Vercel the previous deployment keeps serving, rather than
 * a new one silently dropping the editors' published SEO. Unset = no CMS:
 * the site's own text everywhere.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, loadEnv } from 'vite';

const outDir = resolve(process.argv[2] ?? 'dist');
const ssrDir = `${outDir}-ssr`;

/** GET <CMS_API_URL>/website/public/site, with a timeout and a few retries. Throws on failure. */
async function fetchCmsFeed(apiUrl) {
  let base;
  try {
    base = new URL(apiUrl.replace(/\/+$/, ''));
  } catch {
    throw new Error(`CMS_API_URL "${apiUrl}" is not a URL`);
  }
  const local = ['localhost', '127.0.0.1'].includes(base.hostname);
  if (base.protocol !== 'https:' && !(local && base.protocol === 'http:')) throw new Error('CMS_API_URL must use https');
  const url = `${base.href.replace(/\/+$/, '')}/website/public/site`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'reservia-website-build/1.0' }, signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body?.success === false) throw new Error(body.message || 'the API reported a failure');
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw new Error(`could not fetch the CMS feed from ${url}: ${lastError instanceof Error ? lastError.message : lastError}`);
}

const cmsApiUrl = (process.env.CMS_API_URL ?? loadEnv('production', process.cwd(), '').CMS_API_URL ?? '').trim();
delete process.env.RESERVIA_CMS_FEED_FILE; // never inherit a stale snapshot
if (cmsApiUrl) {
  try {
    const feed = await fetchCmsFeed(cmsApiUrl);
    const file = resolve('node_modules/.cache/reservia-cms-feed.json');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(feed));
    process.env.RESERVIA_CMS_FEED_FILE = file;
    console.log(`[cms] feed fetched: ${feed?.data?.pages?.length ?? 0} published page(s)`);
  } catch (error) {
    console.error(`\n[cms] ${error instanceof Error ? error.message : error}\n[cms] Build stopped so published SEO is never silently dropped. Fix the CMS URL/API, or unset CMS_API_URL to build without the CMS.`);
    process.exit(1);
  }
} else {
  console.log('[cms] CMS_API_URL is not set - building with the site\'s own SEO text (no CMS overrides).');
}

await build({ build: { outDir, emptyOutDir: true }, logLevel: 'warn' });
await build({ build: { ssr: 'src/entry-server.tsx', outDir: ssrDir, emptyOutDir: true }, logLevel: 'warn' });

const server = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href);
const { BUILD_ROUTES, CMS_FEED, injectForPage, routeLangs, HEAD_START, HEAD_END, render } = server;
const ROUTES = BUILD_ROUTES;
// CMS page per route path (page-scoped custom code, landing-page layout).
const cmsByPath = new Map((CMS_FEED?.pages ?? []).map((p) => [p.path === '/' ? '' : p.path.replace(/\/+$/, ''), p]));

const template = readFileSync(resolve(outDir, 'index.html'), 'utf8');
const headStart = template.indexOf(HEAD_START);
const headEnd = template.indexOf(HEAD_END);
if (headStart < 0 || headEnd < 0) throw new Error('index.html is missing the seo:start/seo:end markers');
const ROOT = '<div id="root"></div>';
if (!template.includes(ROOT)) throw new Error('index.html is missing an empty #root');

/** Splits React's output into the hoisted head tags it starts with, and the page body. */
function splitHoisted(html) {
  const tag = /\s*(<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>)/y;
  let head = '';
  let pos = 0;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    // Marked so the browser entry can drop them right before hydrating: React 19 inserts
    // its own copies of hoisted tags on the client, and these would duplicate them.
    head += `\n    ${m[1].replace(/^<(title|meta|link)\b/, '<$1 data-ssr-head')}`;
    pos = tag.lastIndex;
  }
  return { head, body: html.slice(pos) };
}

function page({ lang, head, body, lp, route = '/' }) {
  return (
    template.slice(0, headStart) +
    head.trimStart() +
    template.slice(headEnd + HEAD_END.length)
  )
    .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace('<body>', `<body${lp ? ' data-lp="1"' : ''} data-route="${route}">`)
    .replace(ROOT, `<div id="root">${body}</div>`);
}

const problems = [];
let count = 0;
for (const route of ROUTES) {
  for (const lang of routeLangs(route)) {
    const url = `/${lang}${route.path}`;
    try {
      const { head, body } = splitHoisted(await render(url));
      if (!/<title[^>]*>[^<]+<\/title>/.test(head)) problems.push(`${url}: no <title> in rendered head`);
      if (!/<h1[\s>]/.test(body)) problems.push(`${url}: no <h1> in rendered body`);
      if (/<!--\$[?!]-->/.test(body)) problems.push(`${url}: a Suspense boundary was not resolved inline (streaming fallback in the HTML)`);
      const file = resolve(outDir, `${lang}${route.path}.html`);
      mkdirSync(dirname(file), { recursive: true });
      const cmsPage = cmsByPath.get(route.path);
      const lp = route.path.startsWith('/lp/') || (cmsPage?.pageType === 'managed' && cmsPage.layout === 'landing');
      writeFileSync(file, injectForPage(page({ lang, head, body, lp, route: route.path || '/' }), CMS_FEED, cmsPage?.slug));
      count++;
    } catch (error) {
      problems.push(`${url}: ${error instanceof Error ? error.stack : error}`);
    }
  }
}

writeFileSync(
  resolve(outDir, '404.html'),
  page({ lang: 'en', head: '<title>Page not found | Reservia</title>\n    <meta name="robots" content="noindex, follow">', body: '', lp: false }),
);
rmSync(ssrDir, { recursive: true, force: true });

if (problems.length) {
  console.error(`\n[prerender] ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`[prerender] ${count} pages written to ${outDir} (+ 404.html)`);
