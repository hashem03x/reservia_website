/**
 * Build-time HTML injection of what the Website CMS publishes for the whole site (pure, no React):
 * search-engine verification <meta> tags, the favicon, and administrator custom code (HTML / CSS /
 * JavaScript) at the head, start of body or end of body. Global items go into the index.html
 * template (every prerendered page and the app shell); page-scoped snippets are added only to their
 * own page's HTML by scripts/build-site.mjs.
 *
 * Tracking ids (GA4 / GTM / Meta Pixel / Google Ads) are NOT injected here: they feed the site's
 * own analytics loader (services/analytics.ts through config/env.ts), which loads each provider
 * exactly once and respects the cookie-consent setting.
 */
import type { CmsCustomCode, CmsFeed } from './cms.ts';

const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const VERIFY_META: Record<string, string> = {
  google: 'google-site-verification',
  bing: 'msvalidate.01',
  meta: 'facebook-domain-verification',
  yandex: 'yandex-verification',
  pinterest: 'p:domain_verify',
};

export function verificationTags(feed: CmsFeed | null | undefined): string {
  const v = feed?.integrations?.verification ?? {};
  return Object.entries(v)
    .filter(([k, val]) => VERIFY_META[k] && val)
    .map(([k, val]) => `<meta name="${VERIFY_META[k]}" content="${attr(String(val))}">`)
    .join('\n    ');
}

/** One snippet as HTML. A snippet that could break out of its own element is skipped (the CMS refuses those too). */
export function snippetHtml(c: CmsCustomCode): string {
  const id = attr(c.id || c.name);
  if (c.kind === 'css') return /<\/style/i.test(c.code) ? '' : `<style data-cms-code="${id}">\n${c.code}\n</style>`;
  if (c.kind === 'js') return /<\/script/i.test(c.code) ? '' : `<script data-cms-code="${id}">\n${c.code}\n</script>`;
  return /<\/?(html|head|body)\b/i.test(c.code) ? '' : `<!-- cms:${id} -->\n${c.code}\n<!-- /cms:${id} -->`;
}

function snippets(feed: CmsFeed | null | undefined, placement: CmsCustomCode['placement'], pageSlug: string | null): string {
  return (feed?.customCode ?? [])
    .filter((c) => c.placement === placement && (pageSlug === null ? c.scope === 'global' : c.scope === 'page' && c.pageSlug === pageSlug))
    .map(snippetHtml)
    .filter(Boolean)
    .join('\n');
}

/**
 * Adds the site-wide CMS head/body items to an HTML document (the index.html template). Idempotent
 * for the template (markers prevent a second pass from duplicating anything).
 */
export function injectGlobal(html: string, feed: CmsFeed | null | undefined): string {
  if (!feed || html.includes('<!--cms:global-->')) return html;
  let out = html;
  const favicon = feed.settings?.favicon;
  if (favicon) out = out.replace(/\s*<link rel="icon"[^>]*>/g, '').replace('</head>', `    <link rel="icon" href="${attr(favicon)}">\n  </head>`);
  const head = [verificationTags(feed), snippets(feed, 'head', null)].filter(Boolean).join('\n    ');
  out = out.replace('</head>', `    <!--cms:global-->${head ? `\n    ${head}` : ''}\n  </head>`);
  const start = snippets(feed, 'body_start', null);
  if (start) out = out.replace(/<body([^>]*)>/, (m) => `${m}\n${start}`);
  const end = snippets(feed, 'body_end', null);
  if (end) out = out.replace('</body>', `${end}\n</body>`);
  return out;
}

/** Adds one page's own (page-scoped) snippets to its prerendered HTML. */
export function injectForPage(html: string, feed: CmsFeed | null | undefined, pageSlug: string | null | undefined): string {
  if (!feed || !pageSlug) return html;
  let out = html;
  const head = snippets(feed, 'head', pageSlug);
  if (head) out = out.replace('</head>', `${head}\n  </head>`);
  const start = snippets(feed, 'body_start', pageSlug);
  if (start) out = out.replace(/<body([^>]*)>/, (m) => `${m}\n${start}`);
  const end = snippets(feed, 'body_end', pageSlug);
  if (end) out = out.replace('</body>', `${end}\n</body>`);
  return out;
}
