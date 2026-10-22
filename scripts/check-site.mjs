/**
 * Technical SEO / launch check for a running copy of the site (read-only GET requests).
 *
 *   node scripts/check-site.mjs <baseUrl> [--expect-origin=https://www.example.com] [--strict-404]
 *
 *   baseUrl          where to fetch from (local server or the live domain)
 *   --expect-origin  the production origin canonicals/sitemap must use
 *                    (omit for a build without VITE_SITE_URL: then NO absolute
 *                    canonical/hreflang/og:url/og:image/sitemap may appear)
 *   --strict-404     unknown URLs must return HTTP 404 (Vercel / `serve`);
 *                    leave off for `vite preview`, which answers 200 with index.html
 *
 * Checks every route in the inventory (both languages), sitemap.xml,
 * robots.txt, 404 behaviour, internal links and assets found in the HTML,
 * duplicate titles/descriptions, image alt text, preview/localhost leaks
 * and /lp/ noindex. Exits 1 if any FAIL; WARN lines do not fail the run.
 */
const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:4173').replace(/\/$/, '');
const expectOrigin = (args.find((a) => a.startsWith('--expect-origin=')) ?? '').split('=')[1]?.replace(/\/$/, '') || null;
const strict404 = args.includes('--strict-404');

// Route inventory, kept in sync with src/content/seoHead.ts ROUTES by tests/e2e/check-site.spec.ts.
const ROUTES = [
  ['', ['en', 'ar']], ['/residential', ['en', 'ar']], ['/agriculture', ['en', 'ar']], ['/industrial', ['en', 'ar']],
  ['/oil-gas', ['en', 'ar']], ['/service', ['en', 'ar']], ['/solar-irrigation-guide', ['ar']], ['/calculator', ['en', 'ar']],
  ['/how-we-work', ['en', 'ar']], ['/about', ['en', 'ar']], ['/contact', ['en', 'ar']],
  ['/lp/villas', ['en', 'ar'], true], ['/lp/compounds', ['en', 'ar'], true], ['/lp/agriculture', ['en', 'ar'], true],
  ['/lp/industrial', ['en', 'ar'], true], ['/lp/service', ['en', 'ar'], true],
];

const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

