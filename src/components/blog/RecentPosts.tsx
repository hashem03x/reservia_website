import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import type { CmsBlogPost } from '../../content/cms';
import { blogTitle } from '../../cms/blog';

/**
 * "Recent Blogs" aside (section 4.2) - thumbnail, title and publish date per post, linking to the
 * article. CMS-controlled per article (post.showRecentSidebar) - the caller decides whether to
 * render this at all; this component itself has no visibility logic of its own.
 */
export function RecentPosts({ posts }: { posts: CmsBlogPost[] }) {
  const { language, t } = useLanguage();
  if (!posts.length) return null;
  return (
    <aside className="blog-recent" aria-label={t.blog_recent_title}>
      <h2>{t.blog_recent_title}</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link to={`/${language}/blog/${p.slug}`}>
              {p.featuredImage?.url && <img src={p.featuredImage.url} alt={language === 'ar' ? p.featuredImage.altAr || '' : p.featuredImage.altEn || ''} loading="lazy" />}
              <span>
                <b>{blogTitle(p, language)}</b>
                {p.publishedAt && <time dateTime={p.publishedAt}>{new Date(p.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</time>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
