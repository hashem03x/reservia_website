import { describe, expect, it } from 'vitest';
import { blogPostFor, publishedBlogPosts, validateCmsFeed, type CmsFeed } from './cms';
import { ROUTES, allRoutes, blogRoutes, blogPostingJsonLd } from './seoHead';

const SITE = 'https://www.example.com';
const ROUTE_PATHS = ROUTES.map((r) => r.path);

/** One blog post's resolved SEO in a language, as the CMS backend resolves it (blogSeoResolver.js). */
function blogSeo(lang: 'ar' | 'en', slug: string, over: Record<string, unknown> = {}) {
  const url = `${SITE}/${lang}/blog/${slug}`;
  return {
    locale: lang,
    url,
    title: `Title ${lang}`,
    titleSource: 'content',
    description: `Description ${lang}`,
    descriptionSource: 'content',
    canonical: url,
    robots: 'index,follow',
    indexable: true,
    datePublished: '2026-11-10T10:00:00Z',
    openGraph: { type: 'article', title: '', description: '', image: null, url, locale: 'en_US', siteName: '' },
    twitter: { card: 'summary', cardSource: 'auto', title: '', description: '', image: null, site: null },
    warnings: [],
    ...over,
  };
}

const blogPost = (slug: string, seoByLang: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
  slug,
  titleEn: `${slug} en`,
  titleAr: `${slug} ar`,
  excerptEn: 'excerpt',
  excerptAr: 'ملخص',
  bodyEn: '<p>body</p>',
  bodyAr: '<p>محتوى</p>',
  category: 'Solar',
  tags: ['egypt', 'solar'],
  author: { nameEn: 'Jane', nameAr: 'جين', avatarUrl: null },
  featuredImage: null,
  showRecentSidebar: true,
  locales: ['ar', 'en'],
  publishedAt: '2026-11-10T10:00:00Z',
  seo: seoByLang,
  ...over,
});

function feedOf(blogPosts: unknown[]): CmsFeed {
  return validateCmsFeed({ success: true, data: { schemaVersion: 1, generatedAt: '2026-11-10T10:00:00Z', pages: [], blogPosts } }, ROUTE_PATHS).feed;
}

