import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { env, isPreviewDeployment } from '../../config/env';
import { normalizeSiteUrl, robotsContent, blogPostingJsonLd } from '../../content/seoHead';
import { jsonLdString } from '../../content/organization';
import { blogAuthorName } from '../../cms/blog';
import type { CmsBlogPost } from '../../content/cms';
import { trackPageView } from '../../services/analytics';
import { trackPageView as trackAmplitudePageView } from '../../analytics/amplitude';
import { focusNewPage } from './Seo';

/**
 * Per-post head (title, description, robots, Open Graph/Twitter, canonical, hreflang) and
 * BlogPosting structured data - a sibling of Seo.tsx, not a branch inside it, because a blog post's
 * title/description are always per-post authored fields (resolved server-side,
 * backend/utils/website/blogSeoResolver.js) rather than the single static title-per-PageId shape
 * Seo.tsx's `pageText()` is built around. Same tag set and order as Seo.tsx, same analytics/focus
 * side effects, so a visitor or crawler sees no difference in how a blog page behaves.
 */
export function BlogSeo({ post, lang }: { post: CmsBlogPost; lang: 'en' | 'ar' }) {
  const location = useLocation();
  const resolved = post.seo[lang];
  const title = resolved?.title || post.titleEn || post.titleAr;
  const description = resolved?.description || '';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const base = normalizeSiteUrl(env.siteUrl);
  const canonical = resolved?.canonical || (base ? `${base}/${lang}/blog/${post.slug}` : null);
  const noindex = resolved ? !resolved.indexable : false;
  const robots = isPreviewDeployment ? 'noindex, nofollow' : robotsContent(noindex, resolved?.robots.includes('nofollow') ?? false);
  const ogImage = resolved?.openGraph.image ?? post.featuredImage?.url ?? null;
  const ownImage = !resolved?.openGraph.image && !!ogImage;
  const ogTitle = resolved?.openGraph.title || title;
  const ogDescription = resolved?.openGraph.description || description;
  const authorName = blogAuthorName(post, lang) || 'Reservia';

  const jsonLd = base && canonical ? [blogPostingJsonLd({ base, lang, url: canonical, headline: title, description, datePublished: resolved?.datePublished ?? post.publishedAt, authorName, image: ogImage })] : [];

  useEffect(() => {
    trackPageView(location.pathname, lang, title);
    trackAmplitudePageView(location.pathname, lang);
    focusNewPage();
  }, [location.pathname, lang, title]);

  return (
    <Helmet htmlAttributes={{ lang, dir }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:site_name" content="Reservia Integrated Energy Solutions" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_EG' : 'en_US'} />
      {canonical && <meta property="og:url" content={canonical} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ownImage && <meta property="og:image:width" content="1200" />}
      {ownImage && <meta property="og:image:height" content="630" />}
      <meta name="twitter:card" content={resolved?.twitter.card || (ogImage ? 'summary_large_image' : 'summary')} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">{jsonLdString(data)}</script>
      ))}
    </Helmet>
  );
}
