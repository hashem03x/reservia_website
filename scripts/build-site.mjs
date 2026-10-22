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
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const outDir = resolve(process.argv[2] ?? 'dist');
const ssrDir = `${outDir}-ssr`;

await build({ build: { outDir, emptyOutDir: true }, logLevel: 'warn' });
await build({ build: { ssr: 'src/entry-server.tsx', outDir: ssrDir, emptyOutDir: true }, logLevel: 'warn' });

const server = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href);
const { ROUTES, routeLangs, HEAD_START, HEAD_END, render } = server;

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

function page({ lang, head, body, lp }) {
  return (
    template.slice(0, headStart) +
    head.trimStart() +
    template.slice(headEnd + HEAD_END.length)
  )
    .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace('<body>', lp ? '<body data-lp="1">' : '<body>')
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
      writeFileSync(file, page({ lang, head, body, lp: route.path.startsWith('/lp/') }));
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