describe('Blog Management - feed validation', () => {
  it('drops a blog post entry with no slug, and reports it', () => {
    const { feed, warnings } = validateCmsFeed({ data: { schemaVersion: 1, pages: [], blogPosts: [{ titleEn: 'No slug' }] } }, ROUTE_PATHS);
    expect(feed.blogPosts).toHaveLength(0);
    expect(warnings.some((w) => w.includes('malformed blog post'))).toBe(true);
  });

  it('drops a blog post with no language, and reports it', () => {
    const { feed, warnings } = validateCmsFeed({ data: { schemaVersion: 1, pages: [], blogPosts: [{ slug: 'no-lang', locales: [] }] } }, ROUTE_PATHS);
    expect(feed.blogPosts).toHaveLength(0);
    expect(warnings.some((w) => w.includes('no language'))).toBe(true);
  });

  it('keeps only the first of two blog posts sharing a slug, and reports it', () => {
    const { feed, warnings } = validateCmsFeed(
      { data: { schemaVersion: 1, pages: [], blogPosts: [blogPost('dup', { en: blogSeo('en', 'dup') }, { titleEn: 'First' }), blogPost('dup', { en: blogSeo('en', 'dup') }, { titleEn: 'Second' })] } },
      ROUTE_PATHS,
    );
    expect(feed.blogPosts).toHaveLength(1);
    expect(feed.blogPosts[0].titleEn).toBe('First');
    expect(warnings.some((w) => w.includes('dup'))).toBe(true);
  });

  it('caps an oversized body and strips a non-https featured image, never trusting the feed blindly', () => {
    const feed = feedOf([
      blogPost('big', { en: blogSeo('en', 'big') }, { bodyEn: '<p>x</p>'.repeat(50000), featuredImage: { url: 'http://insecure.example.com/x.jpg' } }),
    ]);
    expect(feed.blogPosts[0].bodyEn.length).toBeLessThanOrEqual(200000);
    expect(feed.blogPosts[0].featuredImage).toBeNull();
  });

  it('caps tags at 10 and each tag at 40 characters', () => {
    const feed = feedOf([blogPost('tags', { en: blogSeo('en', 'tags') }, { tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`.repeat(10)) })]);
    expect(feed.blogPosts[0].tags.length).toBeLessThanOrEqual(10);
    for (const t of feed.blogPosts[0].tags) expect(t.length).toBeLessThanOrEqual(40);
  });
});

describe('Blog Management - lookup helpers', () => {
  it('blogPostFor finds a post only in a language it is published in', () => {
    const feed = feedOf([blogPost('ar-only', { ar: blogSeo('ar', 'ar-only') }, { locales: ['ar'] })]);
    expect(blogPostFor(feed, 'ar-only', 'ar')?.slug).toBe('ar-only');
    expect(blogPostFor(feed, 'ar-only', 'en')).toBeUndefined();
    expect(blogPostFor(feed, 'unknown-slug', 'ar')).toBeUndefined();
  });

  it('publishedBlogPosts sorts newest first, defensively (never trusts the feed order blindly)', () => {
    const feed = feedOf([
      blogPost('older', { en: blogSeo('en', 'older') }, { publishedAt: '2026-01-01T00:00:00Z' }),
      blogPost('newer', { en: blogSeo('en', 'newer') }, { publishedAt: '2026-11-01T00:00:00Z' }),
    ]);
    expect(publishedBlogPosts(feed, 'en').map((p) => p.slug)).toEqual(['newer', 'older']);
  });
});

describe('Blog Management - route discovery (prerendering, sitemap)', () => {
  it('blogRoutes() produces one route per published post, at /blog/:slug', () => {
    const feed = feedOf([blogPost('solar-in-egypt', { ar: blogSeo('ar', 'solar-in-egypt'), en: blogSeo('en', 'solar-in-egypt') })]);
    const routes = blogRoutes(feed);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ path: '/blog/solar-in-egypt', page: 'blog-post', parent: '/blog' });
    expect(routes[0].langs).toEqual(['ar', 'en']);
  });

  it('excludes a language from the route when the post has no resolved SEO for it (never guesses)', () => {
    const feed = feedOf([blogPost('ar-only-route', { ar: blogSeo('ar', 'ar-only-route') }, { locales: ['ar', 'en'] })]);
    expect(blogRoutes(feed)[0].langs).toEqual(['ar']);
  });

  it('excludes a language the post itself marked noindex in', () => {
    const feed = feedOf([blogPost('partial-noindex', { ar: blogSeo('ar', 'partial-noindex'), en: blogSeo('en', 'partial-noindex', { indexable: false }) })]);
    expect(blogRoutes(feed)[0].langs).toEqual(['ar']);
  });

  it('allRoutes() includes the built-in /blog index plus every published post', () => {
    const feed = feedOf([blogPost('x', { en: blogSeo('en', 'x') })]);
    const all = allRoutes(feed);
    expect(all.some((r) => r.path === '/blog')).toBe(true);
    expect(all.some((r) => r.path === '/blog/x')).toBe(true);
  });

  it('an empty or missing feed contributes no blog routes', () => {
    expect(blogRoutes(null)).toEqual([]);
    expect(blogRoutes(feedOf([]))).toEqual([]);
  });
});

describe('Blog Management - structured data', () => {
  it('blogPostingJsonLd produces a well-formed BlogPosting node from only the stated facts', () => {
    const data = blogPostingJsonLd({
      base: SITE,
      lang: 'en',
      url: `${SITE}/en/blog/solar-in-egypt`,
      headline: 'Solar in Egypt',
      description: 'A guide to solar in Egypt.',
      datePublished: '2026-11-10T10:00:00Z',
      authorName: 'Jane Doe',
      image: `${SITE}/images/solar.jpg`,
    });
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBe('Solar in Egypt');
    expect(data.datePublished).toBe('2026-11-10T10:00:00Z');
    expect(data.author).toEqual({ '@type': 'Person', name: 'Jane Doe' });
    expect(data.publisher).toEqual({ '@id': `${SITE}/#organization` });
    expect(data.image).toEqual([`${SITE}/images/solar.jpg`]);
  });

  it('omits datePublished/image when not given, never inventing a fact the post does not state', () => {
    const data = blogPostingJsonLd({ base: SITE, lang: 'en', url: `${SITE}/en/blog/x`, headline: 'X', description: 'D', datePublished: null, authorName: 'Reservia', image: null });
    expect(data).not.toHaveProperty('datePublished');
    expect(data).not.toHaveProperty('image');
  });
});