async function get(path, opts = {}) {
  const res = await fetch(base + path, { redirect: opts.follow === false ? 'manual' : 'follow', headers: { 'User-Agent': 'reservia-site-check/1.0' } });
  return { status: res.status, type: res.headers.get('content-type') ?? '', location: res.headers.get('location'), text: await res.text() };
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const tags = (html, re) => [...html.matchAll(re)].map((m) => m[0]);
const head = (html) => html.slice(0, html.indexOf('</head>'));

const titles = new Map();
const descriptions = new Map();
const internalLinks = new Set();
const assets = new Set();

for (const [path, langs, noindex] of ROUTES) {
  for (const lang of langs) {
    const url = `/${lang}${path}`;
    const r = await get(url);
    if (r.status !== 200) { fail(`${url}: HTTP ${r.status}`); continue; }
    const h = head(r.text);
    const body = r.text.slice(r.text.indexOf('<body'));
    // Initial HTML must already contain the page (prerendered), not an empty shell.
    if (!/<div id="root"><[a-z]/.test(r.text)) fail(`${url}: #root is empty in the served HTML (not prerendered)`);
    if (!/<h1[\s>]/.test(body)) fail(`${url}: no <h1> in the served HTML`);
    const htmlTag = r.text.match(/<html[^>]*>/)?.[0] ?? '';
    if (attr(htmlTag, 'lang') !== lang) fail(`${url}: <html lang="${attr(htmlTag, 'lang')}">, expected ${lang}`);
    if (attr(htmlTag, 'dir') !== (lang === 'ar' ? 'rtl' : 'ltr')) fail(`${url}: wrong dir`);

    const titleTags = tags(h, /<title[^>]*>[^<]*<\/title>/g);
    if (titleTags.length !== 1) fail(`${url}: ${titleTags.length} <title> tags`);
    const title = titleTags[0]?.replace(/<\/?title[^>]*>/g, '') ?? '';
    const descs = tags(h, /<meta[^>]+name="description"[^>]*>/g);
    if (descs.length !== 1) fail(`${url}: ${descs.length} meta descriptions`);
    const desc = descs[0] ? attr(descs[0], 'content') : '';
    if (!title) fail(`${url}: empty title`);
    if (!desc) fail(`${url}: empty description`);
    if (titles.has(title)) fail(`${url}: duplicate title (also on ${titles.get(title)})`); else titles.set(title, url);
    if (descriptions.has(desc)) fail(`${url}: duplicate description (also on ${descriptions.get(desc)})`); else descriptions.set(desc, url);

    const robots = tags(h, /<meta[^>]+name="robots"[^>]*>/g).map((t) => attr(t, 'content'));
    if (robots.length !== 1) fail(`${url}: ${robots.length} robots meta tags`);
    if (noindex && robots[0] !== 'noindex, follow') fail(`${url}: campaign page robots="${robots[0]}", expected "noindex, follow"`);
    if (!noindex && robots[0] !== 'index, follow') fail(`${url}: robots="${robots[0]}", expected "index, follow"`);

    const canon = tags(h, /<link[^>]+rel="canonical"[^>]*>/g).map((t) => attr(t, 'href'));
    const alts = tags(h, /<link[^>]+rel="alternate"[^>]*>/g).map((t) => [attr(t, 'hreflang'), attr(t, 'href')]);
    if (noindex || !expectOrigin) {
      if (canon.length) fail(`${url}: unexpected canonical ${canon[0]}`);
      if (alts.length) fail(`${url}: unexpected hreflang alternates`);
    } else {
      if (canon.length !== 1 || canon[0] !== `${expectOrigin}${url}`) fail(`${url}: canonical ${canon.join(',') || 'missing'}, expected ${expectOrigin}${url}`);
      const want = langs.length > 1 ? [...langs.map((l) => [l, `${expectOrigin}/${l}${path}`]), ['x-default', `${expectOrigin}/en${path}`]] : [];
      if (JSON.stringify(alts) !== JSON.stringify(want)) fail(`${url}: hreflang ${JSON.stringify(alts)} != ${JSON.stringify(want)}`);
    }
    const ogImage = tags(h, /<meta[^>]+property="og:image"[^>]*>/g).map((t) => attr(t, 'content'));
    if (expectOrigin && !noindex && ogImage[0] !== `${expectOrigin}/og-image.jpg`) fail(`${url}: og:image ${ogImage[0] ?? 'missing'}`);
    if (!expectOrigin && ogImage.length) fail(`${url}: og:image without a production origin`);
    if (/vercel\.app|localhost|127\.0\.0\.1/.test(h)) fail(`${url}: preview/localhost URL in <head>`);

    for (const s of tags(r.text, /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g)) {
      try { JSON.parse(s.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch { fail(`${url}: invalid JSON-LD`); }
    }
    for (const img of tags(body, /<img\b[^>]*>/g)) {
      if (!/\salt="/.test(img)) fail(`${url}: <img> without alt: ${img.slice(0, 90)}`);
    }
    for (const a of tags(body, /<a\b[^>]*href="\/[^"]*"[^>]*>/g)) internalLinks.add(attr(a, 'href').split(/[?#]/)[0]);
    for (const m of r.text.matchAll(/(?:src|href)="(\/(?:assets|icons)\/[^"]+|\/favicon\.ico|\/og-image\.jpg)"/g)) assets.add(m[1]);
  }
}

// Internal links and assets referenced by the HTML.
for (const link of internalLinks) {
  const r = await get(link);
  if (r.status !== 200) fail(`internal link ${link}: HTTP ${r.status}`);
}
for (const a of assets) {
  const r = await get(a);
  if (r.status !== 200) fail(`asset ${a}: HTTP ${r.status}`);
}

// Not-found behaviour.
for (const missing of ['/en/this-page-does-not-exist', '/en/solar-irrigation-guide']) {
  const r = await get(missing);
  if (strict404 ? r.status !== 404 : r.status >= 500) fail(`${missing}: HTTP ${r.status}${strict404 ? ', expected 404' : ''}`);
  // (vite preview answers unknown URLs with index.html; only judge where real 404s exist)
  if ((strict404 || r.status === 404) && /name="robots" content="index/.test(head(r.text))) fail(`${missing}: missing page is indexable`);
}

// robots.txt and sitemap.xml.
const robots = await get('/robots.txt');
if (robots.status !== 200) fail(`/robots.txt: HTTP ${robots.status}`);
else {
  if (!/User-agent: \*/.test(robots.text)) fail('/robots.txt: no User-agent line');
  if (/Disallow: \/\s*$/m.test(robots.text)) fail('/robots.txt disallows everything');
  if (expectOrigin && !robots.text.includes(`Sitemap: ${expectOrigin}/sitemap.xml`)) fail('/robots.txt: missing Sitemap line');
}
const sm = await get('/sitemap.xml');
if (expectOrigin) {
  if (sm.status !== 200 || !sm.text.includes('<urlset')) fail(`/sitemap.xml: HTTP ${sm.status} or not a urlset`);
  else {
    if (!/xml/.test(sm.type)) warn(`/sitemap.xml content-type "${sm.type}"`);
    const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = ROUTES.filter(([, , n]) => !n).flatMap(([p, langs]) => langs.map((l) => `${expectOrigin}/${l}${p}`));
    if (JSON.stringify([...locs].sort()) !== JSON.stringify([...expected].sort())) fail(`/sitemap.xml: URLs differ from the indexable route inventory (${locs.length} vs ${expected.length})`);
    for (const loc of locs) {
      if (!loc.startsWith(expectOrigin + '/')) { fail(`/sitemap.xml: foreign URL ${loc}`); continue; }
      const r = await get(loc.slice(expectOrigin.length));
      if (r.status !== 200) fail(`/sitemap.xml: ${loc} returns ${r.status}`);
    }
  }
} else if (sm.status === 200 && sm.text.includes('<urlset')) fail('/sitemap.xml served without a production origin');

console.log(`Checked ${titles.size} pages, ${internalLinks.size} internal links, ${assets.size} assets on ${base}${expectOrigin ? ` (origin ${expectOrigin})` : ' (no production origin)'}`);
for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(fails.length ? `\n${fails.length} failure(s), ${warns.length} warning(s)` : `\nAll checks passed (${warns.length} warning(s))`);
process.exit(fails.length ? 1 : 0);
