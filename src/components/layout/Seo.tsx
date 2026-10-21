import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { env } from '../../config/env';
import { SEO, type PageId } from '../../content/seo';
import { faqJsonLd, pageUrls } from '../../content/seoHead';
import { jsonLdString } from '../../content/organization';
import { trackPageView } from '../../services/analytics';

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
 * Per-page head management (title, description, Open Graph, canonical,
 * hreflang, robots, FAQPage JSON-LD) plus the page lifecycle hooks that
 * need the final title: the page_view event and focus management.
 *
 * Canonical / hreflang / og:url are emitted only once VITE_SITE_URL (the
 * production domain) is configured -- no domain is guessed (client
 * decision 7). noindex pages (campaign pages, 404) get no canonical or
 * hreflang, so they never compete with or point at indexable URLs.
 * The same data feeds the static per-route HTML generated at build time
 * (see vite.config.ts), for crawlers that do not run JavaScript.
 */
export function Seo({
  page,
  path,
  faq,
  noindex,
}: {
  page: PageId;
  path: string;
  /** [question, answer] pairs visible on this page; FAQPage JSON-LD is built from exactly these strings. */
  faq?: Array<[string, string]>;
  noindex?: boolean;
}) {
  const { language } = useLanguage();
  const location = useLocation();
  const [title, description] = SEO[language][page];
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const urls = noindex ? null : pageUrls(env.siteUrl, language, path);
  const faqData = faq && faq.length > 0 ? faqJsonLd(language, faq) : null;

  useEffect(() => {
    trackPageView(location.pathname, language, title);
    focusNewPage();
  }, [location.pathname, language, title]);

  return (
    <Helmet htmlAttributes={{ lang: language, dir }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
      {urls && <link rel="canonical" href={urls.canonical} />}
      {urls && <link rel="alternate" hrefLang="en" href={urls.en} />}
      {urls && <link rel="alternate" hrefLang="ar" href={urls.ar} />}
      {urls && <link rel="alternate" hrefLang="x-default" href={urls.en} />}
      <meta property="og:site_name" content="Reservia Integrated Energy Solutions" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_EG' : 'en_US'} />
      <meta property="og:locale:alternate" content={language === 'ar' ? 'en_US' : 'ar_EG'} />
      {urls && <meta property="og:url" content={urls.canonical} />}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {faqData && <script type="application/ld+json">{jsonLdString(faqData)}</script>}
    </Helmet>
  );
}
