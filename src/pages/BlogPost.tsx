import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { cmsFeed } from '../content/cmsFeed';
import { blogPostFor, blogAuthorName, blogBody, blogTitle, recentPosts } from '../cms/blog';
import { BlogSeo } from '../components/layout/BlogSeo';
import { RecentPosts } from '../components/blog/RecentPosts';
import NotFound from './NotFound';

/**
 * One blog post's public page - looked up by slug in the build-time feed (no runtime fetch, see
 * BlogIndex.tsx). Not published, wrong language or an unknown slug is the ordinary 404 page - a
 * blog slug is never special-cased in routing, it just finds nothing to render.
 */
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const post = slug ? blogPostFor(cmsFeed, slug, language) : undefined;
  if (!post) return <NotFound />;

  const title = blogTitle(post, language);
  const authorName = blogAuthorName(post, language);
  const body = blogBody(post, language);
  const category = post.category;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const aside = post.showRecentSidebar ? recentPosts(cmsFeed, language, post.slug) : [];

  return (
    <>
      <BlogSeo post={post} lang={language} />
      <section className="wrap" style={{ paddingTop: 32 }}>
        <nav className="crumbs" aria-label={t.crumbs_aria}>
          <ol>
            <li>
              <Link to={`/${language}`}>{t.nav_home}</Link>
            </li>
            <li>
              <Link to={`/${language}/blog`}>{t.nav_blog}</Link>
            </li>
            <li>
              <span aria-current="page">{title}</span>
            </li>
          </ol>
        </nav>

        <div className={`blog-post ${aside.length ? 'has-aside' : 'full-width'}`}>
          <article className="blog-post-main">
            {post.featuredImage?.url && <img className="blog-post-hero" src={post.featuredImage.url} alt={language === 'ar' ? post.featuredImage.altAr || '' : post.featuredImage.altEn || ''} />}
            <h1>{title}</h1>
            <div className="blog-post-meta">
              {authorName && <span>{t.blog_by} {authorName}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              )}
              {category && <span className="blog-category-badge">{category}</span>}
            </div>
            {/* The body is TipTap-authored HTML, sanitized server-side on save
                (ERP_SYSTEM/backend/server/utils/website/htmlSanitizer.js - allowlist: p/h1-h6/
                strong/em/u/s/ul/ol/li/blockquote/hr/a[href]/img[src,alt]/br, https-only schemes,
                rel="noopener noreferrer" forced on links) before it is ever stored or published.
                This is the ONE place on the public website that renders HTML instead of plain React
                children - safe only because the content passed that sanitizer before reaching this
                feed; every other field here (title, excerpt, category, tags, author) is plain text. */}
            <div className="cms-prose blog-post-body" dir={dir} dangerouslySetInnerHTML={{ __html: body }} />
            {post.tags.length > 0 && (
              <div className="blog-post-tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link to={`/${language}/blog`} className="btn-link blog-back">
              {t.blog_back}
            </Link>
          </article>
          {aside.length > 0 && <RecentPosts posts={aside} />}
        </div>
      </section>
    </>
  );
}
