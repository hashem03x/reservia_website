/**
 * Blog Management - pure, framework-free helpers over the build-time CMS feed, mirroring
 * src/cms/nav.ts's shape (take `feed`/`lang` as arguments, no React, no module-level state).
 */
import type { CmsBlogPost, CmsFeed } from '../content/cms';
import { blogPostFor, publishedBlogPosts } from '../content/cms';
import type { Lang } from '../content/seoHead';

export { blogPostFor, publishedBlogPosts };

/** Up to `limit` other published posts in a language, newest first - for the "Recent Blogs" aside. */
export function recentPosts(feed: CmsFeed | null | undefined, lang: Lang, excludeSlug?: string, limit = 5): CmsBlogPost[] {
  return publishedBlogPosts(feed, lang).filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

/** Distinct categories among published posts in a language, in first-seen (newest-first) order. */
export function blogCategories(feed: CmsFeed | null | undefined, lang: Lang): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of publishedBlogPosts(feed, lang)) {
    if (p.category && !seen.has(p.category)) {
      seen.add(p.category);
      out.push(p.category);
    }
  }
  return out;
}

/** Plain-text fallback excerpt from a post's HTML body - used only when the editor left the short
 * description empty; mirrors the backend's own excerpt-fallback logic so the two agree, though in
 * practice the feed already carries the resolved excerpt. */
export function stripHtml(html: string, max = 160): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A post's title in a language, falling back to the other language rather than showing nothing. */
export function blogTitle(post: CmsBlogPost, lang: Lang): string {
  return lang === 'ar' ? post.titleAr || post.titleEn : post.titleEn || post.titleAr;
}

export function blogExcerpt(post: CmsBlogPost, lang: Lang): string {
  const direct = lang === 'ar' ? post.excerptAr : post.excerptEn;
  if (direct) return direct;
  const body = lang === 'ar' ? post.bodyAr : post.bodyEn;
  return body ? stripHtml(body) : '';
}

export function blogBody(post: CmsBlogPost, lang: Lang): string {
  return lang === 'ar' ? post.bodyAr : post.bodyEn;
}

export function blogAuthorName(post: CmsBlogPost, lang: Lang): string {
  return lang === 'ar' ? post.author.nameAr || post.author.nameEn : post.author.nameEn || post.author.nameAr;
}
