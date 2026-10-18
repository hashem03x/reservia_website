import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../i18n/LanguageContext';
import { env } from '../../config/env';
import { SEO, type PageId } from '../../content/seo';

/**
 * Per-page SEO head management, driven by the SEO content ported from
 * the reference template. `path` is the language-agnostic route path
 * (e.g. "/residential", or "" for home); canonical/hreflang/OG URLs are
 * only emitted once VITE_SITE_URL is configured (no production domain
 * was supplied, so we don't guess one).
 */
export function Seo({
  page,
  path,
  faq,
  noindex,
}: {
  page: PageId;
  path: string;
  /** [question, answer] pairs visible on this page, for FAQPage structured data (mirrors the template's dynamic FAQ JSON-LD). */
  faq?: Array<[string, string]>;
  /** Campaign landing pages are intentionally excluded from indexing, per the template's own SEO note. */
  noindex?: boolean;
}) {
  const { language } = useLanguage();
  const [title, description] = SEO[language][page];
  const base = env.siteUrl.replace(/\/$/, '');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const faqJsonLd =
    faq && faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: language,
          mainEntity: faq.map(([q, a]) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        }
      : null;

  return (
    <Helmet htmlAttributes={{ lang: language, dir }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      {base && <link rel="canonical" href={`${base}/${language}${path}`} />}
      {base && <link rel="alternate" hrefLang="en" href={`${base}/en${path}`} />}
      {base && <link rel="alternate" hrefLang="ar" href={`${base}/ar${path}`} />}
      {base && <link rel="alternate" hrefLang="x-default" href={`${base}/en${path}`} />}
      <meta property="og:site_name" content="Reservia Integrated Energy Solutions" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_EG' : 'en_US'} />
      {base && <meta property="og:url" content={`${base}/${language}${path}`} />}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {faqJsonLd && <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>}
    </Helmet>
  );
}

/** Organization structured data, ported verbatim from the template's `#ldOrg` script. Rendered once at the app root. */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Reservia Integrated Energy Solutions',
    alternateName: 'Reservia',
    description: 'Egyptian solar and storage EPC company based in Maadi, Cairo.',
    address: { '@type': 'PostalAddress', addressLocality: 'Maadi, Cairo', addressCountry: 'EG' },
    areaServed: 'EG',
    email: env.businessEmail,
    telephone: env.officePhone,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: env.salesEmail,
        telephone: env.mobilePhone,
        availableLanguage: ['en', 'ar'],
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
