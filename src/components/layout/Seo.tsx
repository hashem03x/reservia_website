import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { env, isPreviewDeployment } from '../../config/env';
import type { PageId } from '../../content/seo';
import { breadcrumbJsonLd, faqJsonLd, findRoute, normalizeSiteUrl, pageJsonLd, pageText, pageUrls, robotsContent, websiteJsonLd } from '../../content/seoHead';
import { breadcrumbTrail } from '../../content/breadcrumbs';
import { cmsOverrides } from '../../content/cms';
import { cmsFeed } from '../../content/cmsFeed';
import { jsonLdString } from '../../content/organization';
import { trackPageView } from '../../services/analytics';
import { trackPageView as trackAmplitudePageView } from '../../analytics/amplitude';

let firstPageRendered = false;

/**
 * After a client-side navigation, move keyboard/screen-reader focus to
 * the new page's <h1> (or <main>), so assistive technology announces the
 * new page instead of staying on the link that was clicked. Skipped on
 * the very first page load, where the browser's default focus is right.
 */
function focusNewPage() {
  if (!firstPageRendered) {
    firstPageRendered = true;
    return;
  }
  const target = (document.querySelector('main h1') as HTMLElement | null) ?? document.getElementById('main');
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/**
 * Per-page head (title, description, robots, Open Graph/Twitter,
 * canonical, hreflang) and structured data, plus the page lifecycle hooks
 * that need the final title (page_view, focus management).
 *
 * The same component renders at build time (scripts/prerender.mjs), so the
 * HTML each URL serves already carries its own head -- React 19 hoists
 * these tags into <head>, on the server and in the browser.
 *
 * Absolute URLs (canonical, hreflang, og:url, og:image, JSON-LD ids) are
 * emitted only when VITE_SITE_URL is a valid https origin; nothing points
 * at a guessed or preview domain. Preview deployments are noindex.
 */
export function Seo({
  page,
  path,
  faq,
  noindex,
}: {
  page: PageId;
  /** Language-agnostic route path ('' for home); must exist in ROUTES for canonical/hreflang. */
  path: string;
  /** [question, answer] pairs visible on this page; FAQPage JSON-LD is built from exactly these strings. */
  faq?: Array<[string, string]>;
  noindex?: boolean;
}) {
  const { language, t } = useLanguage();
  const location = useLocation();
  // CMS overrides (content/cms.ts): only what an editor typed and published replaces the code's
  // text; everything else stays exactly as written in content/seo.ts.
  const cms = cmsOverrides(cmsFeed, language, path);
  const [title, description] = pageText(language, page, path, cmsFeed);
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const route = findRoute(path, cmsFeed);
  const base = normalizeSiteUrl(env.siteUrl);
  const isNoindex = !!noindex || !!cms.noindex;
  const urls = route && !isNoindex ? pageUrls(env.siteUrl, language, route, cmsFeed) : null;
  const robots = isPreviewDeployment ? 'noindex, nofollow' : robotsContent(isNoindex, !!cms.nofollow);
  // The site's own share image needs the production origin; an image chosen in the CMS is
  // already an absolute https URL (its size isn't known, so no width/height is claimed for it).
  const ogImage = cms.ogImage ?? (base ? `${base}/og-image.png` : null);
  const ownImage = !cms.ogImage && !!ogImage;
  const ogTitle = cms.ogTitle ?? title;
  const ogDescription = cms.ogDescription ?? description;

  const jsonLd: unknown[] = [];
  if (faq && faq.length > 0) jsonLd.push(faqJsonLd(language, faq));
  if (base && urls && route) {
    jsonLd.push(pageJsonLd({ base, lang: language, route, url: urls.canonical, name: title, description }));
    if (route.path === '') jsonLd.push(websiteJsonLd(base, language, 'Reservia Integrated Energy Solutions'));
    const crumbs = breadcrumbTrail(route.path, t, { lang: language, feed: cmsFeed });
    if (crumbs.length > 1) jsonLd.push(breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: `${base}/${language}${c.path}` }))));
  }

  useEffect(() => {
    trackPageView(location.pathname, language, title);
    trackAmplitudePageView(location.pathname, language);
    focusNewPage();
  }, [location.pathname, language, title]);

  return (
    <Helmet htmlAttributes={{ lang: language, dir }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {urls && <link rel="canonical" href={urls.canonical} />}
      {urls?.alternates.map((a) => <link key={a.hreflang} rel="alternate" hrefLang={a.hreflang} href={a.href} />)}
      <meta property="og:site_name" content="Reservia Integrated Energy Solutions" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_EG' : 'en_US'} />
      {urls && urls.alternates.length > 0 && <meta property="og:locale:alternate" content={language === 'ar' ? 'en_US' : 'ar_EG'} />}
      {urls && <meta property="og:url" content={urls.canonical} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ownImage && <meta property="og:image:width" content="1200" />}
      {ownImage && <meta property="og:image:height" content="630" />}
      {ownImage && <meta property="og:image:alt" content={t.og_image_alt} />}
      <meta name="twitter:card" content={cms.twitterCard ?? (ogImage ? 'summary_large_image' : 'summary')} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">{jsonLdString(data)}</script>
      ))}
    </Helmet>
  );
}
